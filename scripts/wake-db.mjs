/**
 * Envoie une requête simple via le pooler pour réveiller le compute Neon
 * avant que prisma migrate deploy tente d'acquérir un advisory lock.
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

console.log("[wake-db] Pinging Neon via pooler...")

let ok = false
for (let i = 1; i <= 6; i++) {
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log(`[wake-db] DB ready (attempt ${i})`)
    ok = true
    break
  } catch (e) {
    console.log(`[wake-db] Attempt ${i} failed: ${e.message}`)
    await new Promise((r) => setTimeout(r, 5000))
  }
}

await prisma.$disconnect()

if (!ok) {
  console.log("[wake-db] Could not ping DB, migrate deploy will try anyway")
}
