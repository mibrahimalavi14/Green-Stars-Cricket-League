import { prisma } from "@/lib/prisma"

export async function H2H({ team1Id, team2Id, matchId }: { team1Id: string; team2Id: string; matchId: string }) {
  const prevMatches = await prisma.match.findMany({
    where: {
      id: { not: matchId },
      OR: [
        { team1Id, team2Id },
        { team1Id: team2Id, team2Id: team1Id },
      ],
      status: "completed",
    },
    include: { team1: true, team2: true },
  })

  if (prevMatches.length === 0) return null

  const team1Wins = prevMatches.filter(m => {
    if (m.team1Id === team1Id) return m.result.includes(m.team1.name)
    return m.result.includes(m.team2.name)
  }).length

  const team2Wins = prevMatches.length - team1Wins

  return (
    <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="mb-3 text-center text-sm font-semibold text-[var(--muted-foreground)]">HEAD TO HEAD</h3>
      <div className="flex items-center justify-center gap-4">
        <span className="text-sm font-medium">{team1Wins}</span>
        <div className="flex h-2 w-40 overflow-hidden rounded-full bg-[var(--muted)]">
          <div className="h-full rounded-full bg-green-500" style={{ width: `${(team1Wins / prevMatches.length) * 100}%` }} />
          <div className="h-full rounded-full bg-blue-500" style={{ width: `${(team2Wins / prevMatches.length) * 100}%` }} />
        </div>
        <span className="text-sm font-medium">{team2Wins}</span>
      </div>
      <p className="mt-1 text-center text-xs text-[var(--muted-foreground)]">{prevMatches.length} previous meetings</p>
    </div>
  )
}
