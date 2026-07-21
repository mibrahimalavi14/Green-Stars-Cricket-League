import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Star } from "lucide-react"

export const dynamic = "force-dynamic"

async function PotmVoteIndexPage() {
  const matches = await prisma.match.findMany({
    where: { status: "completed" },
    include: { team1: true, team2: true },
    orderBy: { date: "desc" },
    take: 20,
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-2 flex items-center gap-2">
        <Star className="h-6 w-6 text-[var(--accent)]" />
        <h1 className="text-3xl font-bold">POTM Voting</h1>
      </div>
      <p className="mb-8 text-[var(--muted-foreground)]">Vote for Player of the Match in completed matches</p>

      {matches.length === 0 ? (
        <p className="py-12 text-center text-[var(--muted-foreground)]">No completed matches yet.</p>
      ) : (
        <div className="space-y-3">
          {matches.map(m => (
            <Link
              key={m.id}
              href={`/matches/${m.id}/potm`}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-all hover:border-[var(--accent)] hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                {m.team1.logo && <img src={m.team1.logo} alt="" className="h-10 w-10 rounded-full object-cover" />}
                <div className="text-center">
                  <p className="font-semibold">{m.team1.shortName}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{m.team1Score || ""}</p>
                </div>
                <span className="text-xs text-[var(--muted-foreground)]">vs</span>
                <div className="text-center">
                  <p className="font-semibold">{m.team2.shortName}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{m.team2Score || ""}</p>
                </div>
                {m.team2.logo && <img src={m.team2.logo} alt="" className="h-10 w-10 rounded-full object-cover" />}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-[var(--muted-foreground)]">{new Date(m.date).toLocaleDateString("en-PK")}</p>
                <span className="rounded-lg bg-[var(--accent)]/10 px-3 py-1.5 text-sm font-semibold text-[var(--accent)]">
                  Vote <Star className="ml-1 inline h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default PotmVoteIndexPage
