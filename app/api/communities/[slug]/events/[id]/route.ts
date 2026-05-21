import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { EventStatus } from "@prisma/client"

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

  const isStaff = membership && ["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)
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

  if (!membership || !["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const body = await req.json()
  const { title, description, type, status, startDate, endDate, maxSlots } = body

  const start = startDate ? new Date(startDate as string) : event.startDate
  const end = endDate !== undefined ? (endDate ? new Date(endDate as string) : null) : event.endDate
  if (end && end <= start) {
    return NextResponse.json({ error: "La date de fin doit être après la date de début" }, { status: 400 })
  }

  const updated = await prisma.event.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title: (title as string).trim() }),
      ...(description !== undefined && { description: description ?? null }),
      ...(type !== undefined && { type: type as string }),
      ...(status !== undefined && { status: status as EventStatus }),
      ...(startDate !== undefined && { startDate: start }),
      ...(endDate !== undefined && { endDate: end }),
      ...(maxSlots !== undefined && { maxSlots: maxSlots ? Number(maxSlots) : null }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { event, membership } = await getEventWithAccess(params.slug, params.id, session.user.id)
  if (!event) return NextResponse.json({ error: "Événement introuvable" }, { status: 404 })

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  await prisma.event.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
