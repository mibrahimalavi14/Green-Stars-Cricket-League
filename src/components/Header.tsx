"use client"

import Link from "next/link"
import { ThemeToggle } from "./ThemeToggle"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Menu, X, Search, ChevronDown, Sword, Crosshair, Star, Bell, Trophy, Brain, Award, MapPin, Image, History, Info, Mail, HelpCircle, Users, TrendingUp, Gamepad2, Calendar, Shield, Newspaper, MessageSquare, Sparkles, Map, ArrowLeftRight, Crown, Handshake, BarChart3, PenLine, Users2, Activity, FlaskConical, Database, FileText } from "lucide-react"
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

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  if (isAdmin) {
    const adminLinks = {
      main: [
        { href: "/admin/matches", label: "Matches", icon: Calendar },
        { href: "/admin/players", label: "Players", icon: Users },
        { href: "/admin/teams", label: "Teams", icon: Shield },
        { href: "/admin/performances", label: "Scorecards", icon: Trophy },
      ],
      content: [
        { href: "/admin/news", label: "News", icon: Newspaper },
        { href: "/admin/quiz", label: "Quiz", icon: Brain },
        { href: "/admin/moments", label: "Moments", icon: Sparkles },
        { href: "/admin/gallery", label: "Gallery", icon: Image },
        { href: "/admin/sponsors", label: "Sponsors", icon: Award },
        { href: "/admin/chairman-message", label: "Chairman's Message", icon: PenLine },
        { href: "/admin/management", label: "Management", icon: Users2 },
      ],
      manage: [
        { href: "/admin/seasons", label: "Seasons", icon: Calendar },
        { href: "/admin/squad", label: "Squad", icon: Users },
        { href: "/admin/potm", label: "POTM", icon: Star },
        { href: "/admin/player-of-season", label: "Player of Season", icon: Crown },
        { href: "/admin/predictions", label: "Predictions", icon: Trophy },
        { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
        { href: "/admin/match-notes", label: "Match Notes", icon: FileText },
      ],
      league: [
        { href: "/admin/transfers", label: "Transfers", icon: ArrowLeftRight },
        { href: "/admin/captaincy", label: "Captaincy", icon: Crown },
        { href: "/admin/honors", label: "Team Honors", icon: Trophy },
        { href: "/admin/penalties", label: "Penalties", icon: Shield },
        { href: "/admin/awards", label: "Season Awards", icon: Award },
        { href: "/admin/fair-play", label: "Fair Play", icon: Handshake },
      ],
      tools: [
        { href: "/admin/practice", label: "Practice Center", icon: FlaskConical },
        { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/admin/system", label: "System Monitor", icon: Activity },
        { href: "/admin/restore", label: "Restore", icon: Database },
      ],
      system: [
        { href: "/admin/notifications", label: "Notifications", icon: Bell },
        { href: "/admin/contact", label: "Messages", icon: MessageSquare },
      ],
    }
    const adminGroups = [
      { title: "Content", items: adminLinks.content },
      { title: "Manage", items: adminLinks.manage },
      { title: "League", items: adminLinks.league },
      { title: "Tools", items: adminLinks.tools },
      { title: "System", items: adminLinks.system },
    ]
    return (
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <img src="/images/optimized/gscl-logo.webp" alt="GSCL" className="h-8 w-8 rounded-full object-cover" />
            <span className="text-sm font-semibold">Admin</span>
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {adminLinks.main.map(l => <Link key={l.href} href={l.href} className="text-sm transition-colors hover:text-[var(--accent)]">{l.label}</Link>)}
            <div className="group/more relative">
              <button className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--accent)]" aria-label="More">
                More <ChevronDown className="h-3 w-3 transition-transform group-hover/more:rotate-180" />
              </button>
              <div className="invisible absolute right-0 top-full z-50 origin-top-right scale-95 pt-2 opacity-0 transition-all group-hover/more:visible group-hover/more:scale-100 group-hover/more:opacity-100">
                <div className="max-h-[70vh] w-[min(92vw,42rem)] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 shadow-2xl" onWheel={(e) => e.stopPropagation()}>
                  {adminGroups.map((g, gi) => (
                    <div key={g.title}>
                      {gi > 0 && <div className="my-1.5 border-t border-[var(--border)]" />}
                      <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{g.title}</p>
                      <div className="grid gap-0.5 sm:grid-cols-2">
                        {g.items.map(l => (
                          <Link key={l.href} href={l.href} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]">
                            <l.icon className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                            {l.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="my-1.5 border-t border-[var(--border)]" />
                  <Link href="/" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--muted)]">
                    View Site
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--muted)] md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <ThemeToggle />
          </div>
        </div>
        {open && (
          <nav className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-[var(--border)] px-4 py-3 md:hidden">
            <div className="flex flex-col gap-3 text-sm font-medium">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Main</p>
              {adminLinks.main.map(l => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">{l.label}</Link>)}
              {adminGroups.map(g => (
                <div key={g.title}>
                  <div className="border-t border-[var(--border)]" />
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{g.title}</p>
                  {g.items.map(l => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex items-center gap-2 transition-colors hover:text-[var(--accent)]"><l.icon className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />{l.label}</Link>)}
                </div>
              ))}
              <div className="border-t border-[var(--border)]" />
              <Link href="/" onClick={() => setOpen(false)} className="text-[var(--accent)] transition-colors hover:text-[var(--accent)]">View Site</Link>
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
          <img src="/images/optimized/gscl-logo.webp" alt="GSCL" className="h-8 w-8 rounded-full object-cover" />
          <span className="hidden text-sm font-medium md:block">Green Stars Cricket League</span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Home</Link>
          <Link href="/matches" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Matches</Link>
          <Link href="/teams" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Teams</Link>
          <Link href="/players" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Players</Link>
          <Link href="/fixtures" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Fixtures</Link>
          <Link href="/points-table" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Standings</Link>
          <Link href="/records" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Records</Link>
          {hasLive && (
            <Link href="/live" className="flex items-center gap-1 text-sm font-medium text-red-500 transition-colors hover:text-red-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live
            </Link>
          )}
          <Link href="/predictions" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">Predictions</Link>
          <Link href="/news" className="text-sm font-medium transition-colors hover:text-[var(--accent)]">News</Link>
          <div className="group/more relative">
            <button className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-[var(--accent)]">
              More <ChevronDown className="h-3 w-3 transition-transform group-hover/more:rotate-180" />
            </button>
            <div
              className="invisible fixed left-0 right-0 top-[52px] z-50 mx-auto max-h-[80vh] w-full overflow-y-auto rounded-b-xl border border-[var(--border)] border-t-0 bg-[var(--background)] py-2 opacity-0 shadow-2xl transition-all group-hover/more:visible group-hover/more:opacity-100 lg:absolute lg:left-auto lg:right-0 lg:top-full lg:mt-2 lg:w-56 lg:rounded-xl lg:border lg:border-t lg:rounded-b-xl lg:max-h-[70vh]"
              onWheel={(e) => e.stopPropagation()}
            >
              <div className="mx-auto max-w-7xl px-4 lg:px-0">
                <p className="px-4 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Games & Features</p>
                {hasPotm && <Link href="/matches/potm" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Star className="h-3.5 w-3.5" /> POTM Voting</Link>}
                <Link href="/quiz" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Brain className="h-3.5 w-3.5" /> Quiz</Link>
                <Link href="/dream-team" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Users className="h-3.5 w-3.5" /> Dream Team</Link>
                <Link href="/potm-gallery" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Award className="h-3.5 w-3.5" /> POTM Gallery</Link>
                <Link href="/player-of-season" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Crown className="h-3.5 w-3.5" /> Player of the Season</Link>

                <p className="mt-1 border-t border-[var(--border)] px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Stats & Analysis</p>
                <Link href="/compare" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Crosshair className="h-3.5 w-3.5" /> Player Comparison</Link>
                <Link href="/head-to-head" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Sword className="h-3.5 w-3.5" /> Head to Head</Link>
                <Link href="/field-analysis" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Map className="h-3.5 w-3.5" /> Field Analysis</Link>
                <Link href="/toss-analysis" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Gamepad2 className="h-3.5 w-3.5" /> Toss Analysis</Link>
                <Link href="/teams/stats" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><TrendingUp className="h-3.5 w-3.5" /> Team Stats</Link>
                <Link href="/stats" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><BarChart3 className="h-3.5 w-3.5" /> All-Time Stats</Link>
                <Link href="/performers" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Trophy className="h-3.5 w-3.5" /> Top Performers</Link>
                <Link href="/records" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Trophy className="h-3.5 w-3.5" /> Records</Link>

                <p className="mt-1 border-t border-[var(--border)] px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Explore</p>
                <Link href="/seasons" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><History className="h-3.5 w-3.5" /> Seasons</Link>
                <Link href="/awards" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Award className="h-3.5 w-3.5" /> Awards</Link>
                <Link href="/venues" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><MapPin className="h-3.5 w-3.5" /> Venues</Link>
                <Link href="/gallery" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Image className="h-3.5 w-3.5" /> Gallery</Link>
                <Link href="/hall-of-fame" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Trophy className="h-3.5 w-3.5" /> Hall of Fame</Link>
                <Link href="/management" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Crown className="h-3.5 w-3.5" /> Management</Link>

                <p className="mt-1 border-t border-[var(--border)] px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Info</p>
                <Link href="/about" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Info className="h-3.5 w-3.5" /> About</Link>
                <Link href="/contact" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><Mail className="h-3.5 w-3.5" /> Contact</Link>
                <Link href="/faq" className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)] hover:text-[var(--accent)]"><HelpCircle className="h-3.5 w-3.5" /> FAQ</Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={() => window.dispatchEvent(new CustomEvent("open-search"))} className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)] transition-colors hover:bg-[var(--accent)]" aria-label="Search">
            <Search className="h-4 w-4" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--muted)] md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <ThemeToggle />
        </div>
      </div>

      {open && (
        <nav className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-[var(--border)] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium">
            <Link href="/" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Home</Link>
            <Link href="/teams" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Teams</Link>
            <Link href="/players" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Players</Link>
            <Link href="/fixtures" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Fixtures</Link>
            <Link href="/points-table" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Standings</Link>
            <Link href="/records" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Records</Link>
            {hasLive && <Link href="/live" onClick={() => setOpen(false)} className="flex items-center gap-1 text-red-500"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live</Link>}
            <Link href="/predictions" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Predictions</Link>
            <Link href="/news" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">News</Link>
            <hr className="border-[var(--border)]" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Games & Features</p>
            {hasPotm && <Link href="/matches/potm" onClick={() => setOpen(false)} className="flex items-center gap-1 transition-colors hover:text-[var(--accent)]"><Star className="h-3 w-3" /> POTM Voting</Link>}
            <Link href="/quiz" onClick={() => setOpen(false)} className="flex items-center gap-1 transition-colors hover:text-[var(--accent)]"><Brain className="h-3 w-3" /> Quiz</Link>
            <Link href="/dream-team" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Dream Team</Link>
            <Link href="/potm-gallery" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">POTM Gallery</Link>
            <Link href="/player-of-season" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Player of the Season</Link>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Stats & Analysis</p>
            <Link href="/compare" onClick={() => setOpen(false)} className="flex items-center gap-1 transition-colors hover:text-[var(--accent)]"><Crosshair className="h-3 w-3" /> Player Comparison</Link>
            <Link href="/head-to-head" onClick={() => setOpen(false)} className="flex items-center gap-1 transition-colors hover:text-[var(--accent)]"><Sword className="h-3 w-3" /> Head to Head</Link>
            <Link href="/field-analysis" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Field Analysis</Link>
            <Link href="/toss-analysis" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Toss Analysis</Link>
            <Link href="/teams/stats" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Team Stats</Link>
            <Link href="/stats" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">All-Time Stats</Link>
            <Link href="/performers" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Top Performers</Link>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Explore</p>
            <Link href="/seasons" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Seasons</Link>
            <Link href="/awards" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Awards</Link>
            <Link href="/venues" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Venues</Link>
            <Link href="/gallery" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Gallery</Link>
            <Link href="/hall-of-fame" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Hall of Fame</Link>
            <Link href="/management" onClick={() => setOpen(false)} className="transition-colors hover:text-[var(--accent)]">Management</Link>
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
