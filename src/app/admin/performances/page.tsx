import { prisma } from "@/lib/prisma"
import { AdminPerformanceForm } from "@/components/AdminPerformanceForm"

export const dynamic = "force-dynamic"

async function AdminPerformancesPage() {
  const matches = await prisma.match.findMany({
    where: { status: "completed" },
    include: { team1: true, team2: true, season: true, performances: true },
    orderBy: { date: "desc" },
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Player Performances</h1>
      <p className="mb-6 text-[var(--muted-foreground)]">Enter batting and bowling stats for each player per match.</p>

      {matches.length === 0 ? (
        <p className="text-center text-[var(--muted-foreground)] py-8">No completed matches yet. Complete a match first.</p>
      ) : (
        <div className="space-y-6">
          {matches.map((m) => (
            <AdminPerformanceForm
              key={m.id}
              match={{
                id: m.id,
                seasonName: m.season.name,
                date: m.date.toISOString(),
                team1Id: m.team1.id,
                team1Name: m.team1.shortName,
                team1Color: m.team1.color,
                team2Id: m.team2.id,
                team2Name: m.team2.shortName,
                team2Color: m.team2.color,
                team1Score: m.team1Score,
                team2Score: m.team2Score,
                savedPerformances: m.performances.map(p => ({
                  playerId: p.playerId,
                  teamId: p.teamId,
                  battingRuns: p.battingRuns,
                  ballsFaced: p.ballsFaced,
                  fours: p.fours,
                  sixes: p.sixes,
                  ones: p.ones,
                  twos: p.twos,
                  isOut: p.isOut,
                  bowlingWickets: p.bowlingWickets,
                  bowlingRuns: p.bowlingRuns,
                  ballsBowled: p.ballsBowled,
                  catches: p.catches,
                  stumpings: p.stumpings,
                  runOuts: p.runOuts,
                })),
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminPerformancesPage
