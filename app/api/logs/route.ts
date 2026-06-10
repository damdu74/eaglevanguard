import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkEagleVanguardPermission } from "@/lib/eagle-vanguard-auth"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  if (!await checkEagleVanguardPermission(session.user.id, "VIEW_LOGS")) {
    return NextResponse.json({ error: "Permission VIEW_LOGS requise" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 50
  const action = searchParams.get("action") ?? undefined
  const communityId = searchParams.get("communityId") ?? undefined
  const actorId = searchParams.get("actorId") ?? undefined
  const targetId = searchParams.get("targetId") ?? undefined

  const where = {
    ...(action && { action }),
    ...(communityId && { communityId }),
    ...(actorId && { actorId }),
    ...(targetId && { targetId }),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, name: true, steamName: true, customAvatar: true, steamAvatar: true, image: true } },
        target: { select: { id: true, name: true, steamName: true } },
        community: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) })
}
