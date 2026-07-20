import { prisma } from "@/lib/prisma"
import { AdminMatchForm } from "@/components/AdminMatchForm"
import { AdminMatchesList } from "@/components/AdminMatchesList"

export const dynamic = "force-dynamic"

async function AdminMatchesPage({ searchParams }: { searchParams: Promise<{ action?: string }> }) {
  const { action } = await searchParams

  const matches = await prisma.match.findMany({
    include: { team1: true, team2: true, season: true },
    orderBy: { date: "asc" },
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Matches</h1>
        <a href="/api/export/matches" className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)]">Download CSV</a>
      </div>
      {action === "add" && <div className="mb-8"><AdminMatchForm /></div>}
      <AdminMatchesList matches={matches as any[]} />
    </div>
  )
}

export default AdminMatchesPage
