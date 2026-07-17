import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const r = await prisma.team.updateMany({
  where: { captainName: { not: "" } },
  data: { captainName: "" },
})
console.log(`Cleared captain for ${r.count} teams`)

await prisma.$disconnect()
