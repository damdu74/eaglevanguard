import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { EventStatus } from "@prisma/client"
import { createAuditLog } from "@/lib/audit"
import { hasCommunityPermission, isStaff as isStaffHelper } from "@/lib/permissions"

export const dynamic = "force-dynamic"

type Params = { params: { slug: string } }

async function getCommunityAndMembership(slug: string, userId?: string) {
  const community = await prisma.community.findUnique({
    where: { slug },
    select: { id: true, isPublic: true },
  })
  if (!community) return { community: null, membership: null }

  const membership = userId
    ? await prisma.membership.findFirst({
        where: { communityId: community.id, userId },
        include: { rank: { select: { permissions: true } } },
      })
    : null

  return { community, membership }
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id as string | undefined

  const { community, membership } = await getCommunityAndMembership(params.slug, userId)
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  if (!community.isPublic && !membership) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const isStaff = isStaffHelper(membership)

  const events = await prisma.event.findMany({
    where: {
      communityId: community.id,
      ...(!isStaff ? { status: { in: ["PUBLISHED", "ONGOING", "COMPLETED"] } } : {}),
    },
    include: {
      _count: { select: { participants: true } },
    },
    orderBy: { startDate: "asc" },
  })

  // Add current user participation status
  if (userId) {
    const participations = await prisma.eventParticipant.findMany({
      where: { userId, eventId: { in: events.map((e) => e.id) } },
      select: { eventId: true, status: true },
    })
    const participationMap = Object.fromEntries(participations.map((p) => [p.eventId, p.status]))
    return NextResponse.json(events.map((e) => ({ ...e, myStatus: participationMap[e.id] ?? null })))
  }

  return NextResponse.json(events.map((e) => ({ ...e, myStatus: null })))
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { community, membership } = await getCommunityAndMembership(params.slug, session.user.id)
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  if (!hasCommunityPermission(membership, "MANAGE_EVENTS")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const body = await req.json()
  const { title, description, type, status, startDate, endDate, maxSlots } = body

  if (!title?.trim() || !type || !startDate) {
    return NextResponse.json({ error: "Champs requis manquants (titre, type, date de début)" }, { status: 400 })
  }

  const start = new Date(startDate as string)
  const end = endDate ? new Date(endDate as string) : null
  if (end && end <= start) {
    return NextResponse.json({ error: "La date de fin doit être après la date de début" }, { status: 400 })
  }

  const event = await prisma.event.create({
    data: {
      communityId: community.id,
      title: (title as string).trim(),
      description: description ?? null,
      type: type as string,
      status: ((status as string) ?? "DRAFT") as EventStatus,
      startDate: start,
      endDate: end,
      maxSlots: maxSlots ? Number(maxSlots) : null,
    },
  })

  await createAuditLog({
    action: "EVENT_CREATED",
    description: `Événement « ${event.title} » créé (${event.status})`,
    actorId: session.user.id,
    communityId: community.id,
    metadata: { eventId: event.id, type: event.type, status: event.status },
  })

  return NextResponse.json(event, { status: 201 })
}
