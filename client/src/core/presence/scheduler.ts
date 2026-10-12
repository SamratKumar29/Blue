import { useBlueStore } from '../../store';
import { useUi } from '../../ui';
import { canRunBackgroundWork, getPresence, msUntilWake } from './workHours';
import { now, subscribeClock } from './demoClock';

const TICK_MS = 30_000;
const MAX_SLEEP_MS = 15 * 60_000;

/**
 * Presence-aware scheduler. While Blue should be resting it holds one timeout until the next wake time:
 * no interval, no polling, no work. It only ever offers things (a badge, a reminder); it never acts.
 */
export function startScheduler(): () => void {
  let timer: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval> | null = null;
  let isInterval = false;
  let lastReminder = now().getTime();

  const clear = () => {
    if (timer === null) return;
    isInterval ? clearInterval(timer as ReturnType<typeof setInterval>) : clearTimeout(timer as ReturnType<typeof setTimeout>);
    timer = null;
  };

  const evaluate = () => {
    const { settings, meta } = useBlueStore.getState();
    const ui = useUi.getState();
    const presence = getPresence(now(), settings);
    ui.setPresence(presence);
    const work = canRunBackgroundWork(presence, settings);

    if (!work) {
      if (presence === 'sleeping' || presence === 'paused') ui.setRoundupOffered(false);
      if (!isInterval && timer !== null) return;
      clear();
      isInterval = false;
      // One timeout until the next wake window (capped so clock changes are noticed).
      timer = setTimeout(() => { timer = null; evaluate(); }, Math.min(msUntilWake(now(), settings), MAX_SLEEP_MS));
      return;
    }

    // Offer the roundup once per day. If the page was closed at the usual time, this simply appears on open.
    if (meta.lastRoundupDay !== now().toDateString()) ui.setRoundupOffered(true);

    if (settings.waterReminderMin && presence === 'active') {
      if (now().getTime() - lastReminder >= settings.waterReminderMin * 60_000) {
        lastReminder = now().getTime();
        ui.setReminder('A short break and some water might feel good.');
      }
    }

    if (!isInterval || timer === null) {
      clear();
      isInterval = true;
      timer = setInterval(evaluate, TICK_MS);
    }
  };

  const unsubClock = subscribeClock(() => { clear(); isInterval = false; lastReminder = now().getTime(); evaluate(); });
  const unsubStore = useBlueStore.subscribe((s, prev) => {
    if (s.settings !== prev.settings) { clear(); isInterval = false; evaluate(); }
  });
  evaluate();
  return () => { clear(); unsubClock(); unsubStore(); };
}
