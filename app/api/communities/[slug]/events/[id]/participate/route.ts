import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

type Params = { params: { slug: string; id: string } }

async function getEventAndMembership(slug: string, eventId: string, userId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, community: { slug } },
    include: {
      community: { select: { id: true } },
      _count: { select: { participants: { where: { status: { in: ["CONFIRMED", "TENTATIVE"] } } } } },
    },
  })
  if (!event) return { event: null, membership: null }

  const membership = await prisma.membership.findFirst({
    where: { communityId: event.community.id, userId },
  })

  return { event, membership }
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { event, membership } = await getEventAndMembership(params.slug, params.id, session.user.id)
  if (!event) return NextResponse.json({ error: "Événement introuvable" }, { status: 404 })
  if (!membership) return NextResponse.json({ error: "Vous devez être membre pour participer" }, { status: 403 })

  if (!["PUBLISHED", "ONGOING"].includes(event.status)) {
    return NextResponse.json({ error: "Les inscriptions ne sont pas ouvertes" }, { status: 400 })
  }

  const body = await req.json()
  const status = (body.status as string) ?? "CONFIRMED"
  if (!["CONFIRMED", "TENTATIVE", "DECLINED"].includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
  }

  // Check max slots (only for CONFIRMED/TENTATIVE)
  if (event.maxSlots && ["CONFIRMED", "TENTATIVE"].includes(status)) {
    const existing = await prisma.eventParticipant.findFirst({
      where: { eventId: event.id, userId: session.user.id },
    })
    if (!existing || existing.status === "DECLINED") {
      if (event._count.participants >= event.maxSlots) {
        return NextResponse.json({ error: "Le nombre maximum de participants est atteint" }, { status: 400 })
      }
    }
  }

  const participation = await prisma.eventParticipant.upsert({
    where: { eventId_userId: { eventId: event.id, userId: session.user.id } },
    create: { eventId: event.id, userId: session.user.id, status: status as "CONFIRMED" | "TENTATIVE" | "DECLINED" },
    update: { status: status as "CONFIRMED" | "TENTATIVE" | "DECLINED" },
  })

  return NextResponse.json(participation)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { event, membership } = await getEventAndMembership(params.slug, params.id, session.user.id)
  if (!event) return NextResponse.json({ error: "Événement introuvable" }, { status: 404 })
  if (!membership) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  await prisma.eventParticipant.deleteMany({
    where: { eventId: event.id, userId: session.user.id },
  })

  return new NextResponse(null, { status: 204 })
}
