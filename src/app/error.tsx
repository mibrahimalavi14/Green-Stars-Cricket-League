"use client"

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">An unexpected error occurred. Please try again.</p>
      <button onClick={reset} className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90">
        Try Again
      </button>
    </div>
  )
}
