-- CreateTable
CREATE TABLE "SteamAuthCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SteamAuthCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SteamAuthCode_code_key" ON "SteamAuthCode"("code");

-- CreateIndex
CREATE INDEX "SteamAuthCode_expiresAt_idx" ON "SteamAuthCode"("expiresAt");

-- AddForeignKey
ALTER TABLE "SteamAuthCode" ADD CONSTRAINT "SteamAuthCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
