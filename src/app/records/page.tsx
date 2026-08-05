import { prisma } from "@/lib/prisma"
import Link from "next/link"
import type { Metadata } from "next"
import { computeAllRecords } from "@/lib/records"
import { WORKSPACE_OFFICIAL } from "@/lib/workspace"

export const metadata: Metadata = {
  title: "Records | Green Stars Cricket League",
}

export const revalidate = 60

export default async function RecordsPage() {
  const { teamRecords, playerRecords } = await computeAllRecords(WORKSPACE_OFFICIAL)

  const season = await prisma.season.findFirst({ where: { isActive: true, workspaceId: WORKSPACE_OFFICIAL } })

  const teamRecordGroups: { title: string; type: string; icon: string; unit: string; lowerBetter?: boolean }[] = [
    { title: "Highest Team Score", type: "highest_team_score", icon: "🏏", unit: "runs" },
    { title: "Lowest Team Score", type: "lowest_team_score", icon: "📉", unit: "runs", lowerBetter: true },
    { title: "Highest Successful Chase", type: "highest_successful_chase", icon: "🎯", unit: "runs" },
    { title: "Lowest Successful Defence", type: "lowest_successful_defence", icon: "🛡️", unit: "runs", lowerBetter: true },
    { title: "Biggest Win (by Runs)", type: "biggest_win_runs", icon: "🏆", unit: "runs" },
    { title: "Biggest Win (by Wickets)", type: "biggest_win_wickets", icon: "🏆", unit: "wickets" },
    { title: "Fastest Team 50", type: "fastest_team_50", icon: "⚡", unit: "balls", lowerBetter: true },
    { title: "Most Consecutive Wins", type: "most_consecutive_wins", icon: "🔥", unit: "wins" },
    { title: "Most Consecutive Losses", type: "most_consecutive_losses", icon: "😬", unit: "losses" },
  ]

  const playerRecordGroups: { title: string; type: string; icon: string; unit: string; lowerBetter?: boolean }[] = [
    { title: "Fastest 20", type: "fastest_20", icon: "⚡", unit: "balls", lowerBetter: true },
    { title: "Fastest 30", type: "fastest_30", icon: "⚡", unit: "balls", lowerBetter: true },
    { title: "Fastest Fifty", type: "fastest_fifty", icon: "⚡", unit: "balls", lowerBetter: true },
    { title: "Fastest Century", type: "fastest_century", icon: "💯", unit: "balls", lowerBetter: true },
    { title: "Most Runs (Innings)", type: "most_runs_match", icon: "🏏", unit: "runs" },
    { title: "Most Sixes (Innings)", type: "most_sixes_innings", icon: "💥", unit: "sixes" },
    { title: "Most Fours (Innings)", type: "most_fours_innings", icon: "🏏", unit: "fours" },
    { title: "Best Bowling (Innings)", type: "best_bowling", icon: "🎳", unit: "wickets" },
    { title: "Highest Partnership", type: "highest_partnership", icon: "🤝", unit: "runs" },
    { title: "Most Sixes (Season)", type: "most_sixes_season", icon: "💥", unit: "sixes" },
    { title: "Most POTM Awards", type: "most_potm", icon: "⭐", unit: "awards" },
    { title: "Most Catches", type: "most_catches", icon: "🧤", unit: "catches" },
    { title: "Most Run Outs", type: "most_run_outs", icon: "🏃", unit: "run outs" },
    { title: "Most Stumpings", type: "most_stumpings", icon: "🧤", unit: "stumpings" },
    { title: "Most Dot Balls", type: "most_dot_balls", icon: "⚫", unit: "dot balls" },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Records</h1>
        {season && <p className="text-[var(--muted-foreground)]">{season.name}</p>}
      </div>

      <section className="mb-12">
        <h2 className="mb-6 text-xl font-bold">Team Records</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teamRecordGroups.map(group => {
            const records = teamRecords.filter(r => r.type === group.type).sort((a, b) => group.lowerBetter ? a.value - b.value : b.value - a.value).slice(0, 5)
            if (records.length === 0) return null
            return (
              <div key={group.type} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg">{group.icon}</span>
                  <h3 className="font-semibold text-sm">{group.title}</h3>
                </div>
                <div className="space-y-2">
                  {records.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <span className="font-bold text-[var(--accent)]">{r.value}</span>
                        <span className="ml-1 text-xs text-[var(--muted-foreground)]">{group.unit}</span>
                        <p className="text-xs text-[var(--muted-foreground)] truncate">{r.teamName}</p>
                        <RecordContext record={r} />
                      </div>
                      {r.matchId && (
                        <Link href={`/matches/${r.matchId}`} className="shrink-0 text-xs text-[var(--accent)] hover:underline">
                          Details
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-xl font-bold">Player Records</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {playerRecordGroups.map(group => {
            const records = playerRecords.filter(r => r.type === group.type).sort((a, b) => group.lowerBetter ? a.value - b.value : b.value - a.value).slice(0, 5)
            if (records.length === 0) return null
            return (
              <div key={group.type} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg">{group.icon}</span>
                  <h3 className="font-semibold text-sm">{group.title}</h3>
                </div>
                <div className="space-y-2">
                  {records.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <span className="font-bold text-[var(--accent)]">{r.value}</span>
                        <span className="ml-1 text-xs text-[var(--muted-foreground)]">{group.unit}</span>
                        <p className="text-xs truncate">
                          <Link href={`/players/${r.playerId}`} className="hover:text-[var(--accent)]">{r.playerName}</Link>
                          {r.teamName && <span className="text-[var(--muted-foreground)]"> ({r.teamName})</span>}
                        </p>
                        {r.details && <p className="text-[10px] text-[var(--muted-foreground)]">{r.details}</p>}
                        <RecordContext record={r} />
                      </div>
                      {r.matchId && (
                        <Link href={`/matches/${r.matchId}`} className="shrink-0 text-xs text-[var(--accent)] hover:underline">
                          Details
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function RecordContext({ record }: { record: any }) {
  const parts: string[] = []
  if (record.seasonName) parts.push(record.seasonName)
  if (record.matchLabel) parts.push(record.matchLabel.replace(/\s*—\s*.*$/, ""))
  if (record.opponent) parts.push(`vs ${record.opponent}`)
  if (record.venue) parts.push(record.venue)
  if (record.date) parts.push(new Date(record.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }))
  if (parts.length === 0) return null
  return <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">{parts.join(" · ")}</p>
}
