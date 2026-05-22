import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  if (!community) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  const membership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId: session.user.id as string },
  })
  if (!membership) return NextResponse.json({ error: "Vous n'êtes pas membre" }, { status: 403 })

  const existing = await prisma.rpCharacter.findUnique({
    where: { communityId_userId: { communityId: community.id, userId: session.user.id as string } },
  })
  if (existing) return NextResponse.json({ error: "Vous avez déjà un personnage dans cette communauté" }, { status: 409 })

  const { name, role, description, rpUnitId } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 })

  let defaultGroupId: string | null = null
  if (rpUnitId) {
    let defaultGroup = await prisma.rpGroup.findFirst({
      where: { rpUnitId, isDefault: true },
    })
    if (!defaultGroup) {
      defaultGroup = await prisma.rpGroup.create({
        data: { communityId: community.id, rpUnitId, name: "Mobilisé", order: 0, isDefault: true },
      })
    }
    defaultGroupId = defaultGroup.id
  }

  const character = await prisma.rpCharacter.create({
    data: {
      communityId: community.id,
      userId: session.user.id as string,
      name: name.trim(),
      role: role?.trim() || null,
      description: description?.trim() || null,
      rpUnitId: rpUnitId || null,
      rpGroupId: defaultGroupId,
    },
    include: { user: { select: { id: true, name: true, image: true, customAvatar: true } }, rpUnit: true },
  })

  return NextResponse.json(character, { status: 201 })
}
