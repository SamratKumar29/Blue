import { useState } from 'react';
import { Lock, Ban, Users, PenOff } from 'lucide-react';
import { useBlueStore, SOURCE_LABELS, type SourceKey } from '../store';
import { logAudit } from '../core/memory/audit';
import { useModelStatus } from '../core/ai/status';
import { Toggle } from './Toggle';
import { Segmented, inputCls } from '../settings/parts';
import BlueMascot from './BlueMascot';

export default function PermissionCenter() {
  const { settings, meta, updateSettings, updateMeta, refreshAudit } = useBlueStore();
  const status = useModelStatus();
  const [sources, setSources] = useState<Record<SourceKey, boolean>>({ ...meta.sources });
  const [start, setStart] = useState(settings.workStart);
  const [end, setEnd] = useState(settings.workEnd);
  const [presence, setPresence] = useState(settings.presence);
  const anyOn = Object.values(sources).some(Boolean);

  const finish = async () => {
    await updateSettings({
      allowConnectors: anyOn,
      allowTeamContext: sources.policy,
      workStart: start,
      workEnd: end,
      presence,
    });
    await updateMeta({ sources, onboarded: true });
    await logAudit('onboarding', true, `permissions set: ${Object.entries(sources).filter(([, v]) => v).map(([k]) => k).join(', ') || 'no sources'}; writes off`);
    await refreshAudit();
  };

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-sunrise">
      <div className="mx-auto flex min-h-full max-w-3xl items-center p-4 sm:p-8">
        <div className="w-full rounded-3xl bg-white/90 p-6 shadow-2xl backdrop-blur sm:p-10 animate-pop" role="dialog" aria-modal="true" aria-labelledby="pc-title">
          <div className="flex items-center gap-5">
            <BlueMascot size={110} mood="happy" float />
            <div>
              <h1 id="pc-title" className="text-2xl font-bold text-ink sm:text-3xl">Set up your Blue</h1>
              <p className="mt-1 text-muted">You decide what Blue can see. Nothing is on until you say so.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Where Blue thinks</p>
              <p className="mt-1 font-semibold text-ink">{status.info.label}</p>
              <p className="mt-1 text-xs text-muted">{status.info.sentence}</p>
              <p className="mt-2 text-xs text-muted">Gemini API: <strong className="text-ink">{settings.modelMode === 'cloud' ? 'On (asks consent on first use)' : 'Off'}</strong></p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4 text-sm space-y-2">
              <p className="flex items-center gap-2 text-ink"><Ban size={15} className="text-rose-500" /> Codebase access: <strong>never</strong></p>
              <p className="flex items-center gap-2 text-ink"><Users size={15} className="text-rose-500" /> Blue-to-Blue: <strong>off</strong></p>
              <p className="flex items-center gap-2 text-ink"><PenOff size={15} className="text-amber-500" /> Write actions: <strong>off</strong> <span className="text-xs text-muted">(you can enable later)</span></p>
            </div>
          </div>

          <h2 className="mt-6 text-sm font-semibold text-ink">Demo Workspace sources</h2>
          <ul className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-100">
            {(Object.keys(SOURCE_LABELS) as SourceKey[]).map((k) => (
              <li key={k} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{SOURCE_LABELS[k]}</p>
                  <p className="text-xs text-muted">Read-only · fictional sample data</p>
                </div>
                <Toggle checked={sources[k]} onChange={(v) => setSources({ ...sources, [k]: v })} label={SOURCE_LABELS[k]} />
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div><label htmlFor="pc-start" className="mb-1 block text-sm font-medium text-ink">Work starts</label><input id="pc-start" type="time" className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div><label htmlFor="pc-end" className="mb-1 block text-sm font-medium text-ink">Work ends</label><input id="pc-end" type="time" className={inputCls} value={end} onChange={(e) => setEnd(e.target.value)} /></div>
            <div><p className="mb-1 text-sm font-medium text-ink">Presence</p>
              <Segmented label="Presence" value={presence} onChange={setPresence} options={[{ value: 'work_hours', label: 'Work hours' }, { value: 'laptop_awake', label: 'Laptop awake' }]} />
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <button onClick={finish} className="btn-primary w-full max-w-sm py-3 text-base">Start my Blue</button>
            <p className="flex items-center gap-2 text-xs text-muted"><Lock size={13} /> My Blue is my Blue, not your Blue.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
