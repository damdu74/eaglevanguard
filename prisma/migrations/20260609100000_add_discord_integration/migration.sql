-- AlterTable: Community — lien serveur Discord
ALTER TABLE "Community" ADD COLUMN "discordGuildId" TEXT;

-- AlterTable: Event — source et ID Discord
ALTER TABLE "Event" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'NEXUS',
ADD COLUMN "discordEventId" TEXT;

-- CreateIndex: lookup rapide par discordEventId par communauté
CREATE UNIQUE INDEX "Event_communityId_discordEventId_key" ON "Event"("communityId", "discordEventId");
