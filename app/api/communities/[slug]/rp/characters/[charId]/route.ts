import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string; charId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  if (!community) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  const character = await prisma.rpCharacter.findUnique({ where: { id: params.charId } })
  if (!character || character.communityId !== community.id) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  const membership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId: session.user.id as string },
  })
  const isStaff = membership && ["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)
  const isOwner = character.userId === (session.user.id as string)

  if (!isOwner && !isStaff) return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 })

  await prisma.rpCharacter.delete({ where: { id: params.charId } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string; charId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  if (!community) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  const character = await prisma.rpCharacter.findUnique({ where: { id: params.charId } })
  if (!character || character.communityId !== community.id) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  const membership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId: session.user.id as string },
  })
  const isStaff = !!membership && ["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)
  const isOwner = character.userId === (session.user.id as string)

  if (!isOwner && !isStaff) return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 })

  const { name, grade, role, customFields, description, rpUnitId, rpGroupId } = await req.json()
  const updated = await prisma.rpCharacter.update({
    where: { id: params.charId },
    data: {
      ...(isOwner && name?.trim() && { name: name.trim() }),
      ...(isStaff && grade !== undefined && { grade: grade?.trim() || null }),
      ...(isStaff && role !== undefined && { role: role?.trim() || null }),
      ...(isStaff && customFields !== undefined && { customFields }),
      ...(isOwner && description !== undefined && { description: description?.trim() || null }),
      ...(isOwner && rpUnitId !== undefined && { rpUnitId: rpUnitId || null }),
      ...(isStaff && rpGroupId !== undefined && { rpGroupId: rpGroupId || null }),
    },
    include: { user: { select: { id: true, name: true, image: true, customAvatar: true } }, rpUnit: true },
  })

  return NextResponse.json(updated)
}
