-- Drop du champ RendezVous.salle (feature Salles supprimée intégralement).
-- Les 36 RDV historiques perdent leur valeur 'Salle 1|2|3' — délibéré, ces
-- enregistrements étaient des cabinets test.
-- Inspection AGENTS.md §1 step 4 : un seul DROP COLUMN, aucune autre altération.

-- AlterTable
ALTER TABLE "RendezVous" DROP COLUMN "salle";
