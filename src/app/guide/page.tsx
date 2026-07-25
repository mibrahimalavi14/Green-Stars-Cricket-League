"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Shield, LayoutDashboard, Users, Trophy, Calendar, Newspaper, Image, Star,
  Brain, UserCheck, Award, Bell, MessageSquare, BarChart3, Target, Zap,
  Server, Lock, Database, Rocket, AlertTriangle, ChevronRight, ExternalLink,
  Menu, X, Play, CircleDot, SkipForward, RotateCcw, Monitor, Globe, Heart
} from "lucide-react"

const sections = [
  { id: "access", label: "Admin Access", icon: Shield },
  { id: "pages", label: "Admin Pages", icon: LayoutDashboard },
  { id: "matchday", label: "Match Day Workflow", icon: Calendar },
  { id: "scoring", label: "Scoring Panel", icon: Target },
  { id: "live", label: "Live View Features", icon: Monitor },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "api", label: "API Endpoints", icon: Server },
  { id: "env", label: "Environment", icon: Lock },
  { id: "database", label: "Database", icon: Database },
  { id: "deploy", label: "Deployment", icon: Rocket },
  { id: "troubleshoot", label: "Troubleshooting", icon: AlertTriangle },
]

const adminPages = [
  { name: "Dashboard", url: "/admin", desc: "Overview — all counts, quick links", icon: LayoutDashboard, highlight: false },
  { name: "Teams", url: "/admin/teams", desc: "Add/edit/delete teams", icon: Users, highlight: false },
  { name: "Players", url: "/admin/players", desc: "Add/edit/delete players per team", icon: UserCheck, highlight: false },
  { name: "Seasons", url: "/admin/seasons", desc: "Create seasons, lock predictions", icon: Trophy, highlight: false },
  { name: "Matches", url: "/admin/matches", desc: "Create/schedule matches, set live/completed", icon: Calendar, highlight: true },
  { name: "Live Scoring", url: "/admin/live-scoring/{MATCH_ID}", desc: "Ball-by-ball scoring panel", icon: Play, highlight: true },
  { name: "Performances", url: "/admin/performances", desc: "Enter player performances after matches", icon: Award, highlight: false },
  { name: "News", url: "/admin/news", desc: "Publish/edit news articles", icon: Newspaper, highlight: false },
  { name: "Gallery", url: "/admin/gallery", desc: "Upload/manage photos", icon: Image, highlight: false },
  { name: "Sponsors", url: "/admin/sponsors", desc: "Manage league sponsors", icon: Star, highlight: false },
  { name: "Quiz", url: "/admin/quiz", desc: "Create match quizzes", icon: Brain, highlight: false },
  { name: "Squad", url: "/admin/squad", desc: "Set match squads", icon: Users, highlight: false },
  { name: "POTM", url: "/admin/potm", desc: "Man of the Match voting", icon: Award, highlight: false },
  { name: "Predictions", url: "/admin/predictions", desc: "View/lock season predictions", icon: Target, highlight: false },
  { name: "Moments", url: "/admin/moments", desc: "Moment of the Day highlights", icon: Star, highlight: false },
  { name: "Notifications", url: "/admin/notifications", desc: "Send push notifications", icon: Bell, highlight: false },
  { name: "Reviews", url: "/admin/reviews", desc: "Approve/reject user reviews", icon: MessageSquare, highlight: false },
  { name: "Contact", url: "/admin/contact", desc: "View contact form messages", icon: MessageSquare, highlight: false },
  { name: "Analytics", url: "/admin/analytics", desc: "Usage metrics & trends", icon: BarChart3, highlight: true },
]

const scoringRules = [
  { rule: "4 overs per innings", detail: "24 balls total per side" },
  { rule: "1 over max per bowler", detail: "6 legal balls per bowler" },
  { rule: "10 wickets per innings", detail: "All-out or overs finished" },
  { rule: "Strike rotation", detail: "Odd runs + end of over" },
]

const liveFeatures = [
  "Auto-refresh every 5 seconds",
  "Score, overs, wickets with run rate",
  "Target display (2nd innings)",
  "Powerplay indicator",
  "Estimated win probability",
  "Required runs per ball",
  "Boundary count (4s and 6s)",
  "Fielding summary",
  "Over-by-over bar chart",
  "Worm graph (cumulative comparison)",
  "Match highlights (auto + manual)",
  "Team form (last 5 results W/L/T)",
  "Full batting & bowling scorecards",
  "Ball-by-ball timeline with regions",
]

const apis = [
  { endpoint: "/api/health", method: "GET", auth: "Public", desc: "DB status, version, commit SHA" },
  { endpoint: "/api/teams", method: "GET", auth: "Public", desc: "All teams" },
  { endpoint: "/api/players", method: "GET", auth: "Public", desc: "All players" },
  { endpoint: "/api/matches", method: "GET", auth: "Public", desc: "All matches" },
  { endpoint: "/api/matches/live", method: "GET", auth: "Public", desc: "Current live match" },
  { endpoint: "/api/search?q=", method: "GET", auth: "Public", desc: "Search players/teams/matches/news" },
  { endpoint: "/api/head-to-head", method: "GET", auth: "Public", desc: "H2H stats" },
  { endpoint: "/api/live/summary", method: "GET", auth: "Public", desc: "Live match full summary" },
  { endpoint: "/api/live/balls", method: "POST", auth: "Admin", desc: "Submit ball event" },
  { endpoint: "/api/live/balls/undo", method: "POST", auth: "Admin", desc: "Undo last ball" },
  { endpoint: "/api/admin/analytics", method: "GET", auth: "Admin", desc: "Analytics data" },
]

const envVars = [
  { name: "DATABASE_URL", required: true, desc: "Neon PostgreSQL connection string" },
  { name: "NEXTAUTH_SECRET", required: true, desc: "Auth encryption key" },
  { name: "NEXTAUTH_URL", required: true, desc: "Production URL" },
  { name: "ADMIN_PASSWORD", required: true, desc: "Admin panel login password" },
  { name: "AUTH_GOOGLE_ID", required: false, desc: "Google OAuth (for predictions)" },
  { name: "AUTH_GOOGLE_SECRET", required: false, desc: "Google OAuth (for predictions)" },
]

const troubleshoot = [
  { problem: "Build fails", solution: "Run npx prisma generate first" },
  { problem: "DB connection error", solution: "Check DATABASE_URL in .env.local" },
  { problem: "Admin login fails", solution: "Check ADMIN_PASSWORD env var" },
  { problem: "Scoring not saving", solution: "Check network, try refresh" },
  { problem: "Stats wrong", solution: "Run /api/live/sync-stats?matchId=X" },
  { problem: "Migration pending", solution: "Run npx prisma migrate deploy" },
]

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState("access")
  const [mobileNav, setMobileNav] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id) })
      },
      { rootMargin: "-20% 0px -70% 0px" }
    )
    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    setMobileNav(false)
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:py-12">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 space-y-1">
              <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Navigation</p>
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    activeSection === id
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-md"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </aside>

          {/* Mobile Nav Toggle */}
          <button
            onClick={() => setMobileNav(!mobileNav)}
            className="lg:hidden fixed bottom-6 right-6 z-50 bg-[var(--accent)] text-[var(--accent-foreground)] p-3 rounded-full shadow-lg"
          >
            {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Mobile Nav Drawer */}
          {mobileNav && (
            <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileNav(false)}>
              <div className="absolute right-0 top-0 bottom-0 w-72 bg-[var(--card)] p-4 shadow-xl" onClick={e => e.stopPropagation()}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Navigation</p>
                <div className="space-y-1">
                  {sections.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => scrollTo(id)}
                      className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        activeSection === id
                          ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-12">

            {/* Hero */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gscl-dark via-gscl to-gscl-light p-8 md:p-12 text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gscl-gold/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <img src="/images/optimized/gscl-logo.webp" alt="GSCL" className="h-12 w-12 rounded-full border-2 border-white/20" />
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold">GSCL Guide</h1>
                    <span className="inline-block mt-1 rounded-full bg-gscl-gold/20 px-3 py-0.5 text-xs font-semibold text-gscl-gold">v1.0.1 — T4 Edition</span>
                  </div>
                </div>
                <p className="mt-4 max-w-xl text-white/70 text-lg">
                  Complete admin panel guide and operations manual. Everything you need to run the Green Stars Cricket League.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="https://green-stars-cricket-league.vercel.app/admin" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium hover:bg-white/20 transition-colors backdrop-blur-sm">
                    <ExternalLink className="h-4 w-4" /> Open Admin Panel
                  </a>
                  <a href="https://green-stars-cricket-league.vercel.app/live" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium hover:bg-white/20 transition-colors backdrop-blur-sm">
                    <Globe className="h-4 w-4" /> View Live Site
                  </a>
                </div>
              </div>
            </section>

            {/* Admin Access */}
            <section id="access">
              <SectionHeader icon={Shield} title="Admin Panel Access" />
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-500/10">
                    <Lock className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">Password Protected</p>
                    <p className="text-sm text-[var(--muted-foreground)]">Admin password stored in environment variable</p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-[var(--muted)] p-4 font-mono text-sm">
                  <p className="text-[var(--muted-foreground)] mb-1">Production URL</p>
                  <a href="https://green-stars-cricket-league.vercel.app/admin" target="_blank" rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:underline">
                    https://green-stars-cricket-league.vercel.app/admin
                  </a>
                </div>
              </div>
            </section>

            {/* Admin Pages */}
            <section id="pages">
              <SectionHeader icon={LayoutDashboard} title="Admin Panel — All Pages" />
              <div className="grid gap-3 sm:grid-cols-2">
                {adminPages.map((p) => (
                  <div key={p.name}
                    className={`flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-md ${
                      p.highlight
                        ? "border-[var(--accent)]/30 bg-[var(--accent)]/5"
                        : "border-[var(--border)] bg-[var(--card)]"
                    }`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      p.highlight ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    }`}>
                      <p.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[var(--foreground)] truncate">{p.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">{p.desc}</p>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-[var(--muted-foreground)]/50" />
                  </div>
                ))}
              </div>
            </section>

            {/* Match Day Workflow */}
            <section id="matchday">
              <SectionHeader icon={Calendar} title="Match Day Workflow" />

              {/* Before */}
              <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold">1</div>
                  <h3 className="font-bold text-[var(--foreground)]">Before Match</h3>
                </div>
                <ol className="space-y-2 text-sm text-[var(--muted-foreground)]">
                  {[
                    "Go to /admin/matches → Create new match (set teams, venue, date)",
                    "Go to /admin/squad → Set playing XI for both teams",
                    "Open /admin/live-scoring/{MATCH_ID}",
                    "Select toss winner + decision (bat/bowl)",
                    "Select batting team, striker, non-striker, bowler",
                    "Click Start Match"
                  ].map((s, i) => (
                    <li key={i} className="flex gap-2"><span className="text-[var(--accent)] font-semibold">{i + 1}.</span> {s}</li>
                  ))}
                </ol>
              </div>

              {/* During */}
              <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/10 text-green-500 text-xs font-bold">2</div>
                  <h3 className="font-bold text-[var(--foreground)]">During Match — Live Scoring</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-[var(--muted)] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CircleDot className="h-4 w-4 text-green-500" />
                      <p className="font-semibold text-sm text-[var(--foreground)]">Batting Controls</p>
                    </div>
                    <ul className="space-y-1 text-xs text-[var(--muted-foreground)]">
                      <li>Runs: 0, 1, 2, 3, 4, 6 buttons</li>
                      <li>Extras: Wide, No Ball, Bye, Leg Bye</li>
                      <li>Wicket: bowled, caught, lbw, runout, stumped, hit wicket</li>
                      <li>Region: click field diagram for shot direction</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-[var(--muted)] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <SkipForward className="h-4 w-4 text-[var(--accent)]" />
                      <p className="font-semibold text-sm text-[var(--foreground)]">Auto-calculations</p>
                    </div>
                    <ul className="space-y-1 text-xs text-[var(--muted-foreground)]">
                      <li>Score updates live</li>
                      <li>Run rate + required run rate</li>
                      <li>Partnership tracker</li>
                      <li>Current over display</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-amber-500/5 border border-amber-500/20 p-4">
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">T4 Format Rules</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {scoringRules.map((r) => (
                      <div key={r.rule} className="flex items-start gap-2 text-sm">
                        <Zap className="h-3.5 w-3.5 mt-0.5 text-[var(--accent)] shrink-0" />
                        <span><span className="font-medium text-[var(--foreground)]">{r.rule}</span> — {r.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-[var(--muted)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <RotateCcw className="h-4 w-4 text-red-500" />
                    <p className="font-semibold text-sm text-[var(--foreground)]">Undo</p>
                  </div>
                  <ul className="space-y-1 text-xs text-[var(--muted-foreground)]">
                    <li>Reverses last ball (runs, wickets, extras)</li>
                    <li>Cannot undo after match is completed</li>
                  </ul>
                </div>
              </div>

              {/* After */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/10 text-purple-500 text-xs font-bold">3</div>
                  <h3 className="font-bold text-[var(--foreground)]">After Match</h3>
                </div>
                <ol className="space-y-2 text-sm text-[var(--muted-foreground)]">
                  {[
                    "Click End Match in scoring panel",
                    "Select winner (or tie)",
                    "Enter result text",
                    "Select Man of the Match",
                    "Match auto-saves as completed",
                    "Points table auto-updates",
                    "Player stats auto-recalculate"
                  ].map((s, i) => (
                    <li key={i} className="flex gap-2"><span className="text-[var(--accent)] font-semibold">{i + 1}.</span> {s}</li>
                  ))}
                </ol>
              </div>
            </section>

            {/* Scoring Panel */}
            <section id="scoring">
              <SectionHeader icon={Target} title="Scoring Panel Features" />
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
                <h3 className="font-bold text-[var(--foreground)] mb-3">Admin View — Live Display</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    "Score with run rate", "Striker / Non-striker / Bowler cards",
                    "Current over balls", "Last 6 balls",
                    "Ball-by-ball timeline", "Batting & bowling scorecards",
                    "Partnership tracker", "Field diagram with shot regions"
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                      <Heart className="h-3 w-3 text-red-500 shrink-0" /> {f}
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <h3 className="font-bold text-[var(--foreground)] mb-3">Custom Highlights</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mb-2">Admin can add custom match highlights during scoring:</p>
                  <ol className="space-y-1 text-sm text-[var(--muted-foreground)]">
                    <li className="flex gap-2"><span className="text-[var(--accent)]">1.</span> Go to scoring panel → Custom Highlights section</li>
                    <li className="flex gap-2"><span className="text-[var(--accent)]">2.</span> Select icon, enter text + label</li>
                    <li className="flex gap-2"><span className="text-[var(--accent)]">3.</span> Saves instantly → appears on public view above auto-generated highlights</li>
                  </ol>
                </div>
              </div>
            </section>

            {/* Live View */}
            <section id="live">
              <SectionHeader icon={Monitor} title="Public Live View Features" />
              <p className="mb-4 text-sm text-[var(--muted-foreground)]">The public live view at <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-xs font-mono">/live</code> auto-refreshes every 5 seconds and displays:</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {liveFeatures.map((f) => (
                  <div key={f} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" /> {f}
                  </div>
                ))}
              </div>
            </section>

            {/* Analytics */}
            <section id="analytics">
              <SectionHeader icon={BarChart3} title="Analytics Dashboard" />
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  Admin-only at <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-xs font-mono">/admin/analytics</code>
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Tracked Events</p>
                    <div className="space-y-1.5">
                      {["Match scored", "Match completed", "Undo usage", "Search queries", "Predictions submitted", "Quiz attempts", "POTM votes"].map(e => (
                        <div key={e} className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                          <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" /> {e}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Dashboard Shows</p>
                    <div className="space-y-1.5">
                      {["8 all-time counters", "30-day period counters", "Trend charts", "Top search terms", "Most visited pages", "Recent events feed"].map(e => (
                        <div key={e} className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500" /> {e}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* API Endpoints */}
            <section id="api">
              <SectionHeader icon={Server} title="API Endpoints" />
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                        <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Endpoint</th>
                        <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Method</th>
                        <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Auth</th>
                        <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apis.map((a, i) => (
                        <tr key={a.endpoint} className={`border-b border-[var(--border)] last:border-0 ${i % 2 === 0 ? "" : "bg-[var(--muted)]/50"}`}>
                          <td className="px-4 py-2.5 font-mono text-xs text-[var(--accent)]">{a.endpoint}</td>
                          <td className="px-4 py-2.5">
                            <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${a.method === "GET" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}>
                              {a.method}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`rounded px-1.5 py-0.5 text-xs ${a.auth === "Admin" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-gray-500/10 text-[var(--muted-foreground)]"}`}>
                              {a.auth}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{a.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Environment */}
            <section id="env">
              <SectionHeader icon={Lock} title="Environment Variables" />
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                        <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Variable</th>
                        <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Required</th>
                        <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {envVars.map((v, i) => (
                        <tr key={v.name} className={`border-b border-[var(--border)] last:border-0 ${i % 2 === 0 ? "" : "bg-[var(--muted)]/50"}`}>
                          <td className="px-4 py-2.5 font-mono text-xs text-[var(--accent)]">{v.name}</td>
                          <td className="px-4 py-2.5">
                            <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${v.required ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-gray-500/10 text-[var(--muted-foreground)]"}`}>
                              {v.required ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{v.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Database */}
            <section id="database">
              <SectionHeader icon={Database} title="Database Management" />
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
                <div className="space-y-3">
                  {[
                    { cmd: "npx prisma generate", desc: "Generate Prisma client" },
                    { cmd: "npx prisma db push", desc: "Push schema changes to DB" },
                    { cmd: "npx prisma migrate deploy", desc: "Deploy migrations (production)" },
                    { cmd: "npx prisma migrate status", desc: "Check migration status" },
                  ].map((c) => (
                    <div key={c.cmd} className="rounded-lg bg-[var(--muted)] p-3">
                      <p className="text-xs text-[var(--muted-foreground)] mb-1">{c.desc}</p>
                      <code className="font-mono text-sm text-[var(--accent)]">{c.cmd}</code>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Deployment */}
            <section id="deploy">
              <SectionHeader icon={Rocket} title="Deployment (Vercel)" />
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
                <div className="space-y-3">
                  <div className="rounded-lg bg-[var(--muted)] p-3">
                    <p className="text-xs text-[var(--muted-foreground)] mb-1">Push code</p>
                    <code className="font-mono text-sm text-[var(--accent)]">git add . && git commit -m "update" && git push</code>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">Vercel auto-deploys from main branch. For manual deploy:</p>
                  <div className="rounded-lg bg-[var(--muted)] p-3">
                    <code className="font-mono text-sm text-[var(--accent)]">npx vercel --prod</code>
                  </div>
                </div>
              </div>
            </section>

            {/* Troubleshooting */}
            <section id="troubleshoot">
              <SectionHeader icon={AlertTriangle} title="Troubleshooting" />
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                        <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Problem</th>
                        <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Solution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {troubleshoot.map((t, i) => (
                        <tr key={t.problem} className={`border-b border-[var(--border)] last:border-0 ${i % 2 === 0 ? "" : "bg-[var(--muted)]/50"}`}>
                          <td className="px-4 py-2.5 font-medium text-[var(--foreground)]">{t.problem}</td>
                          <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{t.solution}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="text-center py-8 text-sm text-[var(--muted-foreground)]">
              <p>GSCL v1.0.1 — Green Stars Cricket League</p>
              <p className="mt-1">Built with care for Season 1</p>
            </div>

          </main>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10">
        <Icon className="h-5 w-5 text-[var(--accent)]" />
      </div>
      <h2 className="text-xl font-bold text-[var(--foreground)]">{title}</h2>
    </div>
  )
}
