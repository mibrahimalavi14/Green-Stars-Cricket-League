import { prisma } from "@/lib/prisma"
import { AdminChairmanMessageForm } from "@/components/AdminChairmanMessageForm"
import { AdminDeleteButton } from "@/components/AdminDeleteButton"

export const dynamic = "force-dynamic"

async function AdminChairmanMessagePage() {
  const row = await prisma.chairmanMessage.findFirst({ orderBy: { updatedAt: "desc" } })

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Chairman&apos;s Message</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">
        Edit the message that appears in the Chairman&apos;s Message section on the home page.
      </p>

      <AdminChairmanMessageForm
        defaults={row ? { id: row.id, name: row.name, title: row.title, message: row.message, photo: row.photo, showSignature: row.showSignature, active: row.active } : null}
      />

      {row && (
        <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-sm font-semibold">Current saved message</p>
          <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[var(--muted-foreground)]">{row.message}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[var(--muted-foreground)]">
              {row.active ? "Visible on home page" : "Hidden from home page"} · Signature: {row.showSignature ? "shown" : "hidden"}
            </p>
            <AdminDeleteButton api="/api/admin/chairman-message" id={row.id} label="message" />
          </div>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Delete karne par home page purana default message dikhata hai.
          </p>
        </div>
      )}
    </div>
  )
}

export default AdminChairmanMessagePage
