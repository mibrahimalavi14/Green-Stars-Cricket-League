import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
async function main() {
  const count = await p.match.count()
  await p.playerMatch.deleteMany()
  await p.inning.deleteMany()
  await p.prediction.deleteMany()
  await p.match.deleteMany()
  console.log("Deleted", count, "matches")
  await p.$disconnect()
}
main()
