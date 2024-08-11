-- CreateTable
CREATE TABLE "Lyric" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "is_reaction" BOOLEAN NOT NULL,
    "paragraph_count" INTEGER NOT NULL,
    "word_count" INTEGER NOT NULL,
    "hashtag_count" INTEGER NOT NULL,
    "hashtags" TEXT[],

    CONSTRAINT "Lyric_pkey" PRIMARY KEY ("id")
);
