import { prisma } from "@/lib/prisma"

export const revalidate = 30

async function PointsTablePage() {
  const season = await prisma.season.findFirst({ where: { isActive: true } })

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
                <tr key={t.id} className={`border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)] ${i < 4 ? "bg-emerald-100 dark:bg-emerald-900/30" : i >= 4 ? "bg-red-100 dark:bg-red-900/30" : ""}`}>
                  <td className="p-4 font-medium">{i + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {t.logo && <img src={t.logo} alt={t.name} className="h-8 w-8 rounded-full object-cover" />}
                      <span className="font-medium">{t.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-medium">{t.played}</td>
                  <td className="p-4 text-center text-green-600 dark:text-green-400">{t.won}</td>
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
      <p className="mt-3 text-center text-sm font-semibold text-amber-600 dark:text-amber-400">TOP 4 TEAMS QUALIFY FOR PLAYOFFS</p>
    </div>
  )
}

export default PointsTablePage
