import { useState } from 'react';
import { Cloud, Cpu, Eye, Trash2, ShieldCheck, Ban } from 'lucide-react';
import { useBlueStore, SOURCE_LABELS, type SourceKey, type MemoryCategory } from '../store';
import { modelInfo } from '../core/ai/info';

const CATS: { key: MemoryCategory; label: string }[] = [
  { key: 'tasks', label: 'Tasks' },
  { key: 'summaries', label: 'Summaries' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'audit', label: 'Audit entries' },
];

export default function PrivacyPanel() {
  const { settings, meta, tasks, summaries, audit, clearCategory } = useBlueStore();
  const info = modelInfo(settings);
  const [view, setView] = useState<MemoryCategory | null>(null);

  const counts: Record<MemoryCategory, number> = { tasks: tasks.length, summaries: summaries.length, preferences: 1, audit: audit.length };

  return (
    <div className="space-y-6 mt-8" aria-label="Privacy panel">
      <section>
        <h3 className="text-sm font-semibold text-ink mb-2">Where Blue thinks</h3>
        <div className={`flex items-start gap-3 rounded-xl p-3 text-sm ${info.dataLeavesDevice ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
          {info.dataLeavesDevice ? <Cloud size={18} className="mt-0.5" /> : <Cpu size={18} className="mt-0.5" />}
          <div><p className="font-medium">{info.label}</p><p className="text-xs mt-0.5">{info.sentence}</p></div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-ink mb-2">Sources</h3>
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 text-sm">
          {(Object.keys(SOURCE_LABELS) as SourceKey[]).map((k) => {
            const on = settings.allowConnectors && meta.sources[k];
            return (
              <li key={k} className="flex items-center justify-between px-3 py-2">
                <span>{SOURCE_LABELS[k]} <span className="text-xs text-muted">(read-only)</span></span>
                <span className="text-xs text-muted">
                  <span className={`mr-2 font-semibold ${on ? 'text-emerald-600' : 'text-slate-400'}`}>{on ? 'On' : 'Off'}</span>
                  {meta.lastAccess[k] ? `last access ${new Date(meta.lastAccess[k]).toLocaleTimeString()}` : 'never accessed'}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-ink mb-2">What Blue remembers</h3>
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 text-sm">
          {CATS.map(({ key, label }) => (
            <li key={key} className="px-3 py-2">
              <div className="flex items-center justify-between">
                <span>{label} <span className="text-muted">({counts[key]})</span></span>
                <span className="flex gap-2">
                  <button onClick={() => setView(view === key ? null : key)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50" aria-label={`View ${label}`}>
                    <Eye size={13} /> View
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Delete all ${label.toLowerCase()}?`)) clearCategory(key); }}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50"
                    aria-label={`Delete ${label}`}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </span>
              </div>
              {view === key && (
                <div className="mt-2 max-h-40 overflow-auto rounded-lg bg-slate-50 p-2 text-xs text-muted">
                  {key === 'tasks' && (tasks.length ? tasks.map((t) => <p key={t.id}>• {t.title}</p>) : <p>Nothing stored.</p>)}
                  {key === 'summaries' && (summaries.length ? summaries.map((x) => <p key={x.id}>• {x.kind} · {new Date(x.at).toLocaleString()} · {x.sources.length} source pointers</p>) : <p>Nothing stored.</p>)}
                  {key === 'preferences' && <p>Name, timezone, work hours, permissions, notification choices.</p>}
                  {key === 'audit' && (audit.length ? audit.slice(0, 20).map((a) => <p key={a.id}>• {a.action}</p>) : <p>Nothing stored.</p>)}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-ink">Audit log</h3>
          <button onClick={() => clearCategory('audit')} className="text-xs font-medium text-rose-500 hover:underline">Clear log</button>
        </div>
        <div className="max-h-56 overflow-auto rounded-xl border border-slate-100">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 text-left text-muted">
              <tr><th className="px-3 py-2 font-medium">Time</th><th className="px-3 py-2 font-medium">Action</th><th className="px-3 py-2 font-medium">Result</th><th className="px-3 py-2 font-medium">Detail</th></tr>
            </thead>
            <tbody>
              {audit.length === 0 && <tr><td colSpan={4} className="px-3 py-4 text-center text-muted">No activity yet.</td></tr>}
              {audit.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-3 py-1.5 whitespace-nowrap text-muted">{new Date(a.at).toLocaleTimeString()}</td>
                  <td className="px-3 py-1.5">{a.action}</td>
                  <td className="px-3 py-1.5"><span className={`font-semibold ${a.allowed ? 'text-emerald-600' : 'text-rose-500'}`}>{a.allowed ? 'Allowed' : 'Blocked'}</span></td>
                  <td className="px-3 py-1.5 text-muted">{a.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700 space-y-1">
        <p className="flex items-center gap-2"><Ban size={13} /> No codebase access</p>
        <p className="flex items-center gap-2"><ShieldCheck size={13} /> Raw messages are not stored</p>
        <p className="flex items-center gap-2"><ShieldCheck size={13} /> No manager access</p>
      </section>
    </div>
  );
}
