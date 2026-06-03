'use client'

import Topbar from '@/components/layout/Topbar'

// Liste des salles utilisées dans les sélecteurs (création RDV / séance).
// Lecture seule pour l'instant : la liste est consommée côté UI depuis ce même
// hardcode (SALLES dans /agenda et /seances). À promouvoir en CRUD côté DB
// le jour où on veut des salles modifiables par cabinet (hors scope ici).
const SALLES_DEFAULT = ['Salle 1', 'Salle 2', 'Salle 3']

const DOTS = ['#2563EB', '#16A34A', '#F59E0B']

export default function SallesPage() {
  return (
    <div>
      <Topbar title="Salles" subtitle="Salles disponibles dans le cabinet" />
      <div style={{ padding: '24px 28px' }}>
        <div style={{
          background: 'white', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: 24, maxWidth: 480,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>
            Salles disponibles
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SALLES_DEFAULT.map((salle, i) => (
              <div key={salle} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', background: '#F8FAFC',
                borderRadius: 8, border: '1px solid #E2E8F0',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: DOTS[i] ?? '#94A3B8',
                }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>{salle}</span>
                <span style={{
                  marginLeft: 'auto',
                  background: '#DCFCE7', color: '#16A34A',
                  padding: '2px 8px', borderRadius: 999,
                  fontSize: 12, fontWeight: 500,
                }}>Active</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 16, lineHeight: 1.6 }}>
            La gestion des salles est aujourd'hui figée à 3 entrées par défaut.
            La modification par cabinet sera disponible dans une prochaine version.
          </p>
        </div>
      </div>
    </div>
  )
}
