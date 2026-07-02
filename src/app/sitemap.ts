import { prisma } from "@/lib/prisma"

export default async function sitemap() {
  const baseUrl = "https://gscl.pk"

  const teams = await prisma.team.findMany({ select: { id: true } })
  const players = await prisma.player.findMany({ select: { id: true } })
  const news = await prisma.news.findMany({ select: { id: true } })

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/teams`, lastModified: new Date() },
    { url: `${baseUrl}/fixtures`, lastModified: new Date() },
    { url: `${baseUrl}/points-table`, lastModified: new Date() },
    { url: `${baseUrl}/predictions`, lastModified: new Date() },
    { url: `${baseUrl}/news`, lastModified: new Date() },
    { url: `${baseUrl}/contact`, lastModified: new Date() },
    ...teams.map((t) => ({ url: `${baseUrl}/teams/${t.id}`, lastModified: new Date() })),
    ...players.map((p) => ({ url: `${baseUrl}/players/${p.id}`, lastModified: new Date() })),
    ...news.map((n) => ({ url: `${baseUrl}/news/${n.id}`, lastModified: new Date() })),
  ]
}
