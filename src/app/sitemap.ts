const baseUrl = "https://gscl.pk"

export default async function sitemap() {
  try {
    const { prisma } = await import("@/lib/prisma")

    const [teams, players, news] = await Promise.all([
      prisma.team.findMany({ select: { id: true } }).catch(() => []),
      prisma.player.findMany({ select: { id: true } }).catch(() => []),
      prisma.news.findMany({ select: { id: true } }).catch(() => []),
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
  } catch {
    return [
      { url: baseUrl, lastModified: new Date() },
      { url: `${baseUrl}/teams`, lastModified: new Date() },
      { url: `${baseUrl}/fixtures`, lastModified: new Date() },
      { url: `${baseUrl}/points-table`, lastModified: new Date() },
      { url: `${baseUrl}/predictions`, lastModified: new Date() },
      { url: `${baseUrl}/news`, lastModified: new Date() },
      { url: `${baseUrl}/contact`, lastModified: new Date() },
    ]
  }
}
