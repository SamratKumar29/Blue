import { aiComplete } from '../ai/run';
import { praisePrompt } from '../ai/prompts';
import { cleanOutput } from '../connectors/filters';
import { useBlueStore } from '../../store';
import type { Task } from '../types';

export function tidyPraise(text: string): string {
  const words = text.replace(/!+/g, '.').replace(/["“”]/g, '"').trim().split(/\s+/).slice(0, 20).join(' ');
  return /[.?]$/.test(words) ? words : `${words}.`;
}

/** Specific, restrained acknowledgement. Returns null when the user turned praise off. */
export async function praiseFor(task: Task): Promise<string | null> {
  if (!useBlueStore.getState().settings.praise) return null;
  try {
    return tidyPraise(cleanOutput(await aiComplete(praisePrompt({ title: task.title, blocker: task.blocker }))));
  } catch {
    return `You closed "${task.title}".`;
  }
}
