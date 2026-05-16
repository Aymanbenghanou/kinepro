-- AlterTable
ALTER TABLE "Cabinet" ADD COLUMN "googleMapsLink" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Seance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "duree" INTEGER NOT NULL,
    "typeSeance" TEXT NOT NULL,
    "notes" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'realisee',
    "scorePatient" INTEGER,
    "notesInternes" TEXT,
    "feedbackEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "dateFeedback" DATETIME,
    "patientId" TEXT NOT NULL,
    "praticienId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Seance_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Seance_praticienId_fkey" FOREIGN KEY ("praticienId") REFERENCES "Praticien" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Seance" ("createdAt", "date", "duree", "id", "notes", "patientId", "praticienId", "statut", "typeSeance") SELECT "createdAt", "date", "duree", "id", "notes", "patientId", "praticienId", "statut", "typeSeance" FROM "Seance";
DROP TABLE "Seance";
ALTER TABLE "new_Seance" RENAME TO "Seance";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
