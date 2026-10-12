import team from '../../data/team.json';
import type { Effort, Task, TaskGroup } from '../types';
import type { Fact, TriageTask } from '../ai/schemas';
import { isTriageOut } from '../ai/schemas';
import { triagePrompt } from '../ai/prompts';
import { aiJson } from '../ai/run';
import { cleanOutput, isSafeOutput } from '../connectors/filters';
import { useBlueStore } from '../../store';

const GROUPS: TaskGroup[] = ['easy_wins', 'next_up', 'needs_senior'];
const EFFORTS: Effort[] = ['easy', 'medium', 'deep'];
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Validates model output in code: the model proposes, deterministic rules decide. */
export function sanitizeTriage(raw: TriageTask[], allowTeamContext: boolean, now = new Date().toISOString()): Task[] {
  const ids = new Set(team.map((t) => t.id));
  const out: Task[] = [];
  const seen = new Set<string>();
  raw.forEach((t, i) => {
    const title = cleanOutput(t.title);
    if (!title || !isSafeOutput(title)) return;
    const dupKey = `${title.toLowerCase()}|${(t.project ?? '').toLowerCase()}`;
    if (seen.has(dupKey)) return;
    seen.add(dupKey);
    const helper = allowTeamContext && t.suggestedHelperId && ids.has(t.suggestedHelperId) ? t.suggestedHelperId : undefined;
    const group = GROUPS.includes(t.group) ? t.group : 'next_up';
    out.push({
      id: `tri_${Date.now().toString(36)}_${i}`,
      title,
      project: cleanOutput(t.project) || 'General',
      estimateMin: clamp(Math.round(t.estimateMin) || 30, 5, 480),
      effort: EFFORTS.includes(t.effort) ? t.effort : 'medium',
      group,
      urgency: (['low', 'med', 'high'] as const).includes(t.urgency) ? t.urgency : 'med',
      status: 'todo',
      blocker: t.blocker ? cleanOutput(t.blocker) : undefined,
      suggestedHelperId: helper,
      explanation: {
        sourceCategory: t.explanation.sourceCategory ?? 'chat',
        confidence: clamp(Number(t.explanation.confidence) || 0, 0, 1),
        reason: cleanOutput(t.explanation.reason),
      },
      provenance: t.provenance,
      createdAt: now,
    });
  });
  return out;
}

/** Merge a fresh triage with existing tasks: keep completion state and user corrections. */
export function mergeTasks(existing: Task[], fresh: Task[]): Task[] {
  const key = (t: Task) => (t.provenance ? `${t.provenance.source}:${t.provenance.ref}` : `title:${t.title}`);
  const old = new Map(existing.map((t) => [key(t), t]));
  const merged = fresh.map((t) => {
    const prev = old.get(key(t));
    if (!prev) return t;
    return { ...t, id: prev.id, status: prev.status, completedAt: prev.completedAt, group: prev.userAdjusted ? prev.group : t.group, userAdjusted: prev.userAdjusted };
  });
  // Keep tasks the user created themselves (not sample seeds).
  const keepManual = existing.filter((t) => t.provenance?.source === 'manual' && !t.id.startsWith('seed_') && !merged.some((m) => m.id === t.id));
  return [...merged, ...keepManual];
}

export async function triage(facts: Fact[], manualTasks: Task[]): Promise<Task[]> {
  const { settings } = useBlueStore.getState();
  const teamCtx = settings.allowTeamContext ? team.map(({ id, name, role, expertise }) => ({ id, name, role, expertise })) : null;
  const out = await aiJson(
    triagePrompt({
      facts,
      manualTasks: manualTasks.map((t) => ({ title: t.title, group: t.group })),
      team: teamCtx,
    }),
    isTriageOut,
  );
  return sanitizeTriage(out.tasks, settings.allowTeamContext);
}
