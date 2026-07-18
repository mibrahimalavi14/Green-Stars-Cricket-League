export default function TeamDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex items-center gap-6">
        <div className="h-20 w-20 animate-pulse rounded-full bg-[var(--muted)]" />
        <div>
          <div className="mb-2 h-8 w-64 animate-pulse rounded bg-[var(--muted)]" />
          <div className="h-4 w-40 animate-pulse rounded bg-[var(--muted)]" />
        </div>
      </div>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--muted)]" />
        ))}
      </div>
      <div className="mb-8 h-6 w-24 animate-pulse rounded bg-[var(--muted)]" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-[var(--muted)]" />
        ))}
      </div>
    </div>
  )
}
