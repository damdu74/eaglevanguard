import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasCommunityPermission, COMMUNITY_PERMISSIONS } from "@/lib/permissions"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
  permissions: z.array(z.enum(COMMUNITY_PERMISSIONS)).default([]),
  order: z.number().int().min(0).default(0),
})

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug }, select: { id: true } })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, communityId: community.id },
    include: { communityRole: { select: { permissions: true } } },
  })
  if (!hasCommunityPermission(membership, "MANAGE_SETTINGS")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const roles = await prisma.communityRole.findMany({
    where: { communityId: community.id },
    include: { _count: { select: { memberships: true } } },
    orderBy: { order: "asc" },
  })

  return NextResponse.json(roles)
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug }, select: { id: true } })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id, communityId: community.id },
    include: { communityRole: { select: { permissions: true } } },
  })
  if (membership?.role !== "OWNER") return NextResponse.json({ error: "Seul le propriétaire peut créer des rôles" }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 })

  const role = await prisma.communityRole.create({
    data: {
      communityId: community.id,
      name: parsed.data.name,
      color: parsed.data.color,
      permissions: parsed.data.permissions,
      order: parsed.data.order,
    },
  })

  return NextResponse.json(role, { status: 201 })
}
