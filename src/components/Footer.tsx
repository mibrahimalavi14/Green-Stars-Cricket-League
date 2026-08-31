"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Instagram, Mail, MapPin, Users, Trophy, Calendar, ChevronRight, MessageSquare, ArrowUpRight } from "lucide-react"
import { PushSubscribe } from "./PushSubscribe"

const quickLinks = [
  { href: "/teams", label: "Teams" },
  { href: "/teams/stats", label: "Team Stats" },
  { href: "/stats", label: "All-Time Stats" },
  { href: "/matches", label: "Matches" },
  { href: "/points-table", label: "Standings" },
  { href: "/schedule", label: "Schedule" },
  { href: "/format", label: "Format" },
]

const moreLinks = [
  { href: "/news", label: "News" },
  { href: "/players/stats", label: "Player Stats" },
  { href: "/seasons", label: "Seasons" },
  { href: "/dream-team", label: "Dream Team" },
  { href: "/records", label: "Records" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/management", label: "Management" },
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">{children}</h4>
      <span className="mt-1.5 block h-0.5 w-8 rounded-full bg-gscl-gold" />
    </div>
  )
}

function LinkCol({ items }: { items: { href: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="group flex items-center gap-1 text-sm text-[var(--muted-foreground)] transition-all hover:translate-x-0.5 hover:text-[var(--accent)]"
        >
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gscl-gold/70 transition-transform group-hover:translate-x-0.5" />
          <span>{it.label}</span>
        </Link>
      ))}
    </div>
  )
}

export function Footer() {
  const pathname = usePathname()
  const [stats, setStats] = useState<{ season: string; year: number; teams: number; players: number; matches: number } | null>(null)

  useEffect(() => {
    fetch("/api/footer-stats").then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  if (pathname.startsWith("/admin")) return null
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-3">
            <div className="mb-3 flex items-center gap-2">
              <img src="/images/optimized/gscl-logo.webp" alt="GSCL" className="h-9 w-9 rounded-full object-cover ring-1 ring-gscl-gold/40" />
              <h3 className="text-xl font-extrabold tracking-tight text-[var(--accent)]">GSCL</h3>
            </div>
            <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
              Green Stars Cricket League — where champions are made. Follow us for live scores, updates, and more.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--muted)] px-3 py-2 text-sm">
              <MapPin className="h-4 w-4 text-gscl-gold" />
              <span className="text-[var(--muted-foreground)]">Founded &middot; Haripur, Pakistan</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <SectionHeading>Quick Links</SectionHeading>
            <LinkCol items={quickLinks} />
          </div>

          {/* More */}
          <div className="lg:col-span-3">
            <SectionHeading>More</SectionHeading>
            <LinkCol items={moreLinks} />
          </div>

          {/* Contact + Follow */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <SectionHeading>Contact</SectionHeading>
              <div className="space-y-2.5 text-sm text-[var(--muted-foreground)]">
                <div className="flex items-center gap-2.5 rounded-lg bg-[var(--muted)] px-3 py-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gscl-gold/15"><Mail className="h-3.5 w-3.5 text-gscl-gold" /></span>
                  <span className="break-all">greenstarscricketleague@gmail.com</span>
                </div>
                <a href="/contact" className="flex items-center gap-2.5 rounded-lg bg-[var(--muted)] px-3 py-2.5 transition-colors hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gscl-gold/15"><MessageSquare className="h-3.5 w-3.5 text-gscl-gold" /></span>
                  <span>Send us a message</span>
                  <ArrowUpRight className="ml-auto h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div>
              <SectionHeading>Follow Us</SectionHeading>
              <div className="flex gap-3">
                <a
                  href="https://www.instagram.com/green_stars_cricket_league"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="group flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#dc2743] text-white shadow-md transition-all hover:scale-110 hover:shadow-lg"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {stats && (
          <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-5">
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              {stats.season} ({stats.year}) — Season Stats
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
              <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]"><Users className="h-4 w-4 text-gscl-gold" /> <strong className="text-[var(--foreground)]">{stats.teams}</strong> Teams</span>
              <span className="text-gscl-gold/40">•</span>
              <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]"><Trophy className="h-4 w-4 text-gscl-gold" /> <strong className="text-[var(--foreground)]">{stats.players}</strong> Players</span>
              <span className="text-gscl-gold/40">•</span>
              <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]"><Calendar className="h-4 w-4 text-gscl-gold" /> <strong className="text-[var(--foreground)]">{stats.matches}</strong> Matches</span>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <PushSubscribe />
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-[var(--border)] pt-6 text-sm text-[var(--muted-foreground)] sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Green Stars Cricket League. All rights reserved.</p>
          <p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-gscl-gold" /> Haripur, Pakistan</p>
        </div>
      </div>
    </footer>
  )
}
