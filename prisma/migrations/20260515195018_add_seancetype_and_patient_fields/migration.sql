-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "allergies" TEXT;
ALTER TABLE "Patient" ADD COLUMN "antecedents" TEXT;
ALTER TABLE "Patient" ADD COLUMN "cin" TEXT;
ALTER TABLE "Patient" ADD COLUMN "dateDebutSouhaite" DATETIME;
ALTER TABLE "Patient" ADD COLUMN "frequence" TEXT;
ALTER TABLE "Patient" ADD COLUMN "medecinTelephone" TEXT;
ALTER TABLE "Patient" ADD COLUMN "medicaments" TEXT;
ALTER TABLE "Patient" ADD COLUMN "modePaiement" TEXT;
ALTER TABLE "Patient" ADD COLUMN "nbSeancesPrescrites" INTEGER;
ALTER TABLE "Patient" ADD COLUMN "numeroPolice" TEXT;
ALTER TABLE "Patient" ADD COLUMN "objectifsTraitement" TEXT;
ALTER TABLE "Patient" ADD COLUMN "praticienAssigneId" TEXT;
ALTER TABLE "Patient" ADD COLUMN "sexe" TEXT;
ALTER TABLE "Patient" ADD COLUMN "tarifSeance" REAL;
ALTER TABLE "Patient" ADD COLUMN "typesSeances" TEXT;
ALTER TABLE "Patient" ADD COLUMN "ville" TEXT;

-- CreateTable
CREATE TABLE "SeanceType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "dureeDefaut" INTEGER NOT NULL DEFAULT 45,
    "tarifDefaut" REAL NOT NULL DEFAULT 250,
    "couleur" TEXT NOT NULL DEFAULT '#2563EB',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "SeanceType_nom_key" ON "SeanceType"("nom");
