import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { verifySteamCallback, fetchSteamProfile } from "@/lib/steam"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const steamId = await verifySteamCallback(searchParams)
    if (!steamId) {
      return NextResponse.redirect(new URL("/auth/error?error=SteamVerificationFailed", req.url))
    }

    const profile = await fetchSteamProfile(steamId)

    // Find or create user
    let user = await prisma.user.findUnique({ where: { steamId } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          steamId,
          steamName: profile.name ?? null,
          steamAvatar: profile.image ?? null,
          name: profile.name ?? `Steam:${steamId}`,
          image: profile.image ?? null,
        },
      })
    } else {
      user = await prisma.user.update({
        where: { steamId },
        data: {
          steamName: profile.name ?? null,
          steamAvatar: profile.image ?? null,
          name: profile.name ?? user.name,
          ...(profile.image ? { image: profile.image } : {}),
        },
      })
    }

    // Create a short-lived one-time code in the database
    const code = randomBytes(32).toString("hex")
    await prisma.steamAuthCode.create({
      data: {
        code,
        userId: user.id,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
      },
    })

    // Redirect to intermediate page that signs in via NextAuth credentials
    return NextResponse.redirect(new URL(`/auth/steam/complete?code=${code}`, process.env.NEXTAUTH_URL))
  } catch (error) {
    console.error("[Steam Auth] Callback error:", error)
    const detail = error instanceof Error ? error.message : String(error)
    const base = process.env.NEXTAUTH_URL ?? req.url
    return NextResponse.redirect(
      new URL(`/auth/error?error=SteamAuthFailed&detail=${encodeURIComponent(detail)}`, base)
    )
  }
}
