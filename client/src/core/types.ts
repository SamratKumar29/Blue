export type Effort = 'easy' | 'medium' | 'deep';
export type TaskGroup = 'easy_wins' | 'next_up' | 'needs_senior';
export type SourceCategory = 'chat' | 'email' | 'calendar' | 'policy' | 'manual';

export interface Explanation {
  sourceCategory: SourceCategory;
  confidence: number; // 0..1
  reason: string;     // one sentence, plain English
}

export interface Provenance {
  source: 'demo-slack' | 'demo-gmail' | 'demo-calendar' | 'policy' | 'manual';
  ref: string; // item id, never a raw body
}

export interface Task {
  id: string;
  title: string;
  project: string;
  estimateMin: number;
  effort: Effort;
  group: TaskGroup;
  urgency: 'low' | 'med' | 'high';
  status: 'todo' | 'done';
  dependsOn?: string[];
  blocker?: string;
  suggestedHelperId?: string;
  dueDate?: string;  // relative label from seed data, e.g. "Today", "Tomorrow", "Wed"
  dueTime?: string;  // e.g. "10:00 AM"
  explanation: Explanation;
  provenance?: Provenance;
  createdAt: string;
  completedAt?: string;
  userAdjusted?: boolean; // the user moved this task between groups
}

export interface Settings {
  name: string;
  timezone: string;
  language: 'en';
  presence: 'work_hours' | 'laptop_awake';
  workStart: string; // 'HH:mm' e.g. '09:30'
  workEnd: string;   // 'HH:mm' e.g. '18:00'
  waterReminderMin: number | null; // e.g. 90 or null
  allowWriting: boolean;
  allowConnectors: boolean;
  allowTeamContext: boolean;
  modelMode: 'local' | 'cloud';
  cloudConsentGiven: boolean;
  praise: boolean;
  checkins: boolean;
  toneObservations: boolean;
  paused: boolean;
  retentionDays: number;
}

export interface AuditEntry {
  id: string;
  at: string;
  action: string;
  allowed: boolean;
  detail: string; // NEVER a raw message body
}

export interface OutboxItem {
  id: string;
  at: string;
  recipient: string;
  content: string;
  approvedHash: string;
  kind?: 'message' | 'event';
  when?: string; // ISO start, for events
}

export interface Summary {
  id: string;
  at: string;
  kind: 'roundup' | 'digest' | 'note';
  text: string;
  sources: Provenance[];
}

export interface MessageItem {
  id: string;
  channel: string;
  from: string;
  ts: string;
  text: string;
}

export interface EmailItem {
  id: string;
  from: string;
  subject: string;
  ts: string;
  body: string;
}

export interface CalendarItem {
  id: string;
  title: string;
  start: string;
  end: string;
  attendees: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  expertise: string[];
  timezone: string;
  avatar?: string;
  /** Self-declared by the teammate and shared by choice. Never inferred. */
  status?: 'on_track' | 'in_progress' | 'needs_help' | 'at_capacity';
}
