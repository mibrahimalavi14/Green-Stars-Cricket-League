import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const result = await prisma.match.updateMany({
  where: { venue: { not: "AWT Shift" } },
  data: { venue: "AWT Shift" },
})
console.log(`Updated ${result.count} matches to venue "AWT Shift"`)

await prisma.$disconnect()
