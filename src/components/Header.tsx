import Link from "next/link"
import { ThemeToggle } from "./ThemeToggle"
import { auth } from "@/lib/auth"
import { LogIn, LogOut } from "lucide-react"
import { signOut } from "@/lib/auth"

export async function Header() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/teams/gscl-logo.png" alt="GSCL" className="h-8 w-8 rounded-full object-cover" />
          <span className="hidden text-sm font-medium md:block">Green Stars Cricket League</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Home</Link>
          <Link href="/teams" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Teams</Link>
          <Link href="/seasons" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Seasons</Link>
          <Link href="/players" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Players</Link>
          <Link href="/fixtures" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Fixtures</Link>
          <Link href="/points-table" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Standings</Link>
          <Link href="/predictions" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Predictions</Link>
          <Link href="/news" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">News</Link>
          <Link href="/contact" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Contact</Link>
          <Link href="/admin" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Admin</Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <form action={async () => { "use server"; await signOut() }}>
              <button type="submit" className="flex items-center gap-1 rounded-lg bg-[var(--muted)] px-3 py-1.5 text-sm transition-colors hover:bg-[var(--accent)]">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{session.user?.name?.split(" ")[0]}</span>
              </button>
            </form>
          ) : (
            <Link href="/predictions" className="flex items-center gap-1 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-foreground)] transition-colors hover:opacity-90">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>

      <nav className="flex overflow-x-auto border-t border-[var(--border)] px-4 py-2 md:hidden">
        <div className="flex gap-4 text-sm font-medium">
          <Link href="/" className="shrink-0 transition-colors hover:text-[var(--accent)]">Home</Link>
          <Link href="/teams" className="shrink-0 transition-colors hover:text-[var(--accent)]">Teams</Link>
          <Link href="/seasons" className="shrink-0 transition-colors hover:text-[var(--accent)]">Seasons</Link>
          <Link href="/players" className="shrink-0 transition-colors hover:text-[var(--accent)]">Players</Link>
          <Link href="/fixtures" className="shrink-0 transition-colors hover:text-[var(--accent)]">Fixtures</Link>
          <Link href="/points-table" className="shrink-0 transition-colors hover:text-[var(--accent)]">Standings</Link>
          <Link href="/predictions" className="shrink-0 transition-colors hover:text-[var(--accent)]">Predictions</Link>
          <Link href="/news" className="shrink-0 transition-colors hover:text-[var(--accent)]">News</Link>
          <Link href="/contact" className="shrink-0 transition-colors hover:text-[var(--accent)]">Contact</Link>
          <Link href="/admin" className="shrink-0 transition-colors hover:text-[var(--accent)]">Admin</Link>
        </div>
      </nav>
    </header>
  )
}
