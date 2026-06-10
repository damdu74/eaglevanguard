import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ModerationActionType, Prisma } from "@prisma/client"
import { z } from "zod"
import { createAuditLog } from "@/lib/audit"
import { hasCommunityPermission } from "@/lib/permissions"

const createSchema = z.object({
  type: z.enum(["WARN", "KICK", "BAN_COMMUNITY", "UNBAN"]),
  targetId: z.string(),
  reason: z.string().min(1).max(500),
  note: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
})

async function getModerateMembership(userId: string, communityId: string) {
  return prisma.membership.findFirst({
    where: { userId, communityId },
    include: { rank: { select: { permissions: true } } },
  })
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug }, select: { id: true } })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const staff = await getModerateMembership(session.user.id, community.id)
  const eagleVanguardUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isEagleVanguardTeam: true } })
  if (!hasCommunityPermission(staff, "MODERATE") && !eagleVanguardUser?.isEagleVanguardTeam) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 20
  const type = searchParams.get("type") ?? undefined
  const targetId = searchParams.get("targetId") ?? undefined
  const moderatorId = searchParams.get("moderatorId") ?? undefined

  const where = {
    communityId: community.id,
    ...(type && { type: type as ModerationActionType }),
    ...(targetId && { targetId }),
    ...(moderatorId && { moderatorId }),
  }

  const [actions, total] = await Promise.all([
    prisma.moderationAction.findMany({
      where,
      include: {
        target: { select: { id: true, name: true, steamName: true, image: true, steamAvatar: true, customAvatar: true } },
        moderator: { select: { id: true, name: true, steamName: true } },
        resolvedBy: { select: { id: true, name: true, steamName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.moderationAction.count({ where }),
  ])

  return NextResponse.json({ actions, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug }, select: { id: true, name: true } })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const staff = await getModerateMembership(session.user.id, community.id)
  if (!hasCommunityPermission(staff, "MODERATE")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 })

  const { type, targetId, reason, note, expiresAt } = parsed.data

  if (targetId === session.user.id) return NextResponse.json({ error: "Impossible de se sanctionner soi-même" }, { status: 400 })

  const targetMembership = await prisma.membership.findUnique({
    where: { userId_communityId: { userId: targetId, communityId: community.id } },
  })

  // Un non-OWNER ne peut pas sanctionner un autre OWNER
  if (targetMembership?.role === "OWNER" && staff?.role !== "OWNER") {
    return NextResponse.json({ error: "Hiérarchie insuffisante" }, { status: 403 })
  }

  const action = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const a = await tx.moderationAction.create({
      data: {
        type,
        reason,
        note,
        targetId,
        moderatorId: session.user.id,
        communityId: community.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        target: { select: { id: true, name: true, steamName: true } },
        moderator: { select: { id: true, name: true, steamName: true } },
      },
    })

    if (type === "KICK" || type === "BAN_COMMUNITY") {
      await tx.membership.deleteMany({ where: { userId: targetId, communityId: community.id } })
    }

    return a
  })

  const actionLabels: Record<string, string> = {
    WARN: "Avertissement", KICK: "Expulsion", BAN_COMMUNITY: "Ban communauté", UNBAN: "Levée de sanction",
  }
  await createAuditLog({
    action: `MODERATION_${type}` as Parameters<typeof createAuditLog>[0]["action"],
    description: `${actionLabels[type]} — ${reason}`,
    actorId: session.user.id,
    targetId,
    communityId: community.id,
    metadata: { moderationActionId: action.id, reason },
  })

  return NextResponse.json(action, { status: 201 })
}
