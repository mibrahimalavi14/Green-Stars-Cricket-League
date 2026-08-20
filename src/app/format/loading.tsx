export default function FormatLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto h-8 w-48 animate-pulse rounded bg-[var(--muted)]" />
        <div className="mx-auto h-4 w-32 animate-pulse rounded bg-[var(--muted)]" />
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-[var(--muted)]" />
    </div>
  )
}
