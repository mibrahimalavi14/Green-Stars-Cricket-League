"use client"

import { Link2, Facebook, Twitter } from "lucide-react"
import { useState } from "react"

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url

  async function copyLink() {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--muted-foreground)]">Share:</span>
      <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, "_blank", "width=600,height=400")}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--muted)] transition-colors hover:bg-[var(--accent)]" aria-label="Share on Facebook">
        <Facebook className="h-4 w-4" />
      </button>
      <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`, "_blank", "width=600,height=400")}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--muted)] transition-colors hover:bg-[var(--accent)]" aria-label="Share on Twitter">
        <Twitter className="h-4 w-4" />
      </button>
      <button onClick={copyLink}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--muted)] transition-colors hover:bg-[var(--accent)]" aria-label="Copy link">
        <Link2 className="h-4 w-4" />
      </button>
      {copied && <span className="text-xs text-green-500">Copied!</span>}
    </div>
  )
}
