import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const news = await prisma.news.findMany({ orderBy: { createdAt: 'desc' } })
console.log(JSON.stringify(news, null, 2))
await prisma.$disconnect()
