import { create } from 'zustand';
import { Settings, Task, Summary, AuditEntry, OutboxItem } from './core/types';
import { get, put, getAll, del, clearAll } from './core/memory/db';
import { listAudit } from './core/memory/audit';

export const DEFAULT_SETTINGS: Settings = {
  name: 'Alex Johnson',
  timezone: 'Asia/Kolkata',
  language: 'en',
  presence: 'work_hours',
  workStart: '09:30',
  workEnd: '18:00',
  waterReminderMin: 90,
  allowWriting: false,      // D6 default: OFF
  allowConnectors: false,   // D6 default: OFF
  allowTeamContext: false,  // D6 default: OFF
  modelMode: 'cloud',
  cloudConsentGiven: false,
  praise: true,
  checkins: true,
  toneObservations: true,
  paused: false,
  retentionDays: 30,
};

export const INITIAL_SAMPLE_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Review design mockup feedback',
    project: 'Atlas',
    estimateMin: 15,
    effort: 'easy',
    group: 'easy_wins',
    urgency: 'low',
    status: 'todo',
    explanation: {
      sourceCategory: 'chat',
      confidence: 0.9,
      reason: 'Requested by Priya in #atlas-dev for upcoming sync',
    },
    provenance: { source: 'demo-slack', ref: 'msg_001' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 't2',
    title: 'Respond to sprint-demo invite',
    project: 'Atlas',
    estimateMin: 5,
    effort: 'easy',
    group: 'easy_wins',
    urgency: 'low',
    status: 'todo',
    explanation: {
      sourceCategory: 'email',
      confidence: 0.95,
      reason: 'Bi-weekly demo sync scheduled by Marcus',
    },
    provenance: { source: 'demo-gmail', ref: 'email_001' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 't3',
    title: 'Draft API integration spec',
    project: 'Atlas',
    estimateMin: 60,
    effort: 'medium',
    group: 'next_up',
    urgency: 'med',
    status: 'todo',
    explanation: {
      sourceCategory: 'chat',
      confidence: 0.85,
      reason: 'Milestone 2 partner onboarding deliverable',
    },
    provenance: { source: 'demo-slack', ref: 'msg_007' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 't4',
    title: 'Follow up on access request',
    project: 'Orion Billing',
    estimateMin: 30,
    effort: 'medium',
    group: 'next_up',
    urgency: 'med',
    status: 'todo',
    explanation: {
      sourceCategory: 'chat',
      confidence: 0.8,
      reason: 'Admin approval pending for read-replica credential',
    },
    provenance: { source: 'demo-slack', ref: 'msg_009' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 't5',
    title: 'Resolve prod-bug #471 (DevOps input needed)',
    project: 'Atlas',
    estimateMin: 120,
    effort: 'deep',
    group: 'needs_senior',
    urgency: 'high',
    status: 'todo',
    blocker: 'Requires DevOps host-level diagnosis for gateway health checks',
    suggestedHelperId: 'p2', // Amir Hassan (DevOps)
    explanation: {
      sourceCategory: 'chat',
      confidence: 0.95,
      reason: 'SEV-2 production failure flagged by Amir in #incidents',
    },
    provenance: { source: 'demo-slack', ref: 'msg_002' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 't6',
    title: 'Clarify "make it faster" requirement',
    project: 'Atlas',
    estimateMin: 30,
    effort: 'easy',
    group: 'needs_senior',
    urgency: 'high',
    status: 'todo',
    blocker: 'Ambiguous target metrics; needs Product Manager confirmation',
    suggestedHelperId: 'p4', // Rohan Mehta (PM)
    explanation: {
      sourceCategory: 'chat',
      confidence: 0.9,
      reason: 'Unclear executive requirement from Rohan in #product-atlas',
    },
    provenance: { source: 'demo-slack', ref: 'msg_003' },
    createdAt: new Date().toISOString(),
  },
];

interface BlueStore {
  settings: Settings;
  tasks: Task[];
  summaries: Summary[];
  audit: AuditEntry[];
  outbox: OutboxItem[];
  initialized: boolean;

  loadAll: () => Promise<void>;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => Promise<Task>;
  completeTask: (id: string, done: boolean) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  clearMyBlue: () => Promise<void>;
  refreshAudit: () => Promise<void>;
}

export const useBlueStore = create<BlueStore>((set, getStore) => ({
  settings: DEFAULT_SETTINGS,
  tasks: [],
  summaries: [],
  audit: [],
  outbox: [],
  initialized: false,

  loadAll: async () => {
    try {
      // 1. Load or initialize Settings
      let loadedSettings = await get<Settings>('settings', 'current');
      if (!loadedSettings) {
        loadedSettings = DEFAULT_SETTINGS;
        await put<Settings>('settings', 'current', loadedSettings);
      }

      // 2. Load Tasks (if none in encrypted DB, initialize with baseline sample tasks)
      let loadedTasks = await getAll<Task>('tasks');
      if (loadedTasks.length === 0) {
        for (const t of INITIAL_SAMPLE_TASKS) {
          await put<Task>('tasks', t.id, t);
        }
        loadedTasks = INITIAL_SAMPLE_TASKS;
      }

      // 3. Load Summaries, Outbox, Audit
      const loadedSummaries = await getAll<Summary>('summaries');
      const loadedOutbox = await getAll<OutboxItem>('outbox');
      const loadedAudit = await listAudit();

      set({
        settings: loadedSettings,
        tasks: loadedTasks,
        summaries: loadedSummaries,
        outbox: loadedOutbox,
        audit: loadedAudit,
        initialized: true,
      });
    } catch (err) {
      console.error('Failed to load encrypted Blue memory:', err);
      set({ initialized: true });
    }
  },

  updateSettings: async (partial: Partial<Settings>) => {
    const updated: Settings = { ...getStore().settings, ...partial };
    set({ settings: updated });
    await put<Settings>('settings', 'current', updated);
  },

  addTask: async (taskInput) => {
    const newTask: Task = {
      id: taskInput.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...taskInput,
    };
    const updatedTasks = [...getStore().tasks, newTask];
    set({ tasks: updatedTasks });
    await put<Task>('tasks', newTask.id, newTask);
    return newTask;
  },

  completeTask: async (id: string, done: boolean) => {
    const updatedTasks = getStore().tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            status: done ? ('done' as const) : ('todo' as const),
            completedAt: done ? new Date().toISOString() : undefined,
          }
        : t
    );
    set({ tasks: updatedTasks });

    const target = updatedTasks.find((t) => t.id === id);
    if (target) {
      await put<Task>('tasks', target.id, target);
    }
  },

  removeTask: async (id: string) => {
    const filtered = getStore().tasks.filter((t) => t.id !== id);
    set({ tasks: filtered });
    await del('tasks', id);
  },

  clearMyBlue: async () => {
    await clearAll();
    set({
      settings: DEFAULT_SETTINGS,
      tasks: [],
      summaries: [],
      audit: [],
      outbox: [],
    });
  },

  refreshAudit: async () => {
    const entries = await listAudit();
    set({ audit: entries });
  },
}));
