import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

const CREATOR_STEAM_ID = "76561198059449648"
const SUPERVISOR_RANK_NAME = "Superviseur"

const rank = await prisma.eagleVanguardRank.findFirst({ where: { name: SUPERVISOR_RANK_NAME } })
if (!rank) { console.error("Rang Superviseur introuvable"); process.exit(1) }

const user = await prisma.user.findFirst({ where: { steamId: CREATOR_STEAM_ID } })
if (!user) { console.error("Utilisateur introuvable"); process.exit(1) }

await prisma.user.update({ where: { id: user.id }, data: { eagleVanguardRankId: rank.id } })
console.log(`Rang "${rank.name}" assigné à ${user.steamName} (${user.id})`)
await prisma.$disconnect()
