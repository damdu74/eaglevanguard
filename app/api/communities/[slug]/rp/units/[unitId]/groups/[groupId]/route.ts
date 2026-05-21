import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getStaffContext(slug: string, userId: string) {
  const community = await prisma.community.findUnique({ where: { slug } })
  if (!community) return null
  const membership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId },
  })
  const isStaff = !!membership && ["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)
  return isStaff ? community : null
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string; unitId: string; groupId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const community = await getStaffContext(params.slug, session.user.id as string)
  if (!community) return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 })

  const group = await prisma.rpGroup.findUnique({ where: { id: params.groupId } })
  if (!group || group.communityId !== community.id) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  const { name, order } = await req.json()
  const updated = await prisma.rpGroup.update({
    where: { id: params.groupId },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      ...(order !== undefined && { order }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string; unitId: string; groupId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const community = await getStaffContext(params.slug, session.user.id as string)
  if (!community) return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 })

  const group = await prisma.rpGroup.findUnique({ where: { id: params.groupId } })
  if (!group || group.communityId !== community.id) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  await prisma.rpGroup.delete({ where: { id: params.groupId } })
  return NextResponse.json({ ok: true })
}
