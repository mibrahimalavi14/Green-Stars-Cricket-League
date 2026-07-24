import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const entity = searchParams.get("entity") || undefined
  const entityId = searchParams.get("entityId") || undefined
  const action = searchParams.get("action") || undefined
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)

  const where: Record<string, string> = {}
  if (entity) where.entity = entity
  if (entityId) where.entityId = entityId
  if (action) where.action = action

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return NextResponse.json(logs)
}
