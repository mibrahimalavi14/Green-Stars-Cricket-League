export default function AdminScheduleLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 space-y-8">
      <div className="h-8 w-64 animate-pulse rounded bg-[var(--muted)]" />
      <div className="h-4 w-40 animate-pulse rounded bg-[var(--muted)]" />
      {[1, 2, 3].map(i => (
        <div key={i} className="h-40 animate-pulse rounded-xl bg-[var(--muted)]" />
      ))}
    </div>
  )
}
