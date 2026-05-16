import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const adapter = new PrismaBetterSqlite3({ url: `file:${path.resolve(process.cwd(), 'dev.db')}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Nettoyer dans l'ordre des dépendances
  await prisma.facture.deleteMany()
  await prisma.seance.deleteMany()
  await prisma.rendezVous.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.praticien.deleteMany()
  await prisma.seanceType.deleteMany()
  await prisma.cabinet.deleteMany()

  // Cabinet
  await prisma.cabinet.create({
    data: {
      nom: 'Cabinet Amrani - Kinésithérapie',
      adresse: '45 Avenue Hassan II, Casablanca 20000',
      telephone: '0522-456-789',
      email: 'contact@cabinet-amrani.ma',
    },
  })

  // Types de séances
  const typesSeance = [
    { nom: 'Rééducation fonctionnelle', description: 'Rééducation globale de la fonction motrice', dureeDefaut: 45, tarifDefaut: 300, couleur: '#2563EB' },
    { nom: 'Post-opératoire', description: 'Rééducation après intervention chirurgicale', dureeDefaut: 60, tarifDefaut: 400, couleur: '#7C3AED' },
    { nom: 'Massage thérapeutique', description: 'Massage à visée thérapeutique et décontracturante', dureeDefaut: 30, tarifDefaut: 250, couleur: '#0D9488' },
    { nom: 'Électrothérapie', description: 'Traitement par courants électriques', dureeDefaut: 30, tarifDefaut: 200, couleur: '#D97706' },
    { nom: 'Balnéothérapie', description: 'Thérapie par immersion dans l\'eau', dureeDefaut: 45, tarifDefaut: 350, couleur: '#0EA5E9' },
    { nom: 'Mobilisation articulaire', description: 'Techniques de mobilisation passive et active', dureeDefaut: 45, tarifDefaut: 300, couleur: '#16A34A' },
    { nom: 'Renforcement musculaire', description: 'Exercices de renforcement progressif', dureeDefaut: 60, tarifDefaut: 300, couleur: '#DC2626' },
    { nom: 'Bilan initial', description: 'Évaluation complète du patient', dureeDefaut: 60, tarifDefaut: 400, couleur: '#1E3A5F' },
    { nom: 'Kinésithérapie respiratoire', description: 'Rééducation des fonctions respiratoires', dureeDefaut: 30, tarifDefaut: 250, couleur: '#9333EA' },
    { nom: 'Rééducation neurologique', description: 'Rééducation des troubles neurologiques', dureeDefaut: 60, tarifDefaut: 450, couleur: '#C2410C' },
  ]
  for (const t of typesSeance) {
    await prisma.seanceType.create({ data: t })
  }

  // Praticiens
  const amrani = await prisma.praticien.create({
    data: { nom: 'Amrani', prenom: 'Rachid', specialite: 'Kiné général', telephone: '0661-234-567', email: 'r.amrani@cabinet-amrani.ma', couleur: '#2563EB' },
  })
  const cherkaoui = await prisma.praticien.create({
    data: { nom: 'Cherkaoui', prenom: 'Sanae', specialite: 'Kiné sport', telephone: '0662-345-678', email: 's.cherkaoui@cabinet-amrani.ma', couleur: '#16A34A' },
  })
  const benchrif = await prisma.praticien.create({
    data: { nom: 'Benchrif', prenom: 'Youssef', specialite: 'Kiné pédiatrique', telephone: '0663-456-789', email: 'y.benchrif@cabinet-amrani.ma', couleur: '#F59E0B' },
  })

  // Patients
  const patientsData = [
    { nom: 'Benali', prenom: 'Fatima', sexe: 'Femme', telephone: '0671-111-001', email: 'fatima.benali@gmail.com', pathologie: 'Lombalgie chronique', mutuelle: 'CNSS', medecinReferent: 'Dr. Karimi', ville: 'Casablanca', nbSeancesPrescrites: 15, frequence: '3x/semaine', typesSeances: 'Rééducation fonctionnelle', objectifsTraitement: 'Réduire douleurs lombaires et renforcer les muscles du dos' },
    { nom: 'Tazi', prenom: 'Mohammed', sexe: 'Homme', telephone: '0671-111-002', email: 'mohammed.tazi@gmail.com', pathologie: 'Tendinite épaule', mutuelle: 'CNOPS', medecinReferent: 'Dr. Alaoui', ville: 'Rabat', nbSeancesPrescrites: 10, frequence: '2x/semaine', typesSeances: 'Massage thérapeutique', objectifsTraitement: 'Récupération complète de l\'épaule droite' },
    { nom: 'Mansouri', prenom: 'Khadija', sexe: 'Femme', telephone: '0671-111-003', email: 'khadija.mansouri@gmail.com', pathologie: 'Cervicalgie', mutuelle: 'RMA', medecinReferent: 'Dr. Bennis', ville: 'Marrakech', nbSeancesPrescrites: 12, frequence: '2x/semaine', typesSeances: 'Mobilisation articulaire', objectifsTraitement: 'Réduire les douleurs cervicales' },
    { nom: 'El Fassi', prenom: 'Yassine', sexe: 'Homme', telephone: '0671-111-004', email: 'yassine.elfassi@gmail.com', pathologie: 'Entorse cheville', mutuelle: 'CNSS', medecinReferent: 'Dr. Karimi', ville: 'Casablanca', nbSeancesPrescrites: 8, frequence: '3x/semaine', typesSeances: 'Rééducation fonctionnelle', objectifsTraitement: 'Retrouver la stabilité et la mobilité complète de la cheville' },
    { nom: 'Berrada', prenom: 'Nadia', sexe: 'Femme', telephone: '0671-111-005', email: 'nadia.berrada@gmail.com', pathologie: 'Rééducation post-op genou', mutuelle: 'MAMDA', medecinReferent: 'Dr. Sefrioui', ville: 'Casablanca', nbSeancesPrescrites: 20, frequence: '3x/semaine', typesSeances: 'Post-opératoire', objectifsTraitement: 'Récupération complète après arthroplastie du genou' },
    { nom: 'Chraibi', prenom: 'Omar', sexe: 'Homme', telephone: '0671-111-006', email: 'omar.chraibi@gmail.com', pathologie: 'Hernie discale L4-L5', mutuelle: 'CNOPS', medecinReferent: 'Dr. Alaoui', ville: 'Fès', nbSeancesPrescrites: 18, frequence: '2x/semaine', typesSeances: 'Rééducation fonctionnelle', objectifsTraitement: 'Réduction de la douleur et prévention des récidives' },
    { nom: 'Lahlou', prenom: 'Zineb', sexe: 'Femme', telephone: '0671-111-007', email: 'zineb.lahlou@gmail.com', pathologie: 'Scoliose adolescente', mutuelle: 'CNSS', medecinReferent: 'Dr. Bennis', ville: 'Casablanca', nbSeancesPrescrites: 24, frequence: '3x/semaine', typesSeances: 'Renforcement musculaire', objectifsTraitement: 'Stabilisation de la courbure et renforcement du gainage' },
    { nom: 'Saidi', prenom: 'Hamid', sexe: 'Homme', telephone: '0671-111-008', email: 'hamid.saidi@gmail.com', pathologie: 'Paralysie faciale', mutuelle: 'RMA', medecinReferent: 'Dr. Karimi', ville: 'Agadir', nbSeancesPrescrites: 15, frequence: '3x/semaine', typesSeances: 'Rééducation neurologique', objectifsTraitement: 'Récupération de la mobilité faciale' },
    { nom: 'Benhaddou', prenom: 'Samira', sexe: 'Femme', telephone: '0671-111-009', email: 'samira.benhaddou@gmail.com', pathologie: 'Épaule gelée', mutuelle: 'CNSS', medecinReferent: 'Dr. Alaoui', ville: 'Casablanca', nbSeancesPrescrites: 16, frequence: '2x/semaine', typesSeances: 'Mobilisation articulaire', objectifsTraitement: 'Récupération de l\'amplitude articulaire' },
    { nom: 'Zouiten', prenom: 'Amine', sexe: 'Homme', telephone: '0671-111-010', email: 'amine.zouiten@gmail.com', pathologie: 'Tendinopathie rotule', mutuelle: 'CNOPS', medecinReferent: 'Dr. Sefrioui', ville: 'Rabat', nbSeancesPrescrites: 12, frequence: '2x/semaine', typesSeances: 'Électrothérapie', objectifsTraitement: 'Réduire l\'inflammation et renforcer le quadriceps' },
    { nom: 'Idrissi', prenom: 'Hasnaa', sexe: 'Femme', telephone: '0671-111-011', email: 'hasnaa.idrissi@gmail.com', pathologie: 'Lombalgie aiguë', mutuelle: 'MAMDA', medecinReferent: 'Dr. Karimi', ville: 'Casablanca', nbSeancesPrescrites: 8, frequence: '3x/semaine', typesSeances: 'Massage thérapeutique', objectifsTraitement: 'Soulagement rapide de la douleur et reprise des activités' },
    { nom: 'Bennani', prenom: 'Karim', sexe: 'Homme', telephone: '0671-111-012', email: 'karim.bennani@gmail.com', pathologie: 'Cervicobrachialgie', mutuelle: 'CNSS', medecinReferent: 'Dr. Bennis', ville: 'Casablanca', nbSeancesPrescrites: 14, frequence: '2x/semaine', typesSeances: 'Rééducation fonctionnelle', objectifsTraitement: 'Réduction des irradiations dans le membre supérieur' },
    { nom: 'Rhazi', prenom: 'Widad', sexe: 'Femme', telephone: '0671-111-013', email: 'widad.rhazi@gmail.com', pathologie: 'Rééducation AVC', mutuelle: 'CNOPS', medecinReferent: 'Dr. Alaoui', ville: 'Meknès', nbSeancesPrescrites: 30, frequence: '3x/semaine', typesSeances: 'Rééducation neurologique', objectifsTraitement: 'Récupération de la motricité du membre supérieur gauche' },
    { nom: 'Ouazzani', prenom: 'Tariq', sexe: 'Homme', telephone: '0671-111-014', email: 'tariq.ouazzani@gmail.com', pathologie: 'Gonarthrose', mutuelle: 'RMA', medecinReferent: 'Dr. Sefrioui', ville: 'Casablanca', nbSeancesPrescrites: 20, frequence: '2x/semaine', typesSeances: 'Balnéothérapie', objectifsTraitement: 'Améliorer la mobilité articulaire et réduire la douleur' },
    { nom: 'Filali', prenom: 'Leila', sexe: 'Femme', telephone: '0671-111-015', email: 'leila.filali@gmail.com', pathologie: 'Torticolis infantile', mutuelle: 'CNSS', medecinReferent: 'Dr. Karimi', ville: 'Casablanca', nbSeancesPrescrites: 10, frequence: '3x/semaine', typesSeances: 'Kinésithérapie respiratoire', objectifsTraitement: 'Correction de la déviation cervicale' },
  ]

  const praticiens = [amrani, cherkaoui, benchrif]
  const patients = []
  for (const p of patientsData) {
    const patient = await prisma.patient.create({
      data: {
        ...p,
        dateNaissance: new Date(1975 + Math.floor(Math.random() * 35), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        adresse: `${Math.floor(Math.random() * 200) + 1} Rue de la Paix`,
        cin: `BE${Math.floor(Math.random() * 900000) + 100000}`,
        tarifSeance: [200, 250, 300, 350][Math.floor(Math.random() * 4)],
        modePaiement: ['Espèces', 'Virement', 'Chèque'][Math.floor(Math.random() * 3)],
        praticienAssigneId: praticiens[Math.floor(Math.random() * praticiens.length)].id,
      },
    })
    patients.push(patient)
  }

  const typesLabels = ['Rééducation fonctionnelle', 'Massage thérapeutique', 'Électrothérapie', 'Ultrasons', 'Mobilisation articulaire', 'Renforcement musculaire']
  const salles = ['Salle 1', 'Salle 2', 'Salle 3']
  const now = new Date()

  // 30 RDV
  for (let i = 0; i < 30; i++) {
    const daysAhead = Math.floor(Math.random() * 14)
    const date = new Date(now)
    date.setDate(date.getDate() + daysAhead)
    date.setHours(8 + Math.floor(Math.random() * 10), [0, 15, 30, 45][Math.floor(Math.random() * 4)], 0, 0)
    await prisma.rendezVous.create({
      data: {
        date, duree: [30, 45, 60][Math.floor(Math.random() * 3)],
        typeSeance: typesLabels[Math.floor(Math.random() * typesLabels.length)],
        salle: salles[Math.floor(Math.random() * salles.length)],
        statut: ['confirme', 'confirme', 'confirme', 'en_attente'][Math.floor(Math.random() * 4)],
        patientId: patients[Math.floor(Math.random() * patients.length)].id,
        praticienId: praticiens[Math.floor(Math.random() * praticiens.length)].id,
      },
    })
  }

  // 50 séances
  const seances = []
  for (let i = 0; i < 50; i++) {
    const daysBack = Math.floor(Math.random() * 90) + 1
    const date = new Date(now)
    date.setDate(date.getDate() - daysBack)
    date.setHours(8 + Math.floor(Math.random() * 10), 0, 0, 0)
    const statuts = ['realisee', 'realisee', 'realisee', 'annulee', 'no_show']
    const statut = statuts[Math.floor(Math.random() * statuts.length)]
    const seance = await prisma.seance.create({
      data: {
        date, duree: [30, 45, 60][Math.floor(Math.random() * 3)],
        typeSeance: typesLabels[Math.floor(Math.random() * typesLabels.length)],
        statut,
        notes: statut === 'realisee' ? 'Séance bien déroulée. Patient coopératif. Amélioration notable.' : null,
        patientId: patients[Math.floor(Math.random() * patients.length)].id,
        praticienId: praticiens[Math.floor(Math.random() * praticiens.length)].id,
      },
    })
    seances.push(seance)
  }

  // 40 factures
  const statutsFacture = ['paye', 'paye', 'paye', 'en_attente', 'en_attente', 'en_retard']
  for (let i = 0; i < 40; i++) {
    const seance = seances[i % seances.length]
    const statut = statutsFacture[Math.floor(Math.random() * statutsFacture.length)]
    const daysBack = Math.floor(Math.random() * 90) + 1
    const dateEmise = new Date(now)
    dateEmise.setDate(dateEmise.getDate() - daysBack)
    // Only link seanceId for first 40 seances and avoid duplicate
    await prisma.facture.create({
      data: {
        montant: [150, 200, 250, 300, 350, 400][Math.floor(Math.random() * 6)],
        statut, dateEmise,
        datePaiement: statut === 'paye' ? new Date(dateEmise.getTime() + 86400000 * Math.floor(Math.random() * 7)) : null,
        patientId: seance.patientId,
      },
    })
  }

  console.log('✅ Seed terminé avec succès!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
