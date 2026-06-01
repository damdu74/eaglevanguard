-- Étape 1 : migrer ADMIN et MODERATOR → MEMBER avant de modifier l'enum
UPDATE "Membership" SET role = 'MEMBER' WHERE role IN ('ADMIN', 'MODERATOR');

-- Étape 2 : supprimer le DEFAULT avant de changer le type
ALTER TABLE "Membership" ALTER COLUMN "role" DROP DEFAULT;

-- Étape 3 : recréer l'enum sans ADMIN et MODERATOR
ALTER TYPE "MemberRole" RENAME TO "MemberRole_old";
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'MEMBER', 'RECRUIT');
ALTER TABLE "Membership" ALTER COLUMN "role" TYPE "MemberRole" USING role::text::"MemberRole";
DROP TYPE "MemberRole_old";

-- Étape 4 : remettre le DEFAULT avec le nouveau type
ALTER TABLE "Membership" ALTER COLUMN "role" SET DEFAULT 'RECRUIT'::"MemberRole";

-- Étape 5 : créer la table CommunityRole
CREATE TABLE "CommunityRole" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityRole_pkey" PRIMARY KEY ("id")
);

-- Étape 6 : ajouter communityRoleId sur Membership
ALTER TABLE "Membership" ADD COLUMN "communityRoleId" TEXT;

-- Étape 7 : index
CREATE INDEX "CommunityRole_communityId_order_idx" ON "CommunityRole"("communityId", "order");

-- Étape 8 : clés étrangères
ALTER TABLE "CommunityRole" ADD CONSTRAINT "CommunityRole_communityId_fkey"
    FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Membership" ADD CONSTRAINT "Membership_communityRoleId_fkey"
    FOREIGN KEY ("communityRoleId") REFERENCES "CommunityRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
