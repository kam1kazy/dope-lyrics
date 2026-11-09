-- AlterTable
ALTER TABLE "Lyrics" ADD COLUMN     "chatId" BIGINT;

-- Backfill: чат записи из связанной строки Chat
UPDATE "Lyrics" AS l
SET "chatId" = c."id"
FROM "Chat" AS c
WHERE c."lyricId" = l."id";

-- Уникальность по (userId, source, lyric_id) не пускала одинаковые номера из разных чатов
-- и копии при разделении фразы; дубликаты отсекает загрузка по паре чат + lyric_id
DROP INDEX IF EXISTS "Lyrics_userId_source_lyric_id_key";

-- CreateIndex
CREATE INDEX "Lyrics_userId_source_chatId_lyric_id_idx" ON "Lyrics"("userId", "source", "chatId", "lyric_id");
