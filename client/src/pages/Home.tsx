import { useEffect, useState } from 'react';
import { Bell, ChevronRight, CheckCircle2, Circle, Zap, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import BlueMascot from '../components/BlueMascot';

interface Task {
  id: string;
  title: string;
  project: string;
  estimateMin: number;
  group: 'easy_wins' | 'next_up' | 'needs_senior';
  done: boolean;
}

interface TeamUpdate {
  id: string;
  source: 'slack' | 'gmail' | 'calendar';
  text: string;
  time: string;
}

const SAMPLE_TASKS: Task[] = [
  { id: 't1', title: 'Review design mockup feedback', project: 'Atlas', estimateMin: 15, group: 'easy_wins', done: false },
  { id: 't2', title: 'Respond to sprint-demo invite', project: 'Atlas', estimateMin: 5, group: 'easy_wins', done: false },
  { id: 't3', title: 'Draft API integration spec', project: 'Atlas', estimateMin: 60, group: 'next_up', done: false },
  { id: 't4', title: 'Follow up on access request', project: 'Orion Billing', estimateMin: 30, group: 'next_up', done: false },
  { id: 't5', title: 'Resolve prod-bug #471 (DevOps input needed)', project: 'Atlas', estimateMin: 120, group: 'needs_senior', done: false },
  { id: 't6', title: 'Clarify "make it faster" requirement', project: 'Atlas', estimateMin: 30, group: 'needs_senior', done: false },
];

const TEAM_UPDATES: TeamUpdate[] = [
  { id: 'u1', source: 'slack', text: 'Priya: design review feedback added in Figma', time: '10m ago' },
  { id: 'u2', source: 'gmail', text: 'Sprint demo confirmed — Thu 3pm', time: '45m ago' },
  { id: 'u3', source: 'calendar', text: 'Design sync at 11:00 today', time: '1h ago' },
];

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const groupConfig = {
  easy_wins: { label: 'Easy wins', color: 'bg-good', textColor: 'text-green-700', dot: 'bg-good' },
  next_up:   { label: 'Next up',   color: 'bg-blue-500', textColor: 'text-blue-700', dot: 'bg-blue-500' },
  needs_senior: { label: 'Needs senior help', color: 'bg-warn', textColor: 'text-amber-700', dot: 'bg-warn' },
};

function formatEst(min: number) {
  if (min < 60) return `${min}m`;
  return `${min / 60}h`;
}

export default function Home() {
  const [tasks, setTasks] = useState(SAMPLE_TASKS);
  const [showRoundup, setShowRoundup] = useState(false);

  const done = tasks.filter(t => t.done).length;
  const groups = (['easy_wins', 'next_up', 'needs_senior'] as const);

  const toggle = (id: string) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="p-0">
      {/* Hero / Sunrise gradient */}
      <div
        className="relative px-8 pt-8 pb-6"
        style={{ background: 'linear-gradient(135deg, #EEF4FF 0%, #FFF7ED 60%, #FFF 100%)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="pill bg-green-100 text-good font-semibold">● Active</span>
            </div>
            <h1 className="text-2xl font-semibold text-ink">
              Good {getTimeGreeting()}, Alex!
            </h1>
            <p className="text-muted text-sm mt-0.5">Blue here. I've got your roundup for today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-ghost p-2 rounded-full" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
              AJ
            </div>
          </div>
        </div>

        {/* Roundup card */}
        <div className="mt-4 card p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg transition-shadow"
             onClick={() => setShowRoundup(v => !v)}>
          <BlueMascot size={48} mood="happy" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink text-sm">Your day, simplified</p>
            <p className="text-muted text-xs mt-0.5 truncate">
              {done} done · {tasks.length - done} remaining · Click to see roundup
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-1.5 rounded-full hover:bg-blue-50 text-muted hover:text-blue-500 transition-colors"
              aria-label="Refresh roundup"
              onClick={e => { e.stopPropagation(); }}
            >
              <RefreshCw size={15} />
            </button>
            <ChevronRight size={18} className="text-muted" />
          </div>
        </div>

        {showRoundup && (
          <div className="mt-3 card p-4 text-sm text-ink">
            <p className="font-semibold mb-2">Today's Roundup</p>
            <p className="text-muted text-xs mb-2">Based on: Slack, Gmail, Calendar (read-only)</p>
            <ul className="space-y-1.5">
              <li>🟢 <strong>Easy wins:</strong> Review design feedback (15m), respond to sprint-demo invite (5m).</li>
              <li>🔵 <strong>Next up:</strong> Draft API spec for Atlas (1h), follow up on access request (30m).</li>
              <li>🟡 <strong>Needs senior:</strong> Prod-bug #471 needs DevOps input; "make it faster" requirement is ambiguous — both need senior input before you can proceed.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* LEFT column */}
        <div className="space-y-4">
          {/* Today's Tasks */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink">Today's Tasks</h2>
              <span className="text-xs text-muted">{done}/{tasks.length} done</span>
            </div>

            {groups.map(group => {
              const cfg = groupConfig[group];
              const groupTasks = tasks.filter(t => t.group === group);
              if (!groupTasks.length) return null;
              return (
                <div key={group} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-xs font-medium ${cfg.textColor}`}>{cfg.label}</span>
                  </div>
                  <div className="space-y-1">
                    {groupTasks.map(task => (
                      <div key={task.id}
                           className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-slate-50 group">
                        <button onClick={() => toggle(task.id)}
                                className="flex-shrink-0 text-slate-300 hover:text-good transition-colors"
                                aria-label={task.done ? 'Mark undone' : 'Mark done'}>
                          {task.done
                            ? <CheckCircle2 size={18} className="text-good" />
                            : <Circle size={18} />
                          }
                        </button>
                        <span className={`flex-1 text-sm ${task.done ? 'line-through text-muted' : 'text-ink'}`}>
                          {task.title}
                          <span className="text-muted"> ({task.project})</span>
                        </span>
                        <span className="pill bg-slate-100 text-muted shrink-0">
                          {formatEst(task.estimateMin)}
                        </span>
                        <button className="opacity-0 group-hover:opacity-100 text-muted hover:text-blue-500 text-xs transition-opacity"
                                aria-label="Why this group?">
                          Why?
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress card */}
          {done > 0 && (
            <div className="card p-4 flex items-center gap-4">
              <BlueMascot size={40} mood="happy" />
              <div>
                <p className="font-medium text-ink text-sm">Great progress!</p>
                <p className="text-muted text-xs">
                  You checked off {done} task{done !== 1 ? 's' : ''} today. Keep it up!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT column */}
        <div className="space-y-4">
          {/* Team Updates */}
          <div className="card p-5">
            <h2 className="font-semibold text-ink mb-3">Team Updates</h2>
            <div className="space-y-3">
              {TEAM_UPDATES.map(u => (
                <div key={u.id} className="flex items-start gap-3 py-1">
                  <div className={[
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold',
                    u.source === 'slack' ? 'bg-purple-500' :
                    u.source === 'gmail' ? 'bg-red-500' : 'bg-blue-500'
                  ].join(' ')}>
                    {u.source === 'slack' ? 'S' : u.source === 'gmail' ? 'G' : 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink">{u.text}</p>
                    <p className="text-xs text-muted mt-0.5">{u.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-5">
            <h2 className="font-semibold text-ink mb-3">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Ask Blue', icon: '💬' },
                { label: 'Summarize', icon: '📋' },
                { label: 'Write', icon: '✍️' },
                { label: 'Find Help', icon: '🤝' },
                { label: 'Create Task', icon: '➕' },
                { label: 'More', icon: '⋯' },
              ].map(a => (
                <button key={a.label}
                        className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-50 hover:bg-blue-50
                                   text-center text-xs text-ink font-medium hover:text-blue-600 transition-colors">
                  <span className="text-lg">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-5">
            <h2 className="font-semibold text-ink mb-3">Recent Activity</h2>
            <div className="space-y-3">
              {[
                { name: 'Alex', text: 'Completed design review', time: '2h ago', initials: 'AJ', color: 'bg-blue-500' },
                { name: 'Priya', text: 'Added Figma comments', time: '3h ago', initials: 'PK', color: 'bg-purple-500' },
                { name: 'Marcus', text: 'Updated Orion Billing docs', time: '4h ago', initials: 'MT', color: 'bg-green-500' },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full ${a.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {a.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink">{a.text}</p>
                    <p className="text-xs text-muted">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
