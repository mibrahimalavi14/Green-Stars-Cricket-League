import { prisma } from "@/lib/prisma"

async function PointsTablePage() {
  const season = await prisma.season.findFirst({ where: { isActive: true } })
  const allSeasons = await prisma.season.findMany({ orderBy: { year: "desc" } })

  if (!season) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <h1 className="mb-2 text-3xl font-bold">Points Table</h1>
        <p className="text-[var(--muted-foreground)]">No active season found.</p>
      </div>
    )
  }

  const { recalcPointsTable } = await import("@/lib/stats")
  const standings = await recalcPointsTable(season.id)

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
                      <span className="font-medium">{t.name}</span>
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
