import { create } from 'zustand';

export type Presence = 'active' | 'preroll' | 'sleeping' | 'paused';

export type DialogKind =
  | 'analysis'
  | 'askSenior'
  | 'roundup'
  | 'checkin'
  | 'celebrate'
  | 'summarize'
  | 'write'
  | 'createTask'
  | 'moreMenu'
  | 'capacity';

type Dialog = { kind: DialogKind; payload?: Record<string, unknown> };

interface UiState {
  presence: Presence;
  roundupOffered: boolean;
  dialog: Dialog | null;
  settingsOpen: boolean;
  settingsTab: string;
  shortcutsOpen: boolean;
  setPresence: (presence: Presence) => void;
  setRoundupOffered: (offered: boolean) => void;
  openDialog: (kind: DialogKind, payload?: Record<string, unknown>) => void;
  closeDialog: () => void;
  openSettings: (tab?: string) => void;
  closeSettings: () => void;
  setShortcutsOpen: (open: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  presence: 'active',
  roundupOffered: false,
  dialog: null,
  settingsOpen: false,
  settingsTab: 'general',
  shortcutsOpen: false,
  setPresence: (presence) => set({ presence }),
  setRoundupOffered: (roundupOffered) => set({ roundupOffered }),
  openDialog: (kind, payload) => set({ dialog: { kind, payload } }),
  closeDialog: () => set({ dialog: null }),
  openSettings: (settingsTab = 'general') => set({ settingsOpen: true, settingsTab }),
  closeSettings: () => set({ settingsOpen: false }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
}));