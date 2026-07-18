export default function SeasonDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-4 h-4 w-32 animate-pulse rounded bg-[var(--muted)]" />
      <div className="mb-2 h-8 w-64 animate-pulse rounded bg-[var(--muted)]" />
      <div className="mb-2 h-4 w-48 animate-pulse rounded bg-[var(--muted)]" />
      <div className="mb-8 flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-6 w-28 animate-pulse rounded-full bg-[var(--muted)]" />
        ))}
      </div>
      <div className="mb-8 h-6 w-44 animate-pulse rounded bg-[var(--muted)]" />
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-[var(--muted)]" />
        ))}
      </div>
      <div className="mb-8 h-6 w-36 animate-pulse rounded bg-[var(--muted)]" />
      <div className="mb-8 h-64 animate-pulse rounded-xl bg-[var(--muted)]" />
      <div className="mb-8 h-6 w-24 animate-pulse rounded bg-[var(--muted)]" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="mb-3 h-32 animate-pulse rounded-xl bg-[var(--muted)]" />
      ))}
    </div>
  )
}
