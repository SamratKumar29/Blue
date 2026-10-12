import { LifeBuoy, UserX } from 'lucide-react';
import { useUi } from '../ui';
import { useBlueStore } from '../store';
import { TEAM } from '../core/features/askSenior';
import { Card } from '../components/ui';

const STATUS = { on_track: ['On track', 'bg-emerald-50 text-emerald-600'], in_progress: ['In progress', 'bg-amber-50 text-amber-600'], needs_help: ['Needs help', 'bg-rose-50 text-rose-500'], at_capacity: ['At capacity', 'bg-rose-50 text-rose-500'] } as const;

export default function Team() {
  const openDialog = useUi((s) => s.openDialog);
  const showStatus = useBlueStore((s) => s.settings.allowTeamContext);
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-ink">Team</h1><p className="text-sm text-muted">Asking for help early is a sign of strength.</p></div>
        <button onClick={() => openDialog('capacity')} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"><UserX size={15} /> A teammate said no</button>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEAM.map((m) => {
          const s = STATUS[m.status ?? 'on_track'];
          return (
            <li key={m.id}>
              <Card className="flex h-full flex-col p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">{m.name.split(' ').map((p) => p[0]).join('')}</span>
                  <div className="min-w-0"><p className="font-semibold text-ink">{m.name}</p><p className="text-xs text-muted">{m.role}</p>
                    {showStatus && <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${s[1]}`}>{s[0]} · self-declared</span>}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">{m.expertise.map((e) => <span key={e} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-ink">{e}</span>)}</div>
                <button onClick={() => openDialog('askSenior', { helperId: m.id })} className="btn-primary mt-4 inline-flex items-center justify-center gap-2 text-xs"><LifeBuoy size={14} /> Ask {m.name.split(' ')[0]} for help</button>
              </Card>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-xs text-muted">No manager view, no scores. Availability appears only if teammates choose to share it.</p>
    </div>
  );
}
