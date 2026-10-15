import { create } from 'zustand';
import type { Settings, Task, Summary, AuditEntry, OutboxItem, Effort, TaskGroup, SourceCategory } from './core/types';
import type { ActionRequest } from './core/policy/gate';
import { get, put, getAll, del, clearAll } from './core/memory/db';
import { listAudit, clearAudit } from './core/memory/audit';
import seedTasks from './data/tasks.json';

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

function parseDuration(d: string): number {
  let min = 0;
  const h = d.match(/(\d+)\s*h/);
  const m = d.match(/(\d+)\s*m/);
  if (h) min += parseInt(h[1], 10) * 60;
  if (m) min += parseInt(m[1], 10);
  return min || 30;
}

const EFFORT_MAP: Record<string, Effort> = { easy: 'easy', medium: 'medium', hard: 'deep' };
const URGENCY_MAP: Record<string, 'low' | 'med' | 'high'> = { easy_wins: 'low', next_up: 'med', needs_senior: 'high' };
const SOURCE_MAP: Record<string, SourceCategory> = { chat: 'chat', email: 'email', calendar: 'calendar', policy: 'policy', manual: 'manual' };

function manualSeed(): Task[] {
  const now = new Date().toISOString();
  return (seedTasks as Array<Record<string, unknown>>).map((raw) => ({
    id: raw.id as string,
    title: raw.title as string,
    project: raw.project as string,
    estimateMin: parseDuration((raw.duration as string) ?? '30m'),
    effort: EFFORT_MAP[(raw.priority as string)] ?? 'medium',
    group: (raw.group as TaskGroup) ?? 'next_up',
    urgency: URGENCY_MAP[(raw.group as string)] ?? 'med',
    status: (raw.completed ? 'done' : 'todo') as Task['status'],
    blocker: (raw.blocker as string) ?? undefined,
    suggestedHelperId: (raw.suggestedHelperId as string) ?? undefined,
    dueDate: (raw.dueDate as string) ?? undefined,
    dueTime: (raw.dueTime as string) ?? undefined,
    explanation: {
      sourceCategory: SOURCE_MAP[((raw.whyExplanation as Record<string, unknown>)?.sourceCategory as string)] ?? 'manual',
      confidence: ((raw.whyExplanation as Record<string, unknown>)?.confidence as number) ?? 1,
      reason: ((raw.whyExplanation as Record<string, unknown>)?.reason as string) ?? '',
    },
    provenance: { source: 'manual' as const, ref: raw.id as string },
    createdAt: now,
    completedAt: raw.completed ? now : undefined,
  }));
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
      const seed = manualSeed();
      // Backfill due fields on tasks stored before dueDate/dueTime existed.
      const seedById = new Map(seed.map((t) => [t.id, t]));
      tasks = await Promise.all(tasks.map(async (t) => {
        const s = seedById.get(t.id);
        if (s && (!t.dueDate || !t.dueTime)) {
          const patched = { ...t, dueDate: t.dueDate ?? s.dueDate, dueTime: t.dueTime ?? s.dueTime };
          await put<Task>('tasks', t.id, patched);
          return patched;
        }
        return t;
      }));
      const existingIds = new Set(tasks.map((t) => t.id));
      const missing = seed.filter((t) => !existingIds.has(t.id));
      if (missing.length > 0) {
        for (const t of missing) await put<Task>('tasks', t.id, t);
        tasks = [...tasks, ...missing];
      }
      if (!meta.seeded) {
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
