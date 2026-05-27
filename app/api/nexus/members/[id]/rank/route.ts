import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isNexusTeam) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { nexusRankId } = await req.json()

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { nexusRankId: nexusRankId ?? null },
    select: { id: true, nexusRankId: true, nexusRank: true },
  })

  return NextResponse.json(user)
}
