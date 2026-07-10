import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const season = await prisma.season.findFirst({ where: { isActive: true } })
  if (!season) { console.log("No active season"); return }
  const matches = await prisma.match.findMany({ where: { seasonId: season.id }, orderBy: { date: "asc" } })
  for (let i = 0; i < matches.length; i++) {
    await prisma.match.update({ where: { id: matches[i].id }, data: { matchNo: i + 1 } })
  }
  console.log("Updated " + matches.length + " matches")
}
main().catch(console.error).finally(() => prisma.$disconnect())
