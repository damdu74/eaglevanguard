import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { checkNexusPermission } from "@/lib/nexus-auth"

const resolveSchema = z.object({
  note: z.string().max(500).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { actionId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  if (!await checkNexusPermission(session.user.id, "GLOBAL_MODERATION")) {
    return NextResponse.json({ error: "Permission GLOBAL_MODERATION requise" }, { status: 403 })
  }

  const action = await prisma.moderationAction.findUnique({ where: { id: params.actionId } })
  if (!action) return NextResponse.json({ error: "Action introuvable" }, { status: 404 })
  if (action.resolvedAt) return NextResponse.json({ error: "Déjà résolue" }, { status: 409 })

  const body = await req.json()
  const parsed = resolveSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 })

  const resolved = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const a = await tx.moderationAction.update({
      where: { id: params.actionId },
      data: { resolvedAt: new Date(), resolvedById: session.user.id, note: parsed.data.note ?? action.note },
    })

    if (action.type === "BAN_PLATFORM") {
      await tx.user.update({ where: { id: action.targetId }, data: { isBannedFromPlatform: false } })
    }

    return a
  })

  return NextResponse.json(resolved)
}

export async function DELETE(_req: NextRequest, { params }: { params: { actionId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  if (!await checkNexusPermission(session.user.id, "GLOBAL_MODERATION")) {
    return NextResponse.json({ error: "Permission GLOBAL_MODERATION requise" }, { status: 403 })
  }

  const action = await prisma.moderationAction.findUnique({ where: { id: params.actionId } })
  if (!action) return NextResponse.json({ error: "Action introuvable" }, { status: 404 })

  await prisma.moderationAction.delete({ where: { id: params.actionId } })
  return NextResponse.json({ success: true })
}
