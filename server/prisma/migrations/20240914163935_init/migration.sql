-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lyrics" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "editDate" TIMESTAMP(3),
    "isPinned" BOOLEAN NOT NULL,
    "isChannelPost" BOOLEAN NOT NULL,
    "replyToMessage" INTEGER,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Lyrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "text" TEXT,
    "word_count" INTEGER,
    "paragraph_count" INTEGER,
    "lyricId" INTEGER NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reactions" (
    "id" SERIAL NOT NULL,
    "uniqueCount" INTEGER NOT NULL,
    "totalFreeCount" INTEGER NOT NULL,
    "totalPaidCount" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "messageId" INTEGER NOT NULL,

    CONSTRAINT "Reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Emoji" (
    "id" SERIAL NOT NULL,
    "emoji" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL,
    "count" INTEGER NOT NULL,
    "order" INTEGER,
    "reactionId" INTEGER NOT NULL,

    CONSTRAINT "Emoji_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLyric" (
    "key" SERIAL NOT NULL,
    "id" BIGINT NOT NULL,
    "username" TEXT,
    "displayName" TEXT,
    "isAdmin" BOOLEAN NOT NULL,
    "lyricId" INTEGER NOT NULL,

    CONSTRAINT "UserLyric_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Chat" (
    "key" SERIAL NOT NULL,
    "id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "lyricId" INTEGER NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("key")
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
CREATE TABLE "Hashtags" (
    "id" SERIAL NOT NULL,
    "hashtags" TEXT[],
    "count" INTEGER NOT NULL,
    "messageId" INTEGER NOT NULL,

    CONSTRAINT "Hashtags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Message_lyricId_key" ON "Message"("lyricId");

-- CreateIndex
CREATE UNIQUE INDEX "Reactions_messageId_key" ON "Reactions"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "Emoji_reactionId_key" ON "Emoji"("reactionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLyric_lyricId_key" ON "UserLyric"("lyricId");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_lyricId_key" ON "Chat"("lyricId");

-- CreateIndex
CREATE UNIQUE INDEX "Media_lyricId_key" ON "Media"("lyricId");

-- CreateIndex
CREATE UNIQUE INDEX "Hashtags_messageId_key" ON "Hashtags"("messageId");

-- AddForeignKey
ALTER TABLE "Lyrics" ADD CONSTRAINT "Lyrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_lyricId_fkey" FOREIGN KEY ("lyricId") REFERENCES "Lyrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reactions" ADD CONSTRAINT "Reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emoji" ADD CONSTRAINT "Emoji_reactionId_fkey" FOREIGN KEY ("reactionId") REFERENCES "Reactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLyric" ADD CONSTRAINT "UserLyric_lyricId_fkey" FOREIGN KEY ("lyricId") REFERENCES "Lyrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_lyricId_fkey" FOREIGN KEY ("lyricId") REFERENCES "Lyrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_lyricId_fkey" FOREIGN KEY ("lyricId") REFERENCES "Lyrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hashtags" ADD CONSTRAINT "Hashtags_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
