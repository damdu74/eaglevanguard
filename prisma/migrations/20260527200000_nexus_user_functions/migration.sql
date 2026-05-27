-- CreateTable join: User <-> NexusRank (fonctions multiples)
CREATE TABLE "_UserNexusFunctions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_UserNexusFunctions_AB_unique" ON "_UserNexusFunctions"("A", "B");
CREATE INDEX "_UserNexusFunctions_B_index" ON "_UserNexusFunctions"("B");

ALTER TABLE "_UserNexusFunctions" ADD CONSTRAINT "_UserNexusFunctions_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_UserNexusFunctions" ADD CONSTRAINT "_UserNexusFunctions_B_fkey" FOREIGN KEY ("B") REFERENCES "NexusRank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
