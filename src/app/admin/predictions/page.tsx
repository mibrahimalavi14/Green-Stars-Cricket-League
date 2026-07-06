import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

async function AdminPredictionsPage() {
  const season = await prisma.season.findFirst({ where: { isActive: true } })
  if (!season) return <div className="p-4">No active season.</div>

  const predictions = await prisma.seasonPrediction.findMany({
    where: { seasonId: season.id },
    orderBy: { createdAt: "desc" },
  })

  const teams = await prisma.team.findMany({ where: { seasonId: season.id } })
  const teamMap = new Map(teams.map((t) => [t.id, t]))

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Season Predictions / Votes</h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">Total votes: {predictions.length}</p>

      {predictions.length === 0 ? (
        <p className="text-[var(--muted-foreground)]">No votes yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Voted For</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p, i) => {
                const team = teamMap.get(p.predictedTeamId)
                return (
                  <tr key={p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                    <td className="p-3 font-medium text-[var(--muted-foreground)]">{i + 1}</td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-[var(--muted-foreground)]">{p.email}</td>
                    <td className="p-3">
                      <span className="font-semibold" style={{ color: team?.color }}>{team?.name || "Unknown"}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-[var(--muted-foreground)]">
                      {new Date(p.createdAt).toLocaleString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                        timeZone: "Asia/Karachi",
                      })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminPredictionsPage
