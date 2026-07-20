export default function RootLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24">
      <div className="relative mb-6 h-16 w-16">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[var(--accent)]" />
        <div className="absolute inset-3 flex items-center justify-center">
          <div className="h-4 w-4 rounded-full border-2 border-[var(--accent)]" />
        </div>
      </div>
      <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>
    </div>
  )
}
