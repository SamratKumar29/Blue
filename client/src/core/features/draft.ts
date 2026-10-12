import { aiJson, aiComplete } from '../ai/run';
import { bulletsPrompt, draftPrompt } from '../ai/prompts';
import { isBulletsOut, isDraftOut } from '../ai/schemas';
import { cleanOutput, redactSecrets, isCodebaseContent } from '../connectors/filters';
import { AiError } from '../ai/aiTypes';
import { useBlueStore } from '../../store';

export async function draftMessage(intent: string, recipient?: string): Promise<string> {
  if (isCodebaseContent(intent)) throw new AiError('privacy', 'That looks like code or a repository link, which Blue never reads.');
  const out = await aiJson(
    draftPrompt({ intent: redactSecrets(intent), recipient, userName: useBlueStore.getState().settings.name }),
    isDraftOut,
  );
  return cleanOutput(out.body);
}

export async function summarizeText(text: string): Promise<string[]> {
  if (isCodebaseContent(text)) throw new AiError('privacy', 'That looks like code or a repository link, which Blue never reads.');
  const out = await aiJson(bulletsPrompt({ text: redactSecrets(text).slice(0, 8000) }), isBulletsOut);
  return out.bullets.map(cleanOutput).slice(0, 3);
}

export { aiComplete };
