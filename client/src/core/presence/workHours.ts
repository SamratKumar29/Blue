import type { Settings } from '../types';

export type Presence = 'paused' | 'sleeping' | 'preroll' | 'active';

const PREROLL_MIN = 30;

function minutesInZone(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export function getPresence(now: Date, s: Pick<Settings, 'paused' | 'presence' | 'timezone' | 'workStart' | 'workEnd'>): Presence {
  if (s.paused) return 'paused';
  if (s.presence === 'laptop_awake') return 'active';
  const t = minutesInZone(now, s.timezone);
  const start = toMin(s.workStart);
  const end = toMin(s.workEnd);
  const pre = start - PREROLL_MIN;
  if (t >= start && t < end) return 'active';
  if (t >= pre && t < start) return 'preroll';
  return 'sleeping';
}

/** Background work (roundup offers, reminders) is only allowed around work hours. Laptop-awake never polls. */
export function canRunBackgroundWork(p: Presence, s: Pick<Settings, 'presence'>): boolean {
  return s.presence === 'work_hours' && (p === 'preroll' || p === 'active');
}

/** Milliseconds until the next moment Blue would wake (for a single timeout instead of polling). */
export function msUntilWake(now: Date, s: Pick<Settings, 'timezone' | 'workStart'>): number {
  const t = minutesInZone(now, s.timezone);
  const pre = toMin(s.workStart) - PREROLL_MIN;
  const diff = (pre - t + 1440) % 1440 || 1440;
  return diff * 60_000;
}

/** Hour (0-23) in the user's timezone, so greetings match the user's day, not the browser's. */
export function hourInZone(now: Date, timeZone: string): number {
  return Math.floor(minutesInZone(now, timeZone) / 60);
}

export function formatClock(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat([], { timeZone, hour: '2-digit', minute: '2-digit' }).format(now);
}
