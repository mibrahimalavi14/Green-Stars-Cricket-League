"use client"

import { useState, useEffect } from "react"

type Review = { id: string; name: string; email: string; rating: number; comment: string; approved: boolean; createdAt: string }

function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])

  async function load() {
    const res = await fetch("/api/reviews")
    const d = await res.json()
    setReviews(d.reviews)
  }

  useEffect(() => { load() }, [])

  async function toggleApproval(id: string, approved: boolean) {
    await fetch(`/api/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approved }) })
    load()
  }

  async function remove(id: string) {
    if (!confirm("Delete this review?")) return
    await fetch(`/api/reviews/${id}`, { method: "DELETE" })
    load()
  }

  const approvedCount = reviews.filter(r => r.approved).length

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-1 text-3xl font-bold">Reviews</h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">{approvedCount} approved · {reviews.length - approvedCount} pending</p>

      {reviews.length === 0 ? (
        <p className="py-12 text-center text-[var(--muted-foreground)]">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className={`rounded-lg border p-4 ${r.approved ? "border-[var(--border)] bg-[var(--card)]" : "border-yellow-500/50 bg-yellow-500/5"}`}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{r.name}</span>
                  <span className="text-yellow-400">{r.rating}/5</span>
                  {!r.approved && <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-600 dark:text-yellow-400">Pending</span>}
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">{new Date(r.createdAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}</p>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">{r.comment}</p>
              {r.email && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{r.email}</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => toggleApproval(r.id, !r.approved)}
                  className={`rounded px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80 ${r.approved ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" : "bg-green-500/20 text-green-700 dark:text-green-400"}`}>
                  {r.approved ? "Unapprove" : "Approve"}
                </button>
                <button onClick={() => remove(r.id)}
                  className="rounded bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-700 transition-opacity hover:opacity-80 dark:text-red-400">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminReviewsPage
