import { AiError, completeJson, getProvider, type CompleteArgs } from './provider';
import { mockProvider } from './mockProvider';
import { useBlueStore } from '../../store';

/**
 * Runs a prompt on the user's chosen model. If that model is unreachable (or the user declines cloud use),
 * falls back to the deterministic offline demo and says so. It never silently switches Local -> Cloud.
 */
export async function aiComplete(args: CompleteArgs): Promise<string> {
  const store = useBlueStore.getState();
  if (store.settings.paused) throw new AiError('paused', 'Blue is paused.');
  const provider = getProvider(store.settings);
  const avail = await provider.isAvailable();
  if (!avail.ok) {
    store.setOfflineDemo(true);
    return mockProvider.complete(args);
  }
  try {
    const text = await provider.complete(args);
    store.setOfflineDemo(false);
    return text;
  } catch (e) {
    if (e instanceof AiError && (e.kind === 'unavailable' || e.kind === 'network' || e.kind === 'invalid' || (e.kind === 'denied' && e.message === 'Cancelled.'))) {
      store.setOfflineDemo(true);
      return mockProvider.complete(args);
    }
    throw e;
  }
}

export async function aiJson<T>(args: CompleteArgs, validate: (x: unknown) => x is T): Promise<T> {
  const proxy = { id: 'cloud-gemini' as const, label: 'active', dataLeavesDevice: true, isAvailable: async () => ({ ok: true }), complete: aiComplete };
  return completeJson(proxy, args, validate);
}

export function friendlyAiError(e: unknown): string {
  if (e instanceof AiError) {
    if (e.kind === 'paused') return 'Blue is paused. Resume Blue to continue.';
    if (e.kind === 'privacy') return 'Part of that content was excluded by privacy rules, so nothing was sent.';
    if (e.kind === 'denied') return e.message;
    return 'Blue could not reach a model just now. Try again in a moment.';
  }
  return 'Something went wrong. Please try again.';
}
