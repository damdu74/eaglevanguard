import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { EventStatus } from "@prisma/client"
import { createAuditLog } from "@/lib/audit"
import { hasCommunityPermission, isStaff as isStaffHelper } from "@/lib/permissions"

const VALID_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  DRAFT:      ["PUBLISHED", "CANCELLED"],
  PUBLISHED:  ["DRAFT", "ONGOING", "CANCELLED"],
  ONGOING:    ["PUBLISHED", "DRAFT", "CANCELLED"],
  COMPLETED:  ["PUBLISHED", "DRAFT", "ARCHIVED"],
  CANCELLED:  ["DRAFT", "PUBLISHED"],
  ARCHIVED:   [],
}

export const dynamic = "force-dynamic"

type Params = { params: { slug: string; id: string } }

async function getEventWithAccess(slug: string, eventId: string, userId?: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, community: { slug } },
    include: {
      community: { select: { id: true, isPublic: true } },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              steamName: true,
              discordName: true,
              name: true,
              customAvatar: true,
              steamAvatar: true,
              discordAvatar: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { participants: true } },
    },
  })
  if (!event) return { event: null, membership: null }

  const membership = userId
    ? await prisma.membership.findFirst({
        where: { communityId: event.community.id, userId },
        include: { rank: { select: { permissions: true } } },
      })
    : null

  return { event, membership }
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id as string | undefined

  const { event, membership } = await getEventWithAccess(params.slug, params.id, userId)
  if (!event) return NextResponse.json({ error: "Événement introuvable" }, { status: 404 })

  if (!event.community.isPublic && !membership) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const isStaff = isStaffHelper(membership)
  if (event.status === "DRAFT" && !isStaff) {
    return NextResponse.json({ error: "Événement introuvable" }, { status: 404 })
  }

  const myParticipation = userId
    ? event.participants.find((p) => p.userId === userId) ?? null
    : null

  return NextResponse.json({ ...event, myStatus: myParticipation?.status ?? null })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { event, membership } = await getEventWithAccess(params.slug, params.id, session.user.id)
  if (!event) return NextResponse.json({ error: "Événement introuvable" }, { status: 404 })

  if (!hasCommunityPermission(membership, "MANAGE_EVENTS")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const body = await req.json()
  const { title, description, type, status, startDate, endDate, maxSlots } = body

  const start = startDate ? new Date(startDate as string) : event.startDate
  const end = endDate !== undefined ? (endDate ? new Date(endDate as string) : null) : event.endDate
  if (end && end <= start) {
    return NextResponse.json({ error: "La date de fin doit être après la date de début" }, { status: 400 })
  }

  // Statut explicite uniquement (Brouillon ↔ Publié ↔ Annulé)
  // Le statut affiché (À venir / En cours / Terminé) est calculé depuis les dates, pas stocké
  const finalStatus: EventStatus | undefined = status as EventStatus | undefined
  if (finalStatus !== undefined) {
    const current = event.status as EventStatus
    if (current !== finalStatus && !VALID_TRANSITIONS[current]?.includes(finalStatus)) {
      return NextResponse.json(
        { error: `Transition invalide : ${current} → ${finalStatus}` },
        { status: 400 }
      )
    }
  }

  const updated = await prisma.event.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title: (title as string).trim() }),
      ...(description !== undefined && { description: description ?? null }),
      ...(type !== undefined && { type: type as string }),
      ...(finalStatus !== undefined && { status: finalStatus }),
      ...(startDate !== undefined && { startDate: start }),
      ...(endDate !== undefined && { endDate: end }),
      ...(maxSlots !== undefined && { maxSlots: maxSlots ? Number(maxSlots) : null }),
    },
  })

  if (finalStatus !== undefined && finalStatus !== event.status) {
    await createAuditLog({
      action: "EVENT_STATUS_CHANGED",
      description: `Statut de « ${updated.title} » changé : ${event.status} → ${finalStatus}`,
      actorId: session.user.id,
      communityId: event.community.id,
      metadata: { eventId: params.id, from: event.status, to: finalStatus },
    })
  } else if (title !== undefined || description !== undefined) {
    await createAuditLog({
      action: "EVENT_UPDATED",
      description: `Événement « ${updated.title} » modifié`,
      actorId: session.user.id,
      communityId: event.community.id,
      metadata: { eventId: params.id },
    })
  }

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { event, membership } = await getEventWithAccess(params.slug, params.id, session.user.id)
  if (!event) return NextResponse.json({ error: "Événement introuvable" }, { status: 404 })

  if (!hasCommunityPermission(membership, "MANAGE_EVENTS")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  await createAuditLog({
    action: "EVENT_DELETED",
    description: `Événement « ${event.title} » supprimé`,
    actorId: session.user.id,
    communityId: event.community.id,
    metadata: { eventId: params.id, title: event.title },
  })

  await prisma.event.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
