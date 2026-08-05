import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { getPracticeReport } from "@/lib/practice"

export const dynamic = "force-dynamic"

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const report = await getPracticeReport()
    return NextResponse.json(report)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Report failed" }, { status: 500 })
  }
}
