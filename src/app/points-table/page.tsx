import { prisma } from "@/lib/prisma"

async function PointsTablePage() {
  const teams = await prisma.team.findMany({
    include: {
      matches1: { include: { team1: true, team2: true } },
      matches2: { include: { team1: true, team2: true } },
    },
  })

  const standings = teams.map((team) => {
    let won = 0, lost = 0, tied = 0, nr = 0
    let forRuns = 0, forBalls = 0, againstRuns = 0, againstBalls = 0

    const allMatches = [...team.matches1, ...team.matches2].filter((m) => m.status === "completed")
    for (const m of allMatches) {
      const isTeam1 = m.team1Id === team.id
      const winner = m.result
      if (winner.includes("won")) {
        const winnerName = winner.split(" won")[0]
        if (winnerName === team.name || winnerName === team.shortName) won++
        else lost++
      } else if (winner.includes("tied") || winner.includes("Tie")) tied++
      else if (winner === "No Result") nr++

      const score = isTeam1 ? m.team1Score : m.team2Score
      const oppScore = isTeam1 ? m.team2Score : m.team1Score
      if (score) {
        const [runs] = score.split("/")
        forRuns += parseInt(runs) || 0
        forBalls += 120
      }
      if (oppScore) {
        const [runs] = oppScore.split("/")
        againstRuns += parseInt(runs) || 0
        againstBalls += 120
      }
    }

    const nrr = forBalls > 0 && againstBalls > 0
      ? Number(((forRuns / forBalls) - (againstRuns / againstBalls)) * 100)
      : 0

    return {
      id: team.id,
      name: team.name,
      shortName: team.shortName,
      color: team.color,
      played: allMatches.length,
      won, lost, tied, nr,
      points: won * 2 + tied + nr,
      nrr: Number(nrr.toFixed(3)),
    }
  })

  standings.sort((a, b) => b.points - a.points || b.nrr - a.nrr)

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Points Table</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Current standings</p>

      {standings.length === 0 ? (
        <p className="py-12 text-center text-[var(--muted-foreground)]">No data yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="p-4 text-left">#</th>
                <th className="p-4 text-left">Team</th>
                <th className="p-4 text-center">P</th>
                <th className="p-4 text-center">W</th>
                <th className="p-4 text-center">L</th>
                <th className="p-4 text-center">T</th>
                <th className="p-4 text-center">NR</th>
                <th className="p-4 text-center font-bold">Pts</th>
                <th className="p-4 text-center">NRR</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((t, i) => (
                <tr key={t.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                  <td className="p-4 font-medium">{i + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="font-medium">{t.shortName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-medium">{t.played}</td>
                  <td className="p-4 text-center text-green-600">{t.won}</td>
                  <td className="p-4 text-center text-red-500">{t.lost}</td>
                  <td className="p-4 text-center">{t.tied}</td>
                  <td className="p-4 text-center">{t.nr}</td>
                  <td className="p-4 text-center font-bold text-lg">{t.points}</td>
                  <td className="p-4 text-center font-mono">{t.nrr.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default PointsTablePage
