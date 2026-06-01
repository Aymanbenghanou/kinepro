-- AlterTable
ALTER TABLE "Seance" ADD COLUMN     "rendezVousId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Seance_rendezVousId_key" ON "Seance"("rendezVousId");

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_rendezVousId_fkey" FOREIGN KEY ("rendezVousId") REFERENCES "RendezVous"("id") ON DELETE SET NULL ON UPDATE CASCADE;

