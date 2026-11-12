-- AlterTable: целая версия рамки vN становится 0.N.0, дальше MAJOR.MINOR.PATCH.
ALTER TABLE "AiUsage" ALTER COLUMN "frameVersion" SET DATA TYPE TEXT
  USING '0.' || "frameVersion"::text || '.0';
