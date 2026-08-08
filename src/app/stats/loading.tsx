export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-2 h-8 w-1/3 animate-pulse rounded-lg bg-[var(--muted)]" />
      <div className="mb-8 h-4 w-1/2 animate-pulse rounded bg-[var(--muted)]" />
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--muted)]/50" />
        ))}
      </div>
      <div className="mb-8 h-64 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--muted)]/50" />
      <div className="h-96 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--muted)]/50" />
    </div>
  )
}
