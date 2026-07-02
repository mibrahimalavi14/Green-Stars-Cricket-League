import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { MatchCard } from "@/components/MatchCard"
import { TeamCard } from "@/components/TeamCard"
import { NewsCard } from "@/components/NewsCard"
import { PointsTable } from "@/components/PointsTable"
import { Youtube, Trophy, Users, Calendar } from "lucide-react"

async function HomePage() {
  const [season, matches, teams, news, stats] = await Promise.all([
    prisma.season.findFirst({ where: { isActive: true } }),
    prisma.match.findMany({
      take: 4,
      orderBy: { date: "asc" },
      include: { team1: true, team2: true },
    }),
    prisma.team.findMany({ take: 6, include: { players: true } }),
    prisma.news.findMany({ where: { published: true }, take: 3, orderBy: { createdAt: "desc" } }),
    prisma.team.findMany({ include: { _count: { select: { players: true } } } }),
  ])

  const teamCount = stats.length
  const playerCount = stats.reduce((a, b) => a + b._count.players, 0)
  const matchCount = await prisma.match.count()

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-gscl-dark via-gscl to-gscl-light py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gscl-gold/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <h1 className="mb-4 text-5xl font-bold text-white md:text-7xl">
            Green Stars <span className="text-gscl-gold">Cricket League</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/80">
            {season?.name || "Welcome to the most exciting cricket league"} — Where champions rise and legends are made.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/fixtures" className="rounded-lg bg-gscl-gold px-6 py-3 font-semibold text-gscl-dark transition-opacity hover:opacity-90">
              View Fixtures
            </Link>
            <Link href="/live" className="rounded-lg border border-white/30 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10">
              Live Scores
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-[var(--card)] py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Teams", value: teamCount, icon: Users },
              { label: "Players", value: playerCount, icon: Trophy },
              { label: "Matches", value: matchCount, icon: Calendar },
              { label: "Season", value: season?.year || 2026, icon: Trophy },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-[var(--muted)] p-4 text-center">
                <s.icon className="mx-auto mb-1 h-5 w-5 text-[var(--accent)]" />
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {matches.length > 0 && (
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Upcoming Matches</h2>
              <Link href="/fixtures" className="text-sm text-[var(--accent)] hover:underline">View All</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {matches.map((m) => (
                <MatchCard key={m.id} match={m as never} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-[var(--border)] bg-[var(--card)] py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Teams</h2>
            <Link href="/teams" className="text-sm text-[var(--accent)] hover:underline">View All</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {teams.map((t) => (
              <TeamCard key={t.id} team={t as never} />
            ))}
          </div>
        </div>
      </section>

      {(await prisma.team.findMany()).length > 0 && (
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Points Table</h2>
              <Link href="/points-table" className="text-sm text-[var(--accent)] hover:underline">Full Table</Link>
            </div>
            <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
              <PointsTable minimal />
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-[var(--border)] bg-[var(--card)] py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Latest News</h2>
            <Link href="/news" className="text-sm text-[var(--accent)] hover:underline">View All</Link>
          </div>
          {news.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {news.map((n) => (
                <NewsCard key={n.id} news={n as never} />
              ))}
            </div>
          ) : (
            <p className="text-center text-[var(--muted-foreground)]">No news yet. Stay tuned!</p>
          )}
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <Youtube className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-2xl font-bold">Live on YouTube</h2>
          <p className="mb-6 text-[var(--muted-foreground)]">Watch all matches live on our YouTube channel</p>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Youtube className="h-5 w-5" /> Subscribe to GSCL
          </a>
        </div>
      </section>
    </>
  )
}

export default HomePage
