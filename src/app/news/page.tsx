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
              className={`group relative rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all hover:border-[var(--accent)] hover:shadow-lg ${news.title.toLowerCase().includes("schedule") || news.title.toLowerCase().includes("fixture") || news.title.toLowerCase().includes("match") ? "bg-[var(--card)]" : ""}`}
            >
              <div className="aspect-video bg-[var(--muted)] flex items-center justify-center overflow-hidden">
                {news.title.toLowerCase().includes("schedule") || news.title.toLowerCase().includes("fixture") || news.title.toLowerCase().includes("match") ? (
                  <div className="relative flex h-full w-full items-center justify-center">
                    <span className="absolute left-4 top-4 text-7xl opacity-20 rotate-12">🏏</span>
                    <span className="absolute right-6 bottom-4 text-6xl opacity-20 -rotate-12">🏏</span>
                    <span className="absolute left-1/3 top-1/3 text-5xl opacity-15">⚪</span>
                    <span className="text-5xl relative z-10">🏏</span>
                  </div>
                ) : (
                  <span className="text-5xl">🏏</span>
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
