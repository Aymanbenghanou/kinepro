-- Migration: drop_publicToken
--
-- Retire la colonne publicToken de Patient et Cabinet suite à la
-- suppression complète de la feature QR (commits f74ceb5 UI + 2c8d7e7
-- routes API/pages publiques). Aucune route de l'app ne lit ni écrit
-- publicToken après le commit 2c8d7e7 — cette migration finalise le
-- retrait au niveau schéma.
--
-- Effet :
--   • DROP INDEX des contraintes @unique associées.
--   • DROP COLUMN sur les deux tables.
--   • Les données existantes (tokens historiques) sont perdues avec
--     la colonne — c'est le but : plus rien ne peut plus les lire.

BEGIN;

DROP INDEX "Cabinet_publicToken_key";
DROP INDEX "Patient_publicToken_key";

ALTER TABLE "Cabinet" DROP COLUMN "publicToken";
ALTER TABLE "Patient" DROP COLUMN "publicToken";

COMMIT;
