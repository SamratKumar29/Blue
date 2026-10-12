import { useBlueStore } from '../store';
import { Field, SectionTitle, Segmented, inputCls } from './parts';

export default function WorkHours() {
  const s = useBlueStore((x) => x.settings);
  const update = useBlueStore((x) => x.updateSettings);
  return (
    <div>
      <SectionTitle title="Work Hours" hint="Outside these hours Blue sleeps: no polling, no nudges." />
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <Field label="Start" htmlFor="wh-start"><input id="wh-start" type="time" className={inputCls} value={s.workStart} onChange={(e) => update({ workStart: e.target.value })} /></Field>
        <Field label="End" htmlFor="wh-end"><input id="wh-end" type="time" className={inputCls} value={s.workEnd} onChange={(e) => update({ workEnd: e.target.value })} /></Field>
      </div>
      <Field label="Presence" hint="Work hours only: Blue wakes 30 minutes before you start. Laptop awake: Blue is available whenever the app is open, but never watches in the background.">
        <Segmented label="Presence" value={s.presence} onChange={(v) => update({ presence: v })}
          options={[{ value: 'work_hours', label: 'Work hours only' }, { value: 'laptop_awake', label: 'Laptop awake' }]} />
      </Field>
    </div>
  );
}
