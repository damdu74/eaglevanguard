import { prisma } from "@/lib/prisma"
import { hasNexusPermission, type NexusPermission } from "@/lib/permissions"

export async function getNexusActor(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isNexusTeam: true,
      nexusRank: { select: { permissions: true, isProtected: true } },
    },
  })
  return user
}

export async function checkNexusPermission(userId: string, permission: NexusPermission): Promise<boolean> {
  const user = await getNexusActor(userId)
  if (!user?.isNexusTeam) return false
  return hasNexusPermission(user.nexusRank, permission)
}
