import { useBlueStore } from '../../store';
import DialogMessage from './DialogMessage';

export default function RoundupDialog() {
  const allTasks = useBlueStore((state) => state.tasks);
  const tasks = allTasks.filter((task) => task.status !== 'done');
  return <DialogMessage title="Morning roundup" description="A quick view of your open sample tasks.">
    {tasks.length ? <ul className="list-disc space-y-1 pl-5 text-sm text-ink">{tasks.map((task) => <li key={task.id}>{task.title}</li>)}</ul> : <p className="text-sm text-muted">You have no open tasks.</p>}
  </DialogMessage>;
}