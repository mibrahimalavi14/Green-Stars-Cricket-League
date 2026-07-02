import { prisma } from "@/lib/prisma"
import { AdminNewsForm } from "@/components/AdminNewsForm"

async function AdminNewsPage() {
  const newsList = await prisma.news.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Manage News</h1>
      <div className="mb-8"><AdminNewsForm /></div>
      <div className="space-y-3">
        {newsList.map((n) => (
          <div key={n.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{n.published ? "Published" : "Draft"} &middot; {n.author}</p>
              </div>
            </div>
          </div>
        ))}
        {newsList.length === 0 && <p className="text-center py-8 text-[var(--muted-foreground)]">No articles yet.</p>}
      </div>
    </div>
  )
}

export default AdminNewsPage
