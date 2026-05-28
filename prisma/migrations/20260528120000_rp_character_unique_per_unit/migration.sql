-- Un personnage par unité par joueur (au lieu d'un par communauté par joueur)
-- Supprime l'ancienne contrainte unique (communauté + joueur)
DROP INDEX IF EXISTS "RpCharacter_communityId_userId_key";

-- Supprime les éventuels personnages orphelins (rpUnitId = null) avant d'ajouter la contrainte
DELETE FROM "RpCharacter" WHERE "rpUnitId" IS NULL;

-- Ajoute la nouvelle contrainte unique (unité + joueur)
CREATE UNIQUE INDEX "RpCharacter_rpUnitId_userId_key" ON "RpCharacter"("rpUnitId", "userId");

-- Change onDelete de SetNull à Cascade sur rpUnitId (géré par Prisma, pas de SQL direct nécessaire)
