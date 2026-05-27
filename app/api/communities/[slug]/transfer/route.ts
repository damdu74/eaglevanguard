import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true, creatorId: true },
  })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const ownerMembership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId: session.user.id as string },
  })
  if (!ownerMembership || ownerMembership.role !== "OWNER") {
    return NextResponse.json({ error: "Seul le fondateur peut transférer la communauté" }, { status: 403 })
  }

  const { targetUserId } = await req.json() as { targetUserId: string }
  if (!targetUserId || targetUserId === session.user.id) {
    return NextResponse.json({ error: "Cible invalide" }, { status: 400 })
  }

  const targetMembership = await prisma.membership.findFirst({
    where: { communityId: community.id, userId: targetUserId },
  })
  if (!targetMembership) {
    return NextResponse.json({ error: "Ce joueur n'est pas membre de la communauté" }, { status: 404 })
  }

  const foundateurRank = await prisma.rank.findFirst({
    where: { communityId: community.id, isPermanent: true },
  })

  await prisma.$transaction([
    // Ancien fondateur → Membre (sans grade Fondateur)
    prisma.membership.update({
      where: { id: ownerMembership.id },
      data: { role: "MEMBER", rankId: null },
    }),
    // Nouveau fondateur → Owner (avec grade Fondateur)
    prisma.membership.update({
      where: { id: targetMembership.id },
      data: { role: "OWNER", rankId: foundateurRank?.id ?? null },
    }),
    // Mise à jour du creatorId de la communauté
    prisma.community.update({
      where: { id: community.id },
      data: { creatorId: targetUserId },
    }),
  ])

  return NextResponse.json({ ok: true })
}
