-- CreateEnum
CREATE TYPE "AiUsageKind" AS ENUM ('COLLAGE_REWRITE');

-- CreateEnum
CREATE TYPE "AiUsageStatus" AS ENUM ('OK', 'ERROR');

-- CreateTable
CREATE TABLE "AiPrompt" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "AiPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsage" (
    "id" SERIAL NOT NULL,
    "kind" "AiUsageKind" NOT NULL,
    "model" TEXT NOT NULL,
    "frameVersion" INTEGER NOT NULL,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "costRub" DECIMAL(12,4),
    "latencyMs" INTEGER NOT NULL,
    "status" "AiUsageStatus" NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "promptId" INTEGER,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackText" (
    "id" SERIAL NOT NULL,
    "theme" TEXT,
    "slots" JSONB NOT NULL,
    "sourceText" TEXT NOT NULL,
    "aiText" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "finalText" TEXT,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "promptId" INTEGER,
    "usageId" INTEGER,

    CONSTRAINT "TrackText_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiPrompt_userId_createdAt_idx" ON "AiPrompt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsage_userId_createdAt_idx" ON "AiUsage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TrackText_userId_createdAt_idx" ON "TrackText"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AiPrompt" ADD CONSTRAINT "AiPrompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "AiPrompt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackText" ADD CONSTRAINT "TrackText_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackText" ADD CONSTRAINT "TrackText_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "AiPrompt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackText" ADD CONSTRAINT "TrackText_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "AiUsage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
