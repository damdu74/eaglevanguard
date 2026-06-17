import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
const users = await prisma.user.findMany({
  select: { id: true, steamId: true, steamName: true, name: true, email: true, isEagleVanguardTeam: true, eagleVanguardRankId: true },
  where: { isEagleVanguardTeam: true },
})
console.log(JSON.stringify(users, null, 2))
await prisma.$disconnect()
