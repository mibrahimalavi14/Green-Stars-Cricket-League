import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/admin/login") || pathname.startsWith("/api/")) return NextResponse.next()

  if (pathname.startsWith("/admin")) {
    const adminAuth = request.cookies.get("admin_auth")
    if (!adminAuth || adminAuth.value !== "true") {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
