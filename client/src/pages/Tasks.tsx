import { useState } from 'react';
import { CheckCircle2, Circle, Plus, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  project: string;
  estimateMin: number;
  group: 'easy_wins' | 'next_up' | 'needs_senior';
  done: boolean;
}

const TASKS: Task[] = [
  { id: 't1', title: 'Review design mockup feedback', project: 'Atlas', estimateMin: 15, group: 'easy_wins', done: false },
  { id: 't2', title: 'Respond to sprint-demo invite', project: 'Atlas', estimateMin: 5, group: 'easy_wins', done: false },
  { id: 't3', title: 'Draft API integration spec', project: 'Atlas', estimateMin: 60, group: 'next_up', done: false },
  { id: 't4', title: 'Follow up on access request', project: 'Orion Billing', estimateMin: 30, group: 'next_up', done: false },
  { id: 't5', title: 'Resolve prod-bug #471 (DevOps input needed)', project: 'Atlas', estimateMin: 120, group: 'needs_senior', done: false },
  { id: 't6', title: 'Clarify "make it faster" requirement', project: 'Atlas', estimateMin: 30, group: 'needs_senior', done: false },
];

const groupConfig = {
  easy_wins:    { label: 'Easy wins',         color: 'bg-green-100 text-green-700', icon: '🟢' },
  next_up:      { label: 'Next up',           color: 'bg-blue-100 text-blue-700',  icon: '🔵' },
  needs_senior: { label: 'Needs senior help', color: 'bg-amber-100 text-amber-700', icon: '🟡' },
};

export default function Tasks() {
  const [tasks, setTasks] = useState(TASKS);
  const [newTitle, setNewTitle] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const addTask = () => {
    if (!newTitle.trim()) return;
    setTasks(ts => [...ts, {
      id: Date.now().toString(), title: newTitle.trim(),
      project: 'Manual', estimateMin: 30, group: 'next_up', done: false
    }]);
    setNewTitle('');
  };

  const toggleGroup = (g: string) =>
    setCollapsed(c => ({ ...c, [g]: !c[g] }));

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-ink">Tasks</h1>
        <span className="text-muted text-sm">{tasks.filter(t => !t.done).length} remaining</span>
      </div>

      {/* Add task */}
      <div className="flex gap-3 mb-6">
        <input
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-ink
                     focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                     placeholder:text-muted"
          placeholder="Add a task…"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addTask(); }}
          aria-label="New task title"
        />
        <button onClick={addTask} className="btn-primary flex items-center gap-1.5" aria-label="Add task">
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Groups */}
      {(['easy_wins', 'next_up', 'needs_senior'] as const).map(group => {
        const cfg = groupConfig[group];
        const groupTasks = tasks.filter(t => t.group === group);
        if (!groupTasks.length) return null;
        const isCollapsed = collapsed[group];

        return (
          <div key={group} className="card mb-4 overflow-hidden">
            <button
              onClick={() => toggleGroup(group)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
              aria-expanded={!isCollapsed}
            >
              <div className="flex items-center gap-2">
                <span>{cfg.icon}</span>
                <span className={`pill ${cfg.color}`}>{cfg.label}</span>
                <span className="text-xs text-muted">({groupTasks.length})</span>
              </div>
              {isCollapsed ? <ChevronDown size={16} className="text-muted" /> : <ChevronUp size={16} className="text-muted" />}
            </button>

            {!isCollapsed && (
              <div className="px-5 pb-3 space-y-1 border-t border-slate-50">
                {groupTasks.map(task => (
                  <div key={task.id}
                       className="flex items-center gap-3 py-2 hover:bg-slate-50 rounded-lg px-2 group">
                    <button onClick={() => toggle(task.id)}
                            className="flex-shrink-0 text-slate-300 hover:text-good transition-colors"
                            aria-label={task.done ? 'Mark undone' : 'Mark done'}>
                      {task.done ? <CheckCircle2 size={18} className="text-good" /> : <Circle size={18} />}
                    </button>
                    <span className={`flex-1 text-sm ${task.done ? 'line-through text-muted' : 'text-ink'}`}>
                      {task.title}
                      <span className="text-muted text-xs ml-1">({task.project})</span>
                    </span>
                    <span className="pill bg-slate-100 text-muted text-xs">
                      {task.estimateMin < 60 ? `${task.estimateMin}m` : `${task.estimateMin/60}h`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
