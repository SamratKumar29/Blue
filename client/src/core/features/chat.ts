import { aiComplete } from '../ai/run';
import { chatPrompt } from '../ai/prompts';
import { retrieveApproved } from './retrieval';
import { cleanOutput, redactSecrets, isCodebaseContent } from '../connectors/filters';
import { AiError } from '../ai/aiTypes';
import { useBlueStore } from '../../store';

export interface ChatAnswer { text: string; sources: string[] }

export async function chatReply(message: string): Promise<ChatAnswer> {
  if (isCodebaseContent(message)) throw new AiError('privacy', 'That looks like code or a repository link, which Blue never reads.');
  const { settings, tasks } = useBlueStore.getState();
  const hits = await retrieveApproved(message, 3);
  const raw = await aiComplete(
    chatPrompt({
      message: redactSecrets(message),
      taskTitles: tasks.filter((t) => t.status === 'todo').map((t) => t.title).slice(0, 12),
      policy: hits.map((h) => ({ doc: h.doc, text: h.text })),
      toneAware: settings.toneObservations,
    }),
  );
  const text = cleanOutput(raw);
  const cited = [...text.matchAll(/\[([\w-]+)\]/g)].map((m) => m[1]);
  const sources = [...new Set(hits.map((h) => h.doc).filter((d) => cited.includes(d)))];
  return { text, sources };
}
