/**
 * Envoie une requête simple via le pooler pour réveiller le compute Neon
 * avant que prisma migrate deploy tente d'acquérir un advisory lock.
 */
import { PrismaClient } from "@prisma/client"

// Doit pinger via la connexion directe (DATABASE_URL_UNPOOLED) car c'est
// celle qu'utilise prisma migrate deploy pour acquérir l'advisory lock.
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_UNPOOLED } },
})

console.log("[wake-db] Pinging Neon via direct connection...")

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

// Libérer le verrou Prisma Migrate s'il est encore tenu par une session zombie
// (le numéro 72707369 est la clé hardcodée par Prisma pour pg_advisory_lock)
try {
  await prisma.$executeRaw`SELECT pg_advisory_unlock(72707369)`
  console.log("[wake-db] Advisory lock released (or was not held)")
} catch (e) {
  console.log("[wake-db] Could not release lock:", e.message)
}

await prisma.$disconnect()

if (!ok) {
  console.log("[wake-db] Could not ping DB, migrate deploy will try anyway")
}
