import { useEffect, useState } from 'react';
import { useBlueStore } from '../../store';
import { useUi } from '../../ui';
import Modal, { btnGhost, btnPrimary } from '../Modal';
import BlueMascot from '../BlueMascot';
import { praiseFor } from '../../core/features/praise';
import { formatMin } from '../ui';

const QUOTES = ['Progress, not perfection, builds amazing things.', 'Small steps add up.', 'Done is a good feeling. Enjoy it.'];

export default function CelebrateDialog({ taskId }: { taskId?: string }) {
  const task = useBlueStore((s) => s.tasks.find((t) => t.id === taskId));
  const tasks = useBlueStore((s) => s.tasks);
  const name = useBlueStore((s) => s.settings.name);
  const { closeDialog, openDialog } = useUi();
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    if (!task) return;
    let alive = true;
    praiseFor(task).then((p) => alive && setLine(p));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  if (!task) return null;
  const next = tasks.find((t) => t.status === 'todo');
  const quote = QUOTES[task.title.length % QUOTES.length];

  return (
    <Modal title="Task completed" mood="excited" onClose={closeDialog} hideHeader
      footer={<>
        <button onClick={closeDialog} className={btnGhost}>Maybe later</button>
        <button onClick={() => next ? openDialog('analysis', { taskId: next.id }) : closeDialog()} className={btnPrimary}>→ View next task</button>
      </>}>
      <div className="text-center">
        <div className="mx-auto w-fit"><BlueMascot size={130} mood="excited" /></div>
        <h2 className="mt-3 text-2xl font-bold text-ink">Task Completed! 🎉</h2>
        <p className="text-sm text-muted">You did it, {name.split(' ')[0]}! Here's what you accomplished:</p>
        <div className="mx-auto mt-4 flex max-w-sm items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-left">
          <span className="text-sm font-medium text-ink">✅ {task.title}</span>
          <span className="ml-3 flex-shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-600">{task.project} · {formatMin(task.estimateMin)}</span>
        </div>
        {line && <p className="mx-auto mt-4 max-w-sm rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-800">{line} 💙</p>}
        <p className="mx-auto mt-4 max-w-sm text-sm italic text-muted">★ "{quote}"</p>
      </div>
    </Modal>
  );
}
