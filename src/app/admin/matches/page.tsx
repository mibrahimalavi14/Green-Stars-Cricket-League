import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminMatchForm } from "@/components/AdminMatchForm"
import { AdminMatchesList } from "@/components/AdminMatchesList"

async function AdminMatchesPage({ searchParams }: { searchParams: Promise<{ action?: string }> }) {
  const session = await auth()
  if (!session) redirect("/api/auth/signin")
  const { action } = await searchParams

  const matches = await prisma.match.findMany({
    include: { team1: true, team2: true, season: true },
    orderBy: { date: "desc" },
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Manage Matches</h1>
      {action === "add" && <div className="mb-8"><AdminMatchForm /></div>}
      <AdminMatchesList matches={matches as never[]} />
    </div>
  )
}

export default AdminMatchesPage
