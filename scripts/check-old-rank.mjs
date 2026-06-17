import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
const OLD_RANK_ID = "2c425892-c889-45b3-8ee8-b8fb866d22be"
const rank = await prisma.eagleVanguardRank.findUnique({ where: { id: OLD_RANK_ID } })
console.log("Ancien rang:", rank ? JSON.stringify(rank, null, 2) : "introuvable (supprimé ou ID différent)")
const allRanks = await prisma.eagleVanguardRank.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true, isProtected: true, isHidden: true, order: true } })
console.log("\nTous les rangs:", JSON.stringify(allRanks, null, 2))
await prisma.$disconnect()
