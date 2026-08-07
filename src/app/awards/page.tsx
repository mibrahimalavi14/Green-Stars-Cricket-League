import { prisma } from "@/lib/prisma"
import { WORKSPACE_OFFICIAL } from "@/lib/workspace"
import { Trophy, Award, Star, Zap, Target, Medal, Download } from "lucide-react"

export const dynamic = "force-dynamic"

const CEREMONY_ORDER = ["champion", "runner_up", "player_of_season", "orange_cap", "purple_cap", "mvp", "best_batter", "best_bowler", "best_fielder", "most_improved", "emerging_player", "fair_play"]

async function AwardsPage() {
  const seasons = await prisma.season.findMany({
    where: { workspaceId: WORKSPACE_OFFICIAL },
    orderBy: { year: "desc" },
    include: { teams: true },
  })

  const seasonAwards = await prisma.seasonAward.findMany({
    where: { season: { workspaceId: WORKSPACE_OFFICIAL } },
    include: {
      season: { select: { id: true, name: true } },
    },
  })
  const awardsBySeason = new Map<string, any[]>()
  for (const a of seasonAwards) {
    if (!awardsBySeason.has(a.seasonId)) awardsBySeason.set(a.seasonId, [])
    awardsBySeason.get(a.seasonId)!.push(a)
  }

  const allAwardPlayerIds = [...new Set(seasonAwards.filter(a => a.playerId).map(a => a.playerId))]
  const allAwardTeamIds = [...new Set(seasonAwards.filter(a => a.teamId).map(a => a.teamId))]
  const [awardPlayers, awardTeams] = await Promise.all([
    allAwardPlayerIds.length
      ? prisma.player.findMany({ where: { id: { in: allAwardPlayerIds } }, include: { team: true } })
      : Promise.resolve([]),
    allAwardTeamIds.length
      ? prisma.team.findMany({ where: { id: { in: allAwardTeamIds } } })
      : Promise.resolve([]),
  ])
  const playerMap = new Map(awardPlayers.map(p => [p.id, p]))
  const teamMap = new Map(awardTeams.map(t => [t.id, t]))

  const completedMatches = await prisma.match.findMany({
    where: { status: "completed", season: { workspaceId: WORKSPACE_OFFICIAL } },
    include: { team1: true, team2: true },
    orderBy: { date: "desc" },
  })

  const seasonMatchIds = new Map<string, string[]>()
  for (const m of completedMatches) {
    if (!m.seasonId) continue
    if (!seasonMatchIds.has(m.seasonId)) seasonMatchIds.set(m.seasonId, [])
    seasonMatchIds.get(m.seasonId)!.push(m.id)
  }

  const allPlayerMatches = await prisma.playerMatch.findMany({
    where: { match: { season: { workspaceId: WORKSPACE_OFFICIAL } } },
    include: { player: { include: { team: true } } },
  })

  const seasonsAwards = seasons.map(season => {
    const matchIds = new Set(seasonMatchIds.get(season.id) || [])
    const spm = allPlayerMatches.filter(pm => matchIds.has(pm.matchId))

    const agg: Record<string, { playerId: string; name: string; team?: any; runs: number; ballsFaced: number; sixes: number; wickets: number; runsConceded: number; catches: number; matchesPlayed: number }> = {}
    for (const pm of spm) {
      const pid = pm.playerId
      if (!agg[pid]) agg[pid] = { playerId: pid, name: pm.player.name, team: pm.player.team, runs: 0, ballsFaced: 0, sixes: 0, wickets: 0, runsConceded: 0, catches: 0, matchesPlayed: 0 }
      const a = agg[pid]
      a.runs += pm.battingRuns
      a.ballsFaced += pm.ballsFaced
      a.sixes += pm.sixes
      a.wickets += pm.bowlingWickets
      a.runsConceded += pm.bowlingRuns
      a.catches += pm.catches
      a.matchesPlayed++
    }

    const players = Object.values(agg)

    const topScorer = [...players].sort((a, b) => b.runs - a.runs)[0]
    const topWicketTaker = [...players].sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)[0]
    const mostSixes = [...players].sort((a, b) => b.sixes - a.sixes)[0]
    const bestStrikeRate = [...players].filter(p => p.ballsFaced >= 10).sort((a, b) => (b.runs / b.ballsFaced) - (a.runs / a.ballsFaced))[0]
    const bestAllRounder = [...players].filter(p => p.runs >= 20 && p.wickets >= 2).sort((a, b) => (b.runs + b.wickets * 20) - (a.runs + a.wickets * 20))[0]
    const mostCatches = [...players].sort((a, b) => b.catches - a.catches)[0]
    const seasonMatches = completedMatches.filter(m => m.seasonId === season.id)
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

      {seasonsAwards.map(({ season, winner, topScorer, topWicketTaker, mostSixes, bestStrikeRate, bestAllRounder, mostCatches, potmList }) => {
        const ceremony = (awardsBySeason.get(season.id) || [])
          .filter(a => CEREMONY_ORDER.includes(a.category))
          .sort((a, b) => CEREMONY_ORDER.indexOf(a.category) - CEREMONY_ORDER.indexOf(b.category))

        return (
        <div key={season.id} className="mb-12">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <h2 className="text-2xl font-bold">{season.name} ({season.year})</h2>
            {winner && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gscl-gold/20 px-4 py-1.5 text-sm font-semibold text-gscl-dark">
                <Trophy className="h-4 w-4" /> Champions: {winner.name}
              </span>
            )}
          </div>

          {ceremony.length > 0 && (
            <div className="mb-8 overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-50 to-transparent p-6 dark:from-amber-900/10">
              <div className="mb-4 flex items-center gap-2">
                <Medal className="h-5 w-5 text-gscl-gold" />
                <h3 className="text-lg font-bold">Awards Ceremony</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ceremony.map(a => {
                  const player = a.playerId ? playerMap.get(a.playerId) : null
                  const team = a.teamId ? teamMap.get(a.teamId) : null
                  const subject = player?.name || team?.name || "—"
                  const sub = player?.team ? player.team.name : ""
                  const certUrl = `/awards/certificate/${season.id}/${a.category}`
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{a.categoryLabel}</p>
                        <p className="truncate font-semibold">{subject}</p>
                        {(sub || a.value) && (
                          <p className="truncate text-xs text-[var(--muted-foreground)]">{sub || a.value}</p>
                        )}
                      </div>
                      <a href={certUrl} target="_blank" rel="noopener noreferrer" title="Download certificate"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:border-gscl-gold hover:text-gscl-gold">
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
        )
      })}
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
