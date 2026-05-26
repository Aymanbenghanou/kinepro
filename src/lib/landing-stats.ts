// Base historique des cabinets de la version locale : clients déjà acquis avant
// le suivi en base de données. Le compteur "cabinets" de la landing affiche
// CABINETS_BASE + prisma.cabinet.count() (base historique + croissance réelle).
export const CABINETS_BASE = 137
