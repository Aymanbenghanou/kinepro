import { config } from 'dotenv'
config({ path: '.env.development.local', override: true })
config({ path: '.env' })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool    = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Début du seeding…')

  // ─── Clean all tables in dependency order ────────────────────────────────────
  await prisma.whatsAppLog.deleteMany()
  await prisma.facture.deleteMany()
  await prisma.seance.deleteMany()
  await prisma.rendezVous.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.seanceType.deleteMany()
  await prisma.praticien.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.user.deleteMany()
  await prisma.cabinet.deleteMany()
  await prisma.systemConfig.deleteMany()

  const now = new Date()

  // ─── System config ────────────────────────────────────────────────────────────
  await prisma.systemConfig.create({
    data: {
      id:             'global',
      whatsappNumber: '212600000000',
      rib:            '007 780 0001234567890 12',
      banque:         'Attijariwafa Bank',
      titulaire:      'KinéPro SARL',
      prixMensuel:    299,
      prixAnnuel:     2499,
    },
  })

  // ─── SUPER ADMIN (no cabinet) ─────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      email:    'admin@kinepro.ma',
      password: await bcrypt.hash('Admin123!', 12),
      role:     'SUPER_ADMIN',
      nom:      'Admin',
      prenom:   'Super',
    },
  })
  console.log('✅ SUPER_ADMIN: admin@kinepro.ma / Admin123!')

  // ─── CABINET 1 — Trial active ─────────────────────────────────────────────────
  const cabinet1 = await prisma.cabinet.create({
    data: {
      nom:       'Cabinet Amrani - Kinésithérapie',
      ville:     'Casablanca',
      telephone: '0522-456-789',
      email:     'contact@cabinet-amrani.ma',
    },
  })

  await prisma.subscription.create({
    data: {
      cabinetId:   cabinet1.id,
      plan:        'TRIAL',
      trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days remaining
    },
  })

  const owner1 = await prisma.user.create({
    data: {
      email:     'amrani@test.com',
      password:  await bcrypt.hash('Test123!', 12),
      role:      'CABINET_OWNER',
      nom:       'Amrani',
      prenom:    'Rachid',
      cabinetId: cabinet1.id,
    },
  })

  await prisma.cabinet.update({ where: { id: cabinet1.id }, data: { ownerId: owner1.id } })
  console.log('✅ Cabinet 1 (essai actif 5j): amrani@test.com / Test123!')

  // Praticiens for Cabinet 1
  const amrani = await prisma.praticien.create({
    data: { cabinetId: cabinet1.id, nom: 'Amrani', prenom: 'Rachid', specialite: 'Kiné général', telephone: '0661-234-567', email: 'r.amrani@cabinet-amrani.ma', couleur: '#2563EB' },
  })
  const cherkaoui = await prisma.praticien.create({
    data: { cabinetId: cabinet1.id, nom: 'Cherkaoui', prenom: 'Sanae', specialite: 'Kiné sport', telephone: '0662-345-678', email: 's.cherkaoui@cabinet-amrani.ma', couleur: '#16A34A' },
  })
  const benchrif = await prisma.praticien.create({
    data: { cabinetId: cabinet1.id, nom: 'Benchrif', prenom: 'Youssef', specialite: 'Kiné pédiatrique', telephone: '0663-456-789', email: 'y.benchrif@cabinet-amrani.ma', couleur: '#F59E0B' },
  })

  // SeanceTypes for Cabinet 1
  const typesData = [
    { nom: 'Rééducation fonctionnelle', description: 'Rééducation globale de la fonction motrice', dureeDefaut: 45, tarifDefaut: 300, couleur: '#2563EB' },
    { nom: 'Post-opératoire',           description: 'Rééducation après intervention chirurgicale', dureeDefaut: 60, tarifDefaut: 400, couleur: '#7C3AED' },
    { nom: 'Massage thérapeutique',     description: 'Massage à visée thérapeutique',               dureeDefaut: 30, tarifDefaut: 250, couleur: '#0D9488' },
    { nom: 'Électrothérapie',           description: 'Traitement par courants électriques',         dureeDefaut: 30, tarifDefaut: 200, couleur: '#D97706' },
    { nom: 'Balnéothérapie',            description: 'Thérapie par immersion dans l\'eau',          dureeDefaut: 45, tarifDefaut: 350, couleur: '#0EA5E9' },
    { nom: 'Mobilisation articulaire',  description: 'Techniques de mobilisation passive et active', dureeDefaut: 45, tarifDefaut: 300, couleur: '#16A34A' },
    { nom: 'Renforcement musculaire',   description: 'Exercices de renforcement progressif',        dureeDefaut: 60, tarifDefaut: 300, couleur: '#DC2626' },
    { nom: 'Bilan initial',             description: 'Évaluation complète du patient',              dureeDefaut: 60, tarifDefaut: 400, couleur: '#1E3A5F' },
    { nom: 'Kiné respiratoire',         description: 'Rééducation des fonctions respiratoires',     dureeDefaut: 30, tarifDefaut: 250, couleur: '#9333EA' },
    { nom: 'Rééducation neurologique',  description: 'Rééducation des troubles neurologiques',      dureeDefaut: 60, tarifDefaut: 450, couleur: '#C2410C' },
  ]
  for (const t of typesData) {
    await prisma.seanceType.create({ data: { cabinetId: cabinet1.id, ...t } })
  }

  // Patients for Cabinet 1
  const patientsData = [
    { nom: 'Benali', prenom: 'Fatima', sexe: 'Femme', telephone: '0671-111-001', email: 'fatima.benali@gmail.com', pathologie: 'Lombalgie chronique', mutuelle: 'CNSS', medecinReferent: 'Dr. Karimi', ville: 'Casablanca', nbSeancesPrescrites: 15, typesSeances: 'Rééducation fonctionnelle' },
    { nom: 'Tazi', prenom: 'Mohammed', sexe: 'Homme', telephone: '0671-111-002', email: 'mohammed.tazi@gmail.com', pathologie: 'Tendinite épaule', mutuelle: 'CNOPS', medecinReferent: 'Dr. Alaoui', ville: 'Rabat', nbSeancesPrescrites: 10, typesSeances: 'Massage thérapeutique' },
    { nom: 'Mansouri', prenom: 'Khadija', sexe: 'Femme', telephone: '0671-111-003', email: 'khadija.mansouri@gmail.com', pathologie: 'Cervicalgie', mutuelle: 'RMA', medecinReferent: 'Dr. Bennis', ville: 'Marrakech', nbSeancesPrescrites: 12, typesSeances: 'Mobilisation articulaire' },
    { nom: 'El Fassi', prenom: 'Yassine', sexe: 'Homme', telephone: '0671-111-004', email: 'yassine.elfassi@gmail.com', pathologie: 'Entorse cheville', mutuelle: 'CNSS', medecinReferent: 'Dr. Karimi', ville: 'Casablanca', nbSeancesPrescrites: 8, typesSeances: 'Rééducation fonctionnelle' },
    { nom: 'Berrada', prenom: 'Nadia', sexe: 'Femme', telephone: '0671-111-005', email: 'nadia.berrada@gmail.com', pathologie: 'Rééducation post-op genou', mutuelle: 'MAMDA', medecinReferent: 'Dr. Sefrioui', ville: 'Casablanca', nbSeancesPrescrites: 20, typesSeances: 'Post-opératoire' },
    { nom: 'Chraibi', prenom: 'Omar', sexe: 'Homme', telephone: '0671-111-006', email: 'omar.chraibi@gmail.com', pathologie: 'Hernie discale L4-L5', mutuelle: 'CNOPS', medecinReferent: 'Dr. Alaoui', ville: 'Fès', nbSeancesPrescrites: 18, typesSeances: 'Rééducation fonctionnelle' },
    { nom: 'Lahlou', prenom: 'Zineb', sexe: 'Femme', telephone: '0671-111-007', email: 'zineb.lahlou@gmail.com', pathologie: 'Scoliose adolescente', mutuelle: 'CNSS', medecinReferent: 'Dr. Bennis', ville: 'Casablanca', nbSeancesPrescrites: 24, typesSeances: 'Renforcement musculaire' },
    { nom: 'Saidi', prenom: 'Hamid', sexe: 'Homme', telephone: '0671-111-008', email: 'hamid.saidi@gmail.com', pathologie: 'Paralysie faciale', mutuelle: 'RMA', medecinReferent: 'Dr. Karimi', ville: 'Agadir', nbSeancesPrescrites: 15, typesSeances: 'Rééducation neurologique' },
    { nom: 'Benhaddou', prenom: 'Samira', sexe: 'Femme', telephone: '0671-111-009', email: 'samira.benhaddou@gmail.com', pathologie: 'Épaule gelée', mutuelle: 'CNSS', medecinReferent: 'Dr. Alaoui', ville: 'Casablanca', nbSeancesPrescrites: 16, typesSeances: 'Mobilisation articulaire' },
    { nom: 'Zouiten', prenom: 'Amine', sexe: 'Homme', telephone: '0671-111-010', email: 'amine.zouiten@gmail.com', pathologie: 'Tendinopathie rotule', mutuelle: 'CNOPS', medecinReferent: 'Dr. Sefrioui', ville: 'Rabat', nbSeancesPrescrites: 12, typesSeances: 'Électrothérapie' },
    { nom: 'Idrissi', prenom: 'Hasnaa', sexe: 'Femme', telephone: '0671-111-011', email: 'hasnaa.idrissi@gmail.com', pathologie: 'Lombalgie aiguë', mutuelle: 'MAMDA', medecinReferent: 'Dr. Karimi', ville: 'Casablanca', nbSeancesPrescrites: 8, typesSeances: 'Massage thérapeutique' },
    { nom: 'Bennani', prenom: 'Karim', sexe: 'Homme', telephone: '0671-111-012', email: 'karim.bennani@gmail.com', pathologie: 'Cervicobrachialgie', mutuelle: 'CNSS', medecinReferent: 'Dr. Bennis', ville: 'Casablanca', nbSeancesPrescrites: 14, typesSeances: 'Rééducation fonctionnelle' },
    { nom: 'Rhazi', prenom: 'Widad', sexe: 'Femme', telephone: '0671-111-013', email: 'widad.rhazi@gmail.com', pathologie: 'Rééducation AVC', mutuelle: 'CNOPS', medecinReferent: 'Dr. Alaoui', ville: 'Meknès', nbSeancesPrescrites: 30, typesSeances: 'Rééducation neurologique' },
    { nom: 'Ouazzani', prenom: 'Tariq', sexe: 'Homme', telephone: '0671-111-014', email: 'tariq.ouazzani@gmail.com', pathologie: 'Gonarthrose', mutuelle: 'RMA', medecinReferent: 'Dr. Sefrioui', ville: 'Casablanca', nbSeancesPrescrites: 20, typesSeances: 'Balnéothérapie' },
    { nom: 'Filali', prenom: 'Leila', sexe: 'Femme', telephone: '0671-111-015', email: 'leila.filali@gmail.com', pathologie: 'Torticolis infantile', mutuelle: 'CNSS', medecinReferent: 'Dr. Karimi', ville: 'Casablanca', nbSeancesPrescrites: 10, typesSeances: 'Kiné respiratoire' },
  ]

  const praticiens1 = [amrani, cherkaoui, benchrif]
  const patients1: Awaited<ReturnType<typeof prisma.patient.create>>[] = []

  for (const p of patientsData) {
    const patient = await prisma.patient.create({
      data: {
        cabinetId:           cabinet1.id,
        nom:                 p.nom,
        prenom:              p.prenom,
        sexe:                p.sexe,
        telephone:           p.telephone,
        email:               p.email,
        pathologie:          p.pathologie,
        mutuelle:            p.mutuelle,
        medecinReferent:     p.medecinReferent,
        ville:               p.ville,
        nbSeancesPrescrites: p.nbSeancesPrescrites,
        typesSeances:        p.typesSeances,
        dateNaissance:       new Date(1970 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        adresse:             `${Math.floor(Math.random() * 200) + 1} Rue de la Paix`,
        cin:                 `BE${Math.floor(Math.random() * 900000) + 100000}`,
        tarifSeance:         [200, 250, 300, 350][Math.floor(Math.random() * 4)],
        modePaiement:        ['Espèces', 'Virement', 'Chèque'][Math.floor(Math.random() * 3)],
        praticienAssigneId:  praticiens1[Math.floor(Math.random() * praticiens1.length)].id,
        frequence:           ['2x/semaine', '3x/semaine'][Math.floor(Math.random() * 2)],
      },
    })
    patients1.push(patient)
  }

  const typesLabels = ['Rééducation fonctionnelle', 'Massage thérapeutique', 'Électrothérapie', 'Mobilisation articulaire', 'Renforcement musculaire']
  const salles = ['Salle 1', 'Salle 2', 'Salle 3']

  // 30 RDVs for Cabinet 1
  for (let i = 0; i < 30; i++) {
    const daysAhead = Math.floor(Math.random() * 14)
    const rdvDate = new Date(now)
    rdvDate.setDate(rdvDate.getDate() + daysAhead)
    rdvDate.setHours(8 + Math.floor(Math.random() * 10), [0, 15, 30, 45][Math.floor(Math.random() * 4)], 0, 0)
    await prisma.rendezVous.create({
      data: {
        cabinetId:   cabinet1.id,
        date:        rdvDate,
        duree:       [30, 45, 60][Math.floor(Math.random() * 3)],
        typeSeance:  typesLabels[Math.floor(Math.random() * typesLabels.length)],
        salle:       salles[Math.floor(Math.random() * salles.length)],
        statut:      ['confirme', 'confirme', 'confirme', 'en_attente'][Math.floor(Math.random() * 4)],
        patientId:   patients1[Math.floor(Math.random() * patients1.length)].id,
        praticienId: praticiens1[Math.floor(Math.random() * praticiens1.length)].id,
      },
    })
  }

  // 50 séances for Cabinet 1
  const seances1: Awaited<ReturnType<typeof prisma.seance.create>>[] = []
  for (let i = 0; i < 50; i++) {
    const daysBack = Math.floor(Math.random() * 90) + 1
    const seanceDate = new Date(now)
    seanceDate.setDate(seanceDate.getDate() - daysBack)
    seanceDate.setHours(8 + Math.floor(Math.random() * 10), 0, 0, 0)
    const statuts = ['realisee', 'realisee', 'realisee', 'annulee', 'no_show']
    const statut = statuts[Math.floor(Math.random() * statuts.length)]
    const seance = await prisma.seance.create({
      data: {
        cabinetId:   cabinet1.id,
        date:        seanceDate,
        duree:       [30, 45, 60][Math.floor(Math.random() * 3)],
        typeSeance:  typesLabels[Math.floor(Math.random() * typesLabels.length)],
        statut,
        notes:       statut === 'realisee' ? 'Séance bien déroulée. Patient coopératif. Amélioration notable.' : null,
        patientId:   patients1[Math.floor(Math.random() * patients1.length)].id,
        praticienId: praticiens1[Math.floor(Math.random() * praticiens1.length)].id,
      },
    })
    seances1.push(seance)
  }

  // 40 factures for Cabinet 1
  const statutsFacture = ['paye', 'paye', 'paye', 'en_attente', 'en_attente', 'en_retard']
  for (let i = 0; i < 40; i++) {
    const seance = seances1[i % seances1.length]
    const statut = statutsFacture[Math.floor(Math.random() * statutsFacture.length)]
    const daysBack = Math.floor(Math.random() * 90) + 1
    const dateEmise = new Date(now)
    dateEmise.setDate(dateEmise.getDate() - daysBack)
    await prisma.facture.create({
      data: {
        cabinetId:    cabinet1.id,
        montant:      [150, 200, 250, 300, 350, 400][Math.floor(Math.random() * 6)],
        statut,
        dateEmise,
        datePaiement: statut === 'paye' ? new Date(dateEmise.getTime() + 86400000 * Math.floor(Math.random() * 7)) : null,
        patientId:    seance.patientId,
      },
    })
  }

  // ─── CABINET 2 — Trial expired ────────────────────────────────────────────────
  const cabinet2 = await prisma.cabinet.create({
    data: {
      nom:       'Cabinet Benali - Kiné & Réhabilitation',
      ville:     'Rabat',
      telephone: '0537-987-654',
      email:     'contact@cabinet-benali.ma',
    },
  })

  await prisma.subscription.create({
    data: {
      cabinetId:   cabinet2.id,
      plan:        'TRIAL',
      trialEndsAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // expired 3 days ago
    },
  })

  const owner2 = await prisma.user.create({
    data: {
      email:     'benali@test.com',
      password:  await bcrypt.hash('Test123!', 12),
      role:      'CABINET_OWNER',
      nom:       'Benali',
      prenom:    'Karim',
      cabinetId: cabinet2.id,
    },
  })

  await prisma.cabinet.update({ where: { id: cabinet2.id }, data: { ownerId: owner2.id } })

  // A few patients for Cabinet 2
  const benaliPraticien = await prisma.praticien.create({
    data: { cabinetId: cabinet2.id, nom: 'Benali', prenom: 'Karim', specialite: 'Kiné général', telephone: '0661-987-001', email: 'k.benali@cabinet-benali.ma', couleur: '#7C3AED' },
  })

  for (let i = 0; i < 5; i++) {
    await prisma.patient.create({
      data: {
        cabinetId:   cabinet2.id,
        nom:         `Patient${i + 1}`,
        prenom:      `Test`,
        telephone:   `066${i}000000`,
        pathologie:  'Pathologie test',
        praticienAssigneId: benaliPraticien.id,
      },
    })
  }

  console.log('✅ Cabinet 2 (essai expiré): benali@test.com / Test123!')
  console.log('')
  console.log('─────────────────────────────────────────')
  console.log('🎉 Seed terminé avec succès !')
  console.log('')
  console.log('Comptes de test:')
  console.log('  SUPER_ADMIN:   admin@kinepro.ma    / Admin123!')
  console.log('  Cabinet 1:     amrani@test.com     / Test123!  (essai 5j)')
  console.log('  Cabinet 2:     benali@test.com     / Test123!  (essai expiré)')
  console.log('─────────────────────────────────────────')
}

main().catch(console.error).finally(() => prisma.$disconnect())
