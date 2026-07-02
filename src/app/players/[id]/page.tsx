import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const player = await prisma.player.findUnique({
    where: { id },
    include: { team: true },
  })

  if (!player) notFound()

  const sr = player.ballsFaced > 0 ? ((player.runs / player.ballsFaced) * 100).toFixed(1) : "0.0"
  const econ = player.ballsBowled > 0 ? (player.runsConceded / (player.ballsBowled / 6)).toFixed(1) : "0.0"
  const avg = player.matchesPlayed > 0 ? (player.runs / player.matchesPlayed).toFixed(1) : "0.0"

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
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

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Matches" value={player.matchesPlayed} />
          <StatCard label="Runs" value={player.runs} />
          <StatCard label="Strike Rate" value={sr} />
          <StatCard label="Average" value={avg} />
          <StatCard label="4s" value={player.fours} />
          <StatCard label="6s" value={player.sixes} />
          <StatCard label="Wickets" value={player.wickets} />
          <StatCard label="Economy" value={econ} />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-[var(--muted)] p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
    </div>
  )
}

export default PlayerDetailPage
