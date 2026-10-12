import { create } from 'zustand';
import type { Presence } from './core/presence/workHours';

export type DialogKind =
  | 'analysis'      // task analysis + permission to proceed
  | 'askSenior'     // 6-step help flow
  | 'summarize'
  | 'write'
  | 'createTask'
  | 'checkin'
  | 'roundup'
  | 'celebrate'
  | 'moreMenu'
  | 'capacity';

interface UiState {
  presence: Presence;
  roundupOffered: boolean;
  reminder: string | null;
  restOverride: boolean;
  setPresence: (p: Presence) => void;
  setRoundupOffered: (v: boolean) => void;
  setReminder: (m: string | null) => void;
  setRestOverride: (v: boolean) => void;
  settingsOpen: boolean;
  settingsSection: string;
  dialog: { kind: DialogKind; payload?: Record<string, unknown> } | null;
  openSettings: (section?: string) => void;
  closeSettings: () => void;
  openDialog: (kind: DialogKind, payload?: Record<string, unknown>) => void;
  closeDialog: () => void;
}

export const useUi = create<UiState>((set) => ({
  presence: 'active',
  roundupOffered: false,
  reminder: null,
  restOverride: false,
  setPresence: (presence) => set({ presence }),
  setRoundupOffered: (roundupOffered) => set({ roundupOffered }),
  setReminder: (reminder) => set({ reminder }),
  setRestOverride: (restOverride) => set({ restOverride }),
  settingsOpen: typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('settings') === '1',
  settingsSection: 'general',
  dialog: null,
  openSettings: (section = 'general') => set({ settingsOpen: true, settingsSection: section }),
  closeSettings: () => set({ settingsOpen: false }),
  openDialog: (kind, payload) => set({ dialog: { kind, payload } }),
  closeDialog: () => set({ dialog: null }),
}));
