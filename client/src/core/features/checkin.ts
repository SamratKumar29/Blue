import { aiJson } from '../ai/run';
import { stepsPrompt } from '../ai/prompts';
import { isStepsOut } from '../ai/schemas';
import { cleanOutput } from '../connectors/filters';

// Check-ins are private and never persisted unless the user taps Save (notes go through addSummary).
export async function breakDownTask(task: string): Promise<string[]> {
  const out = await aiJson(stepsPrompt({ task }), isStepsOut);
  return out.steps.map(cleanOutput).filter(Boolean).slice(0, 5);
}
