-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'USER');

-- AlterTable Users
ALTER TABLE "Users" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "Users" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "Users" ADD COLUMN "telegramId" BIGINT;
ALTER TABLE "Users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE UNIQUE INDEX "Users_telegramId_key" ON "Users"("telegramId");

-- AlterTable LyricCollage
ALTER TABLE "LyricCollage" ADD COLUMN "userId" INTEGER;

-- AlterTable CarouselHistory
ALTER TABLE "CarouselHistory" ADD COLUMN "userId" INTEGER;

-- Backfill owner
UPDATE "LyricCollage" SET "userId" = 1 WHERE "userId" IS NULL;
UPDATE "CarouselHistory" SET "userId" = 1 WHERE "userId" IS NULL;
UPDATE "Users"
SET "telegramId" = 280897586,
    "role" = 'OWNER'
WHERE "id" = 1;

-- Not null
ALTER TABLE "LyricCollage" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "CarouselHistory" ALTER COLUMN "userId" SET NOT NULL;

-- FKs
ALTER TABLE "LyricCollage" ADD CONSTRAINT "LyricCollage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CarouselHistory" ADD CONSTRAINT "CarouselHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes for owner-scoped history
CREATE INDEX "LyricCollage_userId_createdAt_idx" ON "LyricCollage"("userId", "createdAt");
CREATE INDEX "CarouselHistory_userId_createdAt_idx" ON "CarouselHistory"("userId", "createdAt");
CREATE INDEX "Lyrics_userId_date_idx" ON "Lyrics"("userId", "date");

-- Replace global source+lyric_id index with partial unique per owner
DROP INDEX IF EXISTS "Lyrics_source_lyric_id_idx";
CREATE UNIQUE INDEX "Lyrics_userId_source_lyric_id_key"
  ON "Lyrics"("userId", "source", "lyric_id")
  WHERE "lyric_id" > 0;

-- Session
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ChannelBinding
CREATE TABLE "ChannelBinding" (
    "id" SERIAL NOT NULL,
    "channelId" BIGINT NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelBinding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChannelBinding_channelId_key" ON "ChannelBinding"("channelId");
CREATE INDEX "ChannelBinding_userId_idx" ON "ChannelBinding"("userId");
ALTER TABLE "ChannelBinding" ADD CONSTRAINT "ChannelBinding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
