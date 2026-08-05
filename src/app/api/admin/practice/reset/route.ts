import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { getClientIp } from "@/lib/rate-limit"
import { logAudit } from "@/lib/audit"
import { resetPractice } from "@/lib/practice"
import { getCurrentWorkspaceId, WORKSPACE_PRACTICE } from "@/lib/workspace"

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = await getCurrentWorkspaceId()
  if (workspaceId !== WORKSPACE_PRACTICE) {
    return NextResponse.json({ error: "Switch to PRACTICE MODE before resetting practice data." }, { status: 403 })
  }

  try {
    const result = await resetPractice()
    logAudit({
      action: "practice_reset",
      entity: "workspace",
      entityId: WORKSPACE_PRACTICE,
      details: JSON.stringify(result),
      ip: getClientIp(req),
    })
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Reset failed" }, { status: 400 })
  }
}
