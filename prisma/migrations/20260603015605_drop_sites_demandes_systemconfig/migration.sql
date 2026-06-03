-- Cleanup high-touch : suppression des features sites vitrines, demandes
-- d'abonnement self-service et systemConfig. Destructif et voulu.
--
-- Inspection AGENTS.md §1 step 4 :
--   - DropForeignKey en premier (tables référençantes droppées ensuite)
--   - DROP COLUMN exclusivement sur les champs site/booking du Cabinet
--     (les 4 cabinets test/dev perdent leur slug — OK confirmé)
--   - DROP TABLE x4 sur tables totalement orphelines après suppression UI + API
--   - DROP TYPE DemandeStatut : enum utilisé uniquement par DemandeAbonnement
--   - aucune modification de DEFAULT, aucun ALTER COLUMN problématique

-- DropForeignKey
ALTER TABLE "CabinetSite"       DROP CONSTRAINT "CabinetSite_cabinetId_fkey";
ALTER TABLE "DemandeAbonnement" DROP CONSTRAINT "DemandeAbonnement_cabinetId_fkey";
ALTER TABLE "Testimonial"       DROP CONSTRAINT "Testimonial_cabinetSiteId_fkey";

-- DropIndex (uniques sur les colonnes droppées du Cabinet)
DROP INDEX "Cabinet_slug_key";
DROP INDEX "Cabinet_subdomain_key";

-- AlterTable : retrait des 9 champs site/booking du Cabinet
ALTER TABLE "Cabinet"
  DROP COLUMN "bookingEnabled",
  DROP COLUMN "bookingMessage",
  DROP COLUMN "lunchEndTime",
  DROP COLUMN "lunchStartTime",
  DROP COLUMN "slug",
  DROP COLUMN "subdomain",
  DROP COLUMN "workEndTime",
  DROP COLUMN "workStartTime",
  DROP COLUMN "workingDays";

-- DropTable
DROP TABLE "CabinetSite";
DROP TABLE "DemandeAbonnement";
DROP TABLE "SystemConfig";
DROP TABLE "Testimonial";

-- DropEnum
DROP TYPE "DemandeStatut";
