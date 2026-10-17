export type ModelState = 'checking' | 'ready' | 'needs_consent' | 'unavailable';

export interface ModelStatus {
  state: ModelState;
  info: { label: string; sentence: string };
  reason?: string;
}

export function useModelStatus(): ModelStatus {
  return {
    state: 'unavailable',
    info: {
      label: 'Offline demo',
      sentence: 'No AI model is configured in this workspace. Sample content is shown locally.',
    },
    reason: 'No model is configured',
  };
}