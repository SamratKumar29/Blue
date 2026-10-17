import { useBlueStore } from '../../store';
import { useUi } from '../../ui';
import { isWithinWorkHours } from './workHours';

export function startScheduler() {
  const update = () => {
    const { settings } = useBlueStore.getState();
    if (settings.paused) {
      useUi.getState().setPresence('paused');
      return;
    }
    if (settings.presence === 'laptop_awake' || isWithinWorkHours(new Date(), settings.timezone, settings.workStart, settings.workEnd)) {
      useUi.getState().setPresence('active');
    } else {
      useUi.getState().setPresence('sleeping');
    }
  };
  update();
  const interval = window.setInterval(update, 60_000);
  return () => window.clearInterval(interval);
}