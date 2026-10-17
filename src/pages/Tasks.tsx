import TaskRow from '../components/TaskRow';
import { GROUP_META, GROUP_ORDER } from '../components/ui';
import { useBlueStore } from '../store';

export default function Tasks() {
  const tasks = useBlueStore((state) => state.tasks);
  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-8 md:px-10 md:py-10">
      <h1 className="text-2xl font-semibold text-ink">Tasks</h1>
      <p className="mt-1 text-sm text-muted">A local sample list you can edit and complete.</p>
      <div className="mt-6 space-y-7">
        {GROUP_ORDER.map((group) => {
          const items = tasks.filter((task) => task.group === group);
          if (!items.length) return null;
          return <section key={group} aria-labelledby={`group-${group}`}>
            <h2 id={`group-${group}`} className="mb-2 text-sm font-semibold text-ink">{GROUP_META[group].label}</h2>
            <ul className="border-t border-slate-200">{items.map((task) => <TaskRow key={task.id} task={task} />)}</ul>
          </section>;
        })}
      </div>
    </section>
  );
}