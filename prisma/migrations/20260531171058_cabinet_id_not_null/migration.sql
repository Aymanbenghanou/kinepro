-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_cabinetId_fkey";

-- DropForeignKey
ALTER TABLE "Praticien" DROP CONSTRAINT "Praticien_cabinetId_fkey";

-- DropForeignKey
ALTER TABLE "SeanceType" DROP CONSTRAINT "SeanceType_cabinetId_fkey";

-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "cabinetId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ExerciceProgram" ALTER COLUMN "cabinetId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Facture" ALTER COLUMN "cabinetId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Feedback" ALTER COLUMN "cabinetId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Paiement" ALTER COLUMN "cabinetId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Patient" ALTER COLUMN "cabinetId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Praticien" ALTER COLUMN "cabinetId" SET NOT NULL;

-- AlterTable
ALTER TABLE "RendezVous" ALTER COLUMN "cabinetId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Seance" ALTER COLUMN "cabinetId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SeanceType" ALTER COLUMN "cabinetId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WhatsAppLog" ALTER COLUMN "cabinetId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "SeanceType" ADD CONSTRAINT "SeanceType_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Praticien" ADD CONSTRAINT "Praticien_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_cabinetId_fkey" FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

