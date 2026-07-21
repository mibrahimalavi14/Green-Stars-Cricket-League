import { prisma } from "@/lib/prisma"
import { Trophy, Award, Star, Zap, Target } from "lucide-react"

export const dynamic = "force-dynamic"

async function AwardsPage() {
  const seasons = await prisma.season.findMany({
    orderBy: { year: "desc" },
    include: { teams: true },
  })

  const allPlayers = await prisma.player.findMany({ include: { team: true } })
  const completedMatches = await prisma.match.findMany({
    where: { status: "completed" },
    include: { team1: true, team2: true },
    orderBy: { date: "desc" },
  })

  const seasonsAwards = seasons.map(season => {
    const seasonPlayers = allPlayers.filter(p => season.teams.some(t => t.id === p.teamId))
    const seasonMatches = completedMatches.filter(m => m.seasonId === season.id)

    const topScorer = [...seasonPlayers].sort((a, b) => b.runs - a.runs)[0]
    const topWicketTaker = [...seasonPlayers].sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)[0]
    const mostSixes = [...seasonPlayers].sort((a, b) => b.sixes - a.sixes)[0]
    const bestStrikeRate = [...seasonPlayers].filter(p => p.ballsFaced >= 10).sort((a, b) => (b.runs / b.ballsFaced) - (a.runs / a.ballsFaced))[0]
    const bestAllRounder = [...seasonPlayers].filter(p => p.runs >= 20 && p.wickets >= 2).sort((a, b) => (b.runs + b.wickets * 20) - (a.runs + a.wickets * 20))[0]
    const mostCatches = [...seasonPlayers].sort((a, b) => b.catches - a.catches)[0]
    const potmList = seasonMatches.filter(m => m.manOfMatch).reduce((acc: { name: string; count: number }[], m) => {
      const existing = acc.find(x => x.name === m.manOfMatch)
      if (existing) existing.count++
      else acc.push({ name: m.manOfMatch, count: 1 })
      return acc
    }, []).sort((a, b) => b.count - a.count).slice(0, 3)

    const winner = season.winnerId ? season.teams.find(t => t.id === season.winnerId) : null

    return { season, winner, topScorer, topWicketTaker, mostSixes, bestStrikeRate, bestAllRounder, mostCatches, potmList }
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Awards</h1>
      <p className="mb-10 text-[var(--muted-foreground)]">Season-wise award winners and achievements</p>

      {seasonsAwards.map(({ season, winner, topScorer, topWicketTaker, mostSixes, bestStrikeRate, bestAllRounder, mostCatches, potmList }) => (
        <div key={season.id} className="mb-12">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <h2 className="text-2xl font-bold">{season.name} ({season.year})</h2>
            {winner && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gscl-gold/20 px-4 py-1.5 text-sm font-semibold text-gscl-dark">
                <Trophy className="h-4 w-4" /> Champions: {winner.name}
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AwardCard icon={Trophy} label="Orange Cap" value={topScorer ? String(topScorer.runs) : "-"} stat="Runs" name={topScorer?.name || "N/A"} team={topScorer?.team?.shortName} color="orange" />
            <AwardCard icon={Award} label="Purple Cap" value={topWicketTaker ? String(topWicketTaker.wickets) : "-"} stat="Wickets" name={topWicketTaker?.name || "N/A"} team={topWicketTaker?.team?.shortName} color="violet" />
            <AwardCard icon={Zap} label="Most Sixes" value={mostSixes ? String(mostSixes.sixes) : "-"} stat="Sixes" name={mostSixes?.name || "N/A"} team={mostSixes?.team?.shortName} color="purple" />
            <AwardCard icon={Target} label="Best Strike Rate" value={bestStrikeRate ? ((bestStrikeRate.runs / bestStrikeRate.ballsFaced) * 100).toFixed(1) : "-"} stat="SR" name={bestStrikeRate?.name || "N/A"} team={bestStrikeRate?.team?.shortName} color="cyan" />
            <AwardCard icon={Star} label="Best All-Rounder" value={bestAllRounder ? String(bestAllRounder.runs + bestAllRounder.wickets * 20) : "-"} stat="Points" name={bestAllRounder?.name || "N/A"} team={bestAllRounder?.team?.shortName} color="amber" />
            <AwardCard icon={Trophy} label="Most Catches" value={mostCatches ? String(mostCatches.catches) : "-"} stat="Catches" name={mostCatches?.name || "N/A"} team={mostCatches?.team?.shortName} color="emerald" />

            {potmList.length > 0 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:col-span-2">
                <div className="mb-2 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-gscl-gold" />
                  <h3 className="font-semibold">Player of the Match Leaders</h3>
                </div>
                <div className="space-y-1.5 text-sm">
                  {potmList.map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between">
                      <span><span className="font-medium text-[var(--muted-foreground)]">#{i + 1}</span> {p.name}</span>
                      <span className="font-semibold">{p.count} MOTM</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function AwardCard({ icon: Icon, label, value, stat, name, team, color }: { icon: any; label: string; value: string; stat: string; name: string; team?: string; color: string }) {
  const colorMap: Record<string, string> = {
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  }
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${colorMap[color] || colorMap.orange}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium">{name}</p>
      {team && <p className="text-xs text-[var(--muted-foreground)]">{team} &middot; {stat}</p>}
    </div>
  )
}

export default AwardsPage
