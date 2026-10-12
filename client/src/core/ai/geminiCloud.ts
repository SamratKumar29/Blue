import { AiError, type CompleteArgs, type ModelProvider } from './aiTypes';
import { guard } from '../policy/useGate';

export interface CloudConfig {
  cloudAvailable: boolean;
  model: string | null;
}

export async function fetchCloudConfig(): Promise<CloudConfig | null> {
  try {
    const r = await fetch('/api/config');
    if (!r.ok) return null;
    return (await r.json()) as CloudConfig;
  } catch {
    return null;
  }
}

export class GeminiCloudProvider implements ModelProvider {
  id = 'cloud-gemini' as const;
  label = 'Gemini (Cloud via Cloud Run)';
  dataLeavesDevice = true;

  async isAvailable() {
    const cfg = await fetchCloudConfig();
    if (!cfg) return { ok: false, reason: 'Cannot reach the Blue server.' };
    if (!cfg.cloudAvailable) return { ok: false, reason: 'Gemini is not configured on the server.' };
    return { ok: true };
  }

  async complete({ system, prompt, jsonSchema }: CompleteArgs): Promise<string> {
    const result = await guard({ type: 'cloud_inference', effect: 'Use Gemini in the cloud' }, async () => {
      let res: Response;
      try {
        res = await fetch('/api/ai/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ system, prompt, jsonSchema }),
        });
      } catch {
        throw new AiError('network', 'Could not reach the Blue server.');
      }
      if (res.status === 422) throw new AiError('privacy', 'Content excluded by privacy rules.');
      if (!res.ok) throw new AiError('unavailable', 'The AI service is unavailable right now.');
      const data = (await res.json()) as { text?: string };
      return data.text ?? '';
    });
    if (!result.ok) {
      throw new AiError(result.reason === 'Blue is paused.' ? 'paused' : 'denied', result.reason);
    }
    return result.value;
  }
}
