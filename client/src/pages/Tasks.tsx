import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useBlueStore } from '../store';
import { useUi } from '../ui';
import TaskRow from '../components/TaskRow';
import { Card, EmptyState, GROUP_META, GROUP_ORDER } from '../components/ui';

export default function Tasks() {
  const tasks = useBlueStore((s) => s.tasks);
  const addTask = useBlueStore((s) => s.addTask);
  const removeTask = useBlueStore((s) => s.removeTask);
  const allowConnectors = useBlueStore((s) => s.settings.allowConnectors);
  const openDialog = useUi((s) => s.openDialog);
  const [title, setTitle] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showDone, setShowDone] = useState(false);

  const open = tasks.filter((t) => t.status === 'todo');
  const done = tasks.filter((t) => t.status === 'done');

  const add = async () => {
    const t = title.trim();
    if (!t) return;
    await addTask({
      title: t, project: 'General', estimateMin: 30, effort: 'medium', group: 'next_up', urgency: 'med', status: 'todo',
      explanation: { sourceCategory: 'manual', confidence: 1, reason: 'You added this task yourself.' },
      provenance: { source: 'manual', ref: 'user' },
    });
    setTitle('');
  };

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <div className="mb-5 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-ink">Tasks</h1><p className="text-sm text-muted">{open.length} remaining · {done.length} done</p></div>
        <button onClick={() => openDialog('roundup')} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"><Sparkles size={15} /> Sort my day</button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); add(); }} className="mb-6 flex gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Add a task" placeholder="Add a task…" className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder:text-muted focus:border-blue-500" />
        <button type="submit" disabled={!title.trim()} className="btn-primary inline-flex items-center gap-2 disabled:opacity-40"><Plus size={16} /> Add task</button>
      </form>

      {tasks.length === 0 && (
        <Card><EmptyState title="Nothing here yet" hint={allowConnectors ? 'Open your roundup and I will sort your day.' : 'Connect the Demo Workspace in Settings, or add a task above.'} /></Card>
      )}

      {GROUP_ORDER.map((g) => {
        const items = open.filter((t) => t.group === g);
        if (!items.length) return null;
        return (
          <Card key={g} className="mb-4 p-4">
            <button onClick={() => setCollapsed({ ...collapsed, [g]: !collapsed[g] })} aria-expanded={!collapsed[g]} className="flex w-full items-center justify-between">
              <span className="flex items-center gap-2 font-semibold text-ink"><span className={`h-2.5 w-2.5 rounded-full ${GROUP_META[g].dot}`} />{GROUP_META[g].label}<span className="text-xs font-normal text-muted">({items.length})</span></span>
              {collapsed[g] ? <ChevronDown size={16} className="text-muted" /> : <ChevronUp size={16} className="text-muted" />}
            </button>
            {!collapsed[g] && <ul className="mt-2">{items.map((t) => <TaskRow key={t.id} task={t} />)}</ul>}
          </Card>
        );
      })}

      {done.length > 0 && (
        <Card className="p-4">
          <button onClick={() => setShowDone(!showDone)} aria-expanded={showDone} className="flex w-full items-center justify-between font-semibold text-ink">Completed ({done.length}){showDone ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
          {showDone && (
            <ul className="mt-2">
              {done.map((t) => (
                <div key={t.id} className="flex items-center">
                  <div className="flex-1"><TaskRow task={t} showBadge={false} compact /></div>
                  <button onClick={() => removeTask(t.id)} className="ml-2 text-xs text-muted hover:text-rose-500" aria-label={`Delete ${t.title}`}>Delete</button>
                </div>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
