-- Anonymisation RGPD : ajout d'un flag deletedAt nullable sur Patient.
-- null = patient actif, timestamp = patient anonymisé (PII effacées en place,
-- Seance/Facture/Paiement conservés pour audit médico-comptable).
-- Inspection AGENTS.md §1 step 4 : un seul ALTER ADD COLUMN nullable, aucun
-- DROP, aucune modification d'autre table.

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "deletedAt" TIMESTAMP(3);
