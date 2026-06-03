-- Drop du modèle Subscription (vestigial, écrit mais plus jamais utilisé après
-- migration de l'authentification vers Cabinet.{plan,planStatus,trialEndsAt}).
-- Inspection AGENTS.md §1 step 4 :
--   - DropForeignKey avant DropTable (ordre correct)
--   - Aucune table externe ne référence Subscription → pas de DELETE préalable
--   - Aucun ALTER COLUMN sur table conservée, aucun changement de DEFAULT

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_cabinetId_fkey";

-- DropTable
DROP TABLE "Subscription";
