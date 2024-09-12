-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT,
    "displayName" TEXT,
    "owner" INTEGER,
    "isAdmin" BOOLEAN NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lyric" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "editDate" TIMESTAMP(3) NOT NULL,
    "isPinned" BOOLEAN NOT NULL,
    "isChannelPost" BOOLEAN NOT NULL,

    CONSTRAINT "Lyric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "lyricId" INTEGER NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "mime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "convert" BOOLEAN NOT NULL,
    "lyricId" INTEGER NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "text" TEXT,
    "wordCount" INTEGER,
    "paragraphCount" INTEGER,
    "lyricId" INTEGER NOT NULL,
    "reactionId" INTEGER,
    "hashtagsId" INTEGER,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hashtags" (
    "id" SERIAL NOT NULL,
    "count" INTEGER NOT NULL,
    "hashtags" TEXT[],
    "messageId" INTEGER NOT NULL,

    CONSTRAINT "Hashtags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" SERIAL NOT NULL,
    "uniqueCount" INTEGER NOT NULL,
    "totalFreeCount" INTEGER NOT NULL,
    "totalPaidCount" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "messageId" INTEGER NOT NULL,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Emoji" (
    "id" SERIAL NOT NULL,
    "emoji" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL,
    "count" INTEGER NOT NULL,
    "reactionId" INTEGER NOT NULL,

    CONSTRAINT "Emoji_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplyToMessage" (
    "id" SERIAL NOT NULL,
    "lyricId" INTEGER NOT NULL,

    CONSTRAINT "ReplyToMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chat_lyricId_key" ON "Chat"("lyricId");

-- CreateIndex
CREATE UNIQUE INDEX "Media_lyricId_key" ON "Media"("lyricId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_lyricId_key" ON "Message"("lyricId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_reactionId_key" ON "Message"("reactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_hashtagsId_key" ON "Message"("hashtagsId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_messageId_key" ON "Reaction"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "Emoji_reactionId_key" ON "Emoji"("reactionId");

-- CreateIndex
CREATE UNIQUE INDEX "ReplyToMessage_lyricId_key" ON "ReplyToMessage"("lyricId");

-- AddForeignKey
ALTER TABLE "Lyric" ADD CONSTRAINT "Lyric_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_lyricId_fkey" FOREIGN KEY ("lyricId") REFERENCES "Lyric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_lyricId_fkey" FOREIGN KEY ("lyricId") REFERENCES "Lyric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_lyricId_fkey" FOREIGN KEY ("lyricId") REFERENCES "Lyric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hashtags" ADD CONSTRAINT "Hashtags_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emoji" ADD CONSTRAINT "Emoji_reactionId_fkey" FOREIGN KEY ("reactionId") REFERENCES "Reaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplyToMessage" ADD CONSTRAINT "ReplyToMessage_lyricId_fkey" FOREIGN KEY ("lyricId") REFERENCES "Lyric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
