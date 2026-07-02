import { prisma } from "../src/lib/prisma"

async function main() {
  await prisma.playerMatch.deleteMany()
  await prisma.prediction.deleteMany()
  await prisma.inning.deleteMany()
  await prisma.match.deleteMany()
  await prisma.player.deleteMany()
  await prisma.team.deleteMany()
  await prisma.season.deleteMany()
  await prisma.predictionLock.deleteMany()
  console.log("All data removed successfully!")
}

main().catch(console.error)
