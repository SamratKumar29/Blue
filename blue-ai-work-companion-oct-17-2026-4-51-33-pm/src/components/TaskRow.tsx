import { useState } from 'react';
import { HelpCircle, MoveRight, LifeBuoy } from 'lucide-react';
import type { Task, TaskGroup } from '../core/types';
import { useBlueStore } from '../store';
import { useUi } from '../ui';
import { chipLabel } from '../core/connectors/demoWorkspace';
import { EffortBadge, GROUP_META, GROUP_ORDER, formatMin } from './ui';

interface Props { task: Task; showBadge?: boolean; compact?: boolean }

export default function TaskRow({ task, showBadge = true, compact }: Props) {
  const complete = useBlueStore((s) => s.completeTask);
  const update = useBlueStore((s) => s.updateTask);
  const praise = useBlueStore((s) => s.settings.praise);
  const openDialog = useUi((s) => s.openDialog);
  const [why, setWhy] = useState(false);
  const [moving, setMoving] = useState(false);
  const done = task.status === 'done';

  const toggle = async () => {
    await complete(task.id, !done);
    if (!done && praise) openDialog('celebrate', { taskId: task.id });
  };

  const move = async (g: TaskGroup) => {
    await update(task.id, { group: g, userAdjusted: true });
    setMoving(false);
  };

  return (
    <li className="group relative border-b border-slate-100 last:border-0">
      <div className={`flex items-center gap-3 ${compact ? 'py-2' : 'py-2.5'}`}>
        <input
          type="checkbox"
          checked={done}
          onChange={toggle}
          aria-label={`Mark "${task.title}" ${done ? 'not done' : 'done'}`}
          className="h-[18px] w-[18px] flex-shrink-0 cursor-pointer rounded-full border-slate-300 text-blue-500 focus:ring-blue-500"
        />
        {showBadge && <EffortBadge effort={task.effort} />}
        <button
          onClick={() => openDialog('analysis', { taskId: task.id })}
          className={`min-w-0 flex-1 truncate text-left text-sm hover:text-blue-600 ${done ? 'text-muted line-through' : 'text-ink'}`}
          title={task.title}
        >
          {task.title} <span className="text-muted">({task.project})</span>
        </button>
        <span className="hidden flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-muted sm:inline">{formatMin(task.estimateMin)}</span>
        <div className="flex flex-shrink-0 items-center gap-0.5 opacity-60 transition group-hover:opacity-100 focus-within:opacity-100">
          {task.group === 'needs_senior' && !done && (
            <button onClick={() => openDialog('askSenior', { taskId: task.id })} aria-label={`Ask a senior about ${task.title}`} title="Ask a senior" className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50"><LifeBuoy size={15} /></button>
          )}
          <button onClick={() => setWhy(!why)} aria-expanded={why} aria-label={`Why is "${task.title}" here?`} title="Why?" className="rounded-lg p-1.5 text-muted hover:bg-blue-50 hover:text-blue-600"><HelpCircle size={15} /></button>
          <button onClick={() => setMoving(!moving)} aria-expanded={moving} aria-label={`Move "${task.title}" to another group`} title="Move to…" className="rounded-lg p-1.5 text-muted hover:bg-blue-50 hover:text-blue-600"><MoveRight size={15} /></button>
        </div>
      </div>

      {why && (
        <div role="region" aria-label="Why this task" className="mb-3 ml-8 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-ink animate-pop">
          <p><span className="font-semibold">Source:</span> {task.explanation.sourceCategory}{task.provenance ? ` · ${chipLabel(task.provenance.source, task.provenance.ref)}` : ''}</p>
          <div className="my-1.5 flex items-center gap-2">
            <span className="font-semibold">Confidence:</span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white" role="meter" aria-valuemin={0} aria-valuemax={1} aria-valuenow={task.explanation.confidence}>
              <div className="h-full bg-blue-500" style={{ width: `${Math.round(task.explanation.confidence * 100)}%` }} />
            </div>
            <span>{Math.round(task.explanation.confidence * 100)}%</span>
          </div>
          <p><span className="font-semibold">Reason:</span> {task.explanation.reason}</p>
          {task.blocker && <p className="mt-1"><span className="font-semibold">Blocker:</span> {task.blocker}</p>}
          {task.userAdjusted && <p className="mt-1 text-muted">You moved this task yourself.</p>}
        </div>
      )}

      {moving && (
        <div role="menu" aria-label="Move to" className="mb-3 ml-8 flex flex-wrap gap-2 animate-pop">
          {GROUP_ORDER.map((g) => (
            <button key={g} role="menuitem" onClick={() => move(g)} disabled={g === task.group}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-ink hover:bg-slate-50 disabled:opacity-40">
              <span className={`h-2 w-2 rounded-full ${GROUP_META[g].dot}`} /> {GROUP_META[g].label}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
