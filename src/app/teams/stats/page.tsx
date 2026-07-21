import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Trophy, Users, Target, TrendingUp, Award, Zap } from "lucide-react"

export const dynamic = "force-dynamic"

async function TeamStatsPage() {
  const teams = await prisma.team.findMany({
    include: {
      players: true,
      _count: { select: { players: true } },
    },
  })

  const matches = await prisma.match.findMany({
    where: { status: "completed" },
    include: { team1: true, team2: true },
  })

  const teamStats = teams.map((team) => {
    const teamMatches = matches.filter((m) => m.team1Id === team.id || m.team2Id === team.id)
    const won = teamMatches.filter((m) => m.result?.startsWith(team.name)).length
    const lost = teamMatches.filter((m) => m.result && !m.result.startsWith(team.name) && !m.result.includes("Tied") && !m.result.includes("No Result")).length
    const tied = teamMatches.filter((m) => m.result?.includes("Tied")).length
    const totalRuns = team.players.reduce((a, p) => a + p.runs, 0)
    const totalWickets = team.players.reduce((a, p) => a + p.wickets, 0)
    const topBatter = [...team.players].sort((a, b) => b.runs - a.runs)[0]
    const topBowler = [...team.players].sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)[0]
    const winRate = teamMatches.length > 0 ? ((won / teamMatches.length) * 100).toFixed(0) : "0"

    return { team, matches: teamMatches.length, won, lost, tied, totalRuns, totalWickets, topBatter, topBowler, winRate }
  })

  teamStats.sort((a, b) => Number(b.winRate) - Number(a.winRate) || b.won - a.won)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Team Statistics</h1>
        <p className="text-[var(--muted-foreground)]">Performance overview of all teams in the league</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teamStats.map((s) => (
          <Link
            key={s.team.id}
            href={`/teams/${s.team.id}`}
            className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg"
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: s.team.color }}
              >
                {s.team.logo && !s.team.logo.includes("placeholder") ? (
                  <img src={s.team.logo} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  s.team.shortName
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold group-hover:text-[var(--accent)]">{s.team.name}</h2>
                <p className="text-xs text-[var(--muted-foreground)]">{s.team.shortName} &middot; {s.team.location || "Haripur"}</p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-lg bg-green-500/10 p-2">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{s.won}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">Won</p>
              </div>
              <div className="rounded-lg bg-red-500/10 p-2">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{s.lost}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">Lost</p>
              </div>
              <div className="rounded-lg bg-[var(--muted)] p-2">
                <p className="text-lg font-bold">{s.winRate}%</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">Win Rate</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[var(--muted-foreground)]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-[var(--accent)]" /> Matches</span>
                <span className="font-semibold text-[var(--foreground)]">{s.matches}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-[var(--accent)]" /> Total Runs</span>
                <span className="font-semibold text-[var(--foreground)]">{s.totalRuns}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-[var(--accent)]" /> Total Wickets</span>
                <span className="font-semibold text-[var(--foreground)]">{s.totalWickets}</span>
              </div>
              {s.topBatter && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Award className="h-3 w-3 text-amber-500" /> Top Batter</span>
                  <span className="font-semibold text-[var(--foreground)]">{s.topBatter.name} ({s.topBatter.runs})</span>
                </div>
              )}
              {s.topBowler && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Award className="h-3 w-3 text-violet-500" /> Top Bowler</span>
                  <span className="font-semibold text-[var(--foreground)]">{s.topBowler.name} ({s.topBowler.wickets} wkts)</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default TeamStatsPage
