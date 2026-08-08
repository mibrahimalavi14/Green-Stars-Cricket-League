import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookie = req.headers.get("cookie") || ""
    if (!cookie.includes("admin_auth=true")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await prisma.pushSubscription.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 })
  }
}
