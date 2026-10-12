export interface CompleteArgs {
  system: string;
  prompt: string;
  jsonSchema?: object;
}

export interface ModelProvider {
  id: 'cloud-gemini' | 'local-gemma' | 'offline-demo';
  label: string;
  dataLeavesDevice: boolean;
  isAvailable(): Promise<{ ok: boolean; reason?: string }>;
  complete(args: CompleteArgs): Promise<string>;
}

export type AiErrorKind = 'denied' | 'paused' | 'unavailable' | 'privacy' | 'network' | 'invalid';

export class AiError extends Error {
  constructor(public kind: AiErrorKind, message: string) {
    super(message);
    this.name = 'AiError';
  }
}
