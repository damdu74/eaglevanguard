import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string; unitId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  if (!community) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  const membership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId: session.user.id as string },
  })
  if (!membership || !["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 })
  }

  await prisma.rpUnit.delete({ where: { id: params.unitId } })
  return NextResponse.json({ ok: true })
}
