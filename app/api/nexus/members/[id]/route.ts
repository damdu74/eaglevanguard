import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { checkNexusPermission } from "@/lib/nexus-auth"

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  if (!await checkNexusPermission(session.user.id, "MANAGE_TEAM")) {
    return NextResponse.json({ error: "Permission MANAGE_TEAM requise" }, { status: 403 })
  }

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

  await createAuditLog({
    action: isNexusTeam ? "NEXUS_MEMBER_ADDED" : "NEXUS_MEMBER_REMOVED",
    description: isNexusTeam
      ? `Utilisateur ajouté à la NEXUS Team`
      : `Utilisateur retiré de la NEXUS Team`,
    actorId: session.user.id as string,
    targetId: params.id,
  })

  return NextResponse.json(user)
}
