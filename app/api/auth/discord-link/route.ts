import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { randomBytes } from "crypto"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  const state = randomBytes(16).toString("hex")
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/discord-link/callback`,
    response_type: "code",
    scope: "identify",
    state,
  })

  const response = NextResponse.redirect(`https://discord.com/oauth2/authorize?${params}`)
  // Store state + userId in a short-lived cookie for CSRF protection
  response.cookies.set("discord_link_state", `${state}:${session.user.id}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 300, // 5 minutes
    secure: process.env.NODE_ENV === "production",
  })

  return response
}
