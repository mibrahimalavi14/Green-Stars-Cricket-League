import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const newVenue = "Plot 134, Block B Awt Housing Scheme Phase 2 AWT Phase 2, Lahore, Pakistan"

const result = await prisma.match.updateMany({
  where: { venue: { not: newVenue } },
  data: { venue: newVenue },
})
console.log(`Updated ${result.count} matches to "${newVenue}"`)

await prisma.$disconnect()
