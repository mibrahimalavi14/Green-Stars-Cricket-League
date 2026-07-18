export default function RootLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 h-9 w-48 animate-pulse rounded-lg bg-[var(--muted)]" />
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-[var(--muted)]" />
        ))}
      </div>
    </div>
  )
}
