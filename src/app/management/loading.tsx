export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-2 h-8 w-1/3 animate-pulse rounded-lg bg-[var(--muted)]" />
      <div className="mb-10 h-4 w-1/2 animate-pulse rounded bg-[var(--muted)]" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--muted)]/50" />
        ))}
      </div>
    </div>
  )
}
