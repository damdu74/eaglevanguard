-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "RpUnit" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "era" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RpUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RpGroup" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "rpUnitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RpGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "RpCharacter" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rpUnitId" TEXT,
    "rpGroupId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RpCharacter_pkey" PRIMARY KEY ("id")
);

-- Add rpGroupId column if missing (RpCharacter already exists in prod)
ALTER TABLE "RpCharacter" ADD COLUMN IF NOT EXISTS "rpGroupId" TEXT;

-- CreateIndex (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "RpCharacter_communityId_userId_key" ON "RpCharacter"("communityId", "userId");

-- AddForeignKey (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RpUnit_communityId_fkey') THEN
    ALTER TABLE "RpUnit" ADD CONSTRAINT "RpUnit_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RpGroup_communityId_fkey') THEN
    ALTER TABLE "RpGroup" ADD CONSTRAINT "RpGroup_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RpGroup_rpUnitId_fkey') THEN
    ALTER TABLE "RpGroup" ADD CONSTRAINT "RpGroup_rpUnitId_fkey" FOREIGN KEY ("rpUnitId") REFERENCES "RpUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RpCharacter_communityId_fkey') THEN
    ALTER TABLE "RpCharacter" ADD CONSTRAINT "RpCharacter_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RpCharacter_userId_fkey') THEN
    ALTER TABLE "RpCharacter" ADD CONSTRAINT "RpCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RpCharacter_rpUnitId_fkey') THEN
    ALTER TABLE "RpCharacter" ADD CONSTRAINT "RpCharacter_rpUnitId_fkey" FOREIGN KEY ("rpUnitId") REFERENCES "RpUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RpCharacter_rpGroupId_fkey') THEN
    ALTER TABLE "RpCharacter" ADD CONSTRAINT "RpCharacter_rpGroupId_fkey" FOREIGN KEY ("rpGroupId") REFERENCES "RpGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
