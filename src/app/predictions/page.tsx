import { prisma } from "@/lib/prisma"
import { PredictionsClient } from "@/components/PredictionsClient"

export const revalidate = 30

async function PredictionsPage() {
  const season = await prisma.season.findFirst({ where: { isActive: true } })
  if (!season) return <div className="mx-auto max-w-5xl px-4 py-12"><p className="text-[var(--muted-foreground)]">No active season.</p></div>

  const teams = await prisma.team.findMany({
    where: { seasonId: season.id },
  })

  const predictions = await prisma.seasonPrediction.findMany({
    where: { seasonId: season.id },
    orderBy: { createdAt: "desc" },
  })

  return (
    <PredictionsClient
      teams={teams.map(t => ({ id: t.id, name: t.name, shortName: t.shortName, logo: t.logo, color: t.color }))}
      seasonId={season.id}
      initialPredictions={predictions.map(p => ({ id: p.id, name: p.name, email: p.email, predictedTeamId: p.predictedTeamId, createdAt: p.createdAt.toISOString() }))}
      locked={season.scheduleAnnounced}
    />
  )
}

export default PredictionsPage
