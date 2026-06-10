import { prisma } from "@/lib/prisma"
import type { EagleVanguardPermission } from "@/lib/permissions"

export async function getEagleVanguardActor(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isEagleVanguardTeam: true,
      eagleVanguardRank: { select: { permissions: true, isProtected: true } },
    },
  })
  return user
}

export async function checkEagleVanguardPermission(userId: string, permission: EagleVanguardPermission): Promise<boolean> {
  const user = await getEagleVanguardActor(userId)
  if (!user?.isEagleVanguardTeam) return false
  // Rang protégé → tous les droits
  if (user.eagleVanguardRank?.isProtected) return true
  // Pas de rang ou rang sans aucune permission → accès complet (bootstrap)
  if (!user.eagleVanguardRank || user.eagleVanguardRank.permissions.length === 0) return true
  return user.eagleVanguardRank.permissions.includes(permission)
}
