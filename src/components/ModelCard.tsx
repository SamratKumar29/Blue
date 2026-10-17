import { Cpu } from 'lucide-react';
import { useUi } from '../ui';
import { useModelStatus } from '../core/ai/status';

const CHIP = {
  checking: { text: 'Checking…', cls: 'bg-slate-100 text-muted' },
  ready: { text: 'Active', cls: 'bg-emerald-50 text-emerald-600' },
  needs_consent: { text: 'Needs consent', cls: 'bg-amber-50 text-amber-600' },
  unavailable: { text: 'Unavailable', cls: 'bg-rose-50 text-rose-500' },
} as const;

export default function ModelCard() {
  const status = useModelStatus();
  const openSettings = useUi((s) => s.openSettings);
  const chip = CHIP[status.state];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 flex gap-4 items-start">
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
        <Cpu size={22} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-ink">{status.info.label}</p>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${chip.cls}`}>{chip.text}</span>
        </div>
        <p className="text-xs text-muted mt-1">
          {status.state === 'unavailable'
            ? `${status.reason ?? 'Model not available.'} Blue will show sample output (offline demo mode). Nothing is sent anywhere.`
            : status.info.sentence}
        </p>
        <button onClick={() => openSettings('ai')} className="mt-3 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100">
          Change model
        </button>
      </div>
    </div>
  );
}
