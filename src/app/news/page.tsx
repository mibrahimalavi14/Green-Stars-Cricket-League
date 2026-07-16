import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"

export const revalidate = 300

async function NewsPage() {
  const newsList = await prisma.news.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">News</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Latest updates and announcements</p>
      {newsList.length === 0 ? (
        <p className="py-12 text-center text-[var(--muted-foreground)]">No news articles yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {newsList.map((news) => (
            <Link
              key={news.id}
              href={`/news/${news.id}`}
              className="group relative rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all hover:border-[var(--accent)] hover:shadow-lg"
            >
              <div className={`aspect-video flex items-center justify-center overflow-hidden ${
                news.type === "schedule" || news.type === "match" ? "bg-gradient-to-br from-green-700 via-green-600 to-lime-700" :
                news.type === "team" ? "bg-gradient-to-br from-blue-700 via-indigo-600 to-purple-700" :
                "bg-gradient-to-br from-amber-700 via-orange-600 to-red-700"
              }`}>
                {news.type === "schedule" || news.type === "match" ? (
                  <div className="relative flex h-full w-full items-center justify-center">
                    <span className="text-6xl opacity-30">📅</span>
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
                      backgroundSize: "40px 40px"
                    }} />
                  </div>
                ) : news.type === "team" ? (
                  <div className="relative flex h-full w-full items-center justify-center">
                    <span className="text-6xl opacity-30">👥</span>
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
                      backgroundSize: "40px 40px"
                    }} />
                  </div>
                ) : (
                  <div className="relative flex h-full w-full items-center justify-center">
                    <span className="text-6xl opacity-30">📢</span>
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
                      backgroundSize: "40px 40px"
                    }} />
                  </div>
                )}
              </div>
              <div className="p-5">
                <p className="mb-2 text-xs text-[var(--muted-foreground)]">{formatDate(news.createdAt)} &middot; {news.author}</p>
                <h3 className="mb-2 text-lg font-semibold group-hover:text-[var(--accent)]">{news.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)]">{news.excerpt || news.content?.slice(0, 150)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default NewsPage
