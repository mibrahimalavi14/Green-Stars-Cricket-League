import Link from "next/link"

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/10">
        <svg className="h-8 w-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="mb-2 text-2xl font-bold">Page Not Found</h1>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">The page you are looking for does not exist or has been moved.</p>
      <Link href="/" className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90">
        Go Home
      </Link>
    </div>
  )
}
