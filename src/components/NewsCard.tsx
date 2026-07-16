import Link from "next/link"
import { NewsData } from "@/types"
import { formatDate } from "@/lib/utils"

export function NewsCard({ news }: { news: NewsData }) {
  return (
    <Link
      href={`/news/${news.id}`}
      className="group rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all hover:border-[var(--accent)] hover:shadow-lg"
    >
      <div className={`aspect-video flex items-center justify-center overflow-hidden ${
        news.type === "schedule" || news.type === "match" ? "bg-gradient-to-br from-green-700 via-green-600 to-lime-700" :
        news.type === "team" ? "bg-gradient-to-br from-blue-700 via-indigo-600 to-purple-700" :
        "bg-gradient-to-br from-amber-700 via-orange-600 to-red-700"
      }`}>
        {news.type === "schedule" || news.type === "match" ? (
          <div className="relative flex h-full w-full items-center justify-center">
            <span className="text-5xl opacity-30">📅</span>
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }} />
          </div>
        ) : news.type === "team" ? (
          <div className="relative flex h-full w-full items-center justify-center">
            <span className="text-5xl opacity-30">👥</span>
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }} />
          </div>
        ) : (
          <div className="relative flex h-full w-full items-center justify-center">
            <span className="text-5xl opacity-30">📢</span>
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }} />
          </div>
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
