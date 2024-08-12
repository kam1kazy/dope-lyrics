-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lyric" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "is_reaction" BOOLEAN NOT NULL,
    "paragraph_count" INTEGER NOT NULL,
    "word_count" INTEGER NOT NULL,
    "hashtag_count" INTEGER NOT NULL,
    "hashtags" TEXT[],
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Lyric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hashtag" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Hashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LyricHashtag" (
    "id" SERIAL NOT NULL,
    "lyricId" INTEGER NOT NULL,
    "hashtagId" INTEGER NOT NULL,

    CONSTRAINT "LyricHashtag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hashtag_text_key" ON "Hashtag"("text");

-- CreateIndex
CREATE UNIQUE INDEX "LyricHashtag_lyricId_hashtagId_key" ON "LyricHashtag"("lyricId", "hashtagId");
