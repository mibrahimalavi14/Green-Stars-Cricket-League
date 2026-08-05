import { prisma } from "./prisma"
import { MATCH_CONFIG } from "./config"

export interface FairPlayRow {
  id: string
  name: string
  shortName: string
  logo: string
  color: string
  warnings: number
  behavior: number
  sportsmanship: number
  slowOverRate: number
  penaltyPoints: number
  fairPlayPoints: number
}

export function computeFairPlayPoints(input: {
  warnings: number
  behavior: number
  sportsmanship: number
  slowOverRate: number
  penaltyPoints: number
}): number {
  const { warnings, behavior, sportsmanship, slowOverRate, penaltyPoints } = input
  const points =
    MATCH_CONFIG.fairPlayBasePoints -
    warnings * MATCH_CONFIG.fairPlayWarningDeduction -
    slowOverRate * MATCH_CONFIG.fairPlayOverRateDeduction -
    behavior * MATCH_CONFIG.fairPlayBehaviorDeduction -
    penaltyPoints +
    sportsmanship * MATCH_CONFIG.fairPlaySportsmanshipBonus
  return Math.max(0, points)
}

export async function computeFairPlayTable(seasonId: string): Promise<FairPlayRow[]> {
  const [teams, records, penalties] = await Promise.all([
    prisma.team.findMany({
      where: { seasonId },
      select: { id: true, name: true, shortName: true, logo: true, color: true },
    }),
    prisma.fairPlayRecord.findMany({ where: { seasonId } }),
    prisma.leaguePenalty.findMany({ where: { seasonId } }),
  ])

  const recByTeam = new Map(records.map(r => [r.teamId, r]))
  const slowByTeam: Record<string, number> = {}
  const penaltyByTeam: Record<string, number> = {}
  for (const p of penalties) {
    if (p.type === "over_rate") slowByTeam[p.teamId] = (slowByTeam[p.teamId] || 0) + 1
    penaltyByTeam[p.teamId] = (penaltyByTeam[p.teamId] || 0) + p.points
  }

  return teams
    .map(t => {
      const rec = recByTeam.get(t.id)
      const warnings = rec?.warnings || 0
      const behavior = rec?.behavior || 0
      const sportsmanship = rec?.sportsmanship ?? 10
      const slowOverRate = slowByTeam[t.id] || 0
      const penaltyPoints = penaltyByTeam[t.id] || 0
      return {
        ...t,
        warnings,
        behavior,
        sportsmanship,
        slowOverRate,
        penaltyPoints,
        fairPlayPoints: computeFairPlayPoints({ warnings, behavior, sportsmanship, slowOverRate, penaltyPoints }),
      }
    })
    .sort((a, b) => b.fairPlayPoints - a.fairPlayPoints || b.sportsmanship - a.sportsmanship)
}
