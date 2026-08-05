import { prisma } from "./prisma"

export async function isSeasonLocked(seasonId: string | null | undefined): Promise<boolean> {
  if (!seasonId) return false
  const season = await prisma.season.findUnique({ where: { id: seasonId }, select: { isLocked: true } })
  return !!season?.isLocked
}

export async function assertSeasonUnlocked(seasonId: string | null | undefined): Promise<string | null> {
  if (!seasonId) return null
  const season = await prisma.season.findUnique({ where: { id: seasonId }, select: { isLocked: true, lockedReason: true } })
  if (season?.isLocked) return season.lockedReason || "This season is locked — edit the season lock under Season settings."
  return null
}
