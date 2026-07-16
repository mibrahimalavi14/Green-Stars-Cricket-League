"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X } from "lucide-react"

interface NewsItem {
  id: string
  title: string
  excerpt: string
  createdAt: string
  type: string
}

export function NewsNotification({ news }: { news: NewsItem | null }) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (!news) return
    const stored = localStorage.getItem("dismissedNews")
    const dismissedIds = stored ? JSON.parse(stored) : []
    if (!dismissedIds.includes(news.id)) {
      setDismissed(false)
    }
  }, [news])

  if (!news || dismissed) return null

  function handleDismiss() {
    setDismissed(true)
    if (!news) return
    const stored = localStorage.getItem("dismissedNews")
    const dismissedIds = stored ? JSON.parse(stored) : []
    dismissedIds.push(news.id)
    localStorage.setItem("dismissedNews", JSON.stringify(dismissedIds))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="relative max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-3 text-4xl text-center">🏏</div>
        <h3 className="mb-1 text-lg font-bold">{news.title}</h3>
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">{news.excerpt}</p>
        <div className="flex gap-2">
          <Link
            href={`/news/${news.id}`}
            onClick={handleDismiss}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Read More
          </Link>
          <button
            onClick={handleDismiss}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--muted)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
