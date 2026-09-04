-- CreateEnum
CREATE TYPE "CarouselHistorySource" AS ENUM ('SHUFFLE', 'QUEUE', 'GENERATOR', 'AI');

-- CreateTable
CREATE TABLE "CarouselHistory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "CarouselHistorySource" NOT NULL,
    "lyricIds" INTEGER[] NOT NULL,
    "previewText" TEXT NOT NULL DEFAULT '',
    "isLiked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CarouselHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CarouselHistory_createdAt_idx" ON "CarouselHistory"("createdAt");

-- CreateIndex
CREATE INDEX "CarouselHistory_isLiked_idx" ON "CarouselHistory"("isLiked");
