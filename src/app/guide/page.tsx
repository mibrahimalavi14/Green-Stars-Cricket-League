"use client"

import { useState, useEffect } from "react"
import {
  Shield, LayoutDashboard, Users, Trophy, Calendar, Newspaper, Image, Star,
  Brain, UserCheck, Award, Bell, MessageSquare, BarChart3, Target, Zap,
  Server, Lock, Database, Rocket, AlertTriangle, ChevronRight, ExternalLink,
  Menu, X, Play, CircleDot, SkipForward, RotateCcw, Monitor, Globe, Heart,
  ChevronDown, ChevronUp, Info, Flag, Handshake
} from "lucide-react"

const sections = [
  { id: "access", label: "Admin Access", icon: Shield },
  { id: "setup", label: "League Setup", icon: Trophy },
  { id: "pages", label: "All Admin Pages", icon: LayoutDashboard },
  { id: "matchday", label: "Match Day Workflow", icon: Calendar },
  { id: "scoring", label: "Live Scoring Guide", icon: Target },
  { id: "extras", label: "Extras & Rules", icon: Zap },
  { id: "wickets", label: "Wicket Types", icon: AlertTriangle },
  { id: "endmatch", label: "Ending a Match", icon: Flag },
  { id: "aftermatch", label: "After the Match", icon: Award },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "api", label: "API Endpoints", icon: Server },
  { id: "env", label: "Environment", icon: Lock },
  { id: "troubleshoot", label: "Troubleshooting", icon: AlertTriangle },
]

const extrasTable = [
  { type: "Wide", code: "Wd", runs: "1 extra run + any runs scored", ballCount: "Does NOT count as a legal ball", example: "Bowler bowls wide, batsman swings and gets 2 byes → Total extra = 3 (1 wide + 2 byes). Over still has same ball count.", button: "Click Wide button → immediately saved" },
  { type: "No Ball", code: "Nb", runs: "1 extra run + any runs scored", ballCount: "Does NOT count as a legal ball", example: "No ball hit for a six → Total extra = 7 (1 no-ball + 6 runs). Batsman gets 6 runs added to score. Over does NOT advance.", button: "Click No Ball button → immediately saved" },
  { type: "Bye", code: "{n}B", runs: "Batsman gets 1-4 runs", ballCount: "COUNTS as a legal ball", example: "Ball goes past keeper, batsmen run 3 → Scored as '3 Bye'. Click Bye → click 3. Over advances by 1 ball.", button: "Click Bye → panel opens → click 1/2/3/4" },
  { type: "Leg Bye", code: "{n}LB", runs: "Batsman gets 1-4 runs", ballCount: "COUNTS as a legal ball", example: "Ball hits batsman's pad, deflects to leg side, batsmen run 2 → Scored as '2 Leg Bye'. Click Leg Bye → click 2. Over advances.", button: "Click Leg Bye → panel opens → click 1/2/3/4" },
]

const wicketTypes = [
  { type: "Bowled", trigger: "Click Bowled → Confirm panel opens", fielder: "None needed", example: "Bowler bowls, ball hits stumps. Click Bowled → select who is out (striker) → Confirm OUT. Wicket added, runs = 0." },
  { type: "Caught", trigger: "Click Caught → Confirm panel opens", fielder: "Select fielder from dropdown", example: "Batsman hits in air, fielder catches. Click Caught → select who is out → select who caught it → Confirm OUT." },
  { type: "LBW", trigger: "Click LBW → Confirm panel opens", fielder: "None needed", example: "Ball hits pad in line with stumps. Click LBW → select who is out → Confirm OUT." },
  { type: "Stumped", trigger: "Click Stumped → Confirm panel opens", fielder: "Select fielder (keeper)", example: "Batsman steps out, keeper stumps. Click Stumped → select who is out → select keeper → Confirm OUT." },
  { type: "Run Out", trigger: "Click Run Out → Confirm panel opens", fielder: "Select fielder", example: "Direct hit at non-striker end. Click Run Out → select who is out → select fielder → Confirm OUT. Runs already scored stay." },
  { type: "Hit Wicket", trigger: "Click Hit Wicket → Confirm panel opens", fielder: "None needed", example: "Batsman steps on own stumps. Click Hit Wicket → select who is out → Confirm OUT." },
]

const scorecardExample = {
  batting: [
    { name: "Ahmed R.", r: 24, b: 18, "1s": 8, "2s": 4, "4s": 3, "6s": 1, sr: 133.3, dismissal: "Not Out" },
    { name: "Bilal K.*", r: 18, b: 14, "1s": 6, "2s": 2, "4s": 2, "6s": 1, sr: 128.6, dismissal: "c Farhan b Usman" },
    { name: "Usman A.", r: 5, b: 8, "1s": 3, "2s": 1, "4s": 0, "6s": 0, sr: 62.5, dismissal: "Not Out" },
  ],
  bowling: [
    { name: "Usman A.", o: 2, r: 14, w: 1, econ: 7.0, wd: 2, nb: 0 },
    { name: "Faisal M.", o: 2, r: 12, w: 0, econ: 6.0, wd: 0, nb: 1 },
  ],
}

const apiList = [
  { endpoint: "/api/health", method: "GET", auth: "Public", desc: "DB status, version, config" },
  { endpoint: "/api/teams", method: "GET/POST", auth: "Public/Admin", desc: "List or create teams" },
  { endpoint: "/api/players", method: "GET/POST", auth: "Public/Admin", desc: "List or create players" },
  { endpoint: "/api/matches", method: "GET/PATCH", auth: "Public/Admin", desc: "List or update matches" },
  { endpoint: "/api/matches/live", method: "GET", auth: "Public", desc: "Current live match" },
  { endpoint: "/api/search?q=", method: "GET", auth: "Public", desc: "Search everything" },
  { endpoint: "/api/head-to-head", method: "GET", auth: "Public", desc: "H2H team stats" },
  { endpoint: "/api/live/summary", method: "GET", auth: "Public", desc: "Full live match data" },
  { endpoint: "/api/live/balls", method: "POST", auth: "Admin", desc: "Submit a ball event" },
  { endpoint: "/api/live/balls/undo", method: "POST", auth: "Admin", desc: "Undo last ball" },
  { endpoint: "/api/admin/analytics", method: "GET", auth: "Admin", desc: "Analytics dashboard data" },
]

const envVars = [
  { name: "DATABASE_URL", required: true, desc: "Neon PostgreSQL connection string" },
  { name: "NEXTAUTH_SECRET", required: true, desc: "Random string for auth encryption" },
  { name: "NEXTAUTH_URL", required: true, desc: "https://green-stars-cricket-league.vercel.app" },
  { name: "ADMIN_PASSWORD", required: true, desc: "Password to log into /admin" },
  { name: "AUTH_GOOGLE_ID", required: false, desc: "Google OAuth client ID" },
  { name: "AUTH_GOOGLE_SECRET", required: false, desc: "Google OAuth client secret" },
]

const troubleshoot = [
  { problem: "Build fails", solution: "Run npx prisma generate, then npm run build" },
  { problem: "DB connection error", solution: "Check DATABASE_URL in .env.local, ensure Neon DB is awake" },
  { problem: "Admin login fails", solution: "Check ADMIN_PASSWORD env var in Vercel" },
  { problem: "Scoring not saving", solution: "Check network, refresh page, check browser console" },
  { problem: "Stats wrong after match", solution: "Go to /admin/performances, click Generate Stats for that match" },
  { problem: "Migration pending", solution: "Run npx prisma migrate deploy" },
  { problem: "Match stuck live", solution: "Go to /admin/matches, click Scorecard for that match" },
  { problem: "Player stats wrong", solution: "Go to /admin/players, click reset stats button next to player" },
]

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState("access")
  const [mobileNav, setMobileNav] = useState(false)
  const [expandedWicket, setExpandedWicket] = useState<string | null>(null)
  const [expandedExtra, setExpandedExtra] = useState<string | null>(null)

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
                <button key={id} onClick={() => scrollTo(id)}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    activeSection === id
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-md"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}>
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
            </div>
          </aside>

          {/* Mobile Nav Toggle */}
          <button onClick={() => setMobileNav(!mobileNav)}
            className="lg:hidden fixed bottom-6 right-6 z-50 bg-[var(--accent)] text-[var(--accent-foreground)] p-3 rounded-full shadow-lg">
            {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Mobile Nav Drawer */}
          {mobileNav && (
            <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileNav(false)}>
              <div className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-[var(--card)] p-4 shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Navigation</p>
                <div className="space-y-1">
                  {sections.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => scrollTo(id)}
                      className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        activeSection === id ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                      }`}>
                      <Icon className="h-4 w-4" />{label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================= MAIN CONTENT ======================= */}
          <main className="flex-1 min-w-0 space-y-16">

            {/* ===== HERO ===== */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gscl-dark via-gscl to-gscl-light p-8 md:p-12 text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gscl-gold/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <img src="/images/optimized/gscl-logo.webp" alt="GSCL" className="h-12 w-12 rounded-full border-2 border-white/20" />
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold">GSCL Admin Guide</h1>
                    <span className="inline-block mt-1 rounded-full bg-gscl-gold/20 px-3 py-0.5 text-xs font-semibold text-gscl-gold">v1.0.1 — T4 Edition</span>
                  </div>
                </div>
                <p className="mt-4 max-w-xl text-white/70 text-lg">
                  Complete guide to running the Green Stars Cricket League. Step-by-step instructions with examples for every admin feature.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="https://green-stars-cricket-league.vercel.app/admin" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium hover:bg-white/20 transition-colors backdrop-blur-sm">
                    <ExternalLink className="h-4 w-4" /> Open Admin Panel
                  </a>
                  <a href="https://green-stars-cricket-league.vercel.app" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium hover:bg-white/20 transition-colors backdrop-blur-sm">
                    <Globe className="h-4 w-4" /> View Live Site
                  </a>
                </div>
              </div>
            </section>

            {/* ===== ADMIN ACCESS ===== */}
            <section id="access">
              <SH icon={Shield} title="Admin Panel Access" />
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-500/10">
                    <Lock className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">Password Protected</p>
                    <p className="text-sm text-[var(--muted-foreground)]">Stored in ADMIN_PASSWORD environment variable</p>
                  </div>
                </div>
                <div className="rounded-lg bg-[var(--muted)] p-4">
                  <p className="text-xs text-[var(--muted-foreground)] mb-1">Production URL</p>
                  <a href="https://green-stars-cricket-league.vercel.app/admin" target="_blank" rel="noopener noreferrer"
                    className="font-mono text-sm text-[var(--accent)] hover:underline">
                    https://green-stars-cricket-league.vercel.app/admin
                  </a>
                </div>
                <div className="mt-4 rounded-lg bg-blue-500/5 border border-blue-500/20 p-4 text-sm text-[var(--muted-foreground)]">
                  <strong className="text-[var(--foreground)]">How to login:</strong> Go to /admin → enter the admin password → click Login. You will see the admin dashboard with all management tools.
                </div>
              </Card>
            </section>

            {/* ===== LEAGUE SETUP ===== */}
            <section id="setup">
              <SH icon={Trophy} title="League Setup (Do This First)" />

              <Card>
                <Step n={1} title="Create a Season">
                  <p>Go to <Code>/admin/seasons</Code></p>
                  <p>Enter Season Name (e.g. &quot;Season 1&quot;) and Year (e.g. 2025)</p>
                  <p>Click <strong>Add Season</strong></p>
                  <Example>Season Name: &quot;Season 1&quot; → Year: 2025 → Add Season</Example>
                </Step>
                <Step n={2} title="Add Teams">
                  <p>Go to <Code>/admin/teams</Code></p>
                  <p>Fill in: Team Name, Short Name (max 5 chars), Team Color (color picker), select the Season</p>
                  <p>Click <strong>Add Team</strong> for each team</p>
                  <Example>
                    Team Name: &quot;Green Stars&quot; → Short Name: &quot;GSS&quot; → Color: #1e3a5f → Season: Season 1<br/>
                    Team Name: &quot;Lahore Eagles&quot; → Short Name: &quot;LHE&quot; → Color: #c0392b → Season: Season 1
                  </Example>
                </Step>
                <Step n={3} title="Add Players to Each Team">
                  <p>Go to <Code>/admin/players</Code></p>
                  <p>Fill in: Player Name, Role, Batting Style, Bowling Style, select Team</p>
                  <p>Check &quot;Captain&quot; checkbox if this player is team captain</p>
                  <p>Click <strong>Add Player</strong></p>
                  <Example>
                    Player Name: &quot;Ahmed Raza&quot; → Role: Batsman → Batting: Right-handed → Bowling: Right-arm off break → Team: Green Stars → Captain ✓ → Add Player
                  </Example>
                  <Roles>
                    <li><strong>Batsman</strong> — Primary batter</li>
                    <li><strong>Bowler</strong> — Primary bowler</li>
                    <li><strong>All-rounder</strong> — Can bat and bowl</li>
                    <li><strong>Wicket-keeper</strong> — Keeper + batsman</li>
                  </Roles>
                </Step>
                <Step n={4} title="Lock Predictions (When Schedule is Ready)">
                  <p>Go to <Code>/admin/seasons</Code></p>
                  <p>Click <strong>Lock Predictions (Announce Schedule)</strong> button</p>
                  <p>After this, users can only view predictions, not submit new ones</p>
                </Step>
              </Card>
            </section>

            {/* ===== ALL ADMIN PAGES ===== */}
            <section id="pages">
              <SH icon={LayoutDashboard} title="All Admin Pages" />
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { name: "Dashboard", url: "/admin", desc: "Overview — all counts, quick links", icon: LayoutDashboard, hot: false },
                  { name: "Teams", url: "/admin/teams", desc: "Add/edit/delete teams with colors", icon: Users, hot: false },
                  { name: "Players", url: "/admin/players", desc: "Add/edit/delete players per team", icon: UserCheck, hot: false },
                  { name: "Seasons", url: "/admin/seasons", desc: "Create seasons, lock predictions", icon: Trophy, hot: false },
                  { name: "Matches", url: "/admin/matches", desc: "Create/schedule matches", icon: Calendar, hot: true },
                  { name: "Live Scoring", url: "/admin/live-scoring/{ID}", desc: "Ball-by-ball scoring panel", icon: Play, hot: true },
                  { name: "Performances", url: "/admin/performances", desc: "View scorecards, generate stats", icon: Award, hot: false },
                  { name: "Squad", url: "/admin/squad", desc: "Set playing XI per match", icon: Users, hot: false },
                  { name: "News", url: "/admin/news", desc: "Publish articles", icon: Newspaper, hot: false },
                  { name: "Gallery", url: "/admin/gallery", desc: "Upload photos", icon: Image, hot: false },
                  { name: "Sponsors", url: "/admin/sponsors", desc: "Manage sponsors", icon: Star, hot: false },
                  { name: "Quiz", url: "/admin/quiz", desc: "Create match quizzes", icon: Brain, hot: false },
                  { name: "POTM", url: "/admin/potm", desc: "Man of the Match voting", icon: Award, hot: false },
                  { name: "Predictions", url: "/admin/predictions", desc: "View/lock predictions", icon: Target, hot: false },
                  { name: "Moments", url: "/admin/moments", desc: "Moment of the Day", icon: Star, hot: false },
                  { name: "Notifications", url: "/admin/notifications", desc: "Push notifications", icon: Bell, hot: false },
                  { name: "Reviews", url: "/admin/reviews", desc: "Approve/reject reviews", icon: MessageSquare, hot: false },
                  { name: "Penalties", url: "/admin/penalties", desc: "Team penalties & deductions", icon: Shield, hot: false },
                  { name: "Season Awards", url: "/admin/awards", desc: "Awards + auto-generate ceremony", icon: Trophy, hot: false },
                  { name: "Fair Play", url: "/admin/fair-play", desc: "Warnings, sportsmanship, FP points", icon: Handshake, hot: false },
                  { name: "Contact", url: "/admin/contact", desc: "Contact form messages", icon: MessageSquare, hot: false },
                  { name: "Analytics", url: "/admin/analytics", desc: "Usage metrics & trends", icon: BarChart3, hot: true },
                ].map((p) => (
                  <div key={p.name}
                    className={`flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-md ${
                      p.hot ? "border-[var(--accent)]/30 bg-[var(--accent)]/5" : "border-[var(--border)] bg-[var(--card)]"
                    }`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      p.hot ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    }`}>
                      <p.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-[var(--foreground)] truncate">{p.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">{p.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]/50" />
                  </div>
                ))}
              </div>
            </section>

            {/* ===== MATCH DAY WORKFLOW ===== */}
            <section id="matchday">
              <SH icon={Calendar} title="Match Day Workflow" />

              {/* CREATE MATCH */}
              <Card>
                <Step n={1} title="Create the Match">
                  <p>Go to <Code>/admin/matches</Code> → click <strong>Add Match</strong></p>
                  <div className="rounded-lg bg-[var(--muted)] p-3 text-sm space-y-1">
                    <p><strong>Fields to fill:</strong></p>
                    <li><strong>Season</strong> → Select &quot;Season 1&quot;</li>
                    <li><strong>Date</strong> → Pick date &amp; time (e.g. 2025-08-01 18:00)</li>
                    <li><strong>Team 1</strong> → Green Stars</li>
                    <li><strong>Team 2</strong> → Lahore Eagles</li>
                    <li><strong>Match Number</strong> → 1 (or leave empty for auto)</li>
                    <li><strong>Stage</strong> → League (or Qualifier 1, Eliminator, Final)</li>
                    <li><strong>Venue</strong> → Main Stadium (default)</li>
                    <li><strong>YouTube URL</strong> → (optional live stream link)</li>
                    <li><strong>Status</strong> → Upcoming</li>
                  </div>
                  <p className="mt-2">Click <strong>Add Match</strong>. Match appears in the list.</p>
                </Step>

                <Step n={2} title="Set Squad (Playing XI)">
                  <p>Go to <Code>/admin/squad</Code></p>
                  <p>Select the match from dropdown</p>
                  <p>Add players one by one using the player dropdown</p>
                  <Example>
                    Match: Match 1: GSS vs LHE<br/>
                    Add: Ahmed Raza (GSS) → Add Player<br/>
                    Add: Bilal Khan (GSS) → Add Player<br/>
                    ... add all 11 for both teams
                  </Example>
                </Step>

                <Step n={3} title="Go Live">
                  <p>Go to <Code>/admin/matches</Code></p>
                  <p>Find your match → click <strong>Set Live</strong> (red button)</p>
                  <p>Now click <strong>Live Scoring</strong> to open the scoring panel</p>
                </Step>
              </Card>
            </section>

            {/* ===== LIVE SCORING GUIDE ===== */}
            <section id="scoring">
              <SH icon={Target} title="Live Scoring — Step by Step" />

              <Card>
                <Step n={1} title="Set the Toss">
                  <p>When you first open the scoring panel, you will see the <strong>TOSS</strong> section (yellow box).</p>
                  <div className="rounded-lg bg-[var(--muted)] p-3 text-sm space-y-1">
                    <li><strong>Toss Winner</strong> → Select the team that won the toss (dropdown)</li>
                    <li><strong>Decision</strong> → Bat First or Bowl First (dropdown, enabled after winner selected)</li>
                  </div>
                  <p>Click <strong>Set Toss</strong>. Now the batting/bowling teams are set automatically.</p>
                  <Example>
                    Toss Winner: Green Stars → Decision: Bat First<br/>
                    → Green Stars = Batting team, Lahore Eagles = Bowling team
                  </Example>
                </Step>

                <Step n={2} title="Select Players">
                  <p>Below the toss section, you will see 3 dropdowns:</p>
                  <div className="rounded-lg bg-[var(--muted)] p-3 text-sm space-y-1">
                    <li><strong>Bowler</strong> → Select from bowling team players (sorted by role, bowlers first)</li>
                    <li><strong>Striker</strong> → Select the batsman on strike</li>
                    <li><strong>Non-Striker</strong> → Select the batsman at non-striker end</li>
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">Bowling dropdown shows overs bowled next to each name. A bowler who bowled the last over or reached max overs (2) is disabled.</p>
                  <Example>
                    Bowler: Usman A. (0.0 ov)<br/>
                    Striker: Ahmed Raza<br/>
                    Non-Striker: Bilal Khan
                  </Example>
                </Step>

                <Step n={3} title="Score a Normal Ball (Runs)">
                  <p>Click a <strong>RUNS</strong> button to score runs for the current ball:</p>
                  <div className="flex flex-wrap gap-2 my-3">
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-gray-500/10 text-sm font-bold">0</span>
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-bold">1</span>
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-bold">2</span>
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-bold">3</span>
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-pink-500/10 text-pink-500 text-sm font-bold">4</span>
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-red-500/10 text-red-500 text-sm font-bold">6</span>
                  </div>
                  <div className="rounded-lg bg-[var(--muted)] p-3 text-sm space-y-1">
                    <li><strong>0</strong> → Dot ball, no run. Over advances by 1 ball.</li>
                    <li><strong>1</strong> → 1 run. Strike rotates (striker becomes non-striker).</li>
                    <li><strong>2</strong> → 2 runs. Strike stays (odd = rotate, even = stay).</li>
                    <li><strong>3</strong> → 3 runs. Strike rotates.</li>
                    <li><strong>4</strong> → Boundary! 4 runs. Ball counted but no rotation.</li>
                    <li><strong>6</strong> → Six! 6 runs. Ball counted but no rotation.</li>
                  </div>
                  <Example>
                    Ball 1: Click 1 → Score: 0/0 (1.1 ov) → Striker rotates<br/>
                    Ball 2: Click 4 → Score: 4/0 (1.2 ov) → No rotation<br/>
                    Ball 3: Click 0 → Score: 4/0 (1.3 ov) → Dot ball
                  </Example>
                </Step>

                <Step n={4} title="Mark Shot Region (Optional)">
                  <p>Before or after scoring runs, you can mark where the shot went by clicking the <strong>FIELD</strong> diagram.</p>
                  <p>Click any position on the SVG field diagram, or use the region buttons below it:</p>
                  <div className="flex flex-wrap gap-1.5 my-2">
                    {["Off","Cover","Mid Off","Mid On","Leg","Fine Leg","Square Leg","Mid Wkt","Long On","Long Off","Third","Point","Gully","Slip","Straight"].map(r => (
                      <span key={r} className="inline-block rounded bg-[var(--muted)] px-2 py-1 text-xs text-[var(--muted-foreground)]">{r}</span>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">This is optional — ball is saved even without a region.</p>
                </Step>
              </Card>
            </section>

            {/* ===== EXTRAS & RULES ===== */}
            <section id="extras">
              <SH icon={Zap} title="Extras — Complete Reference" />
              <p className="text-sm text-[var(--muted-foreground)] mb-4">Extras are runs NOT scored by the batsman. Click each extra type to see full details and examples.</p>

              <div className="space-y-3">
                {extrasTable.map((e) => (
                  <div key={e.type} className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                    <button onClick={() => setExpandedExtra(expandedExtra === e.type ? null : e.type)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--muted)]/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-[var(--muted)] text-xs font-mono font-bold text-[var(--foreground)]">{e.code}</span>
                        <div>
                          <p className="font-semibold text-[var(--foreground)]">{e.type}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{e.runs}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${e.ballCount.includes("NOT") ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-green-500/10 text-green-600 dark:text-green-400"}`}>
                          {e.ballCount.includes("NOT") ? "No Ball Count" : "Counts as Ball"}
                        </span>
                        {expandedExtra === e.type ? <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)]" /> : <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />}
                      </div>
                    </button>
                    {expandedExtra === e.type && (
                      <div className="border-t border-[var(--border)] p-4 space-y-3 bg-[var(--muted)]/30">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-lg bg-[var(--muted)] p-3">
                            <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-1">How it&apos;s scored</p>
                            <p className="text-sm text-[var(--foreground)]">{e.runs}</p>
                          </div>
                          <div className="rounded-lg bg-[var(--muted)] p-3">
                            <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-1">Ball count effect</p>
                            <p className="text-sm text-[var(--foreground)]">{e.ballCount}</p>
                          </div>
                        </div>
                        <div className="rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20 p-3">
                          <p className="text-xs font-semibold text-[var(--accent)] mb-1">How to score it</p>
                          <p className="text-sm text-[var(--foreground)]">{e.button}</p>
                        </div>
                        <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Example</p>
                          <p className="text-sm text-[var(--foreground)]">{e.example}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Extras Quick Table */}
              <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                        <th className="px-4 py-3 text-left font-semibold">Extra</th>
                        <th className="px-4 py-3 text-left font-semibold">Code</th>
                        <th className="px-4 py-3 text-left font-semibold">Extra Runs</th>
                        <th className="px-4 py-3 text-left font-semibold">Legal Ball?</th>
                        <th className="px-4 py-3 text-left font-semibold">Strike Rotate?</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[var(--border)]"><td className="px-4 py-2.5 font-medium">Wide</td><td className="px-4 py-2.5 font-mono text-xs">Wd</td><td className="px-4 py-2.5">1 + any scored</td><td className="px-4 py-2.5"><span className="text-red-500 font-semibold">No</span></td><td className="px-4 py-2.5">No</td></tr>
                      <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50"><td className="px-4 py-2.5 font-medium">No Ball</td><td className="px-4 py-2.5 font-mono text-xs">Nb</td><td className="px-4 py-2.5">1 + any scored</td><td className="px-4 py-2.5"><span className="text-red-500 font-semibold">No</span></td><td className="px-4 py-2.5">No</td></tr>
                      <tr className="border-b border-[var(--border)]"><td className="px-4 py-2.5 font-medium">Bye</td><td className="px-4 py-2.5 font-mono text-xs">{`{n}B`}</td><td className="px-4 py-2.5">1-4 runs</td><td className="px-4 py-2.5"><span className="text-green-500 font-semibold">Yes</span></td><td className="px-4 py-2.5">Yes</td></tr>
                      <tr><td className="px-4 py-2.5 font-medium">Leg Bye</td><td className="px-4 py-2.5 font-mono text-xs">{`{n}LB`}</td><td className="px-4 py-2.5">1-4 runs</td><td className="px-4 py-2.5"><span className="text-green-500 font-semibold">Yes</span></td><td className="px-4 py-2.5">Yes</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <Card className="mt-6">
                <h3 className="font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-[var(--accent)]" /> Important Rules
                </h3>
                <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                  <li><strong>Wide / No Ball:</strong> Ball is re-bowled. The over does NOT advance. Batsman cannot be out (except run out).</li>
                  <li><strong>Bye / Leg Bye:</strong> Ball counts as a legal delivery. Over advances by 1. If batsmen run 3, click Bye → 3.</li>
                  <li><strong>Multiple extras on one ball:</strong> If it&apos;s a no-ball and batsmen run 2 + 1 bye = total 4 extra runs. Score the no-ball (1) + runs (2) + bye (1) separately.</li>
                  <li><strong>No-ball + caught:</strong> If no-ball is called and batsman is caught, it&apos;s NOT out. Just 1 no-ball run + any runs scored.</li>
                </div>
              </Card>
            </section>

            {/* ===== WICKET TYPES ===== */}
            <section id="wickets">
              <SH icon={AlertTriangle} title="Wicket Types — How to Score" />

              <Card>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">Click a wicket type to see the full scoring process:</p>
                <div className="space-y-2">
                  {wicketTypes.map((w) => (
                    <div key={w.type} className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                      <button onClick={() => setExpandedWicket(expandedWicket === w.type ? null : w.type)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--muted)]/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-purple-500/10 text-xs font-bold text-purple-600 dark:text-purple-400">W</span>
                          <div>
                            <p className="font-semibold text-[var(--foreground)]">{w.type}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">{w.trigger}</p>
                          </div>
                        </div>
                        {expandedWicket === w.type ? <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)]" /> : <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />}
                      </button>
                      {expandedWicket === w.type && (
                        <div className="border-t border-[var(--border)] p-4 space-y-3 bg-[var(--muted)]/30">
                          <div className="rounded-lg bg-[var(--muted)] p-3">
                            <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-1">Fielder needed?</p>
                            <p className="text-sm text-[var(--foreground)]">{w.fielder}</p>
                          </div>
                          <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Step-by-step example</p>
                            <p className="text-sm text-[var(--foreground)]">{w.example}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-lg bg-purple-500/5 border border-purple-500/20 p-4 text-sm">
                  <p className="font-semibold text-purple-600 dark:text-purple-400 mb-2">General Wicket Process</p>
                  <ol className="space-y-1 text-[var(--muted-foreground)]">
                    <li>1. Click the wicket type button (purple buttons at bottom)</li>
                    <li>2. Purple confirmation panel opens: &quot;WICKET: CAUGHT&quot;</li>
                    <li>3. Select who is out (dropdown shows all batting players)</li>
                    <li>4. For caught/stumped/run out: select the fielder from dropdown</li>
                    <li>5. Click <strong>Confirm OUT</strong> (purple button)</li>
                    <li>6. Ball is saved with runs=0 + wicket info</li>
                  </ol>
                </div>
              </Card>
            </section>

            {/* ===== ENDING A MATCH ===== */}
            <section id="endmatch">
              <SH icon={Flag} title="Ending a Match" />

              <Card>
                <Step n={1} title="Innings Break (Between Innings)">
                  <p>After the first innings finishes (4 overs done or 10 wickets), click <strong>Start Innings Break</strong>.</p>
                  <p>The button turns amber and shows &quot;INNINGS BREAK — Tap to Resume&quot;.</p>
                  <p>When the second innings is ready to start, click it again to resume.</p>
                </Step>

                <Step n={2} title="End the Match">
                  <p>After the second innings finishes, click the <strong>End Match</strong> button (red) at the bottom.</p>
                  <p>A red confirmation panel appears:</p>
                  <div className="rounded-lg bg-[var(--muted)] p-3 text-sm space-y-1">
                    <li>Select <strong>Winner</strong> (or leave empty for tie)</li>
                    <li>Enter <strong>Result text</strong> (e.g. &quot;Green Stars won by 5 runs&quot;)</li>
                    <li>Select <strong>Man of the Match</strong></li>
                  </div>

                  <div className="mt-3 rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 text-sm">
                    <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">Super Over (Tied Matches)</p>
                    <p className="text-[var(--muted-foreground)]">If both innings are played and scores are equal, a Super Over section appears. Enter:</p>
                    <li>Team 1 Super Over runs + wickets</li>
                    <li>Team 2 Super Over runs + wickets</li>
                  </div>

                  <p className="mt-2">Click <strong>Yes, End Match</strong>. The system will:</p>
                  <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3 text-sm space-y-1 text-[var(--muted-foreground)]">
                    <li>Calculate final result and winner</li>
                    <li>Save all innings totals and scores</li>
                    <li>Generate player performances (batting + bowling stats)</li>
                    <li>Update points table automatically</li>
                    <li>Mark match as completed</li>
                    <li>Redirect to /admin/matches</li>
                  </div>
                </Step>
              </Card>
            </section>

            {/* ===== AFTER THE MATCH ===== */}
            <section id="aftermatch">
              <SH icon={Award} title="After the Match" />

              <Card>
                <Step n={1} title="View Scorecard">
                  <p>Go to <Code>/admin/performances</Code></p>
                  <p>Select the match from the button bar at the top</p>
                  <p>You will see the full detailed scorecard with:</p>
                  <div className="rounded-lg bg-[var(--muted)] p-3 text-sm space-y-1">
                    <li><strong>Batting:</strong> Batsman | R | B | 1s | 2s | 4s | 6s | SR | Dismissal</li>
                    <li><strong>Bowling:</strong> Bowler | O | R | W | Econ | Wd | Nb</li>
                    <li><strong>Fielding:</strong> Fielder | Catches | Stumpings | Run Outs</li>
                    <li><strong>Ball-by-Ball:</strong> Color-coded balls grouped by over</li>
                    <li><strong>Partnership:</strong> Partnership card with runs per partnership</li>
                  </div>
                </Step>

                <Step n={2} title="Generate Stats (If Needed)">
                  <p>If stats look wrong, click <strong>Generate Stats</strong> button on the scorecard page.</p>
                  <p>This recalculates all batting, bowling, and fielding stats for the match.</p>
                </Step>

                <Step n={3} title="Set Man of the Match (POTM)">
                  <p>Go to <Code>/admin/potm</Code></p>
                  <p>Find the match and expand it</p>
                  <p>See vote breakdown with progress bars</p>
                  <p>Click <strong>Set Official MOTM</strong> next to the chosen player</p>
                  <Example>
                    Votes: Ahmed Raza (12 votes, 40%) → Bilal Khan (8 votes, 27%) → Usman A. (5 votes, 17%)<br/>
                    Click Ahmed Raza → MOTM set → shown as Trophy icon on match card
                  </Example>
                </Step>

                <Step n={4} title="Check Points Table">
                  <p>Go to <Code>/points-table</Code> on the public site</p>
                  <p>Points table updates automatically based on match results:</p>
                  <div className="rounded-lg bg-[var(--muted)] p-3 text-sm space-y-1">
                    <li><strong>Win:</strong> 2 points</li>
                    <li><strong>Tie:</strong> 1 point</li>
                    <li><strong>No Result:</strong> 1 point</li>
                    <li><strong>Loss:</strong> 0 points</li>
                    <li><strong>NRR:</strong> Net Run Rate calculated automatically</li>
                  </div>
                </Step>
              </Card>
            </section>

            {/* ===== ANALYTICS ===== */}
            <section id="analytics">
              <SH icon={BarChart3} title="Analytics Dashboard" />
              <Card>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  Go to <Code>/admin/analytics</Code> to see how your website is being used.
                </p>

                <h4 className="font-semibold text-[var(--foreground)] mb-2">KPI Cards (Top Row)</h4>
                <div className="rounded-lg bg-[var(--muted)] p-3 text-sm space-y-1 mb-4">
                  <li><strong>Matches Scored</strong> — Total balls submitted this month</li>
                  <li><strong>Matches Completed</strong> — Matches ended this month</li>
                  <li><strong>Undo Used</strong> — How many times undo was clicked</li>
                  <li><strong>Page Views</strong> — Total page views this month</li>
                  <li><strong>Searches</strong> — Search queries this month</li>
                  <li><strong>Predictions</strong> — Total predictions submitted</li>
                  <li><strong>Quiz Attempts</strong> — Total quiz submissions</li>
                  <li><strong>POTM Votes</strong> — Total POTM votes</li>
                </div>

                <h4 className="font-semibold text-[var(--foreground)] mb-2">Trend Charts (Last 30 Days)</h4>
                <div className="rounded-lg bg-[var(--muted)] p-3 text-sm space-y-1 mb-4">
                  <li><strong>Matches</strong> — Green bars showing matches per day</li>
                  <li><strong>Page Views</strong> — Blue bars showing traffic per day</li>
                  <li><strong>Undo Usage</strong> — Amber bars showing undo frequency</li>
                  <li><strong>Searches</strong> — Purple bars showing search activity</li>
                </div>

                <h4 className="font-semibold text-[var(--foreground)] mb-2">Top Lists</h4>
                <div className="rounded-lg bg-[var(--muted)] p-3 text-sm space-y-1">
                  <li><strong>Top Search Terms</strong> — What users are searching for (e.g. &quot;ahmed&quot;, &quot;schedule&quot;)</li>
                  <li><strong>Most Visited Pages</strong> — Which pages get the most traffic</li>
                  <li><strong>Recent Events</strong> — Last 20 events with timestamps and metadata</li>
                </div>
              </Card>
            </section>

            {/* ===== API ENDPOINTS ===== */}
            <section id="api">
              <SH icon={Server} title="API Endpoints" />
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                        <th className="px-4 py-3 text-left font-semibold">Endpoint</th>
                        <th className="px-4 py-3 text-left font-semibold">Method</th>
                        <th className="px-4 py-3 text-left font-semibold">Auth</th>
                        <th className="px-4 py-3 text-left font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiList.map((a, i) => (
                        <tr key={a.endpoint} className={`border-b border-[var(--border)] last:border-0 ${i % 2 !== 0 ? "bg-[var(--muted)]/50" : ""}`}>
                          <td className="px-4 py-2.5 font-mono text-xs text-[var(--accent)]">{a.endpoint}</td>
                          <td className="px-4 py-2.5"><span className={`rounded px-1.5 py-0.5 text-xs font-bold ${a.method.includes("POST") ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-green-500/10 text-green-600 dark:text-green-400"}`}>{a.method}</span></td>
                          <td className="px-4 py-2.5"><span className={`rounded px-1.5 py-0.5 text-xs ${a.auth.includes("Admin") ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-gray-500/10 text-[var(--muted-foreground)]"}`}>{a.auth}</span></td>
                          <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{a.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ===== ENVIRONMENT ===== */}
            <section id="env">
              <SH icon={Lock} title="Environment Variables" />
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                        <th className="px-4 py-3 text-left font-semibold">Variable</th>
                        <th className="px-4 py-3 text-left font-semibold">Required</th>
                        <th className="px-4 py-3 text-left font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {envVars.map((v, i) => (
                        <tr key={v.name} className={`border-b border-[var(--border)] last:border-0 ${i % 2 !== 0 ? "bg-[var(--muted)]/50" : ""}`}>
                          <td className="px-4 py-2.5 font-mono text-xs text-[var(--accent)]">{v.name}</td>
                          <td className="px-4 py-2.5"><span className={`rounded px-1.5 py-0.5 text-xs font-bold ${v.required ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-gray-500/10 text-[var(--muted-foreground)]"}`}>{v.required ? "Yes" : "No"}</span></td>
                          <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{v.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ===== TROUBLESHOOTING ===== */}
            <section id="troubleshoot">
              <SH icon={AlertTriangle} title="Troubleshooting" />
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                        <th className="px-4 py-3 text-left font-semibold">Problem</th>
                        <th className="px-4 py-3 text-left font-semibold">Solution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {troubleshoot.map((t, i) => (
                        <tr key={t.problem} className={`border-b border-[var(--border)] last:border-0 ${i % 2 !== 0 ? "bg-[var(--muted)]/50" : ""}`}>
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
            <div className="text-center py-8 text-sm text-[var(--muted-foreground)] border-t border-[var(--border)]">
              <p className="font-semibold">GSCL v1.0.1 — Green Stars Cricket League</p>
              <p className="mt-1">Built with care for Season 1</p>
            </div>

          </main>
        </div>
      </div>
    </div>
  )
}

/* ============ REUSABLE COMPONENTS ============ */

function SH({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10">
        <Icon className="h-5 w-5 text-[var(--accent)]" />
      </div>
      <h2 className="text-xl font-bold text-[var(--foreground)]">{title}</h2>
    </div>
  )
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4 ${className}`}>{children}</div>
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold">{n}</div>
        <h3 className="font-bold text-[var(--foreground)]">{title}</h3>
      </div>
      <div className="space-y-2 text-sm text-[var(--muted-foreground)]">{children}</div>
    </div>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-xs font-mono text-[var(--accent)]">{children}</code>
}

function Example({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3 text-sm">
      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Example</p>
      <div className="text-[var(--foreground)]">{children}</div>
    </div>
  )
}

function Roles({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-[var(--muted)] p-3 text-sm space-y-1">
      <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-1">Player Roles:</p>
      <ul className="text-[var(--muted-foreground)]">{children}</ul>
    </div>
  )
}
