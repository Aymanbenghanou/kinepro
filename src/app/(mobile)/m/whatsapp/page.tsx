import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { formatTime } from '@/lib/utils'
import MobileTopbar from '@/components/mobile/MobileTopbar'

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default async function MobileWhatsAppPage() {
  const session = await auth()
  if (!session?.user?.cabinetId) redirect('/login')
  const cabinetId = session.user.cabinetId

  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0,0,0)
  const end   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23,59,59)

  const [rdvs, seancesSansFb, readySeances] = await Promise.all([
    prisma.rendezVous.findMany({
      where: { cabinetId, date: { gte: start, lte: end } },
      include: { patient: { select: { nom: true, prenom: true, telephone: true } }, praticien: { select: { nom: true } } },
      orderBy: { date: 'asc' },
    }),
    prisma.seance.findMany({
      where: { cabinetId, statut: 'realisee', scorePatient: null },
      include: { patient: { select: { nom: true, prenom: true, telephone: true } } },
      orderBy: { date: 'desc' }, take: 10,
    }),
    prisma.seance.findMany({
      where: { cabinetId, feedbackStatus: 'ready' },
      include: { patient: { select: { nom: true, prenom: true, telephone: true } } },
      orderBy: { date: 'desc' }, take: 10,
    }),
  ])

  return (
    <div>
      <MobileTopbar title="WhatsApp Center" subtitle="Messagerie & feedbacks" />

      <div style={{ padding: '12px 16px' }}>

        {/* Confirmations RDV */}
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
          📅 Confirmations RDV — {rdvs.length}
        </h3>
        {rdvs.length === 0 ? (
          <EmptyCard text="Aucun RDV aujourd'hui" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {rdvs.map(rdv => (
              <PersonCard
                key={rdv.id}
                initials={`${rdv.patient.prenom[0]}${rdv.patient.nom[0]}`}
                name={`${rdv.patient.prenom} ${rdv.patient.nom}`}
                meta={`📅 ${formatTime(rdv.date)} · ${rdv.typeSeance} · ${rdv.duree} min`}
                badge={{ label: formatTime(rdv.date), bg: '#EFF6FF', color: '#1D4ED8' }}
              />
            ))}
          </div>
        )}

        {/* Feedback prêt */}
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: '12px 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
          🌟 Feedback prêt — {readySeances.length}
        </h3>
        {readySeances.length === 0 ? (
          <EmptyCard text="Aucun feedback prêt" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {readySeances.map(s => (
              <PersonCard
                key={s.id}
                initials={`${s.patient.prenom[0]}${s.patient.nom[0]}`}
                name={`${s.patient.prenom} ${s.patient.nom}`}
                meta={`${s.typeSeance} · ${formatTime(s.date)}`}
                badge={{ label: 'Prêt 🌟', bg: '#F5F3FF', color: '#7C3AED' }}
              />
            ))}
          </div>
        )}

        {/* Sans feedback */}
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: '12px 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
          ⚡ Séances sans feedback — {seancesSansFb.length}
        </h3>
        {seancesSansFb.length === 0 ? (
          <EmptyCard text="Tous les feedbacks ont été enregistrés ✓" green />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {seancesSansFb.map(s => (
              <PersonCard
                key={s.id}
                initials={`${s.patient.prenom[0]}${s.patient.nom[0]}`}
                name={`${s.patient.prenom} ${s.patient.nom}`}
                meta={`${s.typeSeance} · terminée à ${formatTime(s.date)}`}
                badge={{ label: 'En attente', bg: '#FFFBEB', color: '#B45309' }}
              />
            ))}
          </div>
        )}

        {/* Lien "Voir le centre WhatsApp complet" retiré — la cible
            permet d'envoyer des messages (mutation). Mobile reste en
            lecture seule sur les feedbacks/confirmations. */}
      </div>
    </div>
  )
}

function PersonCard({ initials, name, meta, badge }: {
  initials: string; name: string; meta: string;
  badge: { label: string; bg: string; color: string };
}) {
  return (
    <div style={{
      background: 'white', borderRadius: 12, border: '0.5px solid #E2E8F0',
      padding: 12, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        background: '#DBEAFE', color: '#1D4ED8',
        fontSize: 13, fontWeight: 600, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: 11, color: '#64748B', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</div>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
        background: badge.bg, color: badge.color, flexShrink: 0, whiteSpace: 'nowrap',
      }}>
        {badge.label}
      </span>
    </div>
  )
}

function EmptyCard({ text, green }: { text: string; green?: boolean }) {
  return (
    <div style={{
      background:  green ? '#F0FDF4' : 'white',
      borderRadius: 12,
      border: `0.5px solid ${green ? '#BBF7D0' : '#E2E8F0'}`,
      padding: 14, textAlign: 'center',
      fontSize: 12, color: green ? '#15803D' : '#94A3B8',
      fontWeight: green ? 600 : 400,
    }}>
      {text}
    </div>
  )
}
