/**
 * KinéPro — Client-side PDF generation
 * Uses jsPDF + jspdf-autotable. All functions trigger an auto-download.
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  navy:    '#1E3A5F',
  blue:    '#2563EB',
  gray:    '#64748B',
  black:   '#0F172A',
  light:   '#F8FAFC',
  border:  '#E2E8F0',
  blue50:  '#EFF6FF',
  green:   '#16A34A',
  amber:   '#D97706',
  red:     '#DC2626',
  purple:  '#7C3AED',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function frDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  try {
    return new Intl.DateTimeFormat('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d))
  } catch { return '—' }
}

function frMoney(n: number): string {
  return `${n.toLocaleString('fr-MA')} MAD`
}

function todayStr(): string {
  return frDate(new Date())
}

function lastAutoTableY(doc: jsPDF): number {
  return (doc as any).lastAutoTable?.finalY ?? 0
}

// ─── Shared layout blocks ─────────────────────────────────────────────────────

function drawPageHeader(doc: jsPDF, cab: any, title: string, subtitle: string) {
  const W = doc.internal.pageSize.getWidth()

  // Navy background strip
  doc.setFillColor(C.navy)
  doc.rect(0, 0, W, 42, 'F')

  // 'K' logo circle
  doc.setFillColor(C.blue)
  doc.circle(19, 21, 10, 'F')
  doc.setTextColor('#FFFFFF')
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('K', 19, 25.5, { align: 'center' })

  // Cabinet name
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor('#FFFFFF')
  doc.text(cab?.nom || 'KinéPro', 35, 17)

  // Cabinet subtitle
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor('#A8C4E0')
  const info = [cab?.adresse, cab?.telephone, cab?.email].filter(Boolean).join(' · ')
  if (info) doc.text(info, 35, 24)
  doc.text('Logiciel de gestion — kinepro.ma', 35, 30)

  // Right: document type + date
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor('#FFFFFF')
  doc.text(title, W - 14, 19, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor('#A8C4E0')
  doc.text(subtitle, W - 14, 27, { align: 'right' })
  doc.text(`Généré le ${todayStr()}`, W - 14, 34, { align: 'right' })
}

function drawSectionTitle(doc: jsPDF, y: number, label: string): number {
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(C.blue50)
  doc.setDrawColor(C.border)
  doc.rect(14, y, W - 28, 9, 'FD')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(C.navy)
  doc.text(label, 19, y + 6)
  return y + 13
}

function drawKV(doc: jsPDF, y: number, label: string, value: string, labelW = 55): number {
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(C.gray)
  doc.text(label, 19, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(C.black)
  const W = doc.internal.pageSize.getWidth()
  doc.text(String(value || '—'), 19 + labelW, y, { maxWidth: W - 28 - labelW })
  return y + 6.5
}

function drawFooterStrip(doc: jsPDF, cab: any) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  doc.setFillColor(C.navy)
  doc.rect(0, H - 14, W, 14, 'F')
  doc.setTextColor('#FFFFFF')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Document généré par KinéPro · ${cab?.nom || ''} · ${cab?.ville || ''}`,
    W / 2, H - 5,
    { align: 'center' }
  )
}

function addFootersToAllPages(doc: jsPDF, cab: any) {
  const totalPages = (doc.internal as any).pages.length - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawFooterStrip(doc, cab)
  }
}

// ─── FEATURE 1: Facture PDF ───────────────────────────────────────────────────

export async function generateFacturePDF(facture: any, cab: any, qrUrl?: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()

  const invoiceNum = facture.id?.slice(0, 8).toUpperCase() || '—'
  drawPageHeader(doc, cab, 'FACTURE', `N° ${invoiceNum}`)

  let y = 52

  // ── Metadata row ──
  doc.setFillColor(C.light)
  doc.setDrawColor(C.border)
  doc.roundedRect(14, y, W - 28, 26, 2, 2, 'FD')

  const cols = [
    { label: 'DATE D\'ÉMISSION',  value: frDate(facture.dateEmise)  },
    { label: 'DATE PAIEMENT',     value: facture.datePaiement ? frDate(facture.datePaiement) : '—' },
    { label: 'N° FACTURE',        value: invoiceNum                  },
  ]
  cols.forEach((c, i) => {
    const cx = 22 + i * ((W - 28) / 3)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(C.gray)
    doc.text(c.label, cx, y + 8)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(C.black)
    doc.text(c.value, cx, y + 18)
  })

  y += 32

  // ── Patient section ──
  y = drawSectionTitle(doc, y, 'PATIENT')
  y = drawKV(doc, y, 'Nom complet', `${facture.patient?.prenom || ''} ${facture.patient?.nom || ''}`)
  y = drawKV(doc, y, 'Téléphone',   facture.patient?.telephone || '—')
  y = drawKV(doc, y, 'Email',       facture.patient?.email     || '—')
  y += 4

  // ── Prestation table ──
  y = drawSectionTitle(doc, y, 'PRESTATION')

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Description', 'Date', 'Praticien', 'Montant HT']],
    body: [[
      facture.seance?.typeSeance || facture.description || 'Séance de kinésithérapie',
      frDate(facture.dateEmise),
      facture.seance?.praticien
        ? `Dr. ${facture.seance.praticien.prenom || ''} ${facture.seance.praticien.nom || ''}`
        : '—',
      frMoney(facture.montant),
    ]],
    headStyles: {
      fillColor: C.navy as any,
      textColor: [255, 255, 255],
      fontSize: 9, fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 10, textColor: C.black as any },
    columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
    styles: { cellPadding: 5, lineColor: C.border as any, lineWidth: 0.3 },
  })

  y = lastAutoTableY(doc) + 8

  // ── Total box ──
  const boxW = 85
  const boxX = W - 14 - boxW
  doc.setFillColor(C.navy)
  doc.roundedRect(boxX, y, boxW, 24, 3, 3, 'F')
  doc.setTextColor('#FFFFFF')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('MONTANT TOTAL', boxX + boxW / 2, y + 9, { align: 'center' })
  doc.setFontSize(17)
  doc.setFont('helvetica', 'bold')
  doc.text(frMoney(facture.montant), boxX + boxW / 2, y + 19, { align: 'center' })

  // ── Statut badge ──
  const statutLabel = facture.statut === 'paye' ? '✓ PAYÉ' : facture.statut === 'en_attente' ? '⏳ EN ATTENTE' : '⚠ EN RETARD'
  const statutColor = facture.statut === 'paye' ? C.green : facture.statut === 'en_attente' ? C.amber : C.red
  doc.setTextColor(statutColor)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(statutLabel, 14 + 4, y + 17)

  y += 32

  // ── Thank-you note ──
  doc.setFontSize(10)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(C.gray)
  doc.text('Merci pour votre confiance. Pour toute question, contactez votre cabinet.', W / 2, y, { align: 'center' })
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text(`${cab?.nom || 'KinéPro'} · ${cab?.ville || ''} · ${cab?.telephone || ''}`, W / 2, y, { align: 'center' })

  // ── QR Code (bottom-right, above footer) ──
  if (qrUrl) {
    try {
      const QRCode = (await import('qrcode')).default
      const qrDataUrl: string = await QRCode.toDataURL(qrUrl, {
        width: 200,
        margin: 1,
        color: { dark: '#1E3A5F', light: '#FFFFFF' },
      })
      const qrSize = 38       // mm
      const qrX = W - 14 - qrSize
      const qrY = H - 14 - qrSize - 10   // 10mm above footer

      // White background card
      doc.setFillColor('#FFFFFF')
      doc.setDrawColor(C.border)
      doc.roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 14, 2, 2, 'FD')

      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(C.gray)
      doc.text('Scannez pour voir\nvotre dossier', qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' })
    } catch { /* QR generation failed — skip silently */ }
  }

  drawFooterStrip(doc, cab)

  const dateStr = new Date().toISOString().slice(0, 10)
  doc.save(`facture-${invoiceNum.toLowerCase()}-${dateStr}.pdf`)
}

// ─── FEATURE 2: Dossier Patient PDF ──────────────────────────────────────────

export function generateDossierPatientPDF(patient: any, cab: any) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const BOTTOM = H - 20 // don't go below footer

  const fullName = `${patient.prenom || ''} ${patient.nom || ''}`.trim()

  drawPageHeader(doc, cab, 'DOSSIER', fullName)

  // Compute age
  let ageStr = '—'
  if (patient.dateNaissance) {
    const b = new Date(patient.dateNaissance)
    const n = new Date()
    let age = n.getFullYear() - b.getFullYear()
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) age--
    ageStr = `${age} ans`
  }

  const seancesRealisees = (patient.seances || []).filter((s: any) => s.statut === 'realisee').length
  const pct = patient.nbSeancesPrescrites
    ? Math.min(100, Math.round((seancesRealisees / patient.nbSeancesPrescrites) * 100))
    : null

  let y = 52

  function needPage(needed = 40) {
    if (y + needed > BOTTOM) {
      doc.addPage()
      y = 20
    }
  }

  // ── Infos personnelles ──
  needPage(60)
  y = drawSectionTitle(doc, y, 'INFORMATIONS PERSONNELLES')
  y = drawKV(doc, y, 'Nom complet',       fullName)
  y = drawKV(doc, y, 'Date de naissance', `${frDate(patient.dateNaissance)}${ageStr !== '—' ? ` (${ageStr})` : ''}`)
  y = drawKV(doc, y, 'Sexe',              patient.sexe || '—')
  y = drawKV(doc, y, 'Téléphone',         patient.telephone || '—')
  y = drawKV(doc, y, 'Email',             patient.email || '—')
  y = drawKV(doc, y, 'Adresse',           patient.adresse || '—')
  y = drawKV(doc, y, 'CIN',              patient.cin || '—')
  y = drawKV(doc, y, 'Mutuelle',         patient.mutuelle || '—')
  y += 4

  // ── Infos médicales ──
  needPage(60)
  y = drawSectionTitle(doc, y, 'INFORMATIONS MÉDICALES')
  y = drawKV(doc, y, 'Pathologie',     patient.pathologie     || '—')
  y = drawKV(doc, y, 'Méd. référent',  patient.medecinReferent || '—')
  y = drawKV(doc, y, 'Antécédents',   patient.antecedents    || '—')
  y = drawKV(doc, y, 'Allergies',      patient.allergies      || '—')
  y = drawKV(doc, y, 'Médicaments',    patient.medicaments    || '—')
  y += 4

  // ── Plan de traitement ──
  needPage(50)
  y = drawSectionTitle(doc, y, 'PLAN DE TRAITEMENT')
  y = drawKV(doc, y, 'Séances prescrites',  patient.nbSeancesPrescrites ? `${patient.nbSeancesPrescrites}` : '—')
  y = drawKV(doc, y, 'Séances réalisées',   `${seancesRealisees}`)
  y = drawKV(doc, y, 'Progression',         pct !== null ? `${pct}%` : '—')
  y = drawKV(doc, y, 'Fréquence',           patient.frequence || '—')
  y = drawKV(doc, y, 'Objectifs',           patient.objectifsTraitement || '—')
  y += 4

  // ── Historique séances ──
  const seances = (patient.seances || []).slice(0, 20)
  if (seances.length > 0) {
    needPage(50)
    y = drawSectionTitle(doc, y, `HISTORIQUE DES SÉANCES (${seances.length} dernières)`)

    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Date', 'Type de séance', 'Praticien', 'Durée', 'Statut']],
      body: seances.map((s: any) => [
        frDate(s.date),
        s.typeSeance || '—',
        s.praticien ? `Dr. ${(s.praticien.prenom || '')} ${(s.praticien.nom || '')}`.trim() : '—',
        s.duree ? `${s.duree} min` : '—',
        s.statut === 'realisee' ? 'Réalisée'
          : s.statut === 'annulee' ? 'Annulée'
          : s.statut === 'no_show' ? 'Absent'
          : (s.statut || '—'),
      ]),
      headStyles: {
        fillColor: C.navy as any,
        textColor: [255, 255, 255],
        fontSize: 8, fontStyle: 'bold',
      },
      bodyStyles: { fontSize: 8, textColor: C.black as any },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 3.5, lineColor: C.border as any, lineWidth: 0.2 },
      didDrawPage: () => {
        // keep y in sync after page breaks inside autoTable
      },
    })

    y = lastAutoTableY(doc) + 8
  }

  // ── Facturation ──
  const factures = patient.factures || []
  if (factures.length > 0) {
    needPage(50)
    const totalPaye = factures
      .filter((f: any) => f.statut === 'paye')
      .reduce((s: number, f: any) => s + f.montant, 0)

    y = drawSectionTitle(doc, y, `FACTURATION (${factures.length} factures)`)

    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Date', 'Montant', 'Statut', 'Date paiement']],
      body: factures.map((f: any) => [
        frDate(f.dateEmise),
        frMoney(f.montant),
        f.statut === 'paye' ? 'Payé' : f.statut === 'en_attente' ? 'En attente' : 'En retard',
        f.datePaiement ? frDate(f.datePaiement) : '—',
      ]),
      foot: [['', `Total payé : ${frMoney(totalPaye)}`, '', '']],
      headStyles: {
        fillColor: C.navy as any,
        textColor: [255, 255, 255],
        fontSize: 8, fontStyle: 'bold',
      },
      footStyles: {
        fillColor: C.blue50 as any,
        textColor: C.navy as any,
        fontStyle: 'bold', fontSize: 8,
      },
      bodyStyles: { fontSize: 8, textColor: C.black as any },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 1: { fontStyle: 'bold' } },
      styles: { cellPadding: 3.5, lineColor: C.border as any, lineWidth: 0.2 },
    })

    y = lastAutoTableY(doc) + 8
  }

  addFootersToAllPages(doc, cab)

  const dateStr = new Date().toISOString().slice(0, 10)
  const safe = fullName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  doc.save(`dossier-${safe}-${dateStr}.pdf`)
}

// ─── FEATURE 3: Rapport mensuel PDF ──────────────────────────────────────────

export function generateRapportPDF(data: any, cab: any) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  drawPageHeader(doc, cab, 'RAPPORT', monthLabel.toUpperCase())

  const totalRevenu  = data?.data?.reduce((s: number, d: any) => s + d.revenus,     0) ?? 0
  const totalSeances = data?.data?.reduce((s: number, d: any) => s + d.seances,     0) ?? 0
  const totalNoShow  = data?.data?.reduce((s: number, d: any) => s + d.noShow,      0) ?? 0
  const avgNoShow    = data?.data?.length
    ? Math.round(data.data.reduce((s: number, d: any) => s + d.tauxNoShow, 0) / data.data.length)
    : 0

  let y = 52

  // ── KPI cards (2×2 grid) ──
  const kpis = [
    { label: 'Revenus (MAD)',        value: frMoney(totalRevenu),  color: C.green  },
    { label: 'Séances réalisées',    value: `${totalSeances}`,     color: C.blue   },
    { label: 'Taux no-show moyen',   value: `${avgNoShow}%`,       color: C.amber  },
    { label: 'Patients actifs',      value: `${data?.totalPatients || 0}`, color: C.purple },
  ]

  const cardW = (W - 28 - 6) / 2
  const cardH = 26
  kpis.forEach((k, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const cx  = 14 + col * (cardW + 6)
    const cy  = y  + row * (cardH + 6)

    doc.setFillColor(C.light)
    doc.setDrawColor(C.border)
    doc.roundedRect(cx, cy, cardW, cardH, 2, 2, 'FD')

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(k.color)
    doc.text(k.value, cx + cardW / 2, cy + 14, { align: 'center' })

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(C.gray)
    doc.text(k.label, cx + cardW / 2, cy + 21, { align: 'center' })
  })

  y += 2 * (cardH + 6) + 8

  // ── Monthly data table ──
  y = drawSectionTitle(doc, y, 'DONNÉES MENSUELLES')

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Mois', 'Revenus (MAD)', 'Séances', 'No-Show', 'Taux no-show']],
    body: (data?.data || []).map((d: any) => [
      d.mois,
      frMoney(d.revenus),
      `${d.seances}`,
      `${d.noShow}`,
      `${d.tauxNoShow}%`,
    ]),
    foot: [['TOTAL / MOY.', frMoney(totalRevenu), `${totalSeances}`, `${totalNoShow}`, `${avgNoShow}%`]],
    headStyles: {
      fillColor: C.navy as any,
      textColor: [255, 255, 255],
      fontSize: 9, fontStyle: 'bold',
    },
    footStyles: {
      fillColor: C.blue50 as any,
      textColor: C.navy as any,
      fontStyle: 'bold', fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: C.black as any },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
    },
    styles: { cellPadding: 4, lineColor: C.border as any, lineWidth: 0.3 },
  })

  y = lastAutoTableY(doc) + 8

  // ── Patients section ──
  if (y < 220) {
    y = drawSectionTitle(doc, y, 'PATIENTS')
    y = drawKV(doc, y, 'Total patients actifs',     `${data?.totalPatients  || 0}`)
    y = drawKV(doc, y, 'Nouveaux ce mois',          `${data?.nouveauxPatients || 0}`)
    y = drawKV(doc, y, 'Patients récurrents',       `${(data?.totalPatients || 0) - (data?.nouveauxPatients || 0)}`)
  }

  addFootersToAllPages(doc, cab)

  const dateStr = new Date().toISOString().slice(0, 10)
  doc.save(`rapport-kinepro-${dateStr}.pdf`)
}

// ─── FEATURE 4: Rapport complet (advanced analytics) ─────────────────────────

export function generateRapportComplet(stats: any, cab: any, periodLabel: string, praticienName?: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  drawPageHeader(doc, cab, 'RAPPORT', periodLabel.toUpperCase())
  let y = 52

  if (praticienName && praticienName !== 'Tous') {
    doc.setFontSize(10); doc.setFont('helvetica', 'italic'); doc.setTextColor(C.gray)
    doc.text(`Praticien : ${praticienName}`, 14, y)
    y += 6
  }

  // ── KPI cards (3×2) ──
  const kpis = stats?.kpis ?? {}
  const k = [
    { label: 'Revenus',           value: frMoney(kpis.revenus?.value ?? 0),        delta: kpis.revenus?.deltaPct,        color: C.green  },
    { label: 'RDV',               value: `${kpis.rdv?.value ?? 0}`,                delta: kpis.rdv?.deltaPct,            color: C.blue   },
    { label: 'Séances réalisées', value: `${kpis.seancesRealisees?.value ?? 0}`,   delta: kpis.seancesRealisees?.deltaPct, color: C.purple },
    { label: 'Nouveaux patients', value: `${kpis.nouveauxPatients?.value ?? 0}`,   delta: kpis.nouveauxPatients?.deltaPct, color: C.amber  },
    { label: 'Taux de présence',  value: `${kpis.tauxPresence?.value ?? 0}%`,      delta: kpis.tauxPresence?.deltaPct,   color: C.green  },
    { label: 'Satisfaction',      value: `${kpis.satisfaction?.value ?? 0}/10`,    delta: kpis.satisfaction?.deltaPct,   color: C.blue   },
  ]
  const cardW = (W - 28 - 12) / 3
  const cardH = 22
  k.forEach((it, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const cx = 14 + col * (cardW + 6)
    const cy = y + row * (cardH + 4)
    doc.setFillColor(C.light); doc.setDrawColor(C.border)
    doc.roundedRect(cx, cy, cardW, cardH, 2, 2, 'FD')
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(it.color)
    doc.text(it.value, cx + 4, cy + 10)
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(C.gray)
    doc.text(it.label, cx + 4, cy + 16)
    if (typeof it.delta === 'number') {
      const sign = it.delta > 0 ? '+' : ''
      doc.setFontSize(7); doc.setFont('helvetica', 'bold')
      doc.setTextColor(it.delta > 0 ? C.green : it.delta < 0 ? C.red : C.gray)
      doc.text(`${sign}${it.delta}%`, cx + cardW - 4, cy + 16, { align: 'right' })
    }
  })
  y += 2 * (cardH + 4) + 8

  // ── Revenus par type ──
  if (stats?.revenus?.parType?.length) {
    y = drawSectionTitle(doc, y, 'REVENUS PAR TYPE DE SÉANCE')
    autoTable(doc, {
      startY: y, margin: { left: 14, right: 14 },
      head: [['Type', 'Montant', 'Part']],
      body: stats.revenus.repartition.map((r: any) => [r.nom, frMoney(r.montant), `${r.pct}%`]),
      headStyles: { fillColor: C.navy as any, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, textColor: C.black as any },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' } },
      styles: { cellPadding: 3, lineColor: C.border as any, lineWidth: 0.3 },
    })
    y = lastAutoTableY(doc) + 6
  }

  // ── Performance par praticien ──
  if (stats?.praticiensStats?.length) {
    if (y > 230) { doc.addPage(); y = 20 }
    y = drawSectionTitle(doc, y, 'PERFORMANCE PAR PRATICIEN')
    autoTable(doc, {
      startY: y, margin: { left: 14, right: 14 },
      head: [['Praticien', 'RDV', 'Séances', 'Présence', 'Revenus', 'Score']],
      body: stats.praticiensStats.map((p: any) => [
        p.nom, `${p.rdv}`, `${p.seances}`, `${p.taux}%`, frMoney(p.revenus), p.score ? `${p.score}/10` : '—',
      ]),
      headStyles: { fillColor: C.navy as any, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, textColor: C.black as any },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'center' } },
      styles: { cellPadding: 3, lineColor: C.border as any, lineWidth: 0.3 },
    })
    y = lastAutoTableY(doc) + 6
  }

  // ── Top pathologies ──
  if (stats?.patients?.pathologies?.length) {
    if (y > 240) { doc.addPage(); y = 20 }
    y = drawSectionTitle(doc, y, 'TOP PATHOLOGIES')
    autoTable(doc, {
      startY: y, margin: { left: 14, right: 14 },
      head: [['Pathologie', 'Patients']],
      body: stats.patients.pathologies.map((p: any) => [p.nom, `${p.count}`]),
      headStyles: { fillColor: C.navy as any, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, textColor: C.black as any },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 1: { halign: 'center' } },
      styles: { cellPadding: 3, lineColor: C.border as any, lineWidth: 0.3 },
    })
    y = lastAutoTableY(doc) + 6
  }

  // ── Feedbacks négatifs ──
  if (stats?.satisfaction?.summary?.negatifs?.length) {
    if (y > 220) { doc.addPage(); y = 20 }
    y = drawSectionTitle(doc, y, 'FEEDBACKS NÉGATIFS')
    autoTable(doc, {
      startY: y, margin: { left: 14, right: 14 },
      head: [['Date', 'Patient', 'Score', 'Commentaire']],
      body: stats.satisfaction.summary.negatifs.map((n: any) => [
        frDate(n.date), n.patient, `${n.score}/10`, (n.commentaire || '').slice(0, 80),
      ]),
      headStyles: { fillColor: C.navy as any, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, textColor: C.black as any },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 2: { halign: 'center' } },
      styles: { cellPadding: 3, lineColor: C.border as any, lineWidth: 0.3 },
    })
  }

  addFootersToAllPages(doc, cab)
  const safe = periodLabel.replace(/\s+/g, '-').toLowerCase()
  doc.save(`rapport-${safe}.pdf`)
}
