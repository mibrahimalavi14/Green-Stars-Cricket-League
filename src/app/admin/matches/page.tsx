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
      <h1 className="mb-8 text-3xl font-bold">Manage Matches</h1>
      {action === "add" && <div className="mb-8"><AdminMatchForm /></div>}
      <AdminMatchesList matches={matches as any[]} />
    </div>
  )
}

export default AdminMatchesPage
