import { useNavigate } from 'react-router-dom';
import { Hash, Mail, Boxes, Check, LogOut } from 'lucide-react';
import { useBlueStore } from '../store';
import { useUi } from '../ui';
import { Card } from '../components/ui';
import { useGoogle, disconnectGoogle } from '../core/connectors/google';
import { GoogleConnectButton } from './Inbox';

export default function Apps() {
  const on = useBlueStore((s) => s.settings.allowConnectors);
  const openSettings = useUi((s) => s.openSettings);
  const nav = useNavigate();
  const { token, email } = useGoogle();

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-ink">Apps</h1>
      <p className="mb-5 text-sm text-muted">Connect your apps to let Blue read updates. Always read-only. Disconnect any time.</p>
      <ul className="grid gap-4 sm:grid-cols-2">
        <li>
          <Card className="flex h-full items-start gap-4 p-5">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500"><Boxes size={22} /></span>
            <div className="flex-1"><p className="font-semibold text-ink">Demo Workspace</p><p className="mt-0.5 text-xs text-muted">Fictional Slack-like, Gmail-like and Calendar data. Read-only.</p>
              <button onClick={() => openSettings('connectors')} className="mt-3 text-xs font-semibold text-blue-600 hover:underline">Manage</button></div>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${on ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{on ? 'Connected' : 'Available'}</span>
          </Card>
        </li>

        <li>
          <Card className="flex h-full flex-col p-5">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500"><Mail size={22} /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">Gmail + Google Calendar</p>
                <p className="mt-0.5 text-xs text-muted">Real mail and events through Google sign-in. Read-only scopes (gmail.readonly, calendar.readonly).</p>
              </div>
              {token && <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600"><Check size={12} /> Connected</span>}
            </div>
            {token ? (
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-50/60 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-emerald-700">Signed in as: {email ?? 'Google account'}</p>
                  <button onClick={() => nav('/inbox')} className="text-[11px] font-semibold text-blue-600 hover:underline">Open Inbox →</button>
                </div>
                <button onClick={disconnectGoogle} aria-label="Disconnect Google" className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50"><LogOut size={14} /> Disconnect</button>
              </div>
            ) : on ? (
              <div className="mt-4">
                <GoogleConnectButton className="w-full justify-center" />
                <p className="mt-2 text-center text-[11px] text-muted">Access lasts for this tab only. Nothing is stored or sent.</p>
              </div>
            ) : (
              <p className="mt-4 text-xs text-amber-700">Turn on <button onClick={() => openSettings('privacy')} className="font-semibold underline">Allow connectors</button> to connect.</p>
            )}
          </Card>
        </li>

        <li>
          <Card className="flex h-full items-start gap-4 p-5">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600"><Hash size={22} /></span>
            <div className="flex-1"><p className="font-semibold text-ink">Slack</p><p className="mt-0.5 text-xs text-muted">Read-only channel summaries via Slack OAuth.</p></div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-muted">Coming soon</span>
          </Card>
        </li>
      </ul>
    </div>
  );
}
