import { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { useBlueStore } from '../store';
import { SectionTitle, ToggleRow, Field, inputCls } from './parts';
import PrivacyPanel from './PrivacyPanel';

export default function PrivacyData() {
  const s = useBlueStore((x) => x.settings);
  const update = useBlueStore((x) => x.updateSettings);
  const exportData = useBlueStore((x) => x.exportData);
  const clearMyBlue = useBlueStore((x) => x.clearMyBlue);
  const [confirming, setConfirming] = useState(false);

  const doExport = async () => {
    const blob = new Blob([await exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'my-blue-export.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <SectionTitle title="Privacy & Data" hint="You own everything Blue knows. Inspect, export or delete it any time." />
      <ToggleRow title="Allow writing (with approval)" hint="Blue will ask for your permission before sending, editing, or deleting anything." checked={s.allowWriting} onChange={(v) => update({ allowWriting: v })} />
      <ToggleRow title="Allow connectors" hint="Enable the read-only demo Slack, Gmail and Calendar." checked={s.allowConnectors} onChange={(v) => update({ allowConnectors: v })} />
      <ToggleRow title="Allow team context" hint="Use team/project context (no codebase access)." checked={s.allowTeamContext} onChange={(v) => update({ allowTeamContext: v })} />
      <ToggleRow title="Pause Blue" hint="While paused, every action is blocked and nothing is read." checked={s.paused} onChange={(v) => update({ paused: v })} />
      <div className="mt-3 max-w-xs">
        <Field label="Keep summaries and audit entries for" htmlFor="ret">
          <select id="ret" className={inputCls} value={s.retentionDays} onChange={(e) => update({ retentionDays: Number(e.target.value) })}>
            <option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option>
          </select>
        </Field>
      </div>
      <div className="flex flex-wrap gap-3">
        <button onClick={doExport} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50"><Download size={16} /> Export my data</button>
        {!confirming ? (
          <button onClick={() => setConfirming(true)} className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-500 hover:bg-rose-100"><Trash2 size={16} /> Clear my Blue</button>
        ) : (
          <div role="alertdialog" aria-label="Confirm clear" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm">
            <span className="text-rose-600">Delete everything and the encryption key?</span>
            <button onClick={() => { clearMyBlue(); setConfirming(false); }} className="rounded-lg bg-rose-500 px-3 py-1 text-white text-xs font-semibold">Yes, clear</button>
            <button onClick={() => setConfirming(false)} className="rounded-lg px-3 py-1 text-xs font-semibold text-ink">Keep</button>
          </div>
        )}
      </div>
      <PrivacyPanel />
    </div>
  );
}
