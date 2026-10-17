import { aiComplete } from '../ai/run';
import { chatPrompt } from '../ai/prompts';
import { retrieveApproved, bm25, chunkText } from './retrieval';
import { listUploads } from '../memory/files';
import { cleanOutput, redactSecrets, isCodebaseContent } from '../connectors/filters';
import { AiError } from '../ai/aiTypes';
import { useBlueStore } from '../../store';
import { useGoogle, isConnected } from '../connectors/google';

export interface ChatAnswer { text: string; sources: string[] }

export async function chatReply(message: string): Promise<ChatAnswer> {
  if (isCodebaseContent(message)) throw new AiError('privacy', 'That looks like code or a repository link, which Blue never reads.');
  const { settings, tasks } = useBlueStore.getState();
  const policyHits = await retrieveApproved(message, 3);
  // The user's own uploaded text files are searched locally too.
  const uploads = await listUploads().catch(() => []);
  const fileHits = bm25(message, uploads.flatMap((f) => (f.text ? chunkText(f.name, f.text) : [])), 2).filter((h) => h.score > 0);
  const hits = [...policyHits, ...fileHits];
  const raw = await aiComplete(
    chatPrompt({
      message: redactSecrets(message),
      // All open tasks, newest first, so tasks created a moment ago are always included.
      taskTitles: tasks.filter((t) => t.status === 'todo').sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((t) => t.title).slice(0, 60),
      ...(isConnected() ? {
        mail: useGoogle.getState().mail.slice(0, 40).map((m) => ({ from: m.from, subject: m.subject, date: m.date, snippet: m.snippet.slice(0, 160) })),
        events: useGoogle.getState().events.slice(0, 15).map((e) => ({ title: e.title, start: e.start })),
      } : {}),
      policy: hits.map((h) => ({ doc: h.doc, text: h.text })),
      toneAware: settings.toneObservations,
    }),
  );
  const text = cleanOutput(raw);
  const cited = [...text.matchAll(/\[([^\]\n]{1,80})\]/g)].map((m) => m[1]);
  const sources = [...new Set(hits.map((h) => h.doc).filter((d) => cited.includes(d)))];
  return { text, sources };
}
