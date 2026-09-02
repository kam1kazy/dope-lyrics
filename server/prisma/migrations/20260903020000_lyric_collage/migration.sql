-- CreateTable
CREATE TABLE "LyricCollage" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slots" JSONB NOT NULL,

    CONSTRAINT "LyricCollage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LyricCollage_createdAt_idx" ON "LyricCollage"("createdAt");
