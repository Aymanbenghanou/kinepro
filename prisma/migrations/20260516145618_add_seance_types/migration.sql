-- DropIndex
DROP INDEX "SeanceType_nom_key";

-- AlterTable
ALTER TABLE "RendezVous" ADD COLUMN     "seanceTypeId" TEXT;

-- AlterTable
ALTER TABLE "Seance" ADD COLUMN     "seanceTypeId" TEXT;

-- AlterTable
ALTER TABLE "SeanceType" ADD COLUMN     "praticienId" TEXT;

-- AddForeignKey
ALTER TABLE "SeanceType" ADD CONSTRAINT "SeanceType_praticienId_fkey" FOREIGN KEY ("praticienId") REFERENCES "Praticien"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendezVous" ADD CONSTRAINT "RendezVous_seanceTypeId_fkey" FOREIGN KEY ("seanceTypeId") REFERENCES "SeanceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_seanceTypeId_fkey" FOREIGN KEY ("seanceTypeId") REFERENCES "SeanceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
