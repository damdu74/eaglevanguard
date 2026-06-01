import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { COMMUNITY_PERMISSIONS } from "@/lib/permissions"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  permissions: z.array(z.enum(COMMUNITY_PERMISSIONS)).optional(),
  order: z.number().int().min(0).optional(),
})

type Params = { params: { slug: string; roleId: string } }

async function getOwnerAccess(slug: string, userId: string) {
  const community = await prisma.community.findUnique({ where: { slug }, select: { id: true } })
  if (!community) return null
  const membership = await prisma.membership.findFirst({ where: { userId, communityId: community.id, role: "OWNER" } })
  return membership ? community : null
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const community = await getOwnerAccess(params.slug, session.user.id)
  if (!community) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const role = await prisma.communityRole.findFirst({ where: { id: params.roleId, communityId: community.id } })
  if (!role) return NextResponse.json({ error: "Rôle introuvable" }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 })

  const updated = await prisma.communityRole.update({
    where: { id: params.roleId },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.color !== undefined && { color: parsed.data.color }),
      ...(parsed.data.permissions !== undefined && { permissions: parsed.data.permissions }),
      ...(parsed.data.order !== undefined && { order: parsed.data.order }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const community = await getOwnerAccess(params.slug, session.user.id)
  if (!community) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const role = await prisma.communityRole.findFirst({ where: { id: params.roleId, communityId: community.id } })
  if (!role) return NextResponse.json({ error: "Rôle introuvable" }, { status: 404 })

  // Retirer le rôle de tous les membres avant suppression
  await prisma.membership.updateMany({
    where: { communityRoleId: params.roleId },
    data: { communityRoleId: null },
  })

  await prisma.communityRole.delete({ where: { id: params.roleId } })
  return NextResponse.json({ success: true })
}
