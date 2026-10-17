import Modal from '../components/Modal';
import { useBlueStore } from '../store';
import { useUi } from '../ui';
import { Field, inputCls, SectionTitle, TIMEZONES, ToggleRow } from './parts';

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'ai', label: 'AI' },
  { id: 'privacy', label: 'Privacy' },
] as const;

export default function SettingsModal() {
  const open = useUi((state) => state.settingsOpen);
  const activeTab = useUi((state) => state.settingsTab);
  const selectTab = useUi((state) => state.openSettings);
  const close = useUi((state) => state.closeSettings);
  const settings = useBlueStore((state) => state.settings);
  const updateSettings = useBlueStore((state) => state.updateSettings);

  if (!open) return null;

  return (
    <Modal title="Settings" subtitle="Control Blue’s local preferences and access." onClose={close} wide>
      <div className="mb-6 flex gap-2 border-b border-slate-200" role="tablist" aria-label="Settings sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => selectTab(tab.id)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${activeTab === tab.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-muted hover:text-ink'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'ai' ? (
        <section role="tabpanel">
          <SectionTitle title="AI model" hint="Cloud processing stays off unless you explicitly enable it." />
          <div className="space-y-3">
            <button onClick={() => void updateSettings({ modelMode: 'local' })} className={`w-full rounded-xl border p-4 text-left ${settings.modelMode === 'local' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
              <span className="block text-sm font-semibold text-ink">Local demo</span>
              <span className="mt-1 block text-xs text-muted">Uses sample responses. No content is sent to an AI service.</span>
            </button>
            <button onClick={() => void updateSettings({ modelMode: 'cloud' })} className={`w-full rounded-xl border p-4 text-left ${settings.modelMode === 'cloud' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
              <span className="block text-sm font-semibold text-ink">Gemini cloud</span>
              <span className="mt-1 block text-xs text-muted">Cloud requests require a separate approval before content is sent.</span>
            </button>
          </div>
        </section>
      ) : activeTab === 'privacy' ? (
        <section role="tabpanel">
          <SectionTitle title="Privacy and access" hint="Connectors are read-only in this demo." />
          <ToggleRow title="Allow workspace connectors" hint="Permit Blue to use the selected sample workspace sources." checked={settings.allowConnectors} onChange={(allowConnectors) => void updateSettings({ allowConnectors })} />
          <ToggleRow title="Allow team context" hint="Use team guidelines when preparing sample responses." checked={settings.allowTeamContext} onChange={(allowTeamContext) => void updateSettings({ allowTeamContext })} />
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-muted">Codebase access and write actions remain disabled.</p>
        </section>
      ) : (
        <section role="tabpanel">
          <SectionTitle title="General" hint="Personalize Blue’s workday and notifications." />
          <Field label="Your name" htmlFor="settings-name">
            <input id="settings-name" className={inputCls} value={settings.name} onChange={(event) => void updateSettings({ name: event.target.value })} />
          </Field>
          <Field label="Timezone" htmlFor="settings-timezone">
            <select id="settings-timezone" className={inputCls} value={settings.timezone} onChange={(event) => void updateSettings({ timezone: event.target.value })}>
              {TIMEZONES.map((timezone) => <option key={timezone.value} value={timezone.value}>{timezone.label}</option>)}
              {!TIMEZONES.some((timezone) => timezone.value === settings.timezone) && <option value={settings.timezone}>{settings.timezone}</option>}
            </select>
          </Field>
          <ToggleRow title="Pause Blue" hint="Pause presence and background reminders." checked={settings.paused} onChange={(paused) => void updateSettings({ paused })} />
          <ToggleRow title="Celebrate completed tasks" checked={settings.praise} onChange={(praise) => void updateSettings({ praise })} />
        </section>
      )}
    </Modal>
  );
}