"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw } from "lucide-react"

export function AdminResetStats({ id, teamId }: { id?: string; teamId?: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleReset() {
    if (teamId) {
      if (!confirm("Reset ALL stats for this team?")) return
    } else {
      if (!confirm("Reset stats for this player?")) return
    }
    setLoading(true)
    await fetch("/api/players", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(teamId ? { resetTeamStats: true, teamId } : { resetStats: true, id }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={handleReset} disabled={loading}
      className="rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      title={teamId ? "Reset all stats for this team" : "Reset stats"}>
      {loading ? "..." : <RotateCcw className="h-3 w-3" />}
    </button>
  )
}