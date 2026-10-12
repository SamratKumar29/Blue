import { Hash, Mail, Calendar as CalIcon, Boxes } from 'lucide-react';
import { useBlueStore } from '../store';
import { useUi } from '../ui';
import { Card } from '../components/ui';

export default function Apps() {
  const on = useBlueStore((s) => s.settings.allowConnectors);
  const openSettings = useUi((s) => s.openSettings);
  const apps = [
    { name: 'Demo Workspace', desc: 'Fictional Slack-like, Gmail-like and Calendar data. Read-only.', icon: Boxes, status: on ? 'Connected' : 'Available', cls: on ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600', action: true },
    { name: 'Slack', desc: 'Real workspace messages via Slack OAuth.', icon: Hash, status: 'Roadmap', cls: 'bg-slate-100 text-muted' },
    { name: 'Gmail', desc: 'Real mail via the Gmail API, read-only scopes.', icon: Mail, status: 'Roadmap', cls: 'bg-slate-100 text-muted' },
    { name: 'Google Calendar', desc: 'Real events via Calendar API (calendar.readonly).', icon: CalIcon, status: 'Roadmap', cls: 'bg-slate-100 text-muted' },
  ];
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-ink">Apps</h1>
      <p className="mb-5 text-sm text-muted">Connectors are off until you switch them on, and always read-only.</p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {apps.map(({ name, desc, icon: Icon, status, cls, action }) => (
          <li key={name}>
            <Card className="flex h-full items-start gap-4 p-5">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500"><Icon size={22} /></span>
              <div className="flex-1"><p className="font-semibold text-ink">{name}</p><p className="mt-0.5 text-xs text-muted">{desc}</p>
                {action && <button onClick={() => openSettings('connectors')} className="mt-3 text-xs font-semibold text-blue-600 hover:underline">Manage</button>}</div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{status}</span>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
