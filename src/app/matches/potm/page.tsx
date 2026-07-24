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
              className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4 transition-all hover:border-[var(--accent)] hover:shadow-lg"
            >
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                {m.team1.logo && <img src={m.team1.logo} alt="" className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-full object-cover" />}
                <div className="text-center shrink-0">
                  <p className="font-semibold text-xs sm:text-sm">{m.team1.shortName}</p>
                  <p className="text-[10px] sm:text-sm text-[var(--muted-foreground)]">{m.team1Score || ""}</p>
                </div>
                <span className="text-xs text-[var(--muted-foreground)]">vs</span>
                <div className="text-center shrink-0">
                  <p className="font-semibold text-xs sm:text-sm">{m.team2.shortName}</p>
                  <p className="text-[10px] sm:text-sm text-[var(--muted-foreground)]">{m.team2Score || ""}</p>
                </div>
                {m.team2.logo && <img src={m.team2.logo} alt="" className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-full object-cover" />}
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">{new Date(m.date).toLocaleDateString("en-PK")}</p>
                <span className="rounded-lg bg-[var(--accent)]/10 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-[var(--accent)]">
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
