import type { Provenance, Summary, Task } from '../types';
import { fetchApproved } from '../connectors/demoWorkspace';
import { toActionableFacts } from './transform';
import { triage, mergeTasks } from './triage';
import { aiJson } from '../ai/run';
import { roundupPrompt } from '../ai/prompts';
import { isRoundupOut, type RoundupLine } from '../ai/schemas';
import { cleanOutput, isSafeOutput } from '../connectors/filters';
import { useBlueStore } from '../../store';
import { now } from '../presence/demoClock';

export interface RoundupResult { summary: Summary; lines: RoundupLine[]; tasks: Task[] }

const MAX_WORDS = 120;

export function capWords(lines: RoundupLine[], max = MAX_WORDS): RoundupLine[] {
  let used = 0;
  const out: RoundupLine[] = [];
  for (const l of lines) {
    const n = l.text.split(/\s+/).length;
    if (used + n > max) break;
    used += n;
    out.push(l);
  }
  return out;
}

export async function generateRoundup(): Promise<RoundupResult> {
  const store = useBlueStore.getState();
  const approved = await fetchApproved();
  if (!approved.messages.length && !approved.emails.length && !approved.events.length) {
    throw new Error(approved.denied[0] ?? 'No sources are switched on. Enable the Demo Workspace in Settings.');
  }

  const facts = await toActionableFacts(approved);
  const existing = useBlueStore.getState().tasks;
  const fresh = await triage(facts, existing.filter((t) => t.provenance?.source === 'manual'));
  const merged = mergeTasks(existing, fresh);
  await store.replaceTasks(merged);
  // Seeded/manual tasks may carry helper ids; never surface them without team context.
  const tasks = store.settings.allowTeamContext ? merged : merged.map(({ suggestedHelperId: _, ...t }) => t);

  const open = tasks.filter((t) => t.status === 'todo');
  const out = await aiJson(
    roundupPrompt({
      tasks: open.map((t) => ({ id: t.id, title: t.title, group: t.group, estimateMin: t.estimateMin, blocker: t.blocker, provenance: t.provenance })),
      events: approved.events.map((e) => ({ title: e.title, start: e.start })),
    }),
    isRoundupOut,
  );

  const lines = capWords(
    out.lines
      .map((l) => ({ ...l, text: cleanOutput(l.text) }))
      .filter((l) => l.text && isSafeOutput(l.text)),
  );
  const sources: Provenance[] = lines.map((l) => ({ source: l.source, ref: l.ref }));
  const summary = await store.addSummary({ kind: 'roundup', text: lines.map((l) => l.text).join('\n'), sources });
  await store.updateMeta({ lastRoundupDay: now().toDateString() });
  return { summary, lines, tasks };
}
