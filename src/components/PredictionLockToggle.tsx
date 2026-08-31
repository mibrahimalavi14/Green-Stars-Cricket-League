"use client"

import { useRouter } from "next/navigation"

export function PredictionLockToggle({ seasonId, locked }: { seasonId: string; locked: boolean }) {
  const router = useRouter()

  async function toggle() {
    await fetch("/api/seasons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: seasonId, scheduleAnnounced: !locked }),
    })
    router.refresh()
  }

  return (
    <button onClick={toggle}
      className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
        locked ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-green-500/20 text-green-500 hover:bg-green-500/30"
      }`}>
      {locked ? "Hide Schedule" : "Announce Schedule"}
    </button>
  )
}
