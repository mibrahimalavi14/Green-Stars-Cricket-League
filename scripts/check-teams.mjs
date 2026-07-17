import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const teams = await prisma.team.findMany()
console.log(JSON.stringify(teams, null, 2))

await prisma.$disconnect()
