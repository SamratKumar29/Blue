import { useState } from 'react';
import { Hash, Mail, Calendar as CalIcon, Boxes, Check, LogOut, Loader2 } from 'lucide-react';
import { useBlueStore } from '../store';
import { useUi } from '../ui';
import { Card } from '../components/ui';
import type { LucideIcon } from 'lucide-react';

interface AppDef {
  key: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  fieldLabel: string;
  fieldPlaceholder: string;
  connectedPrefix: string;
}

const APPS: AppDef[] = [
  { key: 'slack', name: 'Slack', desc: 'Real workspace messages via Slack OAuth.', icon: Hash, color: 'text-purple-600 bg-purple-50', fieldLabel: 'Workspace URL', fieldPlaceholder: 'your-team.slack.com', connectedPrefix: 'Workspace' },
  { key: 'gmail', name: 'Gmail', desc: 'Real mail via the Gmail API, read-only scopes.', icon: Mail, color: 'text-rose-500 bg-rose-50', fieldLabel: 'Google Account', fieldPlaceholder: 'you@gmail.com', connectedPrefix: 'Signed in as' },
  { key: 'gcal', name: 'Google Calendar', desc: 'Real events via Calendar API (calendar.readonly).', icon: CalIcon, color: 'text-blue-500 bg-blue-50', fieldLabel: 'Google Account', fieldPlaceholder: 'you@gmail.com', connectedPrefix: 'Signed in as' },
];

interface ConnectedState {
  value: string;
}

function AppCard({ app, connected, onConnect, onDisconnect }: { app: AppDef; connected: ConnectedState | null; onConnect: (value: string) => void; onDisconnect: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [field, setField] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = () => {
    if (!field.trim()) return;
    setLoading(true);
    setTimeout(() => {
      onConnect(field.trim());
      setLoading(false);
      setExpanded(false);
      setField('');
    }, 1500);
  };

  const Icon = app.icon;

  return (
    <Card className="flex flex-col h-full p-5">
      <div className="flex items-start gap-4">
        <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${app.color}`}><Icon size={22} /></span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink">{app.name}</p>
          <p className="mt-0.5 text-xs text-muted">{app.desc}</p>
        </div>
        {connected ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 flex items-center gap-1"><Check size={12} /> Connected</span>
        ) : expanded ? (
          <button onClick={() => { setExpanded(false); setField(''); }} className="text-xs font-semibold text-muted hover:underline">Cancel</button>
        ) : (
          <button onClick={() => setExpanded(true)} className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-100 transition">Connect</button>
        )}
      </div>

      {expanded && !connected && (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="mb-3 text-xs font-semibold text-ink">Authorize {app.name} (read-only)</p>
          <label className="block text-xs font-medium text-muted mb-1">{app.fieldLabel}</label>
          <input
            type={app.key === 'slack' ? 'text' : 'email'}
            value={field}
            onChange={(e) => setField(e.target.value)}
            placeholder={app.fieldPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
          />
          <button
            onClick={handleAuth}
            disabled={!field.trim() || loading}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 active:scale-95 transition disabled:opacity-40"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Authorizing...</> : <>Authorize & Connect</>}
          </button>
          <p className="mt-2 text-[11px] text-muted text-center">Blue will only request read-only access. You can disconnect any time.</p>
        </div>
      )}

      {connected && (
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-50/60 px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-emerald-700">{app.connectedPrefix}: {connected.value}</p>
            <p className="text-[11px] text-emerald-600/70">Read-only access</p>
          </div>
          <button onClick={onDisconnect} aria-label={`Disconnect ${app.name}`} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 transition">
            <LogOut size={14} /> Disconnect
          </button>
        </div>
      )}
    </Card>
  );
}

export default function Apps() {
  const on = useBlueStore((s) => s.settings.allowConnectors);
  const openSettings = useUi((s) => s.openSettings);
  const showToast = useBlueStore((s) => s.showToast);
  const [connections, setConnections] = useState<Record<string, ConnectedState | null>>({});

  const connect = (key: string, value: string) => {
    setConnections((prev) => ({ ...prev, [key]: { value } }));
    showToast(`${APPS.find((a) => a.key === key)?.name} connected`);
  };

  const disconnect = (key: string) => {
    setConnections((prev) => ({ ...prev, [key]: null }));
    showToast(`${APPS.find((a) => a.key === key)?.name} disconnected`);
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-ink">Apps</h1>
      <p className="mb-5 text-sm text-muted">Connect your apps to let Blue read updates. Always read-only — disconnect any time.</p>
      <ul className="grid gap-4 sm:grid-cols-2">
        <li>
          <Card className="flex h-full items-start gap-4 p-5">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500"><Boxes size={22} /></span>
            <div className="flex-1"><p className="font-semibold text-ink">Demo Workspace</p><p className="mt-0.5 text-xs text-muted">Fictional Slack-like, Gmail-like and Calendar data. Read-only.</p>
              <button onClick={() => openSettings('connectors')} className="mt-3 text-xs font-semibold text-blue-600 hover:underline">Manage</button></div>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${on ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{on ? 'Connected' : 'Available'}</span>
          </Card>
        </li>
        {APPS.map((app) => (
          <li key={app.key}>
            <AppCard
              app={app}
              connected={connections[app.key] ?? null}
              onConnect={(v) => connect(app.key, v)}
              onDisconnect={() => disconnect(app.key)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
