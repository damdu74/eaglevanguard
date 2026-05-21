-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true;
