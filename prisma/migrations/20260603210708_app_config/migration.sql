-- Config globale plateforme : single-row table (id = 'singleton').
-- Inspection AGENTS.md §1 step 4 : un seul CREATE TABLE, aucun ALTER sur table
-- existante, aucun DROP. Sûr.

-- CreateTable
CREATE TABLE "AppConfig" (
    "id"              TEXT          NOT NULL DEFAULT 'singleton',
    "supportWhatsapp" TEXT          NOT NULL DEFAULT '+212649911970',
    "updatedAt"       TIMESTAMP(3)  NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- Seed initial : insertion de la row singleton (idempotent via ON CONFLICT).
INSERT INTO "AppConfig" ("id", "supportWhatsapp", "updatedAt")
VALUES ('singleton', '+212649911970', NOW())
ON CONFLICT ("id") DO NOTHING;
