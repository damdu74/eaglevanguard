-- Rename join table to match Prisma's expected name (_UserFunctions)
ALTER TABLE "_UserNexusFunctions" RENAME TO "_UserFunctions";
ALTER INDEX "_UserNexusFunctions_AB_unique" RENAME TO "_UserFunctions_AB_unique";
ALTER INDEX "_UserNexusFunctions_B_index" RENAME TO "_UserFunctions_B_index";
