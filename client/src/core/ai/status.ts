import { useEffect, useState } from 'react';
import { useBlueStore } from '../../store';
import { getProvider } from './provider';
import { modelInfo, type ModelInfo } from './info';

export interface ModelStatus {
  info: ModelInfo;
  state: 'checking' | 'ready' | 'needs_consent' | 'unavailable';
  reason?: string;
}

export function useModelStatus(refreshKey: unknown = 0): ModelStatus {
  const mode = useBlueStore((s) => s.settings.modelMode);
  const consent = useBlueStore((s) => s.settings.cloudConsentGiven);
  const [res, setRes] = useState<{ ok: boolean; reason?: string } | null>(null);

  useEffect(() => {
    let alive = true;
    setRes(null);
    getProvider({ modelMode: mode }).isAvailable().then((r) => alive && setRes(r));
    return () => {
      alive = false;
    };
  }, [mode, refreshKey]);

  const info = modelInfo({ modelMode: mode });
  if (!res) return { info, state: 'checking' };
  if (!res.ok) return { info, state: 'unavailable', reason: res.reason };
  if (mode === 'cloud' && !consent) return { info, state: 'needs_consent' };
  return { info, state: 'ready' };
}
