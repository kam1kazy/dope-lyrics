-- AlterTable
ALTER TABLE "Lyrics"
  ALTER COLUMN "mood" DROP DEFAULT,
  ALTER COLUMN "mood" TYPE TEXT[] USING CASE
    WHEN "mood" IS NULL OR btrim("mood") = '' THEN ARRAY[]::TEXT[]
    ELSE ARRAY["mood"]
  END,
  ALTER COLUMN "mood" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "mood" SET NOT NULL;

ALTER TABLE "Lyrics"
  ALTER COLUMN "delivery" DROP DEFAULT,
  ALTER COLUMN "delivery" TYPE TEXT[] USING CASE
    WHEN "delivery" IS NULL OR btrim("delivery") = '' THEN ARRAY[]::TEXT[]
    ELSE ARRAY["delivery"]
  END,
  ALTER COLUMN "delivery" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "delivery" SET NOT NULL;
