export default function MatchDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-6 h-6 w-48 animate-pulse rounded bg-[var(--muted)]" />
      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-full bg-[var(--muted)]" />
            <div className="h-6 w-32 animate-pulse rounded bg-[var(--muted)]" />
          </div>
          <div className="text-center">
            <div className="mb-1 h-4 w-8 animate-pulse rounded bg-[var(--muted)]" />
            <div className="h-3 w-24 animate-pulse rounded bg-[var(--muted)]" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-6 w-32 animate-pulse rounded bg-[var(--muted)]" />
            <div className="h-12 w-12 animate-pulse rounded-full bg-[var(--muted)]" />
          </div>
        </div>
      </div>
      {[1, 2].map((s) => (
        <div key={s} className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-3 h-6 w-24 animate-pulse rounded bg-[var(--muted)]" />
          {[1, 2, 3, 4].map((r) => (
            <div key={r} className="mb-2 h-6 animate-pulse rounded bg-[var(--muted)]" />
          ))}
        </div>
      ))}
    </div>
  )
}
