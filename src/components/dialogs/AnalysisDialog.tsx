import { useBlueStore } from '../../store';
import DialogMessage from './DialogMessage';

export default function AnalysisDialog({ taskId }: { taskId?: string }) {
  const task = useBlueStore((state) => state.tasks.find((item) => item.id === taskId));
  return <DialogMessage title="Task details" description={task?.title ?? 'Task analysis'}>
    {task && <>
      <p className="text-sm text-ink">{task.explanation.reason}</p>
      <p className="text-xs text-muted">Estimated effort: {task.estimateMin} minutes · Source: {task.explanation.sourceCategory}</p>
    </>}
  </DialogMessage>;
}