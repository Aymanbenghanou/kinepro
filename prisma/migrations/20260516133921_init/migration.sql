-- CreateTable
CREATE TABLE "Cabinet" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "googleMapsLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cabinet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeanceType" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "dureeDefaut" INTEGER NOT NULL DEFAULT 45,
    "tarifDefaut" DOUBLE PRECISION NOT NULL DEFAULT 250,
    "couleur" TEXT NOT NULL DEFAULT '#2563EB',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeanceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Praticien" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "specialite" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "couleur" TEXT NOT NULL DEFAULT '#2563EB',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Praticien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3),
    "sexe" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "cin" TEXT,
    "pathologie" TEXT,
    "antecedents" TEXT,
    "allergies" TEXT,
    "medicaments" TEXT,
    "medecinReferent" TEXT,
    "medecinTelephone" TEXT,
    "mutuelle" TEXT,
    "numeroPolice" TEXT,
    "tarifSeance" DOUBLE PRECISION,
    "modePaiement" TEXT,
    "nbSeancesPrescrites" INTEGER,
    "frequence" TEXT,
    "praticienAssigneId" TEXT,
    "typesSeances" TEXT,
    "objectifsTraitement" TEXT,
    "dateDebutSouhaite" TIMESTAMP(3),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RendezVous" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duree" INTEGER NOT NULL DEFAULT 45,
    "typeSeance" TEXT NOT NULL,
    "salle" TEXT,
    "notes" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'confirme',
    "patientId" TEXT NOT NULL,
    "praticienId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RendezVous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seance" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duree" INTEGER NOT NULL,
    "typeSeance" TEXT NOT NULL,
    "notes" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'realisee',
    "scorePatient" INTEGER,
    "notesInternes" TEXT,
    "feedbackEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "dateFeedback" TIMESTAMP(3),
    "patientId" TEXT NOT NULL,
    "praticienId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Seance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "dateEmise" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "datePaiement" TIMESTAMP(3),
    "patientId" TEXT NOT NULL,
    "seanceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Facture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "commentaire" TEXT,
    "typeMessage" TEXT NOT NULL DEFAULT 'post_seance',
    "patientId" TEXT NOT NULL,
    "seanceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "patientNom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeanceType_nom_key" ON "SeanceType"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_seanceId_key" ON "Facture"("seanceId");

-- AddForeignKey
ALTER TABLE "RendezVous" ADD CONSTRAINT "RendezVous_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendezVous" ADD CONSTRAINT "RendezVous_praticienId_fkey" FOREIGN KEY ("praticienId") REFERENCES "Praticien"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_praticienId_fkey" FOREIGN KEY ("praticienId") REFERENCES "Praticien"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "Seance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppLog" ADD CONSTRAINT "WhatsAppLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
