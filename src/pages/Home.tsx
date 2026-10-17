import ModelCard from '../components/ModelCard';
import TaskRow from '../components/TaskRow';
import { useBlueStore } from '../store';

export default function Home() {
  const name = useBlueStore((state) => state.settings.name);
  const allTasks = useBlueStore((state) => state.tasks);
  const tasks = allTasks.filter((task) => task.group === 'today');
  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-8 md:px-10 md:py-10">
      <h1 className="text-2xl font-semibold text-ink">Good morning, {name.split(' ')[0]}</h1>
      <p className="mt-1 text-sm text-muted">Here’s what needs your attention today.</p>
      <div className="mt-7 grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)]">
        <section aria-labelledby="today-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="today-heading" className="text-lg font-semibold text-ink">Today</h2>
            <span className="text-xs text-muted">{tasks.length} tasks</span>
          </div>
          <ul className="border-t border-slate-200">
            {tasks.map((task) => <TaskRow key={task.id} task={task} />)}
            {tasks.length === 0 && <li className="py-5 text-sm text-muted">You’re all caught up.</li>}
          </ul>
        </section>
        <aside aria-label="Model status"><ModelCard /></aside>
      </div>
    </section>
  );
}