import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const users = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
      visibility: { not: "PRIVATE" },
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
    take: 10,
  })

  return NextResponse.json(users)
}
