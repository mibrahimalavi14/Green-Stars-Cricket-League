import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { WORKSPACE_OFFICIAL, WORKSPACE_PRACTICE, WORKSPACE_COOKIE } from "@/lib/workspace"

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const value = body.workspace === WORKSPACE_PRACTICE ? WORKSPACE_PRACTICE : WORKSPACE_OFFICIAL

  const res = NextResponse.json({ success: true, workspace: value })
  res.cookies.set(WORKSPACE_COOKIE, value, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  })
  return res
}
