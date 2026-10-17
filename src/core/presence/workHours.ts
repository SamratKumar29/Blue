export function isWithinWorkHours(date: Date, timezone: string, workStart: string, workEnd: string) {
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  const current = toMinutes(time);
  const start = toMinutes(workStart);
  const end = toMinutes(workEnd);
  return start <= end ? current >= start && current < end : current >= start || current < end;
}

export function formatClock(date: Date, timezone: string) {
  return new Intl.DateTimeFormat(undefined, { timeZone: timezone, hour: 'numeric', minute: '2-digit' }).format(date);
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}