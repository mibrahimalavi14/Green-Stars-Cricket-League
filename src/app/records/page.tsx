import { prisma } from "@/lib/prisma"
import Link from "next/link"
import type { Metadata } from "next"
import { computeAllRecords } from "@/lib/records"

export const metadata: Metadata = {
  title: "Records | Green Stars Cricket League",
}

export const revalidate = 60

export default async function RecordsPage() {
  const { teamRecords, playerRecords } = await computeAllRecords()

  const season = await prisma.season.findFirst({ where: { isActive: true } })

  const teamRecordGroups: { title: string; type: string; icon: string; unit: string }[] = [
    { title: "Highest Team Score", type: "highest_team_score", icon: "🏏", unit: "runs" },
    { title: "Lowest Team Score", type: "lowest_team_score", icon: "📉", unit: "runs" },
    { title: "Highest Successful Chase", type: "highest_successful_chase", icon: "🎯", unit: "runs" },
    { title: "Lowest Successful Defence", type: "lowest_successful_defence", icon: "🛡️", unit: "runs" },
    { title: "Biggest Win (by Runs)", type: "biggest_win_runs", icon: "🏆", unit: "runs" },
    { title: "Biggest Win (by Wickets)", type: "biggest_win_wickets", icon: "🏆", unit: "wickets" },
  ]

  const playerRecordGroups: { title: string; type: string; icon: string; unit: string; lowerBetter?: boolean }[] = [
    { title: "Fastest 20", type: "fastest_20", icon: "⚡", unit: "balls", lowerBetter: true },
    { title: "Fastest 30", type: "fastest_30", icon: "⚡", unit: "balls", lowerBetter: true },
    { title: "Fastest 50", type: "fastest_50", icon: "⚡", unit: "balls", lowerBetter: true },
    { title: "Most Sixes (Innings)", type: "most_sixes_innings", icon: "💥", unit: "sixes" },
    { title: "Most Fours (Innings)", type: "most_fours_innings", icon: "🏏", unit: "fours" },
    { title: "Highest Partnership", type: "highest_partnership", icon: "🤝", unit: "runs" },
    { title: "Most POTM Awards", type: "most_potm", icon: "⭐", unit: "awards" },
    { title: "Most Catches", type: "most_catches", icon: "🧤", unit: "catches" },
    { title: "Most Run Outs", type: "most_run_outs", icon: "🏃", unit: "run outs" },
    { title: "Most Stumpings", type: "most_stumpings", icon: "🧤", unit: "stumpings" },
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
            const records = teamRecords.filter(r => r.type === group.type).sort((a, b) => group.unit === "runs" ? b.value - a.value : b.value - a.value).slice(0, 5)
            if (records.length === 0) return null
            return (
              <div key={group.type} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg">{group.icon}</span>
                  <h3 className="font-semibold text-sm">{group.title}</h3>
                </div>
                <div className="space-y-2">
                  {records.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <span className="font-bold text-[var(--accent)]">{r.value}</span>
                        <span className="ml-1 text-xs text-[var(--muted-foreground)]">{group.unit}</span>
                        <p className="text-xs text-[var(--muted-foreground)] truncate">{r.teamName}</p>
                      </div>
                      {r.matchId && (
                        <Link href={`/matches/${r.matchId}`} className="shrink-0 text-xs text-[var(--accent)] hover:underline">
                          {r.matchLabel}
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
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <span className="font-bold text-[var(--accent)]">{r.value}</span>
                        <span className="ml-1 text-xs text-[var(--muted-foreground)]">{group.unit}</span>
                        <p className="text-xs truncate">
                          <Link href={`/players/${r.playerId}`} className="hover:text-[var(--accent)]">{r.playerName}</Link>
                          {r.teamName && <span className="text-[var(--muted-foreground)]"> ({r.teamName})</span>}
                        </p>
                        {r.details && <p className="text-[10px] text-[var(--muted-foreground)]">{r.details}</p>}
                      </div>
                      {r.matchId && (
                        <Link href={`/matches/${r.matchId}`} className="shrink-0 text-xs text-[var(--accent)] hover:underline">
                          {r.matchLabel}
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
