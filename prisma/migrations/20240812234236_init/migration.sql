-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "name" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lyric" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "is_reaction" BOOLEAN,
    "paragraph_count" INTEGER,
    "word_count" INTEGER,
    "hashtag_count" INTEGER,
    "hashtags" INTEGER[],
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Lyric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hashtag" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "lyricId" INTEGER NOT NULL,

    CONSTRAINT "Hashtag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hashtag_text_key" ON "Hashtag"("text");
