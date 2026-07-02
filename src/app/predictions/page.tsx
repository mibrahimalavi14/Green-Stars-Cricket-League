import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { PredictionsClient } from "@/components/PredictionsClient"

async function PredictionsPage() {
  const session = await auth()
  const season = await prisma.season.findFirst({ where: { isActive: true } })
  const matches = await prisma.match.findMany({
    where: { seasonId: season?.id, status: "upcoming" },
    include: { team1: true, team2: true },
    orderBy: { date: "asc" },
  })
  const allPredictions = await prisma.prediction.findMany({
    include: { user: { select: { name: true, image: true } }, match: { include: { team1: true, team2: true } } },
    orderBy: { createdAt: "desc" },
  })

  const userPredictions = session ? allPredictions.filter((p) => p.userId === session.user?.id) : []
  const locked = season?.scheduleAnnounced ?? false

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Match Predictions</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">
        {locked
          ? "Predictions are now closed. Check out the predictions below!"
          : "Predict match winners and earn bragging rights!"}
      </p>

      <PredictionsClient
        matches={matches as never[]}
        userPredictions={userPredictions as never[]}
        allPredictions={allPredictions as never[]}
        session={session as never}
        locked={locked}
      />
    </div>
  )
}

export default PredictionsPage
