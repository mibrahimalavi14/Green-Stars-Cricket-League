import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

export const revalidate = 10

async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const player = await prisma.player.findUnique({
    where: { id },
    include: { team: true },
  })

  if (!player) notFound()

  const performances = await prisma.playerMatch.findMany({
    where: { playerId: player.id },
    include: {
      match: { include: { team1: true, team2: true } },
    },
    orderBy: { match: { date: "desc" } },
  })

  const inns = performances.length
  const dismissals = performances.filter(x => x.isOut).length || inns
  const battingAvg = dismissals > 0 ? (player.runs / dismissals).toFixed(2) : "-"
  const sr = player.ballsFaced > 0 ? ((player.runs / player.ballsFaced) * 100).toFixed(1) : "-"
  const econ = player.ballsBowled > 0 ? (player.runsConceded / (player.ballsBowled / 6)).toFixed(2) : "-"
  const bowlingAvg = player.wickets > 0 ? (player.runsConceded / player.wickets).toFixed(2) : "-"
  const overs = Math.floor(player.ballsBowled / 6) + "." + (player.ballsBowled % 6)
  const hs = Math.max(...performances.map(x => x.battingRuns), 0)
  const bb = player.bestBowlingWickets > 0 ? `${player.bestBowlingWickets}/${player.bestBowlingRuns}` : "-"

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
        <div className="mb-8 flex items-center gap-6">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white"
            style={{ backgroundColor: player.team?.color || "#1e3a5f" }}
          >
            {player.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{player.name}</h1>
            <p className="text-lg text-[var(--muted-foreground)]">{player.role} &middot; {player.team?.name}</p>
            <div className="mt-1 flex gap-4 text-sm text-[var(--muted-foreground)]">
              <span>Bat: {player.battingStyle}</span>
              <span>Bowl: {player.bowlingStyle}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Batting</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            <StatCard label="Matches" value={player.matchesPlayed} />
            <StatCard label="Innings" value={inns} />
            <StatCard label="Runs" value={player.runs} />
            <StatCard label="HS" value={hs} />
            <StatCard label="Avg" value={battingAvg} />
            <StatCard label="SR" value={sr} />
            <StatCard label="4s" value={player.fours} />
            <StatCard label="6s" value={player.sixes} />
            <StatCard label="Fifties" value={player.fifties} />
            <StatCard label="Hundreds" value={player.hundreds} />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Bowling</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            <StatCard label="Matches" value={player.matchesPlayed} />
            <StatCard label="Innings" value={performances.filter(x => x.ballsBowled > 0).length} />
            <StatCard label="Overs" value={overs} />
            <StatCard label="Wickets" value={player.wickets} />
            <StatCard label="Runs" value={player.runsConceded} />
            <StatCard label="BB" value={bb} />
            <StatCard label="Avg" value={bowlingAvg} />
            <StatCard label="Econ" value={econ} />
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Fielding</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            <StatCard label="Catches" value={player.catches} />
            <StatCard label="Stumpings" value={player.stumpings} />
            <StatCard label="Run Outs" value={player.runOuts} />
          </div>
        </div>
      </div>

      {performances.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">Match Log</h2>
          <div className="space-y-3">
            {performances.map((p) => (
              <div key={p.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{p.match.team1.shortName} vs {p.match.team2.shortName}</span>
                  <span className="text-[var(--muted-foreground)]">{new Date(p.match.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-[var(--muted-foreground)]">Bat: </span>
                    <span className="font-medium">{p.battingRuns}</span>
                    <span className="text-[var(--muted-foreground)]"> ({p.ballsFaced} balls, {p.fours}×4, {p.sixes}×6)</span>
                    {p.isOut && <span className="text-red-500"> {p.dismissalType}</span>}
                    {!p.isOut && <span className="text-green-500"> not out</span>}
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Bowl: </span>
                    <span className="font-medium">{p.bowlingWickets}/{p.bowlingRuns}</span>
                    <span className="text-[var(--muted-foreground)]"> ({p.ballsBowled} balls)</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Catches: </span>
                    <span className="font-medium">{p.catches}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-[var(--muted)] p-3 text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
    </div>
  )
}

export default PlayerDetailPage
