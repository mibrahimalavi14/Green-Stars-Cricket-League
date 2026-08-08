export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-6 h-8 w-1/2 animate-pulse rounded-lg bg-[var(--muted)]" />
      <div className="mb-2 h-4 w-1/4 animate-pulse rounded bg-[var(--muted)]" />
      <div className="mb-8 h-48 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--muted)]/50" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--muted)]/50" />
        ))}
      </div>
    </div>
  )
}
