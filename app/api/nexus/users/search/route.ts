import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isNexusTeam) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { success } = rateLimit(`search:${session.user.id}`, 30, 60_000)
  if (!success) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 })

  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2 || q.length > 50) return NextResponse.json([])

  const users = await prisma.user.findMany({
    where: {
      isNexusTeam: false,
      OR: [
        { steamName: { contains: q, mode: "insensitive" } },
        { discordName: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      steamName: true,
      discordName: true,
      name: true,
      customAvatar: true,
      steamAvatar: true,
      discordAvatar: true,
      image: true,
    },
    take: 8,
  })

  return NextResponse.json(users)
}
