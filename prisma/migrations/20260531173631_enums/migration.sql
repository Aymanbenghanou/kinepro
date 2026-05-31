-- Migration A3 : passage de 9 colonnes String à des enums Prisma.
--
-- Le diff Prisma natif a généré du DROP COLUMN + ADD COLUMN (destructif :
-- toutes les valeurs existantes seraient perdues). On le remplace par des
-- ALTER COLUMN ... TYPE ... USING <col>::"EnumName" non-destructifs, qui
-- castent chaque ligne en place. Pré-requis vérifié par
-- scripts/audit-enum-values.ts : toutes les valeurs DB existantes sont déjà
-- couvertes par les enums (la valeur orpheline 'present' a été migrée en
-- amont via scripts/migrate-rdv-present.sql).
--
-- Pour les colonnes avec un DEFAULT : DROP DEFAULT → ALTER TYPE → SET DEFAULT.

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CABINET_OWNER', 'PRATICIEN', 'SECRETAIRE', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "RdvStatut" AS ENUM ('confirme', 'en_attente', 'annule', 'realise');

-- CreateEnum
CREATE TYPE "SeanceStatut" AS ENUM ('realisee', 'planifiee', 'annulee', 'no_show');

-- CreateEnum
CREATE TYPE "FactureStatut" AS ENUM ('en_attente', 'partielle', 'paye', 'en_retard');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('especes', 'cheque', 'virement', 'carte');

-- CreateEnum
CREATE TYPE "CabinetPlan" AS ENUM ('trial', 'starter', 'pro');

-- CreateEnum
CREATE TYPE "CabinetPlanStatus" AS ENUM ('trialing', 'active', 'expired', 'suspended');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('monthly', 'annual');

-- CreateEnum
CREATE TYPE "DemandeStatut" AS ENUM ('en_attente', 'confirmee', 'refusee');

-- AlterColumn User.role (avec DEFAULT)
ALTER TABLE "User"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole",
  ALTER COLUMN "role" SET DEFAULT 'CABINET_OWNER'::"UserRole";

-- AlterColumn RendezVous.statut (avec DEFAULT)
ALTER TABLE "RendezVous"
  ALTER COLUMN "statut" DROP DEFAULT,
  ALTER COLUMN "statut" TYPE "RdvStatut" USING "statut"::"RdvStatut",
  ALTER COLUMN "statut" SET DEFAULT 'confirme'::"RdvStatut";

-- AlterColumn Seance.statut (avec DEFAULT)
ALTER TABLE "Seance"
  ALTER COLUMN "statut" DROP DEFAULT,
  ALTER COLUMN "statut" TYPE "SeanceStatut" USING "statut"::"SeanceStatut",
  ALTER COLUMN "statut" SET DEFAULT 'realisee'::"SeanceStatut";

-- AlterColumn Facture.statut (avec DEFAULT)
ALTER TABLE "Facture"
  ALTER COLUMN "statut" DROP DEFAULT,
  ALTER COLUMN "statut" TYPE "FactureStatut" USING "statut"::"FactureStatut",
  ALTER COLUMN "statut" SET DEFAULT 'en_attente'::"FactureStatut";

-- AlterColumn Paiement.modePaiement (sans DEFAULT)
ALTER TABLE "Paiement"
  ALTER COLUMN "modePaiement" TYPE "ModePaiement" USING "modePaiement"::"ModePaiement";

-- AlterColumn Cabinet.plan (avec DEFAULT)
ALTER TABLE "Cabinet"
  ALTER COLUMN "plan" DROP DEFAULT,
  ALTER COLUMN "plan" TYPE "CabinetPlan" USING "plan"::"CabinetPlan",
  ALTER COLUMN "plan" SET DEFAULT 'trial'::"CabinetPlan";

-- AlterColumn Cabinet.planStatus (avec DEFAULT)
ALTER TABLE "Cabinet"
  ALTER COLUMN "planStatus" DROP DEFAULT,
  ALTER COLUMN "planStatus" TYPE "CabinetPlanStatus" USING "planStatus"::"CabinetPlanStatus",
  ALTER COLUMN "planStatus" SET DEFAULT 'trialing'::"CabinetPlanStatus";

-- AlterColumn Cabinet.billingCycle (nullable, sans DEFAULT)
ALTER TABLE "Cabinet"
  ALTER COLUMN "billingCycle" TYPE "BillingCycle" USING "billingCycle"::"BillingCycle";

-- AlterColumn DemandeAbonnement.plan (sans DEFAULT)
ALTER TABLE "DemandeAbonnement"
  ALTER COLUMN "plan" TYPE "CabinetPlan" USING "plan"::"CabinetPlan";

-- AlterColumn DemandeAbonnement.billingCycle (sans DEFAULT)
ALTER TABLE "DemandeAbonnement"
  ALTER COLUMN "billingCycle" TYPE "BillingCycle" USING "billingCycle"::"BillingCycle";

-- AlterColumn DemandeAbonnement.statut (avec DEFAULT)
ALTER TABLE "DemandeAbonnement"
  ALTER COLUMN "statut" DROP DEFAULT,
  ALTER COLUMN "statut" TYPE "DemandeStatut" USING "statut"::"DemandeStatut",
  ALTER COLUMN "statut" SET DEFAULT 'en_attente'::"DemandeStatut";
