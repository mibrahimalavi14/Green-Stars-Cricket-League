import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"

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
              className="group rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all hover:border-[var(--accent)] hover:shadow-lg"
            >
              <div className="aspect-video bg-[var(--muted)] flex items-center justify-center">
                <span className="text-5xl">🏏</span>
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
