import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const CREATOR_EMAIL = "dam.moutou@gmail.com"
const ALL_PERMISSIONS = ["MANAGE_TEAM", "MANAGE_ROLES", "MANAGE_RANKS", "GLOBAL_MODERATION", "BAN_PLATFORM", "VIEW_LOGS"]

async function main() {
  const existing = await prisma.eagleVanguardRank.findFirst({ where: { name: "Superviseur" } })
  if (existing) {
    console.log("Le rang Superviseur existe déjà:", existing.id)
    return
  }

  const rank = await prisma.eagleVanguardRank.create({
    data: {
      name: "Superviseur",
      abbreviation: "SUP",
      order: -1,
      color: "#F59E0B",
      permissions: ALL_PERMISSIONS,
      isProtected: true,
      isHidden: true,
      category: "ROLE",
    },
  })

  console.log("Rang Superviseur créé:", rank.id)

  const creator = await prisma.user.findFirst({ where: { email: CREATOR_EMAIL } })
  if (creator) {
    await prisma.user.update({ where: { id: creator.id }, data: { eagleVanguardRankId: rank.id } })
    console.log("Rang assigné à", CREATOR_EMAIL)
  } else {
    console.log("Utilisateur non trouvé:", CREATOR_EMAIL)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
