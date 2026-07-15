import Link from "next/link"
import { prisma } from "@/lib/prisma"

import { MatchCard } from "@/components/MatchCard"
import { TeamCard } from "@/components/TeamCard"
import { NewsCard } from "@/components/NewsCard"
import { StarRating } from "@/components/StarRating"
import { Youtube, Trophy, Users, Calendar, MapPin, Award } from "lucide-react"

export const revalidate = 30

async function HomePage() {
  const season = await prisma.season.findFirst({ where: { isActive: true } })
  const [matches, teams, news, winners, matchCount, allTeams, players] = await Promise.all([
    prisma.match.findMany({
      take: 6,
      where: { status: { not: "completed" } },
      orderBy: { date: "asc" },
      include: { team1: true, team2: true },
    }),
    prisma.team.findMany({ take: 6, include: { players: true } }),
    prisma.news.findMany({ where: { published: true }, take: 3, orderBy: { createdAt: "desc" } }),
    prisma.season.findMany({
      where: { winnerId: { not: "" } },
      include: { teams: true },
      orderBy: { year: "desc" },
    }),
    prisma.match.count(),
    prisma.team.findMany({ include: { _count: { select: { players: true } } } }),
    season ? prisma.player.findMany({ where: { team: { seasonId: season.id } }, include: { team: true } }) : Promise.resolve([]),
  ])

  const teamCount = allTeams.length
  const playerCount = allTeams.reduce((a, b) => a + b._count.players, 0)

  return (
    <>
      <section className="relative flex min-h-[70vh] w-full items-center justify-center overflow-hidden">
        <img src="/images/teams/Banner.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {[
              { label: "Teams", value: teamCount, icon: Users },
              { label: "Players", value: playerCount, icon: Trophy },
              { label: "Matches", value: matchCount, icon: Calendar },
              { label: "Season", value: season?.year || 2026, icon: Trophy },
              { label: "Founded", value: "Lahore", icon: MapPin },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-[var(--muted)] p-4 text-center">
                <s.icon className="mx-auto mb-1 h-5 w-5 text-[var(--accent)]" />
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{s.label}</div>
              </div>
            ))}
          </div>

          {winners.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 rounded-lg bg-[var(--muted)] p-4">
              <Award className="h-5 w-5 text-gscl-gold" />
              {winners.map((w) => {
                const winnerTeam = w.teams.find(t => t.id === w.winnerId)
                return (
                  <span key={w.id} className="flex items-center gap-1.5 text-sm">
                    <span className="font-semibold">{w.name}</span>: 
                    {winnerTeam?.logo && <img src={winnerTeam.logo} alt="" className="h-5 w-5 rounded-full object-cover" />}
                    {winnerTeam?.name || w.winnerId}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {players.length > 0 && (
        <section className="border-t border-[var(--border)] py-10">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Tournament Leaders</h2>
              <Link href="/players/stats" className="text-sm text-[var(--accent)] hover:underline">Full Stats</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {(() => {
                const tR = players.filter(p => p.runs > 0).sort((a, b) => b.runs - a.runs)[0]
                const tW = players.filter(p => p.wickets > 0).sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)[0]
                const m6 = players.filter(p => p.sixes > 0).sort((a, b) => b.sixes - a.sixes)[0]
                const sR = players.filter(p => p.ballsFaced >= 10).sort((a, b) => (b.runs / b.ballsFaced) - (a.runs / a.ballsFaced))[0]
                const aR = players.filter(p => p.runs >= 20 && p.wickets >= 2).sort((a, b) => (b.runs + b.wickets * 20) - (a.runs + a.wickets * 20))[0]
                return (<>
                  <LeaderCard label="Orange Cap" value={tR ? String(tR.runs) : "-"} stat="Runs" name={tR?.name || "Yet to be decided"} team={tR?.team?.shortName} color="orange" />
                  <LeaderCard label="Purple Cap" value={tW ? String(tW.wickets) : "-"} stat="Wickets" name={tW?.name || "Yet to be decided"} team={tW?.team?.shortName} color="violet" />
                  <LeaderCard label="Most Sixes" value={m6 ? String(m6.sixes) : "-"} stat="Sixes" name={m6?.name || "Yet to be decided"} team={m6?.team?.shortName} color="purple" />
                  <LeaderCard label="Best Strike Rate" value={sR ? ((sR.runs / sR.ballsFaced) * 100).toFixed(1) : "-"} stat="SR (min 10 balls)" name={sR?.name || "Yet to be decided"} team={sR?.team?.shortName} color="cyan" />
                  <LeaderCard label="Best All-Rounder" value={aR ? String(aR.runs + aR.wickets * 20) : "-"} stat="Pts" name={aR?.name || "Yet to be decided"} team={aR?.team?.shortName} color="amber" />
                </>)
              })()}
            </div>
          </div>
        </section>
      )}

      {matches.length > 0 && (
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Upcoming Matches</h2>
              <Link href="/fixtures" className="text-sm text-[var(--accent)] hover:underline">View All</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match as any} showMatchNo={true} />
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
              <TeamCard key={t.id} team={t as any} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--card)] py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Latest News</h2>
            <Link href="/news" className="text-sm text-[var(--accent)] hover:underline">View All</Link>
          </div>
          {news.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {news.map((n) => (
                <NewsCard key={n.id} news={n as any} />
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
            href="https://www.youtube.com/@GreenStarsCricketLeague"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Youtube className="h-5 w-5" /> Subscribe to GSCL
          </a>
        </div>
      </section>

      <section className="border-t border-[var(--border)] py-10">
        <div className="mx-auto max-w-md px-4">
          <h3 className="mb-1 text-center text-sm font-semibold text-[var(--muted-foreground)]">Rate this website</h3>
          <StarRating />
        </div>
      </section>
    </>
  )
}

export default HomePage

function LeaderCard({ label, stat, value, name, team, color }: { label: string; stat: string; value: string; name: string; team?: string; color: string }) {
  const circleMap: Record<string, string> = {
    orange: "bg-orange-100 text-orange-600 dark:text-orange-400 dark:bg-orange-900/30",
    violet: "bg-violet-100 text-violet-700 dark:text-violet-400 dark:bg-violet-900/60",
    purple: "bg-purple-100 text-purple-600 dark:text-purple-400 dark:bg-purple-900/30",
    cyan: "bg-cyan-100 text-cyan-600 dark:text-cyan-400 dark:bg-cyan-900/30",
    amber: "bg-amber-100 text-amber-600 dark:text-amber-400 dark:bg-amber-900/30",
  }
  const labelMap: Record<string, string> = {
    orange: "text-orange-600 dark:text-orange-400",
    violet: "text-violet-700 dark:text-violet-400",
    purple: "text-purple-600 dark:text-purple-400",
    cyan: "text-cyan-600 dark:text-cyan-400",
    amber: "text-amber-600 dark:text-amber-400",
  }
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-center">
      <div className={`mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${circleMap[color] || circleMap.orange}`}>
        {name.charAt(0)}
      </div>
      <div className={`text-[10px] font-semibold uppercase tracking-wider ${labelMap[color] || labelMap.orange}`}>{label}</div>
      <div className="mt-1 truncate text-sm font-bold">{name}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] text-[var(--muted-foreground)]">{team || stat}</div>
    </div>
  )
}
