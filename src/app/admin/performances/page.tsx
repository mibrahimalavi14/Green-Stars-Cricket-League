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
          {matches.map((match) => (
            <AdminPerformanceForm
              key={match.id}
              match={{
                id: match.id,
                seasonName: match.season.name,
                date: match.date.toISOString(),
                team1Id: match.team1.id,
                team1Name: match.team1.shortName,
                team1Color: match.team1.color,
                team2Id: match.team2.id,
                team2Name: match.team2.shortName,
                team2Color: match.team2.color,
                team1Score: match.team1Score,
                team2Score: match.team2Score,
                savedPerformances: match.performances.map(p => ({
                  playerId: p.playerId,
                  teamId: p.teamId,
                  battingRuns: p.battingRuns,
                  ballsFaced: p.ballsFaced,
                  fours: p.fours,
                  sixes: p.sixes,
                  ones: p.ones,
                  twos: p.twos,
                  isOut: p.isOut,
                  dismissalType: p.dismissalType,
                  dismissedByBowlerId: p.dismissedByBowlerId,
                  dismissedByFielderId: p.dismissedByFielderId,
                  bowlingWickets: p.bowlingWickets,
                  bowlingRuns: p.bowlingRuns,
                  ballsBowled: p.ballsBowled,
                  maidens: p.maidens,
                  wides: p.wides,
                  noBalls: p.noBalls,
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
