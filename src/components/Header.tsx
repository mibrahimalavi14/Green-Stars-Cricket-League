"use client"

import Link from "next/link"
import { ThemeToggle } from "./ThemeToggle"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { Menu, X, Search, ChevronDown } from "lucide-react"
import { NotificationBell } from "./NotificationBell"

export function Header() {
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")

  if (isAdmin) {
    return (
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <img src="/images/optimized/gscl-logo.webp" alt="GSCL" className="h-8 w-8 rounded-full object-cover" />
            <span className="text-sm font-semibold">Admin Panel</span>
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            <Link href="/admin/matches" className="text-sm transition-colors hover:text-[var(--accent)]">Matches</Link>
            <Link href="/admin/players" className="text-sm transition-colors hover:text-[var(--accent)]">Players</Link>
            <Link href="/admin/teams" className="text-sm transition-colors hover:text-[var(--accent)]">Teams</Link>
            <Link href="/admin/seasons" className="text-sm transition-colors hover:text-[var(--accent)]">Seasons</Link>
            <Link href="/admin/performances" className="text-sm transition-colors hover:text-[var(--accent)]">Performances</Link>
            <Link href="/admin/news" className="text-sm transition-colors hover:text-[var(--accent)]">News</Link>
            <Link href="/admin/contact" className="text-sm transition-colors hover:text-[var(--accent)]">Contact</Link>
            <Link href="/admin/reviews" className="text-sm transition-colors hover:text-[var(--accent)]">Reviews</Link>
            <Link href="/admin/notifications" className="text-sm transition-colors hover:text-[var(--accent)]">Notifications</Link>
            <Link href="/" className="text-sm transition-colors hover:text-[var(--accent)]">View Site</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <ThemeToggle />
          </div>
        </div>
        {open && (
          <nav className="border-t border-[var(--border)] px-4 py-3 md:hidden">
            <div className="flex flex-col gap-3 text-sm font-medium">
              <Link href="/admin/matches" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Matches</Link>
              <Link href="/admin/players" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Players</Link>
              <Link href="/admin/teams" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Teams</Link>
              <Link href="/admin/seasons" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Seasons</Link>
              <Link href="/admin/performances" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Performances</Link>
              <Link href="/admin/news" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">News</Link>
              <Link href="/admin/contact" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Contact</Link>
              <Link href="/admin/reviews" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Reviews</Link>
              <Link href="/admin/notifications" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Notifications</Link>
              <Link href="/" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">View Site</Link>
            </div>
          </nav>
        )}
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/logo/gscl-logo.png" alt="GSCL" className="h-8 w-8 rounded-full object-cover" />
          <span className="hidden text-sm font-medium md:block">Green Stars Cricket League</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Home</Link>
          <Link href="/teams" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Teams</Link>
          <Link href="/players" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Players</Link>
          <Link href="/fixtures" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Fixtures</Link>
          <Link href="/points-table" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Standings</Link>
          <Link href="/news" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">News</Link>
          <div className="relative">
            <button onClick={() => setMoreOpen(!moreOpen)} className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-[var(--accent)]">
              More <ChevronDown className={`h-3 w-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            {moreOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                <div
                  className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-[var(--border)] bg-[var(--background)] py-2 shadow-xl" >
                  <Link href="/seasons" onClick={() => setMoreOpen(false)} className="block px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]">Seasons</Link>
                  <Link href="/awards" onClick={() => setMoreOpen(false)} className="block px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]">Awards</Link>
                  <Link href="/venues" onClick={() => setMoreOpen(false)} className="block px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]">Venues</Link>
                  <Link href="/potm-gallery" onClick={() => setMoreOpen(false)} className="block px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]">POTM Gallery</Link>
                  <Link href="/toss-analysis" onClick={() => setMoreOpen(false)} className="block px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]">Toss Analysis</Link>
                  <Link href="/compare" onClick={() => setMoreOpen(false)} className="block px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]">Compare</Link>
                  <Link href="/teams/stats" onClick={() => setMoreOpen(false)} className="block px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]">Team Stats</Link>
                  <Link href="/about" onClick={() => setMoreOpen(false)} className="block px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]">About</Link>
                  <Link href="/contact" onClick={() => setMoreOpen(false)} className="block px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]">Contact</Link>
                  <Link href="/faq" onClick={() => setMoreOpen(false)} className="block px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]">FAQ</Link>
                </div>
              </>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={() => window.dispatchEvent(new CustomEvent("open-search"))} className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)] transition-colors hover:bg-[var(--accent)]" aria-label="Search">
            <Search className="h-4 w-4" />
          </button>
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <ThemeToggle />
        </div>
      </div>

      {open && (
        <nav className="border-t border-[var(--border)] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium">
            <Link href="/" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Home</Link>
            <Link href="/teams" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Teams</Link>
            <Link href="/players" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Players</Link>
            <Link href="/fixtures" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Fixtures</Link>
            <Link href="/points-table" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Standings</Link>
            <Link href="/news" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">News</Link>
            <hr className="border-[var(--border)]" />
            <Link href="/seasons" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Seasons</Link>
            <Link href="/awards" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Awards</Link>
            <Link href="/venues" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Venues</Link>
            <Link href="/potm-gallery" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">POTM Gallery</Link>
            <Link href="/toss-analysis" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Toss Analysis</Link>
            <Link href="/compare" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Compare</Link>
            <Link href="/teams/stats" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Team Stats</Link>
            <Link href="/about" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">About</Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Contact</Link>
            <Link href="/faq" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">FAQ</Link>
          </div>
        </nav>
      )}
    </header>
  )
}
