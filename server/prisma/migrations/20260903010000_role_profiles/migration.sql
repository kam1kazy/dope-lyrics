-- AlterTable
ALTER TABLE "Lyrics" ADD COLUMN "roleProfiles" JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE "Lyrics"
SET "roleProfiles" = jsonb_build_object(
  "songRole",
  jsonb_build_object(
    'mood', to_jsonb(COALESCE("mood", ARRAY[]::TEXT[])),
    'delivery', to_jsonb(COALESCE("delivery", ARRAY[]::TEXT[]))
  )
)
WHERE "songRole" IS NOT NULL AND btrim("songRole") <> '';

ALTER TABLE "Lyrics"
  ALTER COLUMN "songRole" DROP DEFAULT,
  ALTER COLUMN "songRole" TYPE TEXT[] USING CASE
    WHEN "songRole" IS NULL OR btrim("songRole") = '' THEN ARRAY[]::TEXT[]
    ELSE ARRAY["songRole"]
  END,
  ALTER COLUMN "songRole" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "songRole" SET NOT NULL;
