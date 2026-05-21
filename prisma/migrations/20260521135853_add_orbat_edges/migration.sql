-- CreateTable
CREATE TABLE "OrbatEdge" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "edgeId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "data" JSONB,

    CONSTRAINT "OrbatEdge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrbatEdge_communityId_edgeId_key" ON "OrbatEdge"("communityId", "edgeId");

-- AddForeignKey
ALTER TABLE "OrbatEdge" ADD CONSTRAINT "OrbatEdge_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
