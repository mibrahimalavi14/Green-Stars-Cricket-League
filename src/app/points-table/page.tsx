import { prisma } from "@/lib/prisma"
import PlayoffQualification, { getQualifiedTeams } from "@/components/PlayoffQualification"

export const dynamic = "force-dynamic"

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

  const totalTeams = await prisma.team.count({ where: { seasonId: season.id } })
  const qualifiedTeams = getQualifiedTeams(totalTeams)

  const { recalcPointsTable } = await import("@/lib/stats")
  const standings = await recalcPointsTable(season.id)
  const { computeFairPlayTable } = await import("@/lib/fair-play")
  const fairPlay = await computeFairPlayTable(season.id)

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Points Table</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Current standings</p>

      {standings.length === 0 ? (
        <p className="py-12 text-center text-[var(--muted-foreground)]">No data yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="min-w-[550px] w-full text-sm">
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
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((t, i) => {
                const isQualified = i + 1 <= qualifiedTeams
                return (
                  <tr key={t.id} className={`border-b border-[var(--border)] border-l-4 transition-colors hover:bg-[var(--muted)] ${isQualified ? "border-l-green-600 bg-green-50 dark:bg-green-900/20" : "border-l-red-600 bg-red-50 dark:bg-red-900/20"}`}>
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
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${isQualified ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"}`}>
                        {isQualified ? "🏆 Qualified" : "❌ Eliminated"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {standings.length > 0 && <PlayoffQualification totalTeams={totalTeams} />}

      <h2 className="mt-12 mb-2 text-2xl font-bold">Fair Play Table</h2>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        Fair Play Points = 100 − Warnings(5) − Over-Rate(10) − Behavior(15) − Penalties + Sportsmanship(×2)
      </p>

      {fairPlay.length === 0 ? (
        <p className="py-6 text-center text-[var(--muted-foreground)]">No data yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="min-w-[700px] w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="p-4 text-left">#</th>
                <th className="p-4 text-left">Team</th>
                <th className="p-4 text-center font-bold">FP Pts</th>
                <th className="p-4 text-center">Warnings</th>
                <th className="p-4 text-center">Over-Rate</th>
                <th className="p-4 text-center">Behavior</th>
                <th className="p-4 text-center">Penalties</th>
                <th className="p-4 text-center">Sportsmanship</th>
              </tr>
            </thead>
            <tbody>
              {fairPlay.map((t, i) => (
                <tr key={t.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                  <td className="p-4 font-medium">{i + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {t.logo && <img src={t.logo} alt={t.name} className="h-8 w-8 rounded-full object-cover" />}
                      <span className="font-medium">{t.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-bold text-lg">{t.fairPlayPoints}</td>
                  <td className="p-4 text-center">{t.warnings}</td>
                  <td className="p-4 text-center">{t.slowOverRate}</td>
                  <td className="p-4 text-center">{t.behavior}</td>
                  <td className="p-4 text-center text-red-500">-{t.penaltyPoints}</td>
                  <td className="p-4 text-center">{t.sportsmanship}</td>
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
