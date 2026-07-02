import Link from "next/link"
import { NewsData } from "@/types"
import { formatDate } from "@/lib/utils"

export function NewsCard({ news }: { news: NewsData }) {
  return (
    <Link
      href={`/news/${news.id}`}
      className="group rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all hover:border-[var(--accent)] hover:shadow-lg"
    >
      <div className="aspect-video bg-[var(--muted)] flex items-center justify-center">
        <span className="text-4xl">🏏</span>
      </div>
      <div className="p-4">
        <p className="mb-1 text-xs text-[var(--muted-foreground)]">{formatDate(news.createdAt)}</p>
        <h3 className="mb-1 font-semibold group-hover:text-[var(--accent)]">{news.title}</h3>
        <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">{news.excerpt || news.content?.slice(0, 100)}</p>
      </div>
    </Link>
  )
}
