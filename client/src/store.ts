import { create } from 'zustand';
import type { Settings, Task, Summary, AuditEntry, OutboxItem } from './core/types';
import type { ActionRequest } from './core/policy/gate';
import { get, put, getAll, del, clearAll } from './core/memory/db';
import { listAudit, clearAudit } from './core/memory/audit';

export const DEFAULT_SETTINGS: Settings = {
  name: 'Alex Johnson',
  timezone: 'Asia/Kolkata',
  language: 'en',
  presence: 'work_hours',
  workStart: '09:30',
  workEnd: '18:00',
  waterReminderMin: 90,
  allowWriting: false,
  allowConnectors: false,
  allowTeamContext: false,
  modelMode: 'cloud',
  cloudConsentGiven: false,
  praise: true,
  checkins: true,
  toneObservations: true,
  paused: false,
  retentionDays: 30,
};

export type SourceKey = 'demo-slack' | 'demo-gmail' | 'demo-calendar' | 'policy';
export const SOURCE_LABELS: Record<SourceKey, string> = {
  'demo-slack': 'Slack-like messages',
  'demo-gmail': 'Gmail-like email',
  'demo-calendar': 'Calendar',
  policy: 'Policy & project docs',
};

export interface Meta {
  onboarded: boolean;
  seeded: boolean;
  sources: Record<SourceKey, boolean>;
  lastAccess: Record<string, string>;
  lastRoundupDay?: string;
  localModelName?: string;
}
const DEFAULT_META: Meta = {
  onboarded: false,
  seeded: false,
  sources: { 'demo-slack': true, 'demo-gmail': true, 'demo-calendar': true, policy: true },
  lastAccess: {},
};

export interface PendingApproval {
  request: ActionRequest;
  editable: boolean;
  resolve: (r: { approved: boolean; request: ActionRequest; hash?: string }) => void;
}

export type MemoryCategory = 'tasks' | 'summaries' | 'preferences' | 'audit';

function manualSeed(): Task[] {
  const now = new Date().toISOString();
  const manual = { sourceCategory: 'manual' as const, confidence: 1, reason: 'Sample task you can edit or delete.' };
  return [
    { id: 'seed_1', title: 'Review design mockup feedback', project: 'Atlas', estimateMin: 15, effort: 'easy', group: 'easy_wins', urgency: 'low', status: 'todo', explanation: manual, provenance: { source: 'manual', ref: 'seed_1' }, createdAt: now },
    { id: 'seed_2', title: 'Draft API integration spec', project: 'Atlas', estimateMin: 60, effort: 'medium', group: 'next_up', urgency: 'med', status: 'todo', explanation: manual, provenance: { source: 'manual', ref: 'seed_2' }, createdAt: now },
    { id: 'seed_3', title: 'Sprint planning prep (a senior can help)', project: 'Atlas', estimateMin: 90, effort: 'deep', group: 'needs_senior', urgency: 'med', status: 'todo', explanation: manual, provenance: { source: 'manual', ref: 'seed_3' }, createdAt: now },
  ];
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

interface BlueStore {
  settings: Settings;
  meta: Meta;
  tasks: Task[];
  summaries: Summary[];
  audit: AuditEntry[];
  outbox: OutboxItem[];
  initialized: boolean;
  pendingApproval: PendingApproval | null;
  offlineDemo: boolean;
  toast: string | null;

  loadAll: () => Promise<void>;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
  updateMeta: (partial: Partial<Meta>) => Promise<void>;
  markAccess: (source: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => Promise<Task>;
  updateTask: (id: string, partial: Partial<Task>) => Promise<void>;
  replaceTasks: (tasks: Task[]) => Promise<void>;
  completeTask: (id: string, done: boolean) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  addSummary: (s: Omit<Summary, 'id' | 'at'>) => Promise<Summary>;
  addOutbox: (o: Omit<OutboxItem, 'id' | 'at'>) => Promise<OutboxItem>;
  clearCategory: (c: MemoryCategory) => Promise<void>;
  clearMyBlue: () => Promise<void>;
  refreshAudit: () => Promise<void>;
  setApproval: (a: PendingApproval | null) => void;
  setOfflineDemo: (v: boolean) => void;
  showToast: (msg: string | null) => void;
  exportData: () => Promise<string>;
}

export const useBlueStore = create<BlueStore>((set, getStore) => ({
  settings: DEFAULT_SETTINGS,
  meta: DEFAULT_META,
  tasks: [],
  summaries: [],
  audit: [],
  outbox: [],
  initialized: false,
  pendingApproval: null,
  offlineDemo: false,
  toast: null,

  loadAll: async () => {
    try {
      let settings = (await get<Settings>('settings', 'current')) ?? undefined;
      if (!settings) {
        settings = DEFAULT_SETTINGS;
        await put<Settings>('settings', 'current', settings);
      }
      settings = { ...DEFAULT_SETTINGS, ...settings };

      let meta = { ...DEFAULT_META, ...((await get<Meta>('meta', 'app')) ?? {}) };
      let tasks = await getAll<Task>('tasks');
      if (!meta.seeded && tasks.length === 0) {
        tasks = manualSeed();
        for (const t of tasks) await put<Task>('tasks', t.id, t);
        meta = { ...meta, seeded: true };
        await put('meta', 'app', meta);
      }

      // Retention: drop summaries and audit entries older than retentionDays.
      const cutoff = Date.now() - settings.retentionDays * 86_400_000;
      let summaries = await getAll<Summary>('summaries');
      for (const s of summaries.filter((x) => new Date(x.at).getTime() < cutoff)) await del('summaries', s.id);
      summaries = summaries.filter((x) => new Date(x.at).getTime() >= cutoff);
      let audit = await listAudit();
      for (const a of audit.filter((x) => new Date(x.at).getTime() < cutoff)) await del('audit', a.id);
      audit = audit.filter((x) => new Date(x.at).getTime() >= cutoff);

      const outbox = (await getAll<OutboxItem>('outbox')).sort((a, b) => b.at.localeCompare(a.at));
      set({ settings, meta, tasks, summaries, outbox, audit, initialized: true });
    } catch (err) {
      console.error('Could not load Blue memory', err);
      set({ initialized: true });
    }
  },

  updateSettings: async (partial) => {
    const updated = { ...getStore().settings, ...partial };
    set({ settings: updated });
    await put<Settings>('settings', 'current', updated);
  },

  updateMeta: async (partial) => {
    const updated = { ...getStore().meta, ...partial };
    set({ meta: updated });
    await put('meta', 'app', updated);
  },

  markAccess: async (source) => {
    const m = getStore().meta;
    await getStore().updateMeta({ lastAccess: { ...m.lastAccess, [source]: new Date().toISOString() } });
  },

  addTask: async (input) => {
    const task: Task = { ...input, id: input.id ?? uid('task'), createdAt: new Date().toISOString() } as Task;
    set({ tasks: [...getStore().tasks, task] });
    await put<Task>('tasks', task.id, task);
    return task;
  },

  updateTask: async (id, partial) => {
    const tasks = getStore().tasks.map((t) => (t.id === id ? { ...t, ...partial } : t));
    set({ tasks });
    const t = tasks.find((x) => x.id === id);
    if (t) await put<Task>('tasks', id, t);
  },

  replaceTasks: async (next) => {
    for (const t of getStore().tasks) await del('tasks', t.id);
    for (const t of next) await put<Task>('tasks', t.id, t);
    set({ tasks: next });
  },

  completeTask: async (id, done) => {
    await getStore().updateTask(id, {
      status: done ? 'done' : 'todo',
      completedAt: done ? new Date().toISOString() : undefined,
    });
  },

  removeTask: async (id) => {
    set({ tasks: getStore().tasks.filter((t) => t.id !== id) });
    await del('tasks', id);
  },

  addSummary: async (s) => {
    const summary: Summary = { ...s, id: uid('sum'), at: new Date().toISOString() };
    set({ summaries: [summary, ...getStore().summaries] });
    await put<Summary>('summaries', summary.id, summary);
    return summary;
  },

  addOutbox: async (o) => {
    const item: OutboxItem = { ...o, id: uid('out'), at: new Date().toISOString() };
    set({ outbox: [item, ...getStore().outbox] });
    await put<OutboxItem>('outbox', item.id, item);
    return item;
  },

  clearCategory: async (c) => {
    if (c === 'tasks') {
      for (const t of getStore().tasks) await del('tasks', t.id);
      set({ tasks: [] });
    } else if (c === 'summaries') {
      for (const s of getStore().summaries) await del('summaries', s.id);
      set({ summaries: [] });
    } else if (c === 'audit') {
      await clearAudit();
      set({ audit: [] });
    } else {
      await getStore().updateSettings({ ...DEFAULT_SETTINGS });
    }
  },

  clearMyBlue: async () => {
    await clearAll();
    set({ settings: DEFAULT_SETTINGS, meta: DEFAULT_META, tasks: [], summaries: [], audit: [], outbox: [], pendingApproval: null });
  },

  refreshAudit: async () => set({ audit: await listAudit() }),
  setApproval: (a) => set({ pendingApproval: a }),
  setOfflineDemo: (v) => set({ offlineDemo: v }),
  showToast: (msg) => set({ toast: msg }),

  exportData: async () => {
    const { settings, tasks, summaries, outbox } = getStore();
    return JSON.stringify({ exportedAt: new Date().toISOString(), settings, tasks, summaries, outbox }, null, 2);
  },
}));
