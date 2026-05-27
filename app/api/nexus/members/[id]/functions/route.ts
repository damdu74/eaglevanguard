import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isNexusTeam) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { functionIds } = await req.json()
  if (!Array.isArray(functionIds)) return NextResponse.json({ error: "functionIds must be an array" }, { status: 400 })

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      nexusFunctions: {
        set: functionIds.map((id: string) => ({ id })),
      },
    },
    select: {
      id: true,
      nexusFunctions: true,
    },
  })

  return NextResponse.json(user)
}
