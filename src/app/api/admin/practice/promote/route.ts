import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { getClientIp } from "@/lib/rate-limit"
import { logAudit } from "@/lib/audit"
import { promotePracticeMatch } from "@/lib/practice"
import { getCurrentWorkspaceId, WORKSPACE_PRACTICE } from "@/lib/workspace"

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = await getCurrentWorkspaceId()
  if (workspaceId !== WORKSPACE_PRACTICE) {
    return NextResponse.json({ error: "Switch to PRACTICE MODE before promoting a match." }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { practiceMatchId } = body as { practiceMatchId?: string }
  if (!practiceMatchId) return NextResponse.json({ error: "practiceMatchId required" }, { status: 400 })

  try {
    const result = await promotePracticeMatch(practiceMatchId)
    logAudit({
      action: "practice_match_promoted",
      entity: "match",
      entityId: result.match.id,
      details: JSON.stringify({ practiceMatchId, squadCopied: result.squadCopied }),
      ip: getClientIp(req),
    })
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Promote failed" }, { status: 400 })
  }
}
