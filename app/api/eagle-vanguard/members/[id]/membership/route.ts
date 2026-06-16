import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

type Params = { params: { id: string } }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!session.user.isEagleVanguardTeam) return NextResponse.json({ error: "Accès réservé au staff" }, { status: 403 })

  const community = await prisma.community.findFirst({ orderBy: { createdAt: "asc" } })
  if (!community) return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 })

  await prisma.$transaction([
    prisma.membership.deleteMany({ where: { userId: params.id, communityId: community.id } }),
    prisma.application.deleteMany({ where: { userId: params.id, communityId: community.id } }),
  ])

  await createAuditLog({
    action: "MEMBER_KICKED",
    description: `Membre retiré de la communauté par le staff EV`,
    actorId: session.user.id as string,
    targetId: params.id,
  })

  return NextResponse.json({ ok: true })
}
