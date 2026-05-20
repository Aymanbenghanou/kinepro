'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Globe, Save, Plus, Trash2, Eye, Copy, Check, Sparkles, RefreshCw, Loader2, Edit3 } from 'lucide-react'
import Link from 'next/link'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kinepro-omega.vercel.app'

const AVAILABLE_PHOTOS = [
  { url: 'https://res.cloudinary.com/djouneyaq/image/upload/v1779231325/difference-kine-osteo_m2ze25.jpg',         label: 'Photo 1 — Kiné générale' },
  { url: 'https://res.cloudinary.com/djouneyaq/image/upload/v1779231325/attachement_173374694012430_fnxoke.webp',  label: 'Photo 2 — Cabinet moderne' },
  { url: 'https://res.cloudinary.com/djouneyaq/image/upload/v1779231314/KOSSPARIS_DSC9951-1-480x320-1_ycjl6b.jpg',label: 'Photo 3 — Sport' },
  { url: 'https://res.cloudinary.com/djouneyaq/image/upload/v1779231315/kinesitherapeute-sport-1024x683_izcie4.jpg',label: 'Photo 4 — Kiné sportif' },
  { url: 'https://res.cloudinary.com/djouneyaq/image/upload/v1779231314/kinesitherapie2x_bumgqa.webp',            label: 'Photo 5 — Premium' },
  { url: 'https://res.cloudinary.com/djouneyaq/image/upload/v1779231314/KINESENS-centre-de-kinesitherapie-Luxembourg-reeducation-mobilite-illu12-pediatrique-min_oeixyt.webp', label: 'Photo 6 — Pédiatrique' },
  { url: 'https://res.cloudinary.com/djouneyaq/image/upload/v1779193379/kinepro/documents/s6mshtgzkshlw9fjvao7.jpg', label: 'Photo 7 — Cabinet' },
  { url: 'https://res.cloudinary.com/djouneyaq/image/upload/v1778974291/POL_6607-950x600_b8jayx.jpg',             label: 'Photo 8 — Thérapie' },
]

const TEMPLATES = [
  { id: 'medical',  label: 'Médical Classique', desc: 'Épuré, professionnel, rassurant',     colors: ['#FFFFFF','#1E3A5F','#2563EB'], emoji: '🏥' },
  { id: 'premium',  label: 'Moderne Premium',   desc: 'Luxueux, élégant, haut de gamme',     colors: ['#FFFFFF','#0F172A','#F59E0B'], emoji: '✨' },
  { id: 'warm',     label: 'Chaleureux Humain', desc: 'Chaleureux, accueillant, familial',   colors: ['#FFF7ED','#0D9488','#F59E0B'], emoji: '🌿' },
  { id: 'sport',    label: 'Sport & Dynamique', desc: 'Dynamique, énergique, sportif',       colors: ['#0F172A','#1D4ED8','#06B6D4'], emoji: '⚡' },
]

type Tab = 'template' | 'contenu' | 'temoignages' | 'parametres'

interface SiteContent {
  heroTitle?: string; heroSubtitle?: string; aboutTitle?: string; aboutText?: string
  servicesTitle?: string; servicesSubtitle?: string; teamTitle?: string; teamSubtitle?: string
  bookingTitle?: string; bookingSubtitle?: string; testimonialsTitle?: string; contactTitle?: string
  seoTitle?: string; seoDescription?: string
  stats?: { number: string; label: string }[]
}

interface Testimonial {
  id: string; patientName: string; textFr: string; textAr: string; rating: number
}

interface SiteData {
  id: string; cabinetId: string; templateId: string; published: boolean
  primaryColor: string; secondaryColor: string
  contentFr: SiteContent | null; contentAr: SiteContent | null
  heroImageUrl: string | null; googleMapsEmbed: string | null
  testimonials: Testimonial[]
  cabinet: { id: string; nom: string; ville: string; slug: string | null }
}

const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '9px 14px', color: 'white', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
}
const TEXTAREA_STYLE: React.CSSProperties = { ...INPUT_STYLE, resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.6 }
const LABEL_STYLE: React.CSSProperties = { color: '#94A3B8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }

export default function SuperAdminSiteConfigPage() {
  const { cabinetId } = useParams<{ cabinetId: string }>()

  const [tab, setTab] = useState<Tab>('template')
  const [site, setSite] = useState<SiteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  // Template tab
  const [templateId, setTemplateId] = useState('medical')
  const [primaryColor, setPrimaryColor] = useState('#2563EB')
  const [secondaryColor, setSecondaryColor] = useState('#1E3A5F')
  const [heroImageUrl, setHeroImageUrl] = useState('')

  // Contenu tab (FR + AR editable fields)
  const [contentFr, setContentFr] = useState<SiteContent>({})
  const [contentAr, setContentAr] = useState<SiteContent>({})
  const [generating, setGenerating] = useState(false)
  const [generationDone, setGenerationDone] = useState(false)

  // Testimonials tab
  const [newPatientName, setNewPatientName] = useState('')
  const [newTextFr, setNewTextFr] = useState('')
  const [newTextAr, setNewTextAr] = useState('')
  const [newRating, setNewRating] = useState(5)
  const [addingTestimonial, setAddingTestimonial] = useState(false)

  // Params tab
  const [published, setPublished] = useState(false)
  const [googleMapsEmbed, setGoogleMapsEmbed] = useState('')

  useEffect(() => {
    fetch(`/api/super-admin/sites/${cabinetId}`)
      .then(r => r.json())
      .then((d: SiteData) => {
        setSite(d)
        setTemplateId(d.templateId ?? 'medical')
        setPrimaryColor(d.primaryColor ?? '#2563EB')
        setSecondaryColor(d.secondaryColor ?? '#1E3A5F')
        setHeroImageUrl(d.heroImageUrl ?? '')
        setContentFr((d.contentFr as SiteContent) ?? {})
        setContentAr((d.contentAr as SiteContent) ?? {})
        setPublished(d.published ?? false)
        setGoogleMapsEmbed(d.googleMapsEmbed ?? '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [cabinetId])

  async function patch(body: Record<string, any>) {
    setSaving(true)
    const res = await fetch(`/api/super-admin/sites/${cabinetId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      setSite(prev => prev ? { ...prev, ...updated } : prev)
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  async function saveTemplate() {
    await patch({ templateId, primaryColor, secondaryColor, heroImageUrl: heroImageUrl || null })
  }

  async function saveContenu() {
    await patch({ contentFr, contentAr })
  }

  async function saveParams() {
    await patch({ published, googleMapsEmbed: googleMapsEmbed || null })
  }

  async function generateAI() {
    setGenerating(true)
    setGenerationDone(false)
    const res = await fetch(`/api/super-admin/sites/${cabinetId}/generate-content`, { method: 'POST' })
    if (res.ok) {
      const updated = await res.json()
      setSite(prev => prev ? { ...prev, ...updated } : prev)
      setContentFr((updated.contentFr as SiteContent) ?? {})
      setContentAr((updated.contentAr as SiteContent) ?? {})
      setGenerationDone(true)
    }
    setGenerating(false)
  }

  async function togglePublish() {
    await fetch(`/api/super-admin/sites/${cabinetId}/publish`, { method: 'POST' })
    const val = !published; setPublished(val)
    setSite(prev => prev ? { ...prev, published: val } : prev)
  }

  async function addTestimonial() {
    if (!newPatientName.trim()) return
    setAddingTestimonial(true)
    const res = await fetch(`/api/super-admin/sites/${cabinetId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientName: newPatientName, textFr: newTextFr, textAr: newTextAr, rating: newRating }),
    })
    if (res.ok) {
      const t = await res.json()
      setSite(prev => prev ? { ...prev, testimonials: [t, ...prev.testimonials] } : prev)
      setNewPatientName(''); setNewTextFr(''); setNewTextAr(''); setNewRating(5)
    }
    setAddingTestimonial(false)
  }

  async function deleteTestimonial(id: string) {
    await fetch(`/api/super-admin/sites/${cabinetId}/testimonials/${id}`, { method: 'DELETE' })
    setSite(prev => prev ? { ...prev, testimonials: prev.testimonials.filter(t => t.id !== id) } : prev)
  }

  function copyUrl() {
    if (!site?.cabinet?.slug) return
    navigator.clipboard.writeText(`${APP_URL}/cabinet/${site.cabinet.slug}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const siteUrl = site?.cabinet?.slug ? `${APP_URL}/cabinet/${site.cabinet.slug}` : null
  const tabs: { id: Tab; label: string }[] = [
    { id: 'template',    label: '🎨 Template' },
    { id: 'contenu',     label: '🤖 Contenu IA' },
    { id: 'temoignages', label: '💬 Témoignages' },
    { id: 'parametres',  label: '⚙️ Paramètres' },
  ]

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0F0A2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} style={{ color: '#818CF8', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F0A2E', padding: '32px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <Link href="/super-admin/sites" style={{ color: '#818CF8', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 14 }}>
            <ArrowLeft size={16} /> Retour
          </Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: 0 }}>{site?.cabinet?.nom ?? 'Cabinet'}</h1>
            <p style={{ color: '#818CF8', fontSize: 13, margin: 0 }}>{site?.cabinet?.ville}</p>
          </div>
          <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: published ? 'rgba(22,163,74,0.15)' : 'rgba(100,116,139,0.15)', color: published ? '#4ADE80' : '#94A3B8' }}>
            {published ? '🟢 Publié' : '⚫ Brouillon'}
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '9px 6px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === t.id ? '#4F46E5' : 'transparent', color: tab === t.id ? 'white' : '#818CF8', transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── TAB: Template ── */}
        {tab === 'template' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Template cards */}
            <Card title="Choisir un template">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
                {TEMPLATES.map(tmpl => (
                  <button key={tmpl.id} onClick={() => setTemplateId(tmpl.id)} style={{
                    background: templateId === tmpl.id ? 'rgba(79,70,229,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${templateId === tmpl.id ? '#4F46E5' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 14, padding: 18, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      {tmpl.colors.map((c, i) => <div key={i} style={{ width: 22, height: 22, borderRadius: 6, background: c, border: '1px solid rgba(255,255,255,0.15)' }} />)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 18 }}>{tmpl.emoji}</span>
                      <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{tmpl.label}</span>
                      {templateId === tmpl.id && <span style={{ marginLeft: 'auto', background: '#4F46E5', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>✓</span>}
                    </div>
                    <p style={{ color: '#94A3B8', fontSize: 12, margin: 0 }}>{tmpl.desc}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Color pickers */}
            <Card title="Couleurs personnalisées">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {[
                  { label: 'Couleur principale', val: primaryColor, set: setPrimaryColor },
                  { label: 'Couleur secondaire', val: secondaryColor, set: setSecondaryColor },
                ].map(({ label, val, set }) => (
                  <label key={label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={LABEL_STYLE}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="color" value={val} onChange={e => set(e.target.value)}
                        style={{ width: 44, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none', padding: 2 }} />
                      <input type="text" value={val} onChange={e => set(e.target.value)}
                        style={{ ...INPUT_STYLE, fontFamily: 'monospace', flex: 1 }} />
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            {/* Photo picker */}
            <Card title="Photo hero">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                {AVAILABLE_PHOTOS.map(photo => (
                  <button key={photo.url} onClick={() => setHeroImageUrl(photo.url)} style={{
                    border: `2px solid ${heroImageUrl === photo.url ? '#4F46E5' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 10, overflow: 'hidden', padding: 0, cursor: 'pointer', background: 'none', position: 'relative',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={photo.label} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                    {heroImageUrl === photo.url && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(79,70,229,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={24} style={{ color: 'white' }} />
                      </div>
                    )}
                    <div style={{ padding: '4px 6px', background: 'rgba(0,0,0,0.6)' }}>
                      <p style={{ color: '#C7D2FE', fontSize: 10, margin: 0, textAlign: 'left' }}>{photo.label}</p>
                    </div>
                  </button>
                ))}
              </div>
              {heroImageUrl && (
                <div style={{ marginTop: 12 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroImageUrl} alt="selected" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              )}
            </Card>

            <SaveBtn saving={saving} saved={saved} onClick={saveTemplate} />
          </div>
        )}

        {/* ── TAB: Contenu IA ── */}
        {tab === 'contenu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* AI generation button */}
            <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 14, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>
                    {generationDone ? '✅ Contenu généré avec succès !' : '🤖 Générer le contenu avec Claude AI'}
                  </h3>
                  <p style={{ color: '#A5B4FC', fontSize: 13, margin: 0 }}>
                    {generating
                      ? 'Claude génère le contenu en français et arabe…'
                      : generationDone
                        ? 'Le contenu ci-dessous est pré-rempli. Modifiez et sauvegardez si besoin.'
                        : 'Claude génère automatiquement tout le contenu du site en français et arabe en fonction du cabinet.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {generationDone && (
                    <button onClick={generateAI} disabled={generating} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(99,102,241,0.2)', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      <RefreshCw size={14} /> Régénérer
                    </button>
                  )}
                  <button onClick={generateAI} disabled={generating} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: generating ? 'rgba(99,102,241,0.3)' : '#4F46E5', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer' }}>
                    {generating ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Génération…</> : <><Sparkles size={16} /> Générer avec Claude AI</>}
                  </button>
                </div>
              </div>
            </div>

            {/* FR + AR fields side by side */}
            {(['heroTitle','heroSubtitle','aboutTitle','aboutText','servicesTitle','servicesSubtitle','teamTitle','bookingTitle','bookingSubtitle','testimonialsTitle','contactTitle','seoTitle','seoDescription'] as const).map(field => {
              const isTextarea = ['aboutText','seoDescription','heroSubtitle','bookingSubtitle'].includes(field)
              const labels: Record<string, string> = {
                heroTitle: 'Titre hero', heroSubtitle: 'Sous-titre hero', aboutTitle: 'Titre À propos', aboutText: 'Texte À propos',
                servicesTitle: 'Titre Services', servicesSubtitle: 'Sous-titre Services', teamTitle: "Titre Équipe",
                bookingTitle: 'Titre Réservation', bookingSubtitle: 'Sous-titre Réservation',
                testimonialsTitle: 'Titre Témoignages', contactTitle: 'Titre Contact',
                seoTitle: 'SEO Title', seoDescription: 'SEO Description',
              }
              return (
                <div key={field} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
                  <p style={{ color: '#C7D2FE', fontSize: 13, fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Edit3 size={13} /> {labels[field]}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={LABEL_STYLE}>🇫🇷 Français</label>
                      {isTextarea ? (
                        <textarea rows={3} value={(contentFr as any)[field] ?? ''} onChange={e => setContentFr(p => ({ ...p, [field]: e.target.value }))} style={TEXTAREA_STYLE} />
                      ) : (
                        <input type="text" value={(contentFr as any)[field] ?? ''} onChange={e => setContentFr(p => ({ ...p, [field]: e.target.value }))} style={INPUT_STYLE} />
                      )}
                    </div>
                    <div>
                      <label style={{ ...LABEL_STYLE, direction: 'rtl' }}>🇲🇦 العربية</label>
                      {isTextarea ? (
                        <textarea rows={3} value={(contentAr as any)[field] ?? ''} onChange={e => setContentAr(p => ({ ...p, [field]: e.target.value }))} style={{ ...TEXTAREA_STYLE, direction: 'rtl', textAlign: 'right' }} />
                      ) : (
                        <input type="text" value={(contentAr as any)[field] ?? ''} onChange={e => setContentAr(p => ({ ...p, [field]: e.target.value }))} style={{ ...INPUT_STYLE, direction: 'rtl', textAlign: 'right' }} />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            <SaveBtn saving={saving} saved={saved} onClick={saveContenu} />
          </div>
        )}

        {/* ── TAB: Témoignages ── */}
        {tab === 'temoignages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card title="Ajouter un témoignage">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
                <div>
                  <label style={LABEL_STYLE}>Nom du patient</label>
                  <input type="text" value={newPatientName} onChange={e => setNewPatientName(e.target.value)} placeholder="Marie B." style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Note</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => setNewRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, padding: 0, opacity: s <= newRating ? 1 : 0.3, color: '#F59E0B' }}>★</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={LABEL_STYLE}>🇫🇷 Témoignage en français</label>
                  <textarea rows={3} value={newTextFr} onChange={e => setNewTextFr(e.target.value)} placeholder="Excellent suivi, je recommande vivement…" style={TEXTAREA_STYLE} />
                </div>
                <div>
                  <label style={{ ...LABEL_STYLE, direction: 'rtl' }}>🇲🇦 الشهادة بالعربية</label>
                  <textarea rows={3} value={newTextAr} onChange={e => setNewTextAr(e.target.value)} placeholder="متابعة ممتازة، أنصح بشدة..." style={{ ...TEXTAREA_STYLE, direction: 'rtl', textAlign: 'right' }} />
                </div>
              </div>
              <button onClick={addTestimonial} disabled={addingTestimonial || !newPatientName.trim()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: addingTestimonial ? 0.6 : 1 }}>
                <Plus size={15} /> {addingTestimonial ? 'Ajout…' : 'Ajouter'}
              </button>
            </Card>

            {(site?.testimonials ?? []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#818CF8', fontSize: 14 }}>Aucun témoignage.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {site!.testimonials.map(t => (
                  <div key={t.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, display: 'flex', gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ color: 'white', fontWeight: 700 }}>{t.patientName}</span>
                        <span style={{ color: '#F59E0B' }}>{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <p style={{ color: '#C7D2FE', fontSize: 13, margin: 0, fontStyle: 'italic' }}>{t.textFr || <span style={{ color: '#64748B' }}>—</span>}</p>
                        <p style={{ color: '#C7D2FE', fontSize: 13, margin: 0, fontStyle: 'italic', direction: 'rtl', textAlign: 'right' }}>{t.textAr || <span style={{ color: '#64748B' }}>—</span>}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteTestimonial(t.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', flexShrink: 0 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Paramètres ── */}
        {tab === 'parametres' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Publish toggle */}
            <Card title="Publication">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>
                  {published ? 'Le site est visible par le public.' : 'Le site est en brouillon (invisible du public).'}
                </p>
                <button onClick={togglePublish} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: published ? 'rgba(239,68,68,0.15)' : 'rgba(22,163,74,0.15)', color: published ? '#FCA5A5' : '#4ADE80' }}>
                  {published ? '🔴 Dépublier' : '🟢 Publier le site'}
                </button>
              </div>
            </Card>

            {/* Google Maps */}
            <Card title="Google Maps">
              <label style={LABEL_STYLE}>URL d'intégration (src de l'iframe)</label>
              <input type="text" value={googleMapsEmbed} onChange={e => setGoogleMapsEmbed(e.target.value)}
                placeholder="https://www.google.com/maps/embed?pb=..." style={INPUT_STYLE} />
              {googleMapsEmbed && (
                <div style={{ marginTop: 12 }}>
                  <iframe src={googleMapsEmbed} width="100%" height={180} style={{ border: 0, borderRadius: 10 }} loading="lazy" />
                </div>
              )}
            </Card>

            {/* URL */}
            {siteUrl && (
              <Card title="URL du site">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 9, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
                  <Globe size={14} style={{ color: '#818CF8', flexShrink: 0 }} />
                  <span style={{ flex: 1, color: '#C7D2FE', fontSize: 13, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{siteUrl}</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <a href={siteUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(99,102,241,0.2)', color: '#A5B4FC', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(99,102,241,0.3)' }}>
                    <Eye size={14} /> Voir le site
                  </a>
                  <button onClick={copyUrl} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: copied ? 'rgba(22,163,74,0.2)' : 'rgba(255,255,255,0.05)', color: copied ? '#4ADE80' : '#94A3B8', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copié !' : 'Copier le lien'}
                  </button>
                </div>
              </Card>
            )}

            <SaveBtn saving={saving} saved={saved} onClick={saveParams} />
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
      <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>{title}</h3>
      {children}
    </div>
  )
}

function SaveBtn({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button onClick={onClick} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: saved ? 'rgba(22,163,74,0.2)' : '#4F46E5', color: saved ? '#4ADE80' : 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
        {saved ? <><Check size={16} /> Sauvegardé</> : saving ? 'Sauvegarde…' : <><Save size={16} /> Sauvegarder</>}
      </button>
    </div>
  )
}
