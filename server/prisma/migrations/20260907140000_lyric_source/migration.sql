-- CreateEnum
CREATE TYPE "LyricSource" AS ENUM ('TELEGRAM', 'APPLE_NOTES');

-- AlterTable
ALTER TABLE "Lyrics" ADD COLUMN "source" "LyricSource" NOT NULL DEFAULT 'TELEGRAM';

-- CreateIndex
CREATE INDEX "Lyrics_source_lyric_id_idx" ON "Lyrics"("source", "lyric_id");
