import { useState } from 'react';
import { Lock, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { DOC_NAMES, docText, canUsePolicy } from '../core/features/retrieval';
import { useBlueStore } from '../store';
import { Card, EmptyState } from '../components/ui';

export default function Files() {
  useBlueStore((s) => s.settings.allowTeamContext);
  useBlueStore((s) => s.settings.allowConnectors);
  const allowed = canUsePolicy();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-ink">Files</h1>
      <p className="mb-5 text-sm text-muted">Approved documents Blue may read to ground its answers. Read-only.</p>
      {!allowed ? (
        <Card><EmptyState title="Policy documents are off" hint="Turn on team context or the policy source in Settings to let Blue cite these." /></Card>
      ) : (
        <ul className="space-y-3">
          {DOC_NAMES().map((d) => (
            <li key={d}>
              <Card className="p-4">
                <button onClick={() => setOpen(open === d ? null : d)} aria-expanded={open === d} className="flex w-full items-center gap-3 text-left">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500"><FileText size={18} /></span>
                  <span className="flex-1 font-semibold text-ink">{d.replace(/[-_]/g, ' ')}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-muted"><Lock size={11} /> read-only</span>
                  {open === d ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                </button>
                {open === d && <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-sans text-sm text-ink">{docText(d)}</pre>}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
