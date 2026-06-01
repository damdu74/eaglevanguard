import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasCommunityPermission } from "@/lib/permissions"

interface Params {
  params: { slug: string; rankId: string }
}

async function checkRanksPermission(slug: string, userId: string) {
  const community = await prisma.community.findUnique({ where: { slug } })
  if (!community) return null
  const membership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId },
    include: { communityRole: { select: { permissions: true } } },
  })
  return hasCommunityPermission(membership, "MANAGE_RANKS") ? community : null
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const community = await checkRanksPermission(params.slug, session.user.id as string)
  if (!community) return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })

  const rank = await prisma.rank.findFirst({
    where: { id: params.rankId, communityId: community.id },
  })
  if (!rank) return NextResponse.json({ error: "Grade introuvable" }, { status: 404 })
  if (rank.isPermanent) return NextResponse.json({ error: "Le grade Fondateur ne peut pas être modifié" }, { status: 403 })

  const { name, order, color } = await req.json()
  const updated = await prisma.rank.update({
    where: { id: rank.id },
    data: {
      ...(name?.trim() ? { name: name.trim() } : {}),
      ...(order !== undefined ? { order } : {}),
      ...(color ? { color } : {}),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const community = await checkRanksPermission(params.slug, session.user.id as string)
  if (!community) return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })

  const rank = await prisma.rank.findFirst({
    where: { id: params.rankId, communityId: community.id },
  })
  if (!rank) return NextResponse.json({ error: "Grade introuvable" }, { status: 404 })
  if (rank.isPermanent) return NextResponse.json({ error: "Le grade Fondateur ne peut pas être supprimé" }, { status: 403 })

  await prisma.rank.delete({ where: { id: rank.id } })
  return NextResponse.json({ ok: true })
}
