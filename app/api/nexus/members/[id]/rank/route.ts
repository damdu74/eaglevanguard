import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isNexusTeam) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { nexusRankId } = await req.json()

  // Bloquer l'assignation d'un grade protégé
  if (nexusRankId) {
    const rank = await prisma.nexusRank.findUnique({ where: { id: nexusRankId } })
    if (rank?.isProtected) return NextResponse.json({ error: "Ce grade est protégé" }, { status: 403 })
  }

  // Bloquer le retrait d'un grade protégé
  const target = await prisma.user.findUnique({ where: { id: params.id }, include: { nexusRank: true } })
  if (target?.nexusRank?.isProtected) return NextResponse.json({ error: "Ce grade est protégé" }, { status: 403 })

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { nexusRankId: nexusRankId ?? null },
    select: { id: true, nexusRankId: true, nexusRank: true },
  })

  return NextResponse.json(user)
}
