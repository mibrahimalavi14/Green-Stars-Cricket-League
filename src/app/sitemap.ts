const baseUrl = "https://green-stars-cricket-league.vercel.app"

export const dynamic = "force-dynamic"

export default async function sitemap() {
  const { prisma } = await import("@/lib/prisma")

  const [teams, players, news] = await Promise.all([
    prisma.team.findMany({ select: { id: true } }),
    prisma.player.findMany({ select: { id: true } }),
    prisma.news.findMany({ select: { id: true } }),
  ])

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/teams`, lastModified: new Date() },
    { url: `${baseUrl}/fixtures`, lastModified: new Date() },
    { url: `${baseUrl}/points-table`, lastModified: new Date() },
    { url: `${baseUrl}/predictions`, lastModified: new Date() },
    { url: `${baseUrl}/news`, lastModified: new Date() },
    { url: `${baseUrl}/contact`, lastModified: new Date() },
    ...teams.map((t: { id: string }) => ({ url: `${baseUrl}/teams/${t.id}`, lastModified: new Date() })),
    ...players.map((p: { id: string }) => ({ url: `${baseUrl}/players/${p.id}`, lastModified: new Date() })),
    ...news.map((n: { id: string }) => ({ url: `${baseUrl}/news/${n.id}`, lastModified: new Date() })),
  ]
}
