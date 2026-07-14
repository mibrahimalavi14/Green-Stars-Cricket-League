import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

async function AdminPredictionsPage() {
  const seasons = await prisma.season.findMany({ orderBy: { year: "desc" } })
  if (seasons.length === 0) return <div className="p-4">No seasons found.</div>

  const allTeams = await prisma.team.findMany()
  const teamMap = new Map(allTeams.map((t) => [t.id, t]))

  const allPredictions = await prisma.seasonPrediction.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Season Predictions / Votes</h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">All seasons</p>

      <div className="space-y-10">
        {seasons.map((season) => {
          const predictions = allPredictions.filter((p) => p.seasonId === season.id)
          return (
            <details key={season.id} className="group rounded-xl border border-[var(--border)] bg-[var(--card)]" open={season.isActive}>
              <summary className="flex cursor-pointer items-center justify-between p-4 text-lg font-semibold hover:bg-[var(--muted)]/50">
                <div className="flex items-center gap-3">
                  <span>{season.name}</span>
                  <span className="rounded bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">{predictions.length} votes</span>
                  {season.isActive && <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">Active</span>}
                </div>
                <span className="text-xs text-[var(--muted-foreground)] group-open:hidden">Show</span>
                <span className="text-xs text-[var(--muted-foreground)] hidden group-open:inline">Hide</span>
              </summary>
              <div className="px-4 pb-4">
                {predictions.length === 0 ? (
                  <p className="py-4 text-center text-[var(--muted-foreground)]">No votes for this season.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
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
                                <span className="font-semibold">{team?.name || "Unknown"}</span>
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
            </details>
          )
        })}
      </div>
    </div>
  )
}

export default AdminPredictionsPage
