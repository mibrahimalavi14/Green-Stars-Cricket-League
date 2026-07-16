import Link from "next/link"
import { NewsData } from "@/types"
import { formatDate } from "@/lib/utils"

export function NewsCard({ news }: { news: NewsData }) {
  return (
    <Link
      href={`/news/${news.id}`}
      className="group rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all hover:border-[var(--accent)] hover:shadow-lg"
    >
      <div className="aspect-video bg-[var(--muted)] flex items-center justify-center overflow-hidden">
        {news.title.toLowerCase().includes("schedule") || news.title.toLowerCase().includes("fixture") || news.title.toLowerCase().includes("match") || news.type === "match" || news.type === "schedule" ? (
          <div className="relative flex h-full w-full items-center justify-center">
            <span className="absolute left-2 top-2 text-5xl opacity-20 rotate-12">🏏</span>
            <span className="absolute right-3 bottom-2 text-4xl opacity-20 -rotate-12">🏏</span>
            <span className="absolute left-1/3 top-1/3 text-3xl opacity-15">⚪</span>
            <span className="text-4xl relative z-10">🏏</span>
          </div>
        ) : (
          <span className="text-4xl">🏏</span>
        )}
      </div>
      <div className="p-4">
        <p className="mb-1 text-xs text-[var(--muted-foreground)]">{formatDate(news.createdAt)}</p>
        <h3 className="mb-1 font-semibold group-hover:text-[var(--accent)]">{news.title}</h3>
        <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">{news.excerpt || news.content?.slice(0, 100)}</p>
      </div>
    </Link>
  )
}
