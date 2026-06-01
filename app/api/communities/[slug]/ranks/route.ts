import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasCommunityPermission } from "@/lib/permissions"

interface Params {
  params: { slug: string }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const ranks = await prisma.rank.findMany({
    where: { communityId: community.id },
    orderBy: { order: "asc" },
  })
  return NextResponse.json(ranks)
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const adminMembership = await prisma.membership.findFirst({
    where: {
      communityId: community.id,
      userId: session.user.id as string,
    },
    include: { communityRole: { select: { permissions: true } } },
  })
  if (!hasCommunityPermission(adminMembership, "MANAGE_RANKS")) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
  }

  const { name, abbreviation, order, color } = await req.json()
  if (!name?.trim() || !abbreviation?.trim()) {
    return NextResponse.json({ error: "Nom et abréviation requis" }, { status: 400 })
  }

  const maxOrder = await prisma.rank.aggregate({
    where: { communityId: community.id },
    _max: { order: true },
  })

  const rank = await prisma.rank.create({
    data: {
      communityId: community.id,
      name: name.trim(),
      abbreviation: abbreviation.trim(),
      order: order ?? (maxOrder._max.order ?? 0) + 1,
      color: color ?? "#6366f1",
    },
  })

  return NextResponse.json(rank, { status: 201 })
}
