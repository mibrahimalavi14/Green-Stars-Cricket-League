import { getCurrentWorkspaceId } from "@/lib/workspace"
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const workspace = await getCurrentWorkspaceId()

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <WorkspaceSwitcher current={workspace} />
      </div>
      {children}
    </>
  )
}
