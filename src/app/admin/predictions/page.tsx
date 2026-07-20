import { prisma } from "@/lib/prisma"
import { Trophy, Users, Mail, Calendar } from "lucide-react"

export const dynamic = "force-dynamic"

async function PredictionBreakdown({ predictions }: { predictions: any[] }) {
  const counts: Record<string, { count: number; teamName: string }> = {}
  for (const p of predictions) {
    const team = await prisma.team.findUnique({ where: { id: p.predictedTeamId }, select: { name: true, shortName: true, logo: true } })
    if (team) {
      counts[p.predictedTeamId] = counts[p.predictedTeamId] || { count: 0, teamName: team.name }
      counts[p.predictedTeamId].count++
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(counts).sort((a, b) => b[1].count - a[1].count).map(([teamId, data]) => (
        <div key={teamId} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">{data.teamName}</span>
            <span className="text-2xl font-bold text-[var(--accent)]">{data.count}</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">predictions</p>
        </div>
      ))}
    </div>
  )
}

export default async function AdminPredictionsPage() {
  const season = await prisma.season.findFirst({ where: { isActive: true } })
  if (!season) return <div className="p-8 text-center text-[var(--muted-foreground)]">No active season</div>

  const predictions = await prisma.seasonPrediction.findMany({
    where: { seasonId: season.id },
    orderBy: { createdAt: "desc" },
  })

  const teamNames: Record<string, string> = {}
  for (const p of predictions) {
    if (!teamNames[p.predictedTeamId]) {
      const team = await prisma.team.findUnique({ where: { id: p.predictedTeamId }, select: { name: true, shortName: true, logo: true } })
      teamNames[p.predictedTeamId] = team ? `${team.name} (${team.shortName})` : "Unknown"
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Season Predictions</h1>
        <p className="text-[var(--muted-foreground)]">{season.name} ({season.year}) &middot; {predictions.length} total prediction{predictions.length !== 1 ? "s" : ""}</p>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Breakdown by Team</h2>
      <PredictionBreakdown predictions={predictions} />

      <h2 className="mb-4 mt-10 text-lg font-semibold">All Predictions</h2>
      {predictions.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-[var(--muted-foreground)]">No predictions yet</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--muted)] text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Predicted Team</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map(p => (
                <tr key={p.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{p.email}</td>
                  <td className="px-4 py-3 font-medium text-[var(--accent)]">{teamNames[p.predictedTeamId]}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{new Date(p.createdAt).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
