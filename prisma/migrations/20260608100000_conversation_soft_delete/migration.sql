-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "deletedByUser1" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Conversation" ADD COLUMN "deletedByUser2" BOOLEAN NOT NULL DEFAULT false;
