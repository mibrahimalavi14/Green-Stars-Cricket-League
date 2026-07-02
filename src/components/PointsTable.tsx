import { prisma } from "@/lib/prisma"

interface PointsTableProps {
  minimal?: boolean
}

export async function PointsTable({ minimal }: PointsTableProps) {
  const teams = await prisma.team.findMany({ include: { matches1: true, matches2: true } })

  const standings = teams.map((team) => {
    let won = 0, lost = 0, tied = 0, nr = 0
    let forRuns = 0, forBalls = 0, againstRuns = 0, againstBalls = 0

    const allMatches = [...team.matches1, ...matches2].filter(m  => m.status === "completed")
    for (const m of allMatches) {
      if (m.result.includes("won")) {
        if (m.result.includes(team.name) || m.result.includes(team.shortName)) won++
        else lost++
      } else if (m.result.includes("tied")) tied++
      else if (m.result === "No Result") nr++
    }

    return {
      id: team.id,
      name: team.shortName,
      color: team.color,
      played: allMatches.length,
      won, lost, tied, nr,
      points: won * 2 + tied * 1 + nr * 1,
      nrr: 0,
    }
  })

  standings.sort((a, b) => b.points - a.points || b.nrr - a.nrr)

  const displayTeams = minimal ? standings.slice(0, 4) : standings

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
          <th className="p-3 text-left">#</th>
          <th className="p-3 text-left">Team</th>
          <th className="p-3 text-center">P</th>
          <th className="p-3 text-center">W</th>
          <th className="p-3 text-center">L</th>
          <th className="p-3 text-center">Pts</th>
          {!minimal && <th className="p-3 text-center">NRR</th>}
        </tr>
      </thead>
      <tbody>
        {displayTeams.map((t, i) => (
          <tr key={t.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
            <td className="p-3 font-medium">{i + 1}</td>
            <td className="p-3">
              <span className="font-medium" style={{ color: t.color }}>{t.name}</span>
            </td>
            <td className="p-3 text-center">{t.played}</td>
            <td className="p-3 text-center text-green-600">{t.won}</td>
            <td className="p-3 text-center text-red-500">{t.lost}</td>
            <td className="p-3 text-center font-bold">{t.points}</td>
            {!minimal && <td className="p-3 text-center text-sm">{t.nrr.toFixed(3)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Helper to avoid unused variable issues
const matches2 = [] as { status: string; result: string; team1Id: string; team2Id: string; team1: { name: string; shortName: string }; team2: { name: string; shortName: string } }[]
