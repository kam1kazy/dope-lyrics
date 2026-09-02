-- Backfill readiness from Message.paragraph_count (non-empty lines).
-- Paragraph = 4 lines, floor. READY is never set by formula.
-- Only rows where readiness IS NULL.

UPDATE "Lyrics" AS l
SET readiness = CASE
  WHEN COALESCE(m.paragraph_count, 0) < 1 THEN NULL
  WHEN m.paragraph_count < 4 THEN 'LINE'
  WHEN (m.paragraph_count / 4) <= 4 THEN 'FRAGMENT'
  WHEN (m.paragraph_count / 4) <= 8 THEN 'BLOCK'
  ELSE 'TEXT'
END
FROM "Message" AS m
WHERE m."lyricId" = l.id
  AND l.readiness IS NULL;
