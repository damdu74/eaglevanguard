import { NextRequest, NextResponse } from "next/server"
import { encode } from "next-auth/jwt"
import { verifySteamCallback, fetchSteamProfile } from "@/lib/steam"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // Verify Steam OpenID response
  const steamId = await verifySteamCallback(searchParams)
  if (!steamId) {
    return NextResponse.redirect(new URL("/auth/error?error=SteamVerificationFailed", req.url))
  }

  // Fetch Steam profile
  const profile = await fetchSteamProfile(steamId)

  // Find or create user
  let user = await prisma.user.findUnique({ where: { steamId } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        steamId,
        name: profile.name,
        image: profile.image,
      },
    })
  } else if (profile.name || profile.image) {
    // Update profile in case name/avatar changed
    user = await prisma.user.update({
      where: { steamId },
      data: {
        name: profile.name,
        ...(profile.image && { image: profile.image }),
      },
    })
  }

  // Create NextAuth-compatible JWT session token
  const token = await encode({
    token: {
      sub: user.id,
      name: user.name,
      email: user.email,
      picture: user.image,
    },
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  })

  // Set the session cookie and redirect to dashboard
  const isProd = process.env.NODE_ENV === "production"
  const cookieName = isProd ? "__Secure-next-auth.session-token" : "next-auth.session-token"

  const response = NextResponse.redirect(new URL("/dashboard", process.env.NEXTAUTH_URL))
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    secure: isProd,
  })

  return response
}
