import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getStaffAccess(slug: string, userId: string) {
  const community = await prisma.community.findUnique({ where: { slug } })
  if (!community) return { community: null, ok: false }
  const membership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId },
  })
  const ok = !!membership && ["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)
  return { community, ok }
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string; unitId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { community, ok } = await getStaffAccess(params.slug, session.user.id)
  if (!community) return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  if (!ok) return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 })

  const unit = await prisma.rpUnit.findUnique({ where: { id: params.unitId } })
  if (!unit || unit.communityId !== community.id) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  const body = await req.json()
  const { name, description, era } = body

  if (name !== undefined && !String(name).trim()) {
    return NextResponse.json({ error: "Le nom ne peut pas être vide" }, { status: 400 })
  }

  const updated = await prisma.rpUnit.update({
    where: { id: params.unitId },
    data: {
      ...(name !== undefined && { name: String(name).trim() }),
      ...(description !== undefined && { description: description || null }),
      ...(era !== undefined && { era: era || null }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string; unitId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { community, ok } = await getStaffAccess(params.slug, session.user.id)
  if (!community) return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  if (!ok) return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 })

  const unit = await prisma.rpUnit.findUnique({ where: { id: params.unitId } })
  if (!unit || unit.communityId !== community.id) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  await prisma.rpCharacter.deleteMany({ where: { rpUnitId: params.unitId } })
  await prisma.rpUnit.delete({ where: { id: params.unitId } })
  return NextResponse.json({ ok: true })
}
