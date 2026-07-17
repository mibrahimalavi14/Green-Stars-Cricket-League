"use client"

import Link from "next/link"
import { ThemeToggle } from "./ThemeToggle"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

export function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")

  if (isAdmin) {
    return (
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <img src="/images/logo/gscl-logo.png" alt="GSCL" className="h-8 w-8 rounded-full object-cover" />
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
          <Link href="/seasons" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Seasons</Link>
          <Link href="/players" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Players</Link>
          <Link href="/fixtures" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Fixtures</Link>
          <Link href="/points-table" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Standings</Link>
          <Link href="/toss-analysis" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Toss</Link>
          <Link href="/news" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">News</Link>
          <Link href="/about" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">About</Link>
          <Link href="/contact" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Contact</Link>
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
            <Link href="/" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Home</Link>
            <Link href="/teams" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Teams</Link>
            <Link href="/seasons" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Seasons</Link>
            <Link href="/players" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Players</Link>
            <Link href="/fixtures" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Fixtures</Link>
            <Link href="/points-table" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Standings</Link>
            <Link href="/toss-analysis" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Toss</Link>
            <Link href="/news" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">News</Link>
            <Link href="/about" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">About</Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Contact</Link>
          </div>
        </nav>
      )}
    </header>
  )
}
