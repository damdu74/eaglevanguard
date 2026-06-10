import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasCommunityPermission } from "@/lib/permissions"

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug }, select: { id: true } })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const [membership, eagleVanguardUser] = await Promise.all([
    prisma.membership.findFirst({
      where: { userId: session.user.id, communityId: community.id },
      include: { rank: { select: { permissions: true } } },
    }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { isEagleVanguardTeam: true } }),
  ])
  if (!hasCommunityPermission(membership, "VIEW_LOGS") && !eagleVanguardUser?.isEagleVanguardTeam) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 50
  const action = searchParams.get("action") ?? undefined
  const actorId = searchParams.get("actorId") ?? undefined
  const targetId = searchParams.get("targetId") ?? undefined

  const where = {
    communityId: community.id,
    ...(action && { action }),
    ...(actorId && { actorId }),
    ...(targetId && { targetId }),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, name: true, steamName: true, customAvatar: true, steamAvatar: true, image: true } },
        target: { select: { id: true, name: true, steamName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) })
}
