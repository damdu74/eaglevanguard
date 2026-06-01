-- Ajouter permissions sur Rank
ALTER TABLE "Rank" ADD COLUMN "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Supprimer communityRoleId de Membership
ALTER TABLE "Membership" DROP CONSTRAINT IF EXISTS "Membership_communityRoleId_fkey";
ALTER TABLE "Membership" DROP COLUMN IF EXISTS "communityRoleId";

-- Supprimer la table CommunityRole
DROP TABLE IF EXISTS "CommunityRole";
