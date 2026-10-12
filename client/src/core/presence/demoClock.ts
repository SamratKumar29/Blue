// Simulated clock for the demo (?demo=1). Real time unless an offset is set.
let offsetMs = 0;
const listeners = new Set<() => void>();

export const now = (): Date => new Date(Date.now() + offsetMs);
export const isDemoClock = () => offsetMs !== 0;

export function subscribeClock(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function minutesInZone(d: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d);
  return Number(parts.find((p) => p.type === 'hour')?.value) * 60 + Number(parts.find((p) => p.type === 'minute')?.value);
}

/** Make the clock read `hhmm` in the user's timezone right now; time then keeps moving. */
export function setDemoTime(hhmm: string, timeZone: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const real = new Date();
  offsetMs = (h * 60 + m - minutesInZone(real, timeZone)) * 60_000 - real.getSeconds() * 1000;
  listeners.forEach((f) => f());
}

export function clearDemoTime() {
  offsetMs = 0;
  listeners.forEach((f) => f());
}
