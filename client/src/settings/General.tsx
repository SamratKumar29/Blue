import { User, Lock } from 'lucide-react';
import { useBlueStore } from '../store';
import ModelCard from '../components/ModelCard';
import { Field, SectionTitle, Segmented, ToggleRow, inputCls, TIMEZONES } from './parts';

export default function General() {
  const s = useBlueStore((x) => x.settings);
  const update = useBlueStore((x) => x.updateSettings);

  return (
    <div>
      <SectionTitle title="General" hint="Customize your Blue experience." />
      <Field label="Your Name" htmlFor="set-name">
        <div className="relative">
          <User size={16} className="absolute left-3.5 top-3 text-muted" />
          <input id="set-name" className={`${inputCls} pl-10`} value={s.name} onChange={(e) => update({ name: e.target.value })} />
        </div>
      </Field>
      <Field label="Timezone" htmlFor="set-tz">
        <select id="set-tz" className={inputCls} value={s.timezone} onChange={(e) => update({ timezone: e.target.value })}>
          {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </Field>
      <Field label="Language" htmlFor="set-lang">
        <select id="set-lang" className={inputCls} value="en" onChange={() => undefined}>
          <option value="en">English</option>
        </select>
      </Field>
      <Field label="Blue's Presence" hint="Blue will wake 30 minutes before your workday and sleep after your work hours.">
        <Segmented
          label="Blue's presence"
          value={s.presence}
          onChange={(v) => update({ presence: v })}
          options={[{ value: 'work_hours', label: 'Work hours only' }, { value: 'laptop_awake', label: 'Laptop awake' }]}
        />
      </Field>

      <h3 className="text-sm font-medium text-ink mt-6 mb-2">AI Model</h3>
      <ModelCard />

      <h3 className="text-sm font-medium text-ink mt-6 mb-1">Privacy Quick Controls</h3>
      <ToggleRow title="Allow writing (with approval)" hint="Blue will ask for your permission before sending, editing, or deleting anything." checked={s.allowWriting} onChange={(v) => update({ allowWriting: v })} />
      <ToggleRow title="Allow connectors" hint="Enable Gmail, Slack, Calendar and other apps (read-only demo workspace)." checked={s.allowConnectors} onChange={(v) => update({ allowConnectors: v })} />
      <ToggleRow title="Allow team context" hint="Use team/project context (no codebase access)." checked={s.allowTeamContext} onChange={(v) => update({ allowTeamContext: v })} />

      <div className="mt-5 flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-600">
        <Lock size={18} className="flex-shrink-0" />
        <p><strong>Your data stays with you. Always.</strong> My Blue is my Blue, not your Blue.</p>
      </div>
    </div>
  );
}
