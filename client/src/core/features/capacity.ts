import team from '../../data/team.json';
import type { Task } from '../types';
import { aiJson } from '../ai/run';
import { capacityPrompt } from '../ai/prompts';
import { isCapacityOut, type CapacityOut } from '../ai/schemas';
import { cleanOutput } from '../connectors/filters';
import { useBlueStore } from '../../store';

const JUDGING = /\b(lazy|weak|uncommitted|unreliable|slacker|excuse[s]?|incompetent|flaky|irresponsible)\b/i;
const NEUTRAL = {
  split: 'Split the task and ask for just the smallest part they can fit.',
  reduce_scope: 'Reduce the scope or move the deadline so it fits the current capacity.',
  new_helper: 'Ask another approved teammate with similar skills.',
} as const;

export function neutralize(out: CapacityOut, person: string): CapacityOut {
  const options = out.options.slice(0, 3).map((o) => {
    const kind = (['split', 'reduce_scope', 'new_helper'] as const).includes(o.kind) ? o.kind : 'split';
    const text = cleanOutput(o.text);
    return { kind, text: !text || JUDGING.test(text) ? NEUTRAL[kind] : text };
  });
  let replyDraft = cleanOutput(out.replyDraft);
  if (!replyDraft || JUDGING.test(replyDraft)) {
    replyDraft = `Thanks for telling me, ${person.split(' ')[0]}. That helps me plan. I'll look at how to split this or adjust the timing.`;
  }
  return { options, replyDraft };
}

export async function capacityOptions(task: Pick<Task, 'title' | 'project'>, person: string): Promise<CapacityOut> {
  const { settings } = useBlueStore.getState();
  const out = await aiJson(
    capacityPrompt({
      task: { title: task.title, project: task.project },
      person,
      team: settings.allowTeamContext ? team.filter((t) => t.name !== person).map(({ id, name, role, expertise }) => ({ id, name, role, expertise })) : null,
    }),
    isCapacityOut,
  );
  return neutralize(out, person);
}
