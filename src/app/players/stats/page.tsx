import { prisma } from "@/lib/prisma"

export const revalidate = 30

async function PlayerStatsPage() {
  const players = await prisma.player.findMany({
    include: { team: true },
    orderBy: { runs: "desc" },
  })

  const batting = [...players].filter(p => p.runs > 0).sort((a, b) => b.runs - a.runs)
  const bowling = [...players].filter(p => p.wickets > 0).sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)
  const allrounders = players.filter(p => p.runs > 0 && p.wickets > 0).sort((a, b) => (b.runs + b.wickets * 20) - (a.runs + a.wickets * 20))

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Player Stats</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Batting and bowling statistics</p>

      <div className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">Most Runs (Batting)</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Player</th>
                <th className="p-3 text-left">Team</th>
                <th className="p-3 text-center">M</th>
                <th className="p-3 text-center">Runs</th>
                <th className="p-3 text-center" title="Balls Faced">BF</th>
                <th className="p-3 text-center" title="Fours">4s</th>
                <th className="p-3 text-center" title="Sixes">6s</th>
                <th className="p-3 text-center">50</th>
                <th className="p-3 text-center">100</th>
                <th className="p-3 text-center" title="Not Outs">NO</th>
                <th className="p-3 text-center" title="Ducks (0 runs)">Duck</th>
                <th className="p-3 text-center" title="Balls per Boundary">B/B</th>
                <th className="p-3 text-center" title="Strike Rate">SR</th>
              </tr>
            </thead>
            <tbody>
              {batting.length === 0 ? (
                <tr><td colSpan={14} className="p-6 text-center text-[var(--muted-foreground)]">No batting data yet.</td></tr>
              ) : batting.map((p, i) => (
                <tr key={p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                  <td className="p-3 font-medium">{i + 1}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {p.photo && p.photo !== "/placeholder-player.svg" ? (
                        <img src={p.photo} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <img src="/placeholder-player.svg" alt="" className="h-6 w-6 rounded-full bg-[var(--muted)] p-1" />
                      )}
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      {p.team?.logo && <img src={p.team.logo} alt="" className="h-5 w-5 rounded-full object-cover" />}
                      <span className="text-[var(--muted-foreground)]">{p.team?.shortName}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">{p.matchesPlayed}</td>
                  <td className="p-3 text-center font-bold">{p.runs}</td>
                  <td className="p-3 text-center">{p.ballsFaced}</td>
                  <td className="p-3 text-center text-blue-600 dark:text-blue-400">{p.fours}</td>
                  <td className="p-3 text-center text-purple-600 dark:text-purple-400">{p.sixes}</td>
                  <td className="p-3 text-center text-yellow-600 dark:text-yellow-400">{p.fifties}</td>
                  <td className="p-3 text-center text-green-600 dark:text-green-400">{p.hundreds}</td>
                  <td className="p-3 text-center">{p.notOuts}</td>
                  <td className="p-3 text-center">{p.ducks}</td>
                  <td className="p-3 text-center font-mono">{(p.fours + p.sixes) > 0 ? (p.ballsFaced / (p.fours + p.sixes)).toFixed(1) : "-"}</td>
                  <td className="p-3 text-center font-mono">{p.ballsFaced > 0 ? ((p.runs / p.ballsFaced) * 100).toFixed(1) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">Most Wickets (Bowling)</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Player</th>
                <th className="p-3 text-left">Team</th>
                <th className="p-3 text-center">M</th>
                <th className="p-3 text-center" title="Wickets">Wkts</th>
                <th className="p-3 text-center">Runs</th>
                <th className="p-3 text-center">Balls</th>
                <th className="p-3 text-center" title="4 Wickets">4w</th>
                <th className="p-3 text-center" title="5 Wickets">5w</th>
                <th className="p-3 text-center" title="Strike Rate">SR</th>
                <th className="p-3 text-center" title="Economy Rate">Econ</th>
              </tr>
            </thead>
            <tbody>
              {bowling.length === 0 ? (
                <tr><td colSpan={11} className="p-6 text-center text-[var(--muted-foreground)]">No bowling data yet.</td></tr>
              ) : bowling.map((p, i) => (
                <tr key={p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                  <td className="p-3 font-medium">{i + 1}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {p.photo && p.photo !== "/placeholder-player.svg" ? (
                        <img src={p.photo} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <img src="/placeholder-player.svg" alt="" className="h-6 w-6 rounded-full bg-[var(--muted)] p-1" />
                      )}
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      {p.team?.logo && <img src={p.team.logo} alt="" className="h-5 w-5 rounded-full object-cover" />}
                      <span className="text-[var(--muted-foreground)]">{p.team?.shortName}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">{p.matchesPlayed}</td>
                  <td className="p-3 text-center font-bold text-green-600 dark:text-green-400">{p.wickets}</td>
                  <td className="p-3 text-center">{p.runsConceded}</td>
                  <td className="p-3 text-center">{p.ballsBowled}</td>
                  <td className="p-3 text-center font-bold text-orange-600 dark:text-orange-400">{p.fourWickets}</td>
                  <td className="p-3 text-center font-bold text-red-600 dark:text-red-400">{p.fiveWickets}</td>
                  <td className="p-3 text-center font-mono">{p.wickets > 0 ? (p.ballsBowled / p.wickets).toFixed(1) : "-"}</td>
                  <td className="p-3 text-center font-mono">{p.ballsBowled > 0 ? (p.runsConceded / (p.ballsBowled / 6)).toFixed(2) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {allrounders.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">All-Rounders</h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Player</th>
                  <th className="p-3 text-left">Team</th>
                  <th className="p-3 text-center">M</th>
                  <th className="p-3 text-center">Runs</th>
                  <th className="p-3 text-center" title="Wickets">Wkts</th>
                </tr>
              </thead>
              <tbody>
                {allrounders.map((p, i) => (
                  <tr key={p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                    <td className="p-3 font-medium">{i + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {p.photo && p.photo !== "/placeholder-player.svg" ? (
                          <img src={p.photo} alt="" className="h-6 w-6 rounded-full object-cover" />
                        ) : (
                          <img src="/placeholder-player.svg" alt="" className="h-6 w-6 rounded-full bg-[var(--muted)] p-1" />
                        )}
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {p.team?.logo && <img src={p.team.logo} alt="" className="h-5 w-5 rounded-full object-cover" />}
                        <span className="text-[var(--muted-foreground)]">{p.team?.shortName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">{p.matchesPlayed}</td>
                    <td className="p-3 text-center font-bold">{p.runs}</td>
                    <td className="p-3 text-center font-bold text-green-600 dark:text-green-400">{p.wickets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlayerStatsPage
