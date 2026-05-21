import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  const stateCookie = req.cookies.get("discord_link_state")?.value
  if (!stateCookie || !code || !state) {
    return NextResponse.redirect(new URL("/profile?error=discord_link_failed", req.url))
  }

  const [cookieState, userId] = stateCookie.split(":")
  if (cookieState !== state || !userId) {
    return NextResponse.redirect(new URL("/profile?error=discord_link_failed", req.url))
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/discord-link/callback`,
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/profile?error=discord_link_failed", req.url))
  }

  const { access_token } = await tokenRes.json()

  // Fetch Discord user info
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (!userRes.ok) {
    return NextResponse.redirect(new URL("/profile?error=discord_link_failed", req.url))
  }

  const discordUser = await userRes.json()
  const discordAvatar = discordUser.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
    : null

  // Link Discord to existing user
  await prisma.user.update({
    where: { id: userId },
    data: {
      discordId: discordUser.id,
      discordName: discordUser.global_name ?? discordUser.username,
      discordAvatar: discordAvatar ?? undefined,
    },
  })

  const response = NextResponse.redirect(new URL("/profile?discord_linked=true", req.url))
  response.cookies.delete("discord_link_state")
  return response
}
