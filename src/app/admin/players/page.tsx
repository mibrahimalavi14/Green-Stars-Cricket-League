import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminPlayerForm } from "@/components/AdminPlayerForm"

async function AdminPlayersPage() {
  const session = await auth()
  if (!session) redirect("/api/auth/signin")
  const players = await prisma.player.findMany({ include: { team: true }, orderBy: { runs: "desc" } })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Manage Players</h1>
      <div className="mb-8"><AdminPlayerForm /></div>
      <div className="space-y-2">
        {players.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--muted)] text-xs font-bold">{p.name.charAt(0)}</div>
              <div>
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{p.role} &middot; {p.team?.shortName}</p>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-[var(--muted-foreground)]">
              <span>{p.runs} runs</span>
              <span>{p.wickets} wkts</span>
            </div>
          </div>
        ))}
        {players.length === 0 && <p className="text-center py-8 text-[var(--muted-foreground)]">No players yet.</p>}
      </div>
    </div>
  )
}

export default AdminPlayersPage
