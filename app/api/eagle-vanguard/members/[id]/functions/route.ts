import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkEagleVanguardPermission } from "@/lib/eagle-vanguard-auth"

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!await checkEagleVanguardPermission(session.user.id, "MANAGE_TEAM")) {
    return NextResponse.json({ error: "Permission MANAGE_TEAM requise" }, { status: 403 })
  }

  const { functionIds } = await req.json()
  if (!Array.isArray(functionIds)) return NextResponse.json({ error: "functionIds must be an array" }, { status: 400 })

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      eagleVanguardFunctions: {
        set: functionIds.map((id: string) => ({ id })),
      },
    },
    select: {
      id: true,
      eagleVanguardFunctions: true,
    },
  })

  return NextResponse.json(user)
}
