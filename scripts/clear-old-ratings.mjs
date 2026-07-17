import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const result = await prisma.rating.deleteMany()
console.log(`Deleted ${result.count} old rating(s)`)

await prisma.$disconnect()
