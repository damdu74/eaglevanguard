import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!session.user.isEagleVanguardTeam) return NextResponse.json({ error: "Accès réservé au staff" }, { status: 403 })

  const { action, response } = await req.json()
  if (action !== "ACCEPTED" && action !== "REJECTED") {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 })
  }

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: { community: { select: { id: true } } },
  })
  if (!application) return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 })
  if (application.status !== "PENDING") return NextResponse.json({ error: "Candidature déjà traitée" }, { status: 409 })

  await prisma.$transaction(async (tx) => {
    await tx.application.update({
      where: { id: params.id },
      data: { status: action, response: response?.trim() || null },
    })

    if (action === "ACCEPTED") {
      const existing = await tx.membership.findFirst({
        where: { userId: application.userId, communityId: application.communityId },
      })
      if (!existing) {
        await tx.membership.create({
          data: { userId: application.userId, communityId: application.communityId, role: "RECRUIT" },
        })
      }
    }
  })

  await createAuditLog({
    action: action === "ACCEPTED" ? "APPLICATION_ACCEPTED" : "APPLICATION_REJECTED",
    description: action === "ACCEPTED" ? "Candidature acceptée" : "Candidature refusée",
    actorId: session.user.id as string,
    targetId: application.userId,
  })

  return NextResponse.json({ ok: true })
}
