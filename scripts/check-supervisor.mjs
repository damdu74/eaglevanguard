import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

const rank = await prisma.eagleVanguardRank.findFirst({ where: { name: "Superviseur" } })
console.log("Rang Superviseur:", JSON.stringify(rank, null, 2))

const user = await prisma.user.findFirst({
  where: { steamId: "76561198059449648" },
  select: { id: true, steamName: true, eagleVanguardRankId: true, eagleVanguardRank: true },
})
console.log("\nUtilisateur:", JSON.stringify(user, null, 2))
await prisma.$disconnect()
