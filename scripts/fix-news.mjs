import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const news = await p.news.findMany({ orderBy: { createdAt: 'desc' } })
for (const n of news) {
  console.log(`--- ${n.id} ---`)
  console.log(`Title: ${n.title}`)
  console.log(`Slug: ${n.slug}`)
  console.log(`Content:\n${n.content}`)
  console.log(`Excerpt: ${n.excerpt}`)
  console.log(`Type: ${n.type}`)
  console.log()
}
await p.$disconnect()
