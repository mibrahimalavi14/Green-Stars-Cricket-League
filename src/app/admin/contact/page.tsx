import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

async function AdminContactPage() {
  const messages = await prisma.contact.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Contact Messages</h1>
      {messages.length === 0 ? (
        <p className="py-12 text-center text-[var(--muted-foreground)]">No messages yet.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{msg.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{msg.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {msg.purpose === "sponsorship" && (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">Sponsorship</span>
                  )}
                  <p className="text-xs text-[var(--muted-foreground)]">{new Date(msg.createdAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}</p>
                </div>
              </div>
              {msg.purpose === "sponsorship" && (msg.company || msg.phone || msg.sponsorshipType || msg.budgetRange) && (
                <div className="mb-2 flex flex-wrap gap-2 text-xs">
                  {msg.company && <span className="rounded bg-[var(--muted)] px-2 py-0.5">{msg.company}</span>}
                  {msg.phone && <span className="rounded bg-[var(--muted)] px-2 py-0.5">{msg.phone}</span>}
                  {msg.sponsorshipType && <span className="rounded bg-[var(--muted)] px-2 py-0.5">{msg.sponsorshipType}</span>}
                  {msg.budgetRange && <span className="rounded bg-[var(--muted)] px-2 py-0.5">{msg.budgetRange}</span>}
                </div>
              )}
              {msg.subject && <p className="mb-1 text-xs font-semibold">{msg.subject}</p>}
              <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminContactPage
