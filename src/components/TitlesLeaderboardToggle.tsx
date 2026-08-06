"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff } from "lucide-react"

export function TitlesLeaderboardToggle() {
  const router = useRouter()
  const [visible, setVisible] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")

  useEffect(() => {
    fetch("/api/admin/leaderboard-visibility")
      .then(r => r.json())
      .then(d => setVisible(Boolean(d.titlesLeaderboardVisible)))
      .catch(() => setVisible(true))
  }, [])

  async function toggle() {
    if (visible === null) return
    setBusy(true)
    setErr("")
    const res = await fetch("/api/admin/leaderboard-visibility", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titlesLeaderboardVisible: !visible }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) { setErr(data.error || "Failed to update"); return }
    setVisible(data.titlesLeaderboardVisible)
    router.refresh()
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        visible === null ? "bg-gray-500/15 text-gray-500" :
        visible ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"
      }`}>
        {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        Titles Leaderboard {visible === null ? "…" : visible ? "Visible" : "Hidden"}
      </span>
      <button onClick={toggle} disabled={busy || visible === null}
        className={`flex items-center gap-1 rounded px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
          visible ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
        }`}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        {visible ? "Hide" : "Show"}
      </button>
      {err && <p className="text-xs text-red-500">{err}</p>}
    </div>
  )
}
