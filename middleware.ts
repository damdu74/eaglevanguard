import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/settings",
  "/communities/new",
  "/communities/mine",
  "/players",
  "/members",
  "/nexus",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Block suspicious path traversal attempts
  if (pathname.includes("..") || pathname.includes("//")) {
    return new NextResponse("Bad Request", { status: 400 })
  }

  // Protect dashboard routes
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  if (isProtected) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = "/auth/signin"
      return NextResponse.redirect(url)
    }
  }

  // Block oversized API requests (> 2MB)
  if (pathname.startsWith("/api/")) {
    const contentLength = req.headers.get("content-length")
    if (contentLength && parseInt(contentLength) > 2 * 1024 * 1024) {
      return new NextResponse("Payload Too Large", { status: 413 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|logo.png|steam-logo.svg|discord-logo.svg).*)"],
}
