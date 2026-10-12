import type { Settings } from '../types';

export interface ModelInfo {
  id: 'cloud-gemini' | 'local-gemma';
  label: string;
  dataLeavesDevice: boolean;
  sentence: string;
}

/** Honest labelling (decision D5). Never claims on-device processing unless Local mode is selected. */
export function modelInfo(s: Pick<Settings, 'modelMode'>): ModelInfo {
  if (s.modelMode === 'local') {
    return {
      id: 'local-gemma',
      label: 'Gemma 4 (Local)',
      dataLeavesDevice: false,
      sentence: 'Running on your device. No data leaves your device.',
    };
  }
  return {
    id: 'cloud-gemini',
    label: 'Gemini (Cloud via Cloud Run)',
    dataLeavesDevice: true,
    sentence: 'Cloud mode: selected content is sent to Google Cloud (Gemini) for processing.',
  };
}
