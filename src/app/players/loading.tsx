export default function PlayersLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-2 h-8 w-48 animate-pulse rounded bg-[var(--muted)]" />
          <div className="h-4 w-64 animate-pulse rounded bg-[var(--muted)]" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded-lg bg-[var(--muted)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-lg bg-[var(--muted)]" />
        ))}
      </div>
    </div>
  )
}
