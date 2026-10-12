import { describe, it, expect } from 'vitest';
import { getPresence, canRunBackgroundWork, msUntilWake } from './workHours';

const base = { paused: false, presence: 'work_hours' as const, timezone: 'Asia/Kolkata', workStart: '09:30', workEnd: '18:00' };
// 2026-10-12 HH:MM in Asia/Kolkata (UTC+5:30)
const at = (hhmm: string) => new Date(`2026-10-12T${hhmm}:00+05:30`);

describe('presence', () => {
  it('sleeps before the preroll window', () => expect(getPresence(at('08:59'), base)).toBe('sleeping'));
  it('prerolls 30 minutes before start', () => expect(getPresence(at('09:00'), base)).toBe('preroll'));
  it('is active during work hours', () => expect(getPresence(at('09:30'), base)).toBe('active'));
  it('sleeps at end of day', () => expect(getPresence(at('18:00'), base)).toBe('sleeping'));
  it('paused wins', () => expect(getPresence(at('10:00'), { ...base, paused: true })).toBe('paused'));
  it('laptop_awake is always active but never runs background work', () => {
    const s = { ...base, presence: 'laptop_awake' as const };
    const p = getPresence(at('23:00'), s);
    expect(p).toBe('active');
    expect(canRunBackgroundWork(p, s)).toBe(false);
  });
  it('background work only in preroll/active for work_hours', () => {
    expect(canRunBackgroundWork('preroll', base)).toBe(true);
    expect(canRunBackgroundWork('active', base)).toBe(true);
    expect(canRunBackgroundWork('sleeping', base)).toBe(false);
    expect(canRunBackgroundWork('paused', base)).toBe(false);
  });
  it('honours the user timezone', () => {
    const sg = { ...base, timezone: 'Asia/Singapore' };
    expect(getPresence(new Date('2026-10-12T04:00:00Z'), sg)).toBe('active'); // 12:00 SGT
    expect(getPresence(new Date('2026-10-12T04:00:00Z'), { ...base, timezone: 'UTC' })).toBe('sleeping'); // 04:00 UTC
  });
  it('computes time until wake', () => {
    expect(msUntilWake(at('08:00'), base)).toBe(60 * 60_000); // wake at 09:00
  });
});
