export default function EmptyPage({ title, message }: { title: string; message: string }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-8 md:px-10 md:py-10">
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{message}</p>
      <div role="status" className="mt-8 border-t border-slate-200 py-6 text-sm text-muted">There’s nothing to show here in the current demo workspace.</div>
    </section>
  );
}