-- Rename table NexusRank -> EagleVanguardRank
ALTER TABLE "NexusRank" RENAME TO "EagleVanguardRank";
ALTER TABLE "EagleVanguardRank" RENAME CONSTRAINT "NexusRank_pkey" TO "EagleVanguardRank_pkey";

-- Rename columns on User
ALTER TABLE "User" RENAME COLUMN "isNexusTeam" TO "isEagleVanguardTeam";
ALTER TABLE "User" RENAME COLUMN "nexusRankId" TO "eagleVanguardRankId";

-- Rename FK constraint
ALTER TABLE "User" RENAME CONSTRAINT "User_nexusRankId_fkey" TO "User_eagleVanguardRankId_fkey";
