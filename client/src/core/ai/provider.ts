import type { Settings } from '../types';
import { GeminiCloudProvider } from './geminiCloud';
import { AiError, type CompleteArgs, type ModelProvider } from './aiTypes';

export * from './aiTypes';

export const cloudProvider = new GeminiCloudProvider();
/** Thin proxy: the Gemma runtime is only downloaded when Local mode is actually used. */
export const localProvider: ModelProvider = {
  id: 'local-gemma',
  label: 'Gemma (Local)',
  dataLeavesDevice: false,
  isAvailable: async () => (await import('./localGemma')).localGemma.isAvailable(),
  complete: async (args) => (await import('./localGemma')).localGemma.complete(args),
};

/** Never falls back from Local to Cloud: that would silently send data off the device. */
export function getProvider(settings: Pick<Settings, 'modelMode'>): ModelProvider {
  return settings.modelMode === 'local' ? localProvider : cloudProvider;
}

function stripFences(text: string): string {
  const t = text.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return (m ? m[1] : t).trim();
}

export async function completeJson<T>(
  p: ModelProvider,
  args: CompleteArgs,
  validate: (x: unknown) => x is T,
): Promise<T> {
  const attempt = async (a: CompleteArgs) => {
    const raw = await p.complete(a);
    const parsed = JSON.parse(stripFences(raw));
    if (!validate(parsed)) throw new AiError('invalid', 'The model returned an unexpected shape.');
    return parsed;
  };
  try {
    return await attempt(args);
  } catch (e) {
    if (e instanceof AiError && e.kind !== 'invalid') throw e;
    return attempt({ ...args, system: `${args.system}\n\nReturn only valid JSON.` });
  }
}
