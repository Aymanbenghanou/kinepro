import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function frDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  try {
    return new Intl.DateTimeFormat('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d))
  } catch { return '—' }
}

function frMoney(n: number): string {
  return `${n.toLocaleString('fr-MA')} MAD`
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ScanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // Fetch patient data
  const patient = await prisma.patient.findUnique({
    where: { publicToken: token },
    select: {
      id: true,
      prenom: true,
      nom: true,
      cabinet: {
        select: { nom: true, adresse: true, ville: true, telephone: true, email: true },
      },
      rendezVous: {
        where: { date: { gte: new Date() } },
        orderBy: { date: 'asc' },
        take: 3,
        select: { id: true, date: true, statut: true, notes: true },
      },
      seances: {
        orderBy: { date: 'desc' },
        take: 5,
        select: { id: true, date: true, typeSeance: true, statut: true, duree: true },
      },
      factures: {
        orderBy: { dateEmise: 'desc' },
        take: 1,
        select: { id: true, montant: true, statut: true, dateEmise: true, datePaiement: true },
      },
      cabinetId: true,
    },
  }).catch(() => null)

  if (!patient) {
    return (
      <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>QR Code invalide</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Ce code QR ne correspond à aucun patient.</p>
        </div>
      </div>
    )
  }

  // ── Session check: redirect kiné to internal patient page ─────────────────
  const session = await auth().catch(() => null)
  if (session?.user?.cabinetId === patient.cabinetId) {
    redirect(`/patients/${patient.id}`)
  }

  // ── Public page for patients ───────────────────────────────────────────────
  const lastFacture = patient.factures[0] ?? null
  const nextRdv = patient.rendezVous[0] ?? null
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayRdv = patient.rendezVous.find(r => new Date(r.date).toISOString().slice(0, 10) === todayStr)

  const statutConfig: Record<string, { label: string; bg: string; color: string }> = {
    paye:       { label: 'Payé',       bg: '#DCFCE7', color: '#16A34A' },
    en_attente: { label: 'En attente', bg: '#FEF3C7', color: '#D97706' },
    en_retard:  { label: 'En retard',  bg: '#FEE2E2', color: '#DC2626' },
    realisee:   { label: 'Réalisée',   bg: '#DBEAFE', color: '#2563EB' },
    annulee:    { label: 'Annulée',    bg: '#F1F5F9', color: '#64748B' },
    no_show:    { label: 'Absent',     bg: '#FEE2E2', color: '#DC2626' },
    planifiee:  { label: 'Planifiée',  bg: '#F0FDF4', color: '#16A34A' },
    present:    { label: 'Présent',    bg: '#DCFCE7', color: '#16A34A' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
        padding: '36px 20px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 60%)',
        }} />
        <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>K</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: 16 }}>KinéPro</span>
          </div>

          {/* Greeting */}
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 4 }}>Bonjour 👋</div>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: '0 0 6px' }}>
            {patient.prenom} {patient.nom}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>
            {patient.cabinet?.nom}
          </p>
        </div>
      </div>

      {/* Content cards */}
      <div style={{ maxWidth: 480, margin: '-32px auto 0', padding: '0 16px 32px', position: 'relative' }}>

        {/* Today's appointment */}
        {todayRdv && (
          <div style={{
            background: 'linear-gradient(135deg, #16A34A, #15803D)',
            borderRadius: 16, padding: '20px 20px', marginBottom: 14,
            boxShadow: '0 4px 24px rgba(22,163,74,0.4)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              🟢 Rendez-vous AUJOURD'HUI
            </div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>
              {new Date(todayRdv.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            {todayRdv.notes && (
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 }}>{todayRdv.notes}</div>
            )}
          </div>
        )}

        {/* Last invoice */}
        {lastFacture && (
          <div style={{
            background: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 14,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Dernière facture
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>{frMoney(lastFacture.montant)}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 }}>{frDate(lastFacture.dateEmise)}</div>
              </div>
              {(() => {
                const s = statutConfig[lastFacture.statut] ?? { label: lastFacture.statut, bg: '#F1F5F9', color: '#64748B' }
                return (
                  <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>
                    {s.label}
                  </span>
                )
              })()}
            </div>
            {lastFacture.statut !== 'paye' && lastFacture.statut === 'en_retard' && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(220,38,38,0.12)', borderRadius: 8, color: '#FCA5A5', fontSize: 13 }}>
                ⚠️ Paiement en retard. Veuillez contacter le cabinet.
              </div>
            )}
          </div>
        )}

        {/* Next appointment */}
        {nextRdv && !todayRdv && (
          <div style={{
            background: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 14,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Prochain rendez-vous
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, background: 'rgba(37,99,235,0.2)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#60A5FA', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>
                  {new Date(nextRdv.date).getDate()}
                </span>
                <span style={{ color: '#60A5FA', fontSize: 10, lineHeight: 1, marginTop: 2 }}>
                  {new Date(nextRdv.date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
                </span>
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>
                  {new Date(nextRdv.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 }}>
                  à {new Date(nextRdv.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {nextRdv.notes && (
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>{nextRdv.notes}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Séances history */}
        {patient.seances.length > 0 && (
          <div style={{
            background: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 14,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
              Historique des séances
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {patient.seances.map((s) => {
                const sc = statutConfig[s.statut] ?? { label: s.statut, bg: '#F1F5F9', color: '#64748B' }
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>
                        {s.typeSeance || 'Séance de kinésithérapie'}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                        {frDate(s.date)}{s.duree ? ` · ${s.duree} min` : ''}
                      </div>
                    </div>
                    <span style={{ background: sc.bg, color: sc.color, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                      {sc.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Cabinet footer */}
        <div style={{
          background: '#1E293B', borderRadius: 16, padding: 20,
          border: '1px solid rgba(255,255,255,0.08)',
          textAlign: 'center',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Votre cabinet
          </div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{patient.cabinet?.nom}</div>
          {patient.cabinet?.adresse && (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{patient.cabinet.adresse}</div>
          )}
          {patient.cabinet?.ville && (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{patient.cabinet.ville}</div>
          )}
          {patient.cabinet?.telephone && (
            <a href={`tel:${patient.cabinet.telephone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '10px 20px', background: '#2563EB', color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              📞 {patient.cabinet.telephone}
            </a>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 20 }}>
          Powered by KinéPro · kinepro.ma
        </p>
      </div>
    </div>
  )
}
