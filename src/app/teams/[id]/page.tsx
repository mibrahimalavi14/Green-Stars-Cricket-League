import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { relativeDateLabel, getVenueMapsUrl } from "@/lib/utils"
import { Trophy, TrendingUp, Zap, Award, Star, Crown } from "lucide-react"

export const dynamic = "force-dynamic"

async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      players: { orderBy: { runs: "desc" } },
      season: true,
    },
  })

  if (!team) notFound()

  const playerNameMap = new Map(team.players.map(p => [p.id, p]))

  const [captaincies, honors] = await Promise.all([
    prisma.teamCaptaincy.findMany({
      where: { teamId: team.id },
      include: {
        season: { select: { id: true, name: true, year: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.teamHonor.findMany({
      where: { teamId: team.id },
      include: { season: { select: { id: true, name: true, year: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const latest = captaincies[captaincies.length - 1]
  const captainId = latest?.captainId
  const viceCaptainId = latest?.viceCaptainId || ""

  const allMatches = await prisma.match.findMany({
    where: {
      seasonId: team.seasonId,
      OR: [{ team1Id: team.id }, { team2Id: team.id }],
    },
    include: { team1: true, team2: true },
    orderBy: { date: "asc" },
  })

  const completedMatches = allMatches.filter((m) => m.status === "completed")
  const won = completedMatches.filter((m) => m.result?.startsWith(team.name)).length
  const topBatter = [...team.players].sort((a, b) => b.runs - a.runs)[0]
  const topBowler = [...team.players].sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)[0]
  const mostMatches = [...team.players].sort((a, b) => b.matchesPlayed - a.matchesPlayed)[0]
  const teamRuns = team.players.reduce((a, p) => a + p.runs, 0)
  const teamWickets = team.players.reduce((a, p) => a + p.wickets, 0)

  let streak = 0
  for (let i = completedMatches.length - 1; i >= 0; i--) {
    if (completedMatches[i].result?.startsWith(team.name)) streak++
    else break
  }

  const teamAwards = await prisma.seasonAward.findMany({
    where: { teamId: team.id },
    include: { season: { select: { id: true, name: true, year: true } } },
    orderBy: { season: { year: "desc" } },
  })

  const latestChampionSeason = teamAwards.find(a => a.category === "champion")?.season
  const isDefendingChampion = !!latestChampionSeason && latestChampionSeason.id !== team.seasonId

  const awardBadge = (category: string, icon: string, cls: string, label: string) =>
    teamAwards.filter(a => a.category === category).map(a => (
      { key: `${a.seasonId}-${category}`, icon, cls, label, sub: a.season?.name || "" }
    ))

  const teamBadges = [
    ...(isDefendingChampion ? [{ key: "defending", icon: "🏆", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400", label: "Defending Champion", sub: latestChampionSeason?.name || "" }] : []),
    ...awardBadge("champion", "🏆", "bg-amber-500/15 text-amber-600 dark:text-amber-400", "Champion"),
    ...awardBadge("runner_up", "🥈", "bg-slate-400/15 text-slate-500", "Runner-up"),
    ...awardBadge("fair_play", "🤝", "bg-teal-500/15 text-teal-600 dark:text-teal-400", "Fair Play"),
    ...(streak >= 3 ? [{ key: "streak", icon: "🔥", cls: "bg-orange-500/15 text-orange-600 dark:text-orange-400", label: `${streak} Win Streak`, sub: "" }] : []),
    ...(won >= 5 ? [{ key: "wins", icon: "✅", cls: "bg-green-500/15 text-green-600 dark:text-green-400", label: `${won} Wins`, sub: "" }] : []),
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex items-center gap-6 min-w-0">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] overflow-hidden" style={{ backgroundColor: team.color }}>
          {team.logo && !team.logo.includes("placeholder") ? (
            <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-white">{team.shortName}</span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold truncate">{team.name}</h1>
          <p className="text-[var(--muted-foreground)] truncate">{team.players.length} Players &middot; {allMatches.length} Matches &middot; {won} Wins</p>
          {latest && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Captain: {playerNameMap.get(latest.captainId)?.name || "—"}
              {latest.viceCaptainId && <span className="text-[var(--muted-foreground)]"> &middot; VC: {playerNameMap.get(latest.viceCaptainId)?.name}</span>}
            </p>
          )}
          {!latest && team.captainName && <p className="text-xs text-amber-600 dark:text-amber-400">Captain: {team.captainName}</p>}
          {teamBadges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {teamBadges.map(b => (
                <span key={b.key} title={b.sub || b.label} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${b.cls}`}>
                  <span>{b.icon}</span> {b.label}
                  {b.sub && <span className="opacity-70">· {b.sub}</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-1 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <TrendingUp className="h-4 w-4 text-[var(--accent)]" /> Top Batter
          </div>
          {topBatter ? (
            <Link href={`/players/${topBatter.id}`} className="group flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-[10px] font-bold text-[var(--accent)]">{topBatter.name.charAt(0)}</div>
              <div>
                <p className="text-sm font-semibold group-hover:text-[var(--accent)]">{topBatter.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{topBatter.runs} runs</p>
              </div>
            </Link>
          ) : <p className="text-sm text-[var(--muted-foreground)]">No data</p>}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-1 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Zap className="h-4 w-4 text-[var(--accent)]" /> Top Bowler
          </div>
          {topBowler ? (
            <Link href={`/players/${topBowler.id}`} className="group flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-[10px] font-bold text-[var(--accent)]">{topBowler.name.charAt(0)}</div>
              <div>
                <p className="text-sm font-semibold group-hover:text-[var(--accent)]">{topBowler.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{topBowler.wickets} wickets</p>
              </div>
            </Link>
          ) : <p className="text-sm text-[var(--muted-foreground)]">No data</p>}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-1 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Award className="h-4 w-4 text-amber-500" /> Team Total
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-xs font-bold text-[var(--accent)]">#</div>
            <div>
              <p className="text-sm font-semibold">{teamRuns} runs</p>
              <p className="text-xs text-[var(--muted-foreground)]">{teamWickets} wickets &middot; {completedMatches.length} played</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Players</h2>
        {team.players.length === 0 ? (
          <p className="text-[var(--muted-foreground)]">No players added yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {team.players.map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 transition-all hover:border-[var(--accent)]"
              >
                {player.photo && player.photo !== "/placeholder-player.svg" ? (
                  <img src={player.photo} alt={player.name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <img src="/placeholder-player.svg" alt={player.name} className="h-10 w-10 rounded-full bg-[var(--muted)] p-2" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="font-medium truncate">{player.name}</p>
                    {player.jerseyNumber != null && <span className="shrink-0 text-[10px] font-semibold text-[var(--muted-foreground)]">#{player.jerseyNumber}</span>}
                    {player.id === captainId && <Crown className="h-3 w-3 shrink-0 text-amber-500" />}
                    {player.id === viceCaptainId && <Crown className="h-3 w-3 shrink-0 text-slate-400" />}
                    {(player as any).isCaptain && !captaincies.length && <Crown className="h-3 w-3 shrink-0 text-amber-500" />}
                    <span className="text-[9px] font-semibold text-[var(--muted-foreground)]">{player.id === captainId ? "C" : player.id === viceCaptainId ? "VC" : ""}</span>
                    {player.status !== "available" && (
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        player.status === "injured" ? "bg-red-500/15 text-red-500"
                        : player.status === "suspended" ? "bg-orange-500/15 text-orange-500"
                        : "bg-slate-500/15 text-slate-400"
                      }`}>{player.status}</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">{player.role}</p>
                </div>
                <div className="text-right text-xs text-[var(--muted-foreground)] shrink-0">
                  <div>{player.runs} runs</div>
                  <div>{player.wickets} wkts</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {captaincies.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Leadership History</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {captaincies.map(c => (
              <div key={c.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                <p className="mb-2 text-xs font-semibold text-[var(--muted-foreground)]">{c.season?.name}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">{playerNameMap.get(c.captainId)?.name || "Unknown"}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">C</span>
                  </div>
                  {c.viceCaptainId && playerNameMap.get(c.viceCaptainId) && (
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-slate-400" />
                      <span>{playerNameMap.get(c.viceCaptainId)?.name}</span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">VC</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {honors.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Honors</h2>
          <div className="flex flex-wrap gap-2">
            {honors.map(h => (
              <span key={h.id} className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Trophy className="h-3.5 w-3.5" /> {h.title} <span className="text-[var(--muted-foreground)]">· {h.season?.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <details className="group rounded-xl border border-[var(--border)] bg-[var(--card)]" open>
        <summary className="flex cursor-pointer items-center justify-between p-4 text-lg font-semibold hover:bg-[var(--muted)]/50">
          <span>Matches {team.season ? `(${team.season.name})` : ""}</span>
          <span className="text-xs text-[var(--muted-foreground)] group-open:hidden">Show</span>
          <span className="text-xs text-[var(--muted-foreground)] hidden group-open:inline">Hide</span>
        </summary>
        <div className="px-4 pb-4">
          {allMatches.length === 0 ? (
            <p className="text-[var(--muted-foreground)] py-4 text-center">No matches yet.</p>
          ) : (
            <div className="space-y-3">
              {allMatches.map((match) => (
                <div key={match.id} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 sm:p-4">
                  {match.matchNo > 0 && <div className="-mt-1 mb-1 text-[10px] font-semibold text-[var(--accent)]">Match {match.matchNo}</div>}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div className="flex shrink-0 items-center gap-1.5">
                        {match.team1.logo && <img src={match.team1.logo} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />}
                        <span className="truncate text-sm font-medium">{match.team1.name}</span>
                      </div>
                      {match.team1Score && <span className="shrink-0 text-xs font-semibold text-[var(--foreground)]">{match.team1Score}</span>}
                    </div>
                    <div className="shrink-0 text-center">
                      <span className="text-xs font-semibold text-[var(--accent)]">VS</span>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {(() => { const rel = relativeDateLabel(new Date(match.date)); return rel.label ? <span className={rel.className}>{rel.label}</span> : <>{new Date(match.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" })}</>; })()} &middot;{" "}
                        {new Date(match.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })}
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                      {match.team2Score && <span className="shrink-0 text-xs font-semibold text-[var(--foreground)]">{match.team2Score}</span>}
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="truncate text-sm font-medium">{match.team2.name}</span>
                        {match.team2.logo && <img src={match.team2.logo} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />}
                      </div>
                    </div>
                  </div>
                  {match.result && <p className="mt-1 text-center text-xs font-medium text-green-600 dark:text-green-400">{match.result}</p>}
                  {match.status === "upcoming" && <p className="mt-1 text-center text-xs text-[var(--muted-foreground)]">{(venue => { const url = getVenueMapsUrl(venue); return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] underline underline-offset-2">{venue}</a> : <>{venue}</> })(match.venue)}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  )
}

export default TeamDetailPage
