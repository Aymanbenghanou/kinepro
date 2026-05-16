// Default session types seeded for every new cabinet

export const DEFAULT_SEANCE_TYPES = [
  { nom: 'Rééducation fonctionnelle',   description: 'Rééducation générale et fonctionnelle',             dureeDefaut: 45, tarifDefaut: 300, couleur: '#2563EB' },
  { nom: 'Post-opératoire',             description: 'Suivi et rééducation post-chirurgie',                dureeDefaut: 60, tarifDefaut: 400, couleur: '#7C3AED' },
  { nom: 'Massage thérapeutique',       description: 'Massage à visée thérapeutique',                      dureeDefaut: 30, tarifDefaut: 250, couleur: '#0D9488' },
  { nom: 'Électrothérapie',             description: 'Traitement par courants électriques',                dureeDefaut: 30, tarifDefaut: 200, couleur: '#D97706' },
  { nom: 'Balnéothérapie',              description: 'Thérapie par l\'eau',                                dureeDefaut: 45, tarifDefaut: 350, couleur: '#0EA5E9' },
  { nom: 'Mobilisation articulaire',    description: 'Techniques de mobilisation des articulations',       dureeDefaut: 45, tarifDefaut: 300, couleur: '#16A34A' },
  { nom: 'Renforcement musculaire',     description: 'Exercices de renforcement',                          dureeDefaut: 60, tarifDefaut: 300, couleur: '#DC2626' },
  { nom: 'Bilan initial',               description: 'Évaluation et bilan du patient',                    dureeDefaut: 60, tarifDefaut: 400, couleur: '#1E3A5F' },
  { nom: 'Kinésithérapie respiratoire', description: 'Rééducation respiratoire',                          dureeDefaut: 30, tarifDefaut: 250, couleur: '#9333EA' },
  { nom: 'Rééducation neurologique',    description: 'Rééducation des pathologies neurologiques',         dureeDefaut: 60, tarifDefaut: 450, couleur: '#C2410C' },
] as const
