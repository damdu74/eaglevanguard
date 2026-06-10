import { prisma } from "@/lib/prisma"
import type { Eagle VanguardPermission } from "@/lib/permissions"

export async function getEagle VanguardActor(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isEagleVanguardTeam: true,
      eagleVanguardRank: { select: { permissions: true, isProtected: true } },
    },
  })
  return user
}

export async function checkEagle VanguardPermission(userId: string, permission: Eagle VanguardPermission): Promise<boolean> {
  const user = await getEagle VanguardActor(userId)
  if (!user?.isEagleVanguardTeam) return false
  // Rang protégé → tous les droits
  if (user.eagleVanguardRank?.isProtected) return true
  // Pas de rang ou rang sans aucune permission → accès complet (bootstrap)
  if (!user.eagleVanguardRank || user.eagleVanguardRank.permissions.length === 0) return true
  return user.eagleVanguardRank.permissions.includes(permission)
}
