let demoTime: Date | null = null;

export function now() {
  return demoTime ? new Date(demoTime) : new Date();
}

export function isDemoClock() {
  return demoTime !== null;
}

export function setDemoTime(time: string, _timezone: string) {
  const [hours, minutes] = time.split(':').map(Number);
  demoTime = new Date();
  demoTime.setHours(hours, minutes, 0, 0);
}

export function clearDemoTime() {
  demoTime = null;
}