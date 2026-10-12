export interface Slot { start: Date; end: Date; label: string }

const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const fmtTime = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

/** Next weekday slot after `from`; `skip` moves further out (0 = next working day). */
export function nextSlot(from: Date, hour = 11, minutes = 45, skip = 0): Slot {
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  let n = skip;
  for (;;) {
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    if (n-- <= 0) break;
    d.setDate(d.getDate() + 1);
  }
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, 0, 0);
  const end = new Date(start.getTime() + minutes * 60_000);
  return { start, end, label: `${fmt.format(start)} · ${fmtTime.format(start)} – ${fmtTime.format(end)}` };
}

/** Deterministic "free/busy" for the simulated availability scan. */
export function isBusy(personId: string, day: Date): boolean {
  let h = 0;
  for (const c of `${personId}${day.toDateString()}`) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 3 === 0;
}
