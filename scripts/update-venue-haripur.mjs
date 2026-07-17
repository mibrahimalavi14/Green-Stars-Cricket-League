import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const result = await prisma.match.updateMany({
  where: { venue: { contains: "Lahore" } },
  data: { venue: "Plot 134, Block B Awt Housing Scheme Phase 2 AWT Phase 2, Haripur, Pakistan" },
})
console.log(`Updated ${result.count} venue(s) to Haripur`)

await prisma.$disconnect()
