"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FlaskConical, Trophy, Loader2 } from "lucide-react"

export function WorkspaceSwitcher({ current }: { current: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const isPractice = current === "practice"

  async function switchTo(workspace: string) {
    setBusy(true)
    await fetch("/api/admin/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace }),
    })
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
      <div className="flex items-center gap-2">
        {isPractice ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-500">
            <FlaskConical className="h-3.5 w-3.5" /> PRACTICE MODE
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Trophy className="h-3.5 w-3.5" /> OFFICIAL SEASON
          </span>
        )}
        <span className="text-xs text-[var(--muted-foreground)]">
          Workspace: {isPractice ? "Practice" : "Official"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => switchTo("official")}
          disabled={!isPractice || busy}
          className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
            !isPractice ? "bg-[var(--accent)] text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted-foreground)]/20"
          } disabled:opacity-50`}
        >
          {busy && isPractice ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : "Official"}
        </button>
        <button
          onClick={() => switchTo("practice")}
          disabled={isPractice || busy}
          className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
            isPractice ? "bg-purple-600 text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted-foreground)]/20"
          } disabled:opacity-50`}
        >
          {busy && !isPractice ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : "Practice"}
        </button>
      </div>
    </div>
  )
}
