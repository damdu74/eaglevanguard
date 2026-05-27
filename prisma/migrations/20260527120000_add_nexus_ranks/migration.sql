-- CreateTable
CREATE TABLE "NexusRank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NexusRank_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN "nexusRankId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_nexusRankId_fkey" FOREIGN KEY ("nexusRankId") REFERENCES "NexusRank"("id") ON DELETE SET NULL ON UPDATE CASCADE;
