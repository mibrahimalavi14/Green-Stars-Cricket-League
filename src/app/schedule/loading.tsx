export default function ScheduleLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto h-8 w-48 animate-pulse rounded bg-[var(--muted)]" />
        <div className="mx-auto h-4 w-32 animate-pulse rounded bg-[var(--muted)]" />
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-[var(--muted)]" />
      <div className="h-32 animate-pulse rounded-xl bg-[var(--muted)]" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--muted)]" />
      ))}
    </div>
  )
}
