import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ModerationActionType, Prisma } from "@prisma/client"
import { z } from "zod"
import { createAuditLog } from "@/lib/audit"
import { checkNexusPermission, getNexusActor } from "@/lib/nexus-auth"
import { hasNexusPermission } from "@/lib/permissions"

const createSchema = z.object({
  type: z.enum(["WARN", "KICK", "BAN_COMMUNITY", "BAN_PLATFORM", "UNBAN"]),
  targetId: z.string(),
  communityId: z.string().optional(),
  reason: z.string().min(1).max(500),
  note: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!await checkNexusPermission(session.user.id, "GLOBAL_MODERATION")) {
    return NextResponse.json({ error: "Permission GLOBAL_MODERATION requise" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 20
  const type = searchParams.get("type") ?? undefined
  const targetId = searchParams.get("targetId") ?? undefined
  const communityId = searchParams.get("communityId") ?? undefined

  const where = {
    ...(type && { type: type as ModerationActionType }),
    ...(targetId && { targetId }),
    ...(communityId && { communityId }),
  }

  const [actions, total] = await Promise.all([
    prisma.moderationAction.findMany({
      where,
      include: {
        target: { select: { id: true, name: true, steamName: true, image: true, steamAvatar: true, customAvatar: true } },
        moderator: { select: { id: true, name: true, steamName: true, image: true, steamAvatar: true, customAvatar: true } },
        community: { select: { id: true, name: true, slug: true, logoUrl: true } },
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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const actor = await getNexusActor(session.user.id)
  if (!actor?.isNexusTeam) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  if (!hasNexusPermission(actor.nexusRank, "GLOBAL_MODERATION")) {
    return NextResponse.json({ error: "Permission GLOBAL_MODERATION requise" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 })

  const { type, targetId, communityId, reason, note, expiresAt } = parsed.data

  const target = await prisma.user.findUnique({ where: { id: targetId } })
  if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })

  if (type === "BAN_PLATFORM" && communityId) {
    return NextResponse.json({ error: "Un ban plateforme ne peut pas être lié à une communauté" }, { status: 400 })
  }

  if ((type === "BAN_PLATFORM" || type === "UNBAN") && !hasNexusPermission(actor.nexusRank, "BAN_PLATFORM")) {
    return NextResponse.json({ error: "Permission BAN_PLATFORM requise" }, { status: 403 })
  }

  const action = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const a = await tx.moderationAction.create({
      data: {
        type,
        reason,
        note,
        targetId,
        moderatorId: session.user.id,
        communityId: communityId ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        target: { select: { id: true, name: true, steamName: true } },
        moderator: { select: { id: true, name: true, steamName: true } },
        community: { select: { id: true, name: true, slug: true } },
      },
    })

    if (type === "BAN_PLATFORM") {
      await tx.user.update({ where: { id: targetId }, data: { isBannedFromPlatform: true } })
    }

    if (type === "UNBAN") {
      await tx.user.update({ where: { id: targetId }, data: { isBannedFromPlatform: false } })
    }

    if (type === "KICK" && communityId) {
      await tx.membership.deleteMany({ where: { userId: targetId, communityId } })
    }

    return a
  })

  const actionLabels: Record<string, string> = {
    WARN: "Avertissement", KICK: "Expulsion", BAN_COMMUNITY: "Ban communauté",
    BAN_PLATFORM: "Ban plateforme", UNBAN: "Levée de sanction",
  }
  await createAuditLog({
    action: `MODERATION_${type}` as Parameters<typeof createAuditLog>[0]["action"],
    description: `${actionLabels[type]} — ${reason}`,
    actorId: session.user.id,
    targetId,
    communityId: communityId ?? null,
    metadata: { moderationActionId: action.id, reason },
  })

  return NextResponse.json(action, { status: 201 })
}
