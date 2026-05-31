-- One-shot data fix pré-A3 : la valeur 'present' (1 row historique, jamais
-- écrite par le code actuel) est migrée vers 'confirme' pour permettre la
-- conversion de RendezVous.statut en enum RdvStatut(confirme|en_attente|annule|realise).
-- Lancé une fois, conservé pour traçabilité.
UPDATE "RendezVous" SET "statut" = 'confirme' WHERE "statut" = 'present';
