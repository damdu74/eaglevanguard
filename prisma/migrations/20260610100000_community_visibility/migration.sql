-- CreateEnum
CREATE TYPE "CommunityVisibility" AS ENUM ('PUBLIC', 'WHITELIST', 'INVISIBLE');

-- Ajouter la colonne en nullable d'abord
ALTER TABLE "Community" ADD COLUMN "visibility" "CommunityVisibility";

-- Migrer les données existantes
UPDATE "Community" SET "visibility" = CASE
  WHEN "isPublic" = false THEN 'INVISIBLE'::"CommunityVisibility"
  ELSE 'WHITELIST'::"CommunityVisibility"
END;

-- Rendre NOT NULL avec default
ALTER TABLE "Community" ALTER COLUMN "visibility" SET NOT NULL;
ALTER TABLE "Community" ALTER COLUMN "visibility" SET DEFAULT 'WHITELIST'::"CommunityVisibility";

-- Supprimer l'ancienne colonne
ALTER TABLE "Community" DROP COLUMN "isPublic";
