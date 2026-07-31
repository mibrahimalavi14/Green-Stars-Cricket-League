"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Search, X } from "lucide-react"

type Result = { label: string; href: string; sub?: string }

export function SearchOverlay() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setOpen(o => !o) }
      if (e.key === "Escape") setOpen(false)
    }
    function onCustom() { setOpen(true) }
    window.addEventListener("keydown", onKey)
    window.addEventListener("open-search", onCustom)
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("open-search", onCustom) }
  }, [])

  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); return }
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const search = useCallback(async (q: string) => {
    setQuery(q)
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results || [])
    } catch { setResults([]) }
    setLoading(false)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-3">
          <Search className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => search(e.target.value)}
            placeholder="Search players, teams, jersey #, match no..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
          />
          <button onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--muted)] hover:bg-[var(--accent)]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {loading && <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">Searching...</p>}
          {!loading && query && results.length === 0 && (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">No results found</p>
          )}
          {!loading && !query && (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">Search players, teams, jersey #, match no, captain, umpire & POTM</p>
          )}
          {results.map((r, i) => {
            const iconMap: Record<string, string> = { player: "👤", team: "🏏", match: "⚔️", news: "📰", season: "🏆" }
            return (
              <Link key={i} href={r.href} onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-[var(--muted)]">
                <span className="text-base shrink-0">{(r as any).icon ? iconMap[(r as any).icon] || "🔗" : "🔗"}</span>
                <div className="min-w-0">
                  <span className="font-medium block truncate">{r.label}</span>
                  {r.sub && <span className="text-xs text-[var(--muted-foreground)]">{r.sub}</span>}
                </div>
              </Link>
            )
          })}
        </div>
        <div className="border-t border-[var(--border)] px-5 py-2 text-[10px] text-[var(--muted-foreground)]">
          Press <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono">Esc</kbd> to close · <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono">Ctrl+K</kbd> to open
        </div>
      </div>
    </div>
  )
}
