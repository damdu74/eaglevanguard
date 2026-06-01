/**
 * Réveille le compute Neon et lance prisma migrate deploy avec retry.
 * Remplace le double appel wake-db + migrate dans le build script.
 */
import { PrismaClient } from "@prisma/client"
import { execSync } from "child_process"

const dbUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!dbUrl) {
  console.log("[wake-db] No DATABASE_URL defined, skipping.")
  process.exit(0)
}

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
})

console.log("[wake-db] Pinging Neon via direct connection...")

let ok = false
for (let i = 1; i <= 8; i++) {
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

// Libérer le verrou Prisma Migrate zombie si besoin
try {
  await prisma.$executeRaw`SELECT pg_advisory_unlock(72707369)`
  console.log("[wake-db] Advisory lock released (or was not held)")
} catch {}

await prisma.$disconnect()

if (!ok) {
  console.log("[wake-db] Could not reach DB after 8 attempts, aborting.")
  process.exit(1)
}

// Attendre 3s pour laisser Neon se stabiliser avant migrate
console.log("[wake-db] Waiting 3s for Neon to fully stabilize...")
await new Promise((r) => setTimeout(r, 3000))

// prisma migrate deploy avec jusqu'à 3 tentatives
let migrated = false
for (let i = 1; i <= 3; i++) {
  try {
    console.log(`[wake-db] Running prisma migrate deploy (attempt ${i})...`)
    execSync("npx prisma migrate deploy", { stdio: "inherit" })
    migrated = true
    break
  } catch {
    console.log(`[wake-db] migrate deploy attempt ${i} failed`)
    if (i < 3) await new Promise((r) => setTimeout(r, 5000))
  }
}

if (!migrated) {
  console.error("[wake-db] migrate deploy failed after 3 attempts.")
  process.exit(1)
}

console.log("[wake-db] Done.")
