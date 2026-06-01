import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isStaff as isStaffHelper } from "@/lib/permissions"

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  if (!community) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  const membership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId: session.user.id as string },
    include: { rank: { select: { permissions: true } } },
  })
  if (!isStaffHelper(membership)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 })
  }

  const { name, description, era } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 })

  const unit = await prisma.rpUnit.create({
    data: { communityId: community.id, name: name.trim(), description: description?.trim() || null, era: era?.trim() || null },
  })

  return NextResponse.json(unit, { status: 201 })
}
