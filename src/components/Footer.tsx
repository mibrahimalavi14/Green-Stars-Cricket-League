"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Instagram, Youtube, Mail, MapPin, Phone, Users, Trophy, Calendar } from "lucide-react"
import { PushSubscribe } from "./PushSubscribe"

export function Footer() {
  const pathname = usePathname()
  const [stats, setStats] = useState<{ season: string; year: number; teams: number; players: number; matches: number } | null>(null)

  useEffect(() => {
    fetch("/api/footer-stats").then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  if (pathname.startsWith("/admin")) return null
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-5">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <img src="/images/optimized/gscl-logo.webp" alt="GSCL" className="h-8 w-8 rounded-full object-cover" />
              <h3 className="text-lg font-bold text-[var(--accent)]">GSCL</h3>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Green Stars Cricket League - Where champions are made. Follow us for live scores, updates, and more.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Quick Links</h4>
            <div className="flex flex-col gap-2 text-sm text-[var(--muted-foreground)]">
              <Link href="/teams" className="transition-colors hover:text-[var(--accent)]">Teams</Link>
              <Link href="/teams/stats" className="transition-colors hover:text-[var(--accent)]">Team Stats</Link>
              <Link href="/stats" className="transition-colors hover:text-[var(--accent)]">All-Time Stats</Link>
              <Link href="/fixtures" className="transition-colors hover:text-[var(--accent)]">Fixtures</Link>
              <Link href="/points-table" className="transition-colors hover:text-[var(--accent)]">Standings</Link>
              <Link href="/field-analysis" className="transition-colors hover:text-[var(--accent)]">Field Analysis</Link>
              <Link href="/toss-analysis" className="transition-colors hover:text-[var(--accent)]">Toss Analysis</Link>
              <Link href="/about" className="transition-colors hover:text-[var(--accent)]">About</Link>
              <Link href="/contact" className="transition-colors hover:text-[var(--accent)]">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">More</h4>
            <div className="flex flex-col gap-2 text-sm text-[var(--muted-foreground)]">
              <Link href="/news" className="transition-colors hover:text-[var(--accent)]">News</Link>
              <Link href="/players/stats" className="transition-colors hover:text-[var(--accent)]">Stats</Link>
              <Link href="/seasons" className="transition-colors hover:text-[var(--accent)]">Seasons</Link>
              <Link href="/predictions" className="transition-colors hover:text-[var(--accent)]">Predictions</Link>
              <Link href="/dream-team" className="transition-colors hover:text-[var(--accent)]">Dream Team</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Contact</h4>
            <div className="flex flex-col gap-2 text-sm text-[var(--muted-foreground)]">
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Haripur, Pakistan</span>
              <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> greenstarscricketleague@gmail.com</span>
              <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> +92 325 7682420</span>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Follow Us</h4>
            <div className="flex gap-3">

              <a href="https://www.instagram.com/green_stars_cricket_league" target="_blank" rel="noopener noreferrer" className="rounded-full bg-[var(--muted)] p-2 transition-colors hover:bg-[var(--accent)]">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://www.youtube.com/@GreenStarsCricketLeague" target="_blank" rel="noopener noreferrer" className="rounded-full bg-[var(--muted)] p-2 transition-colors hover:bg-[var(--accent)]">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {stats && (
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{stats.season} ({stats.year}) — Season Stats</p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-[var(--accent)]" /> <strong>{stats.teams}</strong> Teams</span>
              <span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5 text-[var(--accent)]" /> <strong>{stats.players}</strong> Players</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-[var(--accent)]" /> <strong>{stats.matches}</strong> Matches</span>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <PushSubscribe />
        </div>

        <div className="mt-6 border-t border-[var(--border)] pt-6 text-center text-sm text-[var(--muted-foreground)]">
          &copy; {new Date().getFullYear()} Green Stars Cricket League. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
