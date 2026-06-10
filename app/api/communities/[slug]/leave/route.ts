import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

interface Params {
  params: { slug: string }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const community = await prisma.community.findUnique({ where: { slug: params.slug } })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  const membership = await prisma.membership.findUnique({
    where: { userId_communityId: { userId: session.user.id as string, communityId: community.id } },
  })
  if (!membership) return NextResponse.json({ error: "Vous n'êtes pas membre" }, { status: 400 })

  if (membership.role === "OWNER") {
    return NextResponse.json(
      { error: "Le fondateur ne peut pas quitter la communauté. Transférez la propriété d'abord." },
      { status: 403 }
    )
  }

  await prisma.membership.delete({
    where: { userId_communityId: { userId: session.user.id as string, communityId: community.id } },
  })

  await createAuditLog({
    action: "MEMBER_LEFT",
    description: `A quitté la communauté « ${community.name} »`,
    actorId: session.user.id as string,
    communityId: community.id,
  })

  return NextResponse.json({ ok: true })
}
