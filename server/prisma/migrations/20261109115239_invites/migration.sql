-- CreateTable
CREATE TABLE "Invite" (
    "id" SERIAL NOT NULL,
    "codeHash" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedById" INTEGER,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invite_codeHash_key" ON "Invite"("codeHash");

-- CreateIndex
CREATE INDEX "Invite_createdById_createdAt_idx" ON "Invite"("createdById", "createdAt");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Счётчик Users.id: владелец вставлен с явным id, и nextval отставал от существующих строк
SELECT setval(pg_get_serial_sequence('"Users"', 'id'), GREATEST((SELECT MAX(id) FROM "Users"), 1));
