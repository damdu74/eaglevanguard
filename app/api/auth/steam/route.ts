import { NextResponse } from "next/server"
import { buildSteamLoginUrl } from "@/lib/steam"

export async function GET() {
  const callbackUrl = `${process.env.NEXTAUTH_URL}/api/auth/steam/callback`
  const steamUrl = buildSteamLoginUrl(callbackUrl)
  return NextResponse.redirect(steamUrl)
}
