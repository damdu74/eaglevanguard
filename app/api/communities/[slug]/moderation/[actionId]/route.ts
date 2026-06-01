import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MemberRole } from "@prisma/client"
import { z } from "zod"

const STAFF_ROLES: MemberRole[] = ["OWNER", "ADMIN", "MODERATOR"]

const resolveSchema = z.object({
  note: z.string().max(500).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { slug: string; actionId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug }, select: { id: true } })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const staff = await prisma.membership.findFirst({
    where: { userId: session.user.id, communityId: community.id, role: { in: STAFF_ROLES } },
  })
  if (!staff) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const action = await prisma.moderationAction.findFirst({
    where: { id: params.actionId, communityId: community.id },
  })
  if (!action) return NextResponse.json({ error: "Action introuvable" }, { status: 404 })
  if (action.resolvedAt) return NextResponse.json({ error: "Déjà résolue" }, { status: 409 })

  const body = await req.json()
  const parsed = resolveSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 })

  const resolved = await prisma.moderationAction.update({
    where: { id: params.actionId },
    data: { resolvedAt: new Date(), resolvedById: session.user.id, note: parsed.data.note ?? action.note },
  })

  return NextResponse.json(resolved)
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string; actionId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug }, select: { id: true } })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const staff = await prisma.membership.findFirst({
    where: { userId: session.user.id, communityId: community.id, role: { in: ["OWNER", "ADMIN"] as MemberRole[] } },
  })
  if (!staff) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const action = await prisma.moderationAction.findFirst({
    where: { id: params.actionId, communityId: community.id },
  })
  if (!action) return NextResponse.json({ error: "Action introuvable" }, { status: 404 })

  await prisma.moderationAction.delete({ where: { id: params.actionId } })
  return NextResponse.json({ success: true })
}
