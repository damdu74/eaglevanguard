import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const DEFAULT_RANKS = [
  { name: "Fondateur",  abbreviation: "FOND", order: 0, color: "#FFD700", permissions: [], isProtected: true,  category: "ROLE" },
  { name: "Directeur",  abbreviation: "DIR",  order: 1, color: "#FF4444", permissions: ["MANAGE_TEAM","MANAGE_RANKS","GLOBAL_MODERATION","BAN_PLATFORM","VIEW_LOGS"], isProtected: false, category: "ROLE" },
  { name: "Modérateur", abbreviation: "MOD",  order: 2, color: "#4CAF50", permissions: ["GLOBAL_MODERATION","VIEW_LOGS"], isProtected: false, category: "ROLE" },
  { name: "Staff",      abbreviation: "STF",  order: 3, color: "#6366f1", permissions: ["VIEW_LOGS"], isProtected: false, category: "ROLE" },
  { name: "Développeur",       abbreviation: "DEV", order: 0, color: "#0EA5E9", permissions: [], isProtected: false, category: "FUNCTION" },
  { name: "Community Manager", abbreviation: "CM",  order: 1, color: "#A855F7", permissions: [], isProtected: false, category: "FUNCTION" },
]

async function main() {
  console.log("Seeding Eagle Vanguard ranks...")

  for (const rank of DEFAULT_RANKS) {
    const existing = await prisma.eagleVanguardRank.findFirst({ where: { name: rank.name } })
    if (!existing) {
      await prisma.eagleVanguardRank.create({ data: rank })
      console.log(`  ✓ ${rank.name}`)
    } else {
      console.log(`  ~ déjà présent : ${rank.name}`)
    }
  }

  console.log("\nDone. Connecte-toi sur le site, puis donne-moi ton email pour activer ton compte admin.")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
