-- AlterEnum
ALTER TYPE "AiUsageKind" ADD VALUE 'PROMPT_META';

-- AlterTable
ALTER TABLE "AiPrompt" ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT;
