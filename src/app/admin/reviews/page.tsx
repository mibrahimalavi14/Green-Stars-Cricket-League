import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({ orderBy: { createdAt: "desc" } })
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminReviewsPage
