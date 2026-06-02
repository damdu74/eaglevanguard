-- CreateTable
CREATE TABLE "RpUnitOrbatNode" (
    "id" TEXT NOT NULL,
    "rpUnitId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,

    CONSTRAINT "RpUnitOrbatNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RpUnitOrbatEdge" (
    "id" TEXT NOT NULL,
    "rpUnitId" TEXT NOT NULL,
    "edgeId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "data" JSONB,

    CONSTRAINT "RpUnitOrbatEdge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RpUnitOrbatNode_rpUnitId_nodeId_key" ON "RpUnitOrbatNode"("rpUnitId", "nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "RpUnitOrbatEdge_rpUnitId_edgeId_key" ON "RpUnitOrbatEdge"("rpUnitId", "edgeId");

-- AddForeignKey
ALTER TABLE "RpUnitOrbatNode" ADD CONSTRAINT "RpUnitOrbatNode_rpUnitId_fkey" FOREIGN KEY ("rpUnitId") REFERENCES "RpUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RpUnitOrbatEdge" ADD CONSTRAINT "RpUnitOrbatEdge_rpUnitId_fkey" FOREIGN KEY ("rpUnitId") REFERENCES "RpUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
