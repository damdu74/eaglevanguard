import { prisma } from "@/lib/prisma"
import type { NexusPermission } from "@/lib/permissions"

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
  // Rang protégé → tous les droits
  if (user.nexusRank?.isProtected) return true
  // Pas de rang ou rang sans aucune permission → accès complet (bootstrap)
  if (!user.nexusRank || user.nexusRank.permissions.length === 0) return true
  return user.nexusRank.permissions.includes(permission)
}
