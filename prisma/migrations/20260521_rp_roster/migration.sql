-- CreateTable
CREATE TABLE "RpUnit" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "era" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RpUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RpCharacter" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rpUnitId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RpCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RpCharacter_communityId_userId_key" ON "RpCharacter"("communityId", "userId");

-- AddForeignKey
ALTER TABLE "RpUnit" ADD CONSTRAINT "RpUnit_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RpCharacter" ADD CONSTRAINT "RpCharacter_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RpCharacter" ADD CONSTRAINT "RpCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RpCharacter" ADD CONSTRAINT "RpCharacter_rpUnitId_fkey" FOREIGN KEY ("rpUnitId") REFERENCES "RpUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
