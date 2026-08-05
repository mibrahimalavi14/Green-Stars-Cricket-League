"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock, LockOpen } from "lucide-react"

export function SeasonLockToggle({ seasonId, locked, reason }: { seasonId: string; locked: boolean; reason?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reasonVal, setReasonVal] = useState(reason || "")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")

  async function apply(nextLocked: boolean) {
    setBusy(true)
    setErr("")
    const res = await fetch("/api/admin/season-lock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seasonId, isLocked: nextLocked, reason: reasonVal }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) { setErr(data.error || "Failed to update"); return }
    setOpen(false)
    router.refresh()
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {locked ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-500">
          <Lock className="h-3.5 w-3.5" /> Season Locked{reason ? ` — ${reason}` : ""}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-500">
          <LockOpen className="h-3.5 w-3.5" /> Season Open
        </span>
      )}

      {!open ? (
        <button onClick={() => setOpen(true)}
          className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
            locked ? "bg-green-500/20 text-green-600 hover:bg-green-500/30" : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
          }`}>
          {locked ? "Unlock Season" : "Lock Season"}
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={reasonVal}
            onChange={e => setReasonVal(e.target.value)}
            placeholder="Reason (audit log)"
            className="w-64 rounded border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs"
          />
          <button onClick={() => locked ? apply(false) : apply(true)} disabled={busy}
            className={`flex items-center gap-1 rounded px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 ${
              locked ? "bg-green-600" : "bg-red-600"
            }`}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : locked ? <LockOpen className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            Confirm {locked ? "Unlock" : "Lock"}
          </button>
          <button onClick={() => setOpen(false)} className="rounded px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)]">Cancel</button>
        </div>
      )}
      {err && <p className="text-xs text-red-500">{err}</p>}
    </div>
  )
}
