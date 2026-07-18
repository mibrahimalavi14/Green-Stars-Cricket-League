export default function FixturesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-2 h-8 w-64 animate-pulse rounded bg-[var(--muted)]" />
      <div className="mb-8 h-4 w-96 animate-pulse rounded bg-[var(--muted)]" />
      <div className="mb-10 overflow-hidden rounded-2xl border border-[var(--border)]">
        <div className="border-b border-[var(--border)] bg-[var(--background)] px-6 py-3">
          <div className="h-6 w-32 animate-pulse rounded bg-[var(--muted)]" />
        </div>
        <div className="divide-y divide-[var(--border)]">
          {[1, 2, 3].map((day) => (
            <div key={day} className="px-6 py-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--muted)]" />
                <div>
                  <div className="mb-1 h-4 w-32 animate-pulse rounded bg-[var(--muted)]" />
                  <div className="h-3 w-20 animate-pulse rounded bg-[var(--muted)]" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[1, 2, 3].map((m) => (
                  <div key={m} className="h-24 animate-pulse rounded-xl bg-[var(--muted)]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
