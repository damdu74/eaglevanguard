-- Remove unique constraint to allow multiple applications per user per community
DROP INDEX IF EXISTS "Application_communityId_userId_key";

-- Add non-unique index for lookup performance
CREATE INDEX IF NOT EXISTS "Application_communityId_userId_idx" ON "Application"("communityId", "userId");
CREATE INDEX IF NOT EXISTS "Application_userId_communityId_idx" ON "Application"("userId", "communityId");
