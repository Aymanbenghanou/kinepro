'use client'

import { useState, useEffect, useRef } from 'react'
import Topbar from '@/components/layout/Topbar'
import Toast from '@/components/ui/Toast'
import { Save, Copy, ExternalLink, Check, Globe } from 'lucide-react'
import dynamic from 'next/dynamic'

const QrCodeModal = dynamic(() => import('@/components/qr/QrCodeModal'), { ssr: false })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kinepro-omega.vercel.app'

const JOURS = [
  { value: '1', label: 'Lun' },
  { value: '2', label: 'Mar' },
  { value: '3', label: 'Mer' },
  { value: '4', label: 'Jeu' },
  { value: '5', label: 'Ven' },
  { value: '6', label: 'Sam' },
  { value: '0', label: 'Dim' },
]

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1px solid #E2E8F0', borderRadius: 8,
  fontSize: 14, color: '#0F172A', background: 'white',
  outline: 'none', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: '#374151',
  display: 'block', marginBottom: 6,
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function ReservationSettingsPage() {
  const [cabinet, setCabinet]     = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [copied, setCopied]       = useState(false)
  const [showQr, setShowQr]       = useState(false)
  const [slugError, setSlugError] = useState('')

  const [form, setForm] = useState({
    slug: '',
    bookingEnabled: false,
    workStartTime: '08:00',
    workEndTime: '18:00',
    lunchStartTime: '12:00',
    lunchEndTime: '14:00',
    bookingMessage: '',
    workingDays: '1,2,3,4,5,6',
  })

  useEffect(() => {
    fetch('/api/cabinet').then(r => r.json()).then(d => {
      setCabinet(d)
      setForm({
        slug:           d.slug           ?? '',
        bookingEnabled: d.bookingEnabled ?? false,
        workStartTime:  d.workStartTime  ?? '08:00',
        workEndTime:    d.workEndTime    ?? '18:00',
        lunchStartTime: d.lunchStartTime ?? '12:00',
        lunchEndTime:   d.lunchEndTime   ?? '14:00',
        bookingMessage: d.bookingMessage ?? '',
        workingDays:    d.workingDays    ?? '1,2,3,4,5,6',
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function toggleDay(val: string) {
    const days = form.workingDays ? form.workingDays.split(',') : []
    const next = days.includes(val)
      ? days.filter(d => d !== val)
      : [...days, val].sort()
    setForm(f => ({ ...f, workingDays: next.join(',') }))
  }

  async function handleSave() {
    if (!form.slug.trim()) {
      setSlugError('Le lien de réservation est obligatoire.')
      return
    }
    const slugVal = slugify(form.slug)
    if (!slugVal) {
      setSlugError('Lien invalide — utilisez uniquement des lettres et tirets.')
      return
    }
    setSlugError('')
    setSaving(true)
    try {
      const res = await fetch('/api/cabinet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, slug: slugVal }),
      })
      if (!res.ok) {
        const d = await res.json()
        if (d.error?.includes('Unique constraint') || res.status === 409) {
          setSlugError('Ce lien est déjà utilisé. Choisissez un autre.')
        } else {
          throw new Error(d.error || 'Erreur serveur')
        }
      } else {
        const updated = await res.json()
        setCabinet(updated)
        setForm(f => ({ ...f, slug: updated.slug ?? slugVal }))
        setToast({ message: 'Paramètres enregistrés !', type: 'success' })
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Erreur lors de la sauvegarde', type: 'error' })
    }
    setSaving(false)
  }

  async function copyLink() {
    const url = `${APP_URL}/booking/${form.slug}`
    try { await navigator.clipboard.writeText(url) } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const bookingUrl = form.slug ? `${APP_URL}/booking/${form.slug}` : null

  if (loading) return (
    <div>
      <Topbar title="Réservation en ligne" subtitle="Paramètres de réservation" />
      <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Chargement...</div>
    </div>
  )

  return (
    <div>
      <Topbar title="Réservation en ligne" subtitle="Paramètres de réservation" />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ padding: 24, maxWidth: 640 }}>

        {/* Enable / disable toggle */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>Réservation en ligne</h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                Permet aux patients de réserver directement sans appeler.
              </p>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, bookingEnabled: !f.bookingEnabled }))}
              style={{
                width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                background: form.bookingEnabled ? '#2563EB' : '#CBD5E1',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute', top: 3,
                left: form.bookingEnabled ? 'calc(100% - 25px)' : 3,
                width: 22, height: 22, borderRadius: '50%',
                background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
        </div>

        {/* Booking link */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>🔗 Lien de réservation</h3>

          <label style={lbl}>Identifiant de votre page *</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#64748B', whiteSpace: 'nowrap' }}>{APP_URL}/booking/</span>
            <input
              value={form.slug}
              onChange={e => {
                setSlugError('')
                setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))
              }}
              placeholder="cabinet-nom-ville"
              style={{ ...inp, flex: 1 }}
            />
          </div>
          {!form.slug && cabinet?.nom && (
            <button
              onClick={() => setForm(f => ({ ...f, slug: slugify(cabinet.nom) }))}
              style={{ fontSize: 12, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Générer automatiquement depuis le nom du cabinet →
            </button>
          )}
          {slugError && <p style={{ color: '#DC2626', fontSize: 13, margin: '4px 0 0' }}>{slugError}</p>}

          {bookingUrl && (
            <div style={{ marginTop: 16, padding: 14, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>Lien public de réservation :</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: '#2563EB', wordBreak: 'break-all', flex: 1 }}>
                  {bookingUrl}
                </a>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={copyLink}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: 7, background: 'white', cursor: 'pointer', fontSize: 12, color: '#374151', fontWeight: 500 }}>
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                  <button onClick={() => setShowQr(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: 7, background: 'white', cursor: 'pointer', fontSize: 12, color: '#374151', fontWeight: 500 }}>
                    QR
                  </button>
                  <a href={`https://wa.me/?text=${encodeURIComponent('Réservez votre RDV en ligne : ' + bookingUrl)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: '1px solid #DCFCE7', borderRadius: 7, background: '#F0FDF4', textDecoration: 'none', fontSize: 12, color: '#16A34A', fontWeight: 500 }}>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Working hours */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>🕐 Horaires de travail</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={lbl}>Début de journée</label>
              <input type="time" value={form.workStartTime}
                onChange={e => setForm(f => ({ ...f, workStartTime: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Fin de journée</label>
              <input type="time" value={form.workEndTime}
                onChange={e => setForm(f => ({ ...f, workEndTime: e.target.value }))} style={inp} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={lbl}>Début pause déjeuner</label>
              <input type="time" value={form.lunchStartTime}
                onChange={e => setForm(f => ({ ...f, lunchStartTime: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Fin pause déjeuner</label>
              <input type="time" value={form.lunchEndTime}
                onChange={e => setForm(f => ({ ...f, lunchEndTime: e.target.value }))} style={inp} />
            </div>
          </div>

          <label style={lbl}>Jours de travail</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {JOURS.map(j => {
              const active = form.workingDays.split(',').includes(j.value)
              return (
                <button key={j.value} onClick={() => toggleDay(j.value)}
                  style={{
                    padding: '8px 14px', borderRadius: 8, border: '1px solid',
                    borderColor: active ? '#2563EB' : '#E2E8F0',
                    background: active ? '#EFF6FF' : 'white',
                    color: active ? '#2563EB' : '#64748B',
                    cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  }}>
                  {j.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom message */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>💬 Message personnalisé</h3>
          <label style={lbl}>Message affiché sur la page de réservation</label>
          <textarea
            value={form.bookingMessage}
            onChange={e => setForm(f => ({ ...f, bookingMessage: e.target.value }))}
            rows={3}
            placeholder="Ex: Merci de venir 10 minutes avant votre rendez-vous. Apportez votre ordonnance médicale."
            style={{ ...inp, resize: 'vertical' }}
          />
          <p style={{ fontSize: 12, color: '#94A3B8', margin: '6px 0 0' }}>
            Ce message est affiché dans la confirmation de réservation.
          </p>
        </div>

        <button onClick={handleSave} disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#2563EB', color: 'white', border: 'none',
            borderRadius: 10, padding: '12px 24px', cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: 14, boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            opacity: saving ? 0.7 : 1,
          }}>
          <Save size={16} />
          {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </button>
      </div>

      {showQr && bookingUrl && (
        <QrCodeModal
          url={bookingUrl}
          title={cabinet?.nom ?? 'Cabinet'}
          subtitle="Réservation en ligne"
          onClose={() => setShowQr(false)}
        />
      )}
    </div>
  )
}
