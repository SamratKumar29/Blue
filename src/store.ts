import { create } from 'zustand';
import type { PendingApproval, SourceKey, Task } from './core/types';

export type { SourceKey } from './core/types';

export const SOURCE_LABELS: Record<SourceKey, string> = {
  calendar: 'Calendar',
  chat: 'Team messages',
  drive: 'Shared files',
  policy: 'Team guidelines',
};

interface Settings {
  name: string;
  paused: boolean;
  timezone: string;
  praise: boolean;
  workStart: string;
  workEnd: string;
  presence: 'work_hours' | 'laptop_awake';
  modelMode: 'local' | 'cloud';
  allowConnectors: boolean;
  allowTeamContext: boolean;
}

interface Meta {
  onboarded: boolean;
  sources: Record<SourceKey, boolean>;
}

interface BlueState {
  initialized: boolean;
  offlineDemo: boolean;
  settings: Settings;
  meta: Meta;
  tasks: Task[];
  pendingApproval: PendingApproval | null;
  loadAll: () => Promise<void>;
  updateSettings: (changes: Partial<Settings>) => Promise<void>;
  updateMeta: (changes: Partial<Meta>) => Promise<void>;
  refreshAudit: () => Promise<void>;
  completeTask: (id: string, completed: boolean) => Promise<void>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  setApproval: (approval: PendingApproval | null) => void;
}

const initialSettings: Settings = {
  name: 'Alex Morgan',
  paused: false,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  praise: true,
  workStart: '09:00',
  workEnd: '17:00',
  presence: 'work_hours',
  modelMode: 'local',
  allowConnectors: false,
  allowTeamContext: false,
};

const initialSources: Record<SourceKey, boolean> = {
  calendar: false,
  chat: false,
  drive: false,
  policy: false,
};

const demoTasks: Task[] = [
  {
    id: 'prepare-weekly-update',
    title: 'Prepare the weekly project update',
    project: 'Product launch',
    status: 'todo',
    group: 'today',
    effort: 'medium',
    estimateMin: 30,
    explanation: { sourceCategory: 'Team messages', confidence: 0.88, reason: 'A project update is due before the next team check-in.' },
  },
  {
    id: 'review-design-feedback',
    title: 'Review design feedback',
    project: 'Workspace refresh',
    status: 'todo',
    group: 'this_week',
    effort: 'small',
    estimateMin: 20,
    explanation: { sourceCategory: 'Shared files', confidence: 0.76, reason: 'Feedback was added to the latest design notes.' },
  },
  {
    id: 'confirm-release-plan',
    title: 'Confirm the release plan with a teammate',
    project: 'Product launch',
    status: 'todo',
    group: 'needs_senior',
    effort: 'small',
    estimateMin: 15,
    explanation: { sourceCategory: 'Team messages', confidence: 0.69, reason: 'The release plan needs a teammate’s confirmation.' },
  },
];

export const useBlueStore = create<BlueState>((set) => ({
  initialized: false,
  offlineDemo: true,
  settings: initialSettings,
  meta: { onboarded: false, sources: initialSources },
  tasks: demoTasks,
  pendingApproval: null,
  loadAll: async () => set({ initialized: true }),
  updateSettings: async (changes) => set((state) => ({ settings: { ...state.settings, ...changes } })),
  updateMeta: async (changes) => set((state) => ({ meta: { ...state.meta, ...changes } })),
  refreshAudit: async () => undefined,
  completeTask: async (id, completed) => set((state) => ({
    tasks: state.tasks.map((task) => task.id === id ? { ...task, status: completed ? 'done' : 'todo' } : task),
  })),
  updateTask: async (id, changes) => set((state) => ({
    tasks: state.tasks.map((task) => task.id === id ? { ...task, ...changes } : task),
  })),
  setApproval: (pendingApproval) => set({ pendingApproval }),
}));