"use client"

import Link from "next/link"
import { ThemeToggle } from "./ThemeToggle"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Menu, X, Search, ChevronDown, Sword, Crosshair, Star, Bell, Activity, Trophy, Brain, Award, MapPin, Image, History, Info, Mail, HelpCircle, Users, TrendingUp, Gamepad2 } from "lucide-react"
import { NotificationBell } from "./NotificationBell"

export function Header() {
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [hasLive, setHasLive] = useState(false)
  const [hasPotm, setHasPotm] = useState(false)
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")

  useEffect(() => {
    fetch("/api/matches/live").then(r => r.json()).then(d => setHasLive(!!d?.id)).catch(() => {})
    fetch("/api/matches/count?status=completed").then(r => r.json()).then(d => setHasPotm(d?.count > 0)).catch(() => {})
  }, [])

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
            <Link href="/admin/performances" className="text-sm transition-colors hover:text-[var(--accent)]">Performances</Link>
            <Link href="/admin/seasons" className="text-sm transition-colors hover:text-[var(--accent)]">Seasons</Link>
            <Link href="/admin/news" className="text-sm transition-colors hover:text-[var(--accent)]">News</Link>
            <Link href="/admin/quiz" className="text-sm transition-colors hover:text-[var(--accent)]">Quiz</Link>
            <Link href="/admin/potm" className="flex items-center gap-1 text-sm transition-colors hover:text-[var(--accent)]"><Star className="h-3 w-3" /> POTM</Link>
            <Link href="/admin/predictions" className="text-sm transition-colors hover:text-[var(--accent)]">Predictions</Link>
            <Link href="/admin/reviews" className="text-sm transition-colors hover:text-[var(--accent)]">Reviews</Link>
            <Link href="/admin/contact" className="text-sm transition-colors hover:text-[var(--accent)]">Contact</Link>
            <Link href="/admin/gallery" className="text-sm transition-colors hover:text-[var(--accent)]">Gallery</Link>
            <Link href="/admin/sponsors" className="text-sm transition-colors hover:text-[var(--accent)]">Sponsors</Link>
            <Link href="/admin/squad" className="text-sm transition-colors hover:text-[var(--accent)]">Squad</Link>
            <Link href="/admin/notifications" className="flex items-center gap-1 text-sm transition-colors hover:text-[var(--accent)]"><Bell className="h-3 w-3" /> Notifications</Link>
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
              <Link href="/admin/performances" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Performances</Link>
              <Link href="/admin/seasons" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Seasons</Link>
              <Link href="/admin/news" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">News</Link>
              <Link href="/admin/quiz" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Quiz</Link>
              <Link href="/admin/potm" onClick={() => setOpen(false)} className="flex items-center gap-1 transition-colors hover:text-[var(--accent)]"><Star className="h-3 w-3" /> POTM</Link>
              <Link href="/admin/predictions" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Predictions</Link>
              <Link href="/admin/reviews" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Reviews</Link>
              <Link href="/admin/contact" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Contact</Link>
              <Link href="/admin/gallery" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Gallery</Link>
              <Link href="/admin/sponsors" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Sponsors</Link>
              <Link href="/admin/squad" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Squad</Link>
              <Link href="/admin/notifications" onClick={() => setOpen(false)} className="flex items-center gap-1 transition-colors hover:text-[var(--accent)]"><Bell className="h-3 w-3" /> Notifications</Link>
              <Link href="/admin/moments" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Moments</Link>
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

        <nav className="hidden items-center gap-5 md:flex">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Home</Link>
          <Link href="/teams" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Teams</Link>
          <Link href="/players" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Players</Link>
          <Link href="/fixtures" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Fixtures</Link>
          <Link href="/points-table" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Standings</Link>
          {hasLive && (
            <Link href="/live" className="flex items-center gap-1 text-sm font-medium text-red-500 transition-colors hover:text-red-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live
            </Link>
          )}
          <Link href="/predictions" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Predictions</Link>
          <Link href="/news" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">News</Link>
          <div className="relative">
            <button onClick={() => setMoreOpen(!moreOpen)} className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-[var(--accent)]">
              More <ChevronDown className={`h-3 w-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            {moreOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-[var(--border)] bg-[var(--background)] py-2 shadow-xl">
                  <p className="px-4 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Games & Features</p>
                  {hasPotm && <Link href="/matches/potm" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Star className="h-3.5 w-3.5" /> POTM Voting</Link>}
                  <Link href="/quiz" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Brain className="h-3.5 w-3.5" /> Quiz</Link>
                  <Link href="/dream-team" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Users className="h-3.5 w-3.5" /> Dream Team</Link>
                  <Link href="/potm-gallery" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Award className="h-3.5 w-3.5" /> POTM Gallery</Link>

                  <p className="mt-1 border-t border-[var(--border)] px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Stats & Analysis</p>
                  <Link href="/compare" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Crosshair className="h-3.5 w-3.5" /> Player Comparison</Link>
                  <Link href="/head-to-head" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Sword className="h-3.5 w-3.5" /> Head to Head</Link>
                  <Link href="/toss-analysis" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Gamepad2 className="h-3.5 w-3.5" /> Toss Analysis</Link>
                  <Link href="/teams/stats" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><TrendingUp className="h-3.5 w-3.5" /> Team Stats</Link>
                  <Link href="/performers" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Trophy className="h-3.5 w-3.5" /> Top Performers</Link>

                  <p className="mt-1 border-t border-[var(--border)] px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Explore</p>
                  <Link href="/seasons" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><History className="h-3.5 w-3.5" /> Seasons</Link>
                  <Link href="/awards" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Award className="h-3.5 w-3.5" /> Awards</Link>
                  <Link href="/venues" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><MapPin className="h-3.5 w-3.5" /> Venues</Link>
                  <Link href="/gallery" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Image className="h-3.5 w-3.5" /> Gallery</Link>
                  <Link href="/hall-of-fame" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Trophy className="h-3.5 w-3.5" /> Hall of Fame</Link>

                  <p className="mt-1 border-t border-[var(--border)] px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Info</p>
                  <Link href="/about" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Info className="h-3.5 w-3.5" /> About</Link>
                  <Link href="/contact" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Mail className="h-3.5 w-3.5" /> Contact</Link>
                  <Link href="/faq" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><HelpCircle className="h-3.5 w-3.5" /> FAQ</Link>
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
            {hasLive && <Link href="/live" onClick={() => setOpen(false)} className="flex items-center gap-1 text-red-500"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live</Link>}
            <Link href="/predictions" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Predictions</Link>
            <Link href="/news" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">News</Link>
            <hr className="border-[var(--border)]" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Games & Features</p>
            {hasPotm && <Link href="/matches/potm" onClick={() => setOpen(false)} className="flex items-center gap-1 transition-colors hover:text-[var(--accent)]"><Star className="h-3 w-3" /> POTM Voting</Link>}
            <Link href="/quiz" onClick={() => setOpen(false)} className="flex items-center gap-1 transition-colors hover:text-[var(--accent)]"><Brain className="h-3 w-3" /> Quiz</Link>
            <Link href="/dream-team" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Dream Team</Link>
            <Link href="/potm-gallery" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">POTM Gallery</Link>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Stats & Analysis</p>
            <Link href="/compare" onClick={() => setOpen(false)} className="flex items-center gap-1 transition-colors hover:text-[var(--accent)]"><Crosshair className="h-3 w-3" /> Player Comparison</Link>
            <Link href="/head-to-head" onClick={() => setOpen(false)} className="flex items-center gap-1 transition-colors hover:text-[var(--accent)]"><Sword className="h-3 w-3" /> Head to Head</Link>
            <Link href="/toss-analysis" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Toss Analysis</Link>
            <Link href="/teams/stats" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Team Stats</Link>
            <Link href="/performers" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Top Performers</Link>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Explore</p>
            <Link href="/seasons" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Seasons</Link>
            <Link href="/awards" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Awards</Link>
            <Link href="/venues" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Venues</Link>
            <Link href="/gallery" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Gallery</Link>
            <Link href="/hall-of-fame" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Hall of Fame</Link>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Info</p>
            <Link href="/about" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">About</Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Contact</Link>
            <Link href="/faq" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">FAQ</Link>
          </div>
        </nav>
      )}
    </header>
  )
}
