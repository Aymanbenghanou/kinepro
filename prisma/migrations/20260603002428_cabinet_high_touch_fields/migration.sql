-- AlterTable : ajout de 3 colonnes nullables, purement additif (0 perte de données)
ALTER TABLE "Cabinet"
  ADD COLUMN "planEndsAt"       TIMESTAMP(3),
  ADD COLUMN "suspendedAt"      TIMESTAMP(3),
  ADD COLUMN "suspensionReason" TEXT;
