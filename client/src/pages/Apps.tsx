import { CheckCircle, Clock, XCircle } from 'lucide-react';

const CONNECTORS = [
  {
    id: 'c1', name: 'Demo Workspace', description: 'Sample Slack-like, Gmail-like, and Calendar data',
    status: 'available', icon: '🔵'
  },
  {
    id: 'c2', name: 'Slack', description: 'Real-time team messaging', status: 'roadmap', icon: '💬'
  },
  {
    id: 'c3', name: 'Gmail', description: 'Work email access (read-only)', status: 'roadmap', icon: '📧'
  },
  {
    id: 'c4', name: 'Google Calendar', description: 'Calendar events and scheduling', status: 'roadmap', icon: '📅'
  },
];

const statusUI = {
  available: { label: 'Available', icon: <CheckCircle size={14} />, className: 'bg-green-100 text-green-700' },
  roadmap:   { label: 'Roadmap',   icon: <Clock size={14} />,       className: 'bg-slate-100 text-muted' },
  denied:    { label: 'Denied',    icon: <XCircle size={14} />,     className: 'bg-red-100 text-red-700' },
};

export default function Apps() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-ink mb-2">Connectors & Apps</h1>
      <p className="text-muted text-sm mb-6">
        Blue accesses only what you explicitly enable. Codebase and secret access is always off.
      </p>

      <div className="space-y-3">
        {CONNECTORS.map(conn => {
          const ui = statusUI[conn.status as keyof typeof statusUI];
          return (
            <div key={conn.id} className="card px-5 py-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <span className="text-2xl">{conn.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink text-sm">{conn.name}</p>
                <p className="text-xs text-muted mt-0.5">{conn.description}</p>
              </div>
              <span className={`pill flex items-center gap-1 ${ui.className}`}>
                {ui.icon}
                {ui.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 card p-4 bg-slate-50">
        <p className="text-xs text-muted text-center">
          🔒 Codebase access: never &nbsp;·&nbsp; Blue-to-Blue: disabled &nbsp;·&nbsp; Write actions: off by default
        </p>
      </div>
    </div>
  );
}
