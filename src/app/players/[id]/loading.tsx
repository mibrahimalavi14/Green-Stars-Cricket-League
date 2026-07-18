export default function PlayerDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
        <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <div className="h-24 w-24 animate-pulse rounded-full bg-[var(--muted)]" />
          <div className="flex-1">
            <div className="mb-2 h-8 w-56 animate-pulse rounded bg-[var(--muted)]" />
            <div className="mb-2 h-5 w-72 animate-pulse rounded bg-[var(--muted)]" />
            <div className="mb-2 h-4 w-48 animate-pulse rounded bg-[var(--muted)]" />
            <div className="h-4 w-full animate-pulse rounded bg-[var(--muted)]" />
          </div>
        </div>
        {[1, 2, 3].map((section) => (
          <div key={section} className="mb-6">
            <div className="mb-3 h-6 w-24 animate-pulse rounded bg-[var(--muted)]" />
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div key={s} className="h-16 animate-pulse rounded-lg bg-[var(--muted)]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
