import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const message = typeof body.message === "string" ? body.message.trim() : ""
  if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 })

  const data = {
    name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Hafiz Muhammad Ibrahim Alavi",
    title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Chairman, Green Stars Cricket League",
    message,
    photo: typeof body.photo === "string" && body.photo.trim() ? body.photo.trim() : "/images/optimized/chairman.webp",
    showSignature: body.showSignature !== false,
    active: body.active !== false,
  }

  let row
  if (typeof body.id === "string" && body.id) {
    row = await prisma.chairmanMessage.update({ where: { id: body.id }, data })
  } else {
    row = await prisma.chairmanMessage.create({ data })
  }

  return NextResponse.json(row)
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  await prisma.chairmanMessage.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
