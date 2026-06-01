import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasCommunityPermission } from "@/lib/permissions"

export const dynamic = "force-dynamic"

type Params = { params: { slug: string } }

async function getStaffMembership(slug: string, userId: string) {
  const community = await prisma.community.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (!community) return { community: null, membership: null }

  const membership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId },
    include: { communityRole: { select: { permissions: true } } },
  })
  return { community, membership }
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { community, membership } = await getStaffMembership(params.slug, session.user.id)
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })
  if (!hasCommunityPermission(membership, "MANAGE_EVENTS")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const templates = await prisma.eventTemplate.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(templates)
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { community, membership } = await getStaffMembership(params.slug, session.user.id)
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })
  if (!hasCommunityPermission(membership, "MANAGE_EVENTS")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const body = await req.json()
  const { name, title, type, description, maxSlots } = body

  if (!name?.trim() || !title?.trim() || !type?.trim()) {
    return NextResponse.json({ error: "Nom, titre et type sont requis" }, { status: 400 })
  }

  const template = await prisma.eventTemplate.create({
    data: {
      communityId: community.id,
      name: (name as string).trim(),
      title: (title as string).trim(),
      type: type as string,
      description: description ?? null,
      maxSlots: maxSlots ? Number(maxSlots) : null,
    },
  })

  return NextResponse.json(template, { status: 201 })
}
