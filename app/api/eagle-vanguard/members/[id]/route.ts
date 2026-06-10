import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { checkEagle VanguardPermission } from "@/lib/eagle-vanguard-auth"

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!await checkEagle VanguardPermission(session.user.id, "MANAGE_TEAM")) {
    return NextResponse.json({ error: "Permission MANAGE_TEAM requise" }, { status: 403 })
  }

  const { isEagleVanguardTeam } = await req.json()

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      isEagleVanguardTeam: Boolean(isEagleVanguardTeam),
      ...(isEagleVanguardTeam === false ? { eagleVanguardRankId: null } : {}),
    },
    select: {
      id: true,
      steamName: true,
      discordName: true,
      name: true,
      customAvatar: true,
      steamAvatar: true,
      discordAvatar: true,
      eagleVanguardRankId: true,
      eagleVanguardRank: true,
      isEagleVanguardTeam: true,
    },
  })

  await createAuditLog({
    action: isEagleVanguardTeam ? "Eagle Vanguard_MEMBER_ADDED" : "Eagle Vanguard_MEMBER_REMOVED",
    description: isEagleVanguardTeam
      ? `Utilisateur ajouté à la Eagle Vanguard Team`
      : `Utilisateur retiré de la Eagle Vanguard Team`,
    actorId: session.user.id as string,
    targetId: params.id,
  })

  return NextResponse.json(user)
}
