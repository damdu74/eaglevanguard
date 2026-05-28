-- Index Event : requêtes fréquentes par communauté + statut + date
CREATE INDEX IF NOT EXISTS "Event_communityId_status_startDate_idx" ON "Event"("communityId", "status", "startDate");

-- Index Rank : lookup par communauté
CREATE INDEX IF NOT EXISTS "Rank_communityId_idx" ON "Rank"("communityId");

-- Index RpUnit : lookup par communauté
CREATE INDEX IF NOT EXISTS "RpUnit_communityId_idx" ON "RpUnit"("communityId");

-- Index RpCharacter : lookup par communauté + utilisateur
CREATE INDEX IF NOT EXISTS "RpCharacter_communityId_userId_idx" ON "RpCharacter"("communityId", "userId");

-- Index Application : admin lookup candidatures par statut
CREATE INDEX IF NOT EXISTS "Application_communityId_status_idx" ON "Application"("communityId", "status");
