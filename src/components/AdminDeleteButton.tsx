"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

export function AdminDeleteButton({ api, id, label }: { api: string; id: string; label?: string }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Delete this ${label || "item"}? This cannot be undone.`)) return
    setDeleting(true)
    await fetch(api, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setDeleting(false)
    router.refresh()
  }

  return (
    <button onClick={handleDelete} disabled={deleting}
      className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50">
      {deleting ? "..." : <Trash2 className="h-3 w-3" />}
    </button>
  )
}