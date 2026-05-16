'use client'

import { useState, useEffect } from 'react'
import { Building2, Phone, Mail, Globe, MessageSquare, Star, Image, CheckCircle, AlertCircle } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid #E2E8F0',
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  color: '#0F172A',
  background: 'white',
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid #E2E8F0', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Icon size={18} color="#2563EB" />
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function CabinetProfilePage() {
  const [form, setForm] = useState({
    nom: '',
    adresse: '',
    ville: '',
    telephone: '',
    email: '',
    whatsappNumber: '',
    googleReviewLink: '',
    logoUrl: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/cabinet')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setForm({
            nom:              data.nom              ?? '',
            adresse:          data.adresse          ?? '',
            ville:            data.ville            ?? '',
            telephone:        data.telephone        ?? '',
            email:            data.email            ?? '',
            whatsappNumber:   data.whatsappNumber   ?? '',
            googleReviewLink: data.googleReviewLink ?? '',
            logoUrl:          data.logoUrl          ?? '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) {
      setMsg({ text: 'Le nom du cabinet est requis.', ok: false })
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/cabinet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      setMsg({ text: 'Profil du cabinet mis à jour avec succès !', ok: true })
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : 'Erreur serveur', ok: false })
    }
    setSaving(false)
  }

  // WhatsApp signature preview
  const waSignature = form.nom
    ? `— ${form.nom}${form.telephone ? ` | ${form.telephone}` : ''}`
    : '— Votre Cabinet'

  if (loading) {
    return (
      <div>
        <Topbar title="Profil du cabinet" subtitle="Informations et coordonnées" />
        <div style={{ padding: 24, color: '#64748B', fontSize: 14 }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      <Topbar title="Profil du cabinet" subtitle="Informations et coordonnées" />
      <div style={{ padding: 24 }}>
        <form onSubmit={handleSave} style={{ maxWidth: 720 }}>

          {/* Section 1 — Informations générales */}
          <Section icon={Building2} title="Informations générales">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Nom du cabinet <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  value={form.nom}
                  onChange={set('nom')}
                  required
                  placeholder="Ex: Cabinet Kinésithérapie Amrani"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Ville</label>
                  <input value={form.ville} onChange={set('ville')} placeholder="Ex: Casablanca" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Adresse</label>
                  <input value={form.adresse} onChange={set('adresse')} placeholder="Rue, quartier..." style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={13} /> Téléphone</span>
                  </label>
                  <input type="tel" value={form.telephone} onChange={set('telephone')} placeholder="0600000000" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={13} /> Email</span>
                  </label>
                  <input type="email" value={form.email} onChange={set('email')} placeholder="contact@cabinet.ma" style={inputStyle} />
                </div>
              </div>
            </div>
          </Section>

          {/* Section 2 — Messagerie & Avis */}
          <Section icon={MessageSquare} title="Messagerie & Avis Google">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#25D366' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </span>
                    Numéro WhatsApp du cabinet
                  </span>
                </label>
                <input
                  type="tel"
                  value={form.whatsappNumber}
                  onChange={set('whatsappNumber')}
                  placeholder="212600000000 (format international sans +)"
                  style={inputStyle}
                />
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  Utilisé pour les liens wa.me dans les messages envoyés aux patients.
                </p>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Star size={13} color="#F59E0B" /> Lien Google Avis</span>
                </label>
                <input
                  value={form.googleReviewLink}
                  onChange={set('googleReviewLink')}
                  placeholder="https://g.page/r/.../review"
                  style={inputStyle}
                />
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  Envoyé automatiquement aux patients avec un score ≥ 8/10 après leur séance.
                </p>
              </div>

              {/* WhatsApp signature preview */}
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#166534', margin: '0 0 6px' }}>
                  Aperçu de la signature WhatsApp :
                </p>
                <p style={{ fontSize: 13, color: '#14532D', margin: 0, fontFamily: 'monospace' }}>
                  {waSignature}
                </p>
              </div>
            </div>
          </Section>

          {/* Section 3 — Logo */}
          <Section icon={Image} title="Logo du cabinet">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Globe size={13} /> URL du logo</span>
                </label>
                <input
                  value={form.logoUrl}
                  onChange={set('logoUrl')}
                  placeholder="https://exemple.com/logo.png"
                  style={inputStyle}
                />
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  URL publique d'une image (PNG, JPG). Hébergez votre logo sur un service externe (Imgur, Cloudinary, etc.).
                </p>
              </div>

              {/* Logo preview */}
              {form.logoUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.logoUrl}
                    alt="Logo cabinet"
                    style={{ height: 60, maxWidth: 200, objectFit: 'contain', border: '1px solid #E2E8F0', borderRadius: 8, padding: 6, background: 'white' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <span style={{ fontSize: 12, color: '#64748B' }}>Aperçu du logo</span>
                </div>
              )}
            </div>
          </Section>

          {/* Save button + message */}
          {msg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 16px', borderRadius: 10, marginBottom: 16,
              background: msg.ok ? '#F0FDF4' : '#FEF2F2',
              color: msg.ok ? '#166534' : '#B91C1C',
              border: `1px solid ${msg.ok ? '#BBF7D0' : '#FECACA'}`,
              fontSize: 13,
            }}>
              {msg.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '12px 32px',
              background: saving ? '#93C5FD' : '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>

        </form>
      </div>
    </div>
  )
}
