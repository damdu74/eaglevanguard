import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isNexusTeam) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const rank = await prisma.nexusRank.findUnique({ where: { id: params.id } })
  if (!rank) return NextResponse.json({ error: "Grade introuvable" }, { status: 404 })
  if (rank.isProtected) return NextResponse.json({ error: "Ce grade est protégé" }, { status: 403 })

  const { name, abbreviation, order, color, category } = await req.json()

  const updated = await prisma.nexusRank.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(abbreviation !== undefined && { abbreviation: abbreviation.trim().toUpperCase() }),
      ...(order !== undefined && { order }),
      ...(color !== undefined && { color }),
      ...(category !== undefined && { category: category === "FUNCTION" ? "FUNCTION" : "ROLE" }),
    },
  })

  await createAuditLog({
    action: "NEXUS_RANK_UPDATED",
    description: `Grade NEXUS « ${updated.name} » modifié`,
    actorId: session.user.id as string,
    metadata: { rankId: params.id },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isNexusTeam) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const rank = await prisma.nexusRank.findUnique({ where: { id: params.id } })
  if (!rank) return NextResponse.json({ error: "Grade introuvable" }, { status: 404 })
  if (rank.isProtected) return NextResponse.json({ error: "Ce grade est protégé" }, { status: 403 })

  await createAuditLog({
    action: "NEXUS_RANK_DELETED",
    description: `Grade NEXUS « ${rank.name} » supprimé`,
    actorId: session.user.id as string,
    metadata: { rankName: rank.name },
  })

  await prisma.nexusRank.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
