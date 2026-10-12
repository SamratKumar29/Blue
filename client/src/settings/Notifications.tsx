import { useBlueStore } from '../store';
import { SectionTitle, ToggleRow, inputCls } from './parts';

export default function Notifications() {
  const s = useBlueStore((x) => x.settings);
  const update = useBlueStore((x) => x.updateSettings);
  const on = s.waterReminderMin !== null;

  return (
    <div>
      <SectionTitle title="Notifications" hint="Each one is independent. Blue never nags and never keeps streaks." />
      <ToggleRow title="Praise" hint="A short, specific note when you finish something." checked={s.praise} onChange={(v) => update({ praise: v })} />
      <ToggleRow title="Check-ins" hint="Optional, private, skippable wellbeing check-ins." checked={s.checkins} onChange={(v) => update({ checkins: v })} />
      <ToggleRow title="Tone observations" hint="Lets Blue reply calmly if a message sounds stressed. It never labels or scores you." checked={s.toneObservations} onChange={(v) => update({ toneObservations: v })} />
      <ToggleRow title="Water / work reminder" hint="A gentle reminder while Blue is active." checked={on} onChange={(v) => update({ waterReminderMin: v ? 90 : null })} />
      {on && (
        <div className="mt-2 flex items-center gap-3">
          <label htmlFor="rem-min" className="text-sm text-ink">Every</label>
          <input id="rem-min" type="number" min={15} max={240} step={5} className={`${inputCls} w-24`} value={s.waterReminderMin ?? 90}
            onChange={(e) => update({ waterReminderMin: Math.max(15, Math.min(240, Number(e.target.value) || 90)) })} />
          <span className="text-sm text-muted">minutes</span>
        </div>
      )}
    </div>
  );
}
