import team from '../../data/team.json';
import type { Task, TeamMember } from '../types';
import { aiJson } from '../ai/run';
import { helpDraftPrompt } from '../ai/prompts';
import { isHelpDraft, type HelpDraft } from '../ai/schemas';
import { retrieveApproved } from './retrieval';
import { cleanOutput } from '../connectors/filters';
import { useBlueStore } from '../../store';

export const TEAM = team as TeamMember[];

export function suggestHelper(task: Pick<Task, 'title' | 'blocker' | 'suggestedHelperId'>): { member: TeamMember; why: string } {
  const byId = task.suggestedHelperId && TEAM.find((m) => m.id === task.suggestedHelperId);
  const text = `${task.title} ${task.blocker ?? ''}`.toLowerCase();
  const scored = TEAM.map((m) => {
    const hits = m.expertise.filter((e) => e.toLowerCase().split(/\s+/).some((w) => w.length > 3 && text.includes(w)));
    return { m, hits };
  }).sort((a, b) => b.hits.length - a.hits.length);
  const best = byId ? { m: byId, hits: scored.find((s) => s.m.id === byId.id)?.hits ?? [] } : scored[0];
  const why = best.hits.length ? `Expertise match: ${best.hits.join(', ')}` : `${best.m.role}: ${best.m.expertise.slice(0, 2).join(', ')}`;
  return { member: best.m, why };
}

export function formatHelpRequest(d: HelpDraft, helper: TeamMember, userName: string): string {
  const first = helper.name.split(' ')[0];
  return [
    `Hi ${first},`,
    '',
    `Context: ${d.context}`,
    '',
    'What I tried:',
    ...d.tried.map((t) => `- ${t}`),
    '',
    `Specific ask: ${d.ask}`,
    `Smallest useful next step: ${d.nextStep}`,
    `Timing: ${d.timing}`,
    '',
    `Thanks,`,
    userName.split(' ')[0],
  ].join('\n');
}

export async function draftHelpRequest(task: Task, helper: TeamMember): Promise<{ draft: HelpDraft; text: string }> {
  const { settings } = useBlueStore.getState();
  const policy = (await retrieveApproved(`${task.title} ${task.blocker ?? ''} escalate`, 2)).map((h) => ({ doc: h.doc, text: h.text }));
  const draft = await aiJson(
    helpDraftPrompt({
      task: { title: task.title, project: task.project, blocker: task.blocker, estimateMin: task.estimateMin },
      helper: settings.allowTeamContext ? { name: helper.name, role: helper.role, expertise: helper.expertise } : { name: helper.name },
      policy,
      userName: settings.name,
    }),
    isHelpDraft,
  );
  const clean: HelpDraft = {
    context: cleanOutput(draft.context),
    tried: draft.tried.map(cleanOutput).slice(0, 4),
    ask: cleanOutput(draft.ask),
    nextStep: cleanOutput(draft.nextStep),
    timing: cleanOutput(draft.timing),
  };
  return { draft: clean, text: formatHelpRequest(clean, helper, settings.name) };
}
