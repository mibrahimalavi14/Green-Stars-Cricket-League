import { prisma } from "@/lib/prisma"

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
                <th className="p-3 text-center">BF</th>
                <th className="p-3 text-center">4s</th>
                <th className="p-3 text-center">6s</th>
                <th className="p-3 text-center">50</th>
                <th className="p-3 text-center">100</th>
                <th className="p-3 text-center">SR</th>
              </tr>
            </thead>
            <tbody>
              {batting.length === 0 ? (
                <tr><td colSpan={9} className="p-6 text-center text-[var(--muted-foreground)]">No batting data yet.</td></tr>
              ) : batting.map((p, i) => (
                <tr key={p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                  <td className="p-3 font-medium">{i + 1}</td>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-[var(--muted-foreground)]">{p.team?.shortName}</td>
                  <td className="p-3 text-center">{p.matchesPlayed}</td>
                  <td className="p-3 text-center font-bold">{p.runs}</td>
                  <td className="p-3 text-center">{p.ballsFaced}</td>
                  <td className="p-3 text-center text-blue-600">{p.fours}</td>
                  <td className="p-3 text-center text-purple-600">{p.sixes}</td>
                  <td className="p-3 text-center text-yellow-600">{p.fifties}</td>
                  <td className="p-3 text-center text-green-600">{p.hundreds}</td>
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
                <th className="p-3 text-center">Wkts</th>
                <th className="p-3 text-center">Runs</th>
                <th className="p-3 text-center">Balls</th>
                <th className="p-3 text-center">Econ</th>
              </tr>
            </thead>
            <tbody>
              {bowling.length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-center text-[var(--muted-foreground)]">No bowling data yet.</td></tr>
              ) : bowling.map((p, i) => (
                <tr key={p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                  <td className="p-3 font-medium">{i + 1}</td>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-[var(--muted-foreground)]">{p.team?.shortName}</td>
                  <td className="p-3 text-center">{p.matchesPlayed}</td>
                  <td className="p-3 text-center font-bold text-green-600">{p.wickets}</td>
                  <td className="p-3 text-center">{p.runsConceded}</td>
                  <td className="p-3 text-center">{p.ballsBowled}</td>
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
                  <th className="p-3 text-center">Wkts</th>
                </tr>
              </thead>
              <tbody>
                {allrounders.map((p, i) => (
                  <tr key={p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                    <td className="p-3 font-medium">{i + 1}</td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-[var(--muted-foreground)]">{p.team?.shortName}</td>
                    <td className="p-3 text-center">{p.matchesPlayed}</td>
                    <td className="p-3 text-center font-bold">{p.runs}</td>
                    <td className="p-3 text-center font-bold text-green-600">{p.wickets}</td>
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
