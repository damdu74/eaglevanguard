import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isEagleVanguardTeam) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const members = await prisma.user.findMany({
    where: { isEagleVanguardTeam: true },
    select: {
      id: true,
      steamName: true,
      discordName: true,
      name: true,
      customAvatar: true,
      steamAvatar: true,
      discordAvatar: true,
      eagleVanguardRankId: true,
      eagleVanguardRank: true,
    },
    orderBy: [
      { eagleVanguardRank: { order: "asc" } },
      { createdAt: "asc" },
    ],
  })

  return NextResponse.json(members)
}
