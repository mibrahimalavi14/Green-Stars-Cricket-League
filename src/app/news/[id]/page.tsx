import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { formatDate } from "@/lib/utils"

export const revalidate = 300

async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const news = await prisma.news.findUnique({ where: { id } })
  if (!news) notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="aspect-video bg-[var(--muted)] flex items-center justify-center overflow-hidden">
          {news.image && news.image !== "/placeholder-news.png" ? (
            <img src={news.image} alt={news.title} className="h-full w-full object-cover" />
          ) : (
            <span className="text-6xl">🏏</span>
          )}
        </div>
        <div className="p-8">
          <p className="mb-2 text-sm text-[var(--muted-foreground)]">{formatDate(news.createdAt)} &middot; {news.author}</p>
          <h1 className="mb-6 text-3xl font-bold">{news.title}</h1>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-[var(--foreground)]">
            {news.content}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewsDetailPage
