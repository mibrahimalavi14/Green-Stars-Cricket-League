import { prisma } from "@/lib/prisma"
import { AdminManagementForm } from "@/components/AdminManagementForm"
import { AdminManagementRow } from "@/components/AdminManagementRow"

export const dynamic = "force-dynamic"

async function AdminManagementPage() {
  const members = await prisma.managementMember.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Management Members</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">
        Add, edit, hide or remove the management members shown on the /management page.
      </p>

      <div className="mb-8">
        <AdminManagementForm />
      </div>

      <div className="space-y-3">
        {members.map((m) => (
          <AdminManagementRow key={m.id} member={m} />
        ))}
        {members.length === 0 && (
          <p className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]">
            No members yet — use the form above to add the first one.
          </p>
        )}
      </div>
    </div>
  )
}

export default AdminManagementPage
