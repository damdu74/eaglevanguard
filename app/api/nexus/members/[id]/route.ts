import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isNexusTeam) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { isNexusTeam } = await req.json()

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      isNexusTeam: Boolean(isNexusTeam),
      ...(isNexusTeam === false ? { nexusRankId: null } : {}),
    },
    select: {
      id: true,
      steamName: true,
      discordName: true,
      name: true,
      customAvatar: true,
      steamAvatar: true,
      discordAvatar: true,
      nexusRankId: true,
      nexusRank: true,
      isNexusTeam: true,
    },
  })

  return NextResponse.json(user)
}
