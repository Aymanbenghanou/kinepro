'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Globe, Save, Plus, Trash2, Star, Eye, Copy, Check } from 'lucide-react'
import Link from 'next/link'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kinepro-omega.vercel.app'

const TEMPLATES = [
  {
    id: 'medical',
    label: 'Médical Classique',
    desc: 'Design épuré, professionnel et rassurant. Fond blanc, marine et bleu.',
    colors: ['#F8FAFC', '#1E3A5F', '#2563EB'],
    emoji: '🏥',
  },
  {
    id: 'premium',
    label: 'Moderne Premium',
    desc: 'Luxueux, sombre avec des accents dorés. Idéal pour les cabinets haut de gamme.',
    colors: ['#0F172A', '#1E293B', '#F59E0B'],
    emoji: '✨',
  },
  {
    id: 'warm',
    label: 'Chaleureux Humain',
    desc: 'Tons beige et sarcelle chauds. Ambiance accueillante et humaine.',
    colors: ['#FFF7ED', '#CCFBF1', '#0D9488'],
    emoji: '🌿',
  },
  {
    id: 'sport',
    label: 'Sport & Dynamique',
    desc: 'Sombre et énergique avec un bleu électrique. Parfait pour la kiné sportive.',
    colors: ['#0F172A', '#111827', '#3B82F6'],
    emoji: '⚡',
  },
]

type Tab = 'template' | 'contenu' | 'temoignages' | 'parametres'

interface Testimonial {
  id: string
  patientName: string
  text: string
  rating: number
}

interface SiteData {
  id: string
  cabinetId: string
  templateId: string
  published: boolean
  primaryColor: string
  secondaryColor: string
  heroTitle: string | null
  heroSubtitle: string | null
  heroImageUrl: string | null
  aboutText: string | null
  googleMapsEmbed: string | null
  testimonials: Testimonial[]
  cabinet: { id: string; nom: string; ville: string; slug: string | null }
}

export default function SuperAdminSiteConfigPage() {
  const { cabinetId } = useParams<{ cabinetId: string }>()
  const router = useRouter()

  const [tab, setTab] = useState<Tab>('template')
  const [site, setSite] = useState<SiteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  // Form fields
  const [templateId, setTemplateId] = useState('medical')
  const [primaryColor, setPrimaryColor] = useState('#2563EB')
  const [secondaryColor, setSecondaryColor] = useState('#1E3A5F')
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [aboutText, setAboutText] = useState('')
  const [googleMapsEmbed, setGoogleMapsEmbed] = useState('')
  const [published, setPublished] = useState(false)

  // Testimonial form
  const [newPatientName, setNewPatientName] = useState('')
  const [newText, setNewText] = useState('')
  const [newRating, setNewRating] = useState(5)
  const [addingTestimonial, setAddingTestimonial] = useState(false)

  useEffect(() => {
    fetch(`/api/super-admin/sites/${cabinetId}`)
      .then(r => r.json())
      .then((d: SiteData) => {
        setSite(d)
        setTemplateId(d.templateId ?? 'medical')
        setPrimaryColor(d.primaryColor ?? '#2563EB')
        setSecondaryColor(d.secondaryColor ?? '#1E3A5F')
        setHeroTitle(d.heroTitle ?? '')
        setHeroSubtitle(d.heroSubtitle ?? '')
        setHeroImageUrl(d.heroImageUrl ?? '')
        setAboutText(d.aboutText ?? '')
        setGoogleMapsEmbed(d.googleMapsEmbed ?? '')
        setPublished(d.published ?? false)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [cabinetId])

  async function save() {
    setSaving(true)
    const body: Record<string, any> = {}
    if (tab === 'template') {
      body.templateId = templateId
      body.primaryColor = primaryColor
      body.secondaryColor = secondaryColor
    } else if (tab === 'contenu') {
      body.heroTitle = heroTitle || null
      body.heroSubtitle = heroSubtitle || null
      body.heroImageUrl = heroImageUrl || null
      body.aboutText = aboutText || null
      body.googleMapsEmbed = googleMapsEmbed || null
    } else if (tab === 'parametres') {
      body.published = published
    }
    const res = await fetch(`/api/super-admin/sites/${cabinetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      setSite(prev => prev ? { ...prev, ...updated } : prev)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  async function addTestimonial() {
    if (!newPatientName.trim() || !newText.trim()) return
    setAddingTestimonial(true)
    const res = await fetch(`/api/super-admin/sites/${cabinetId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientName: newPatientName, text: newText, rating: newRating }),
    })
    if (res.ok) {
      const t = await res.json()
      setSite(prev => prev ? { ...prev, testimonials: [t, ...prev.testimonials] } : prev)
      setNewPatientName('')
      setNewText('')
      setNewRating(5)
    }
    setAddingTestimonial(false)
  }

  async function deleteTestimonial(id: string) {
    await fetch(`/api/super-admin/sites/${cabinetId}/testimonials/${id}`, { method: 'DELETE' })
    setSite(prev => prev ? { ...prev, testimonials: prev.testimonials.filter(t => t.id !== id) } : prev)
  }

  async function togglePublish() {
    await fetch(`/api/super-admin/sites/${cabinetId}/publish`, { method: 'POST' })
    const newVal = !published
    setPublished(newVal)
    setSite(prev => prev ? { ...prev, published: newVal } : prev)
  }

  function copyUrl() {
    const url = `${APP_URL}/cabinet/${site?.cabinet?.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const siteUrl = site?.cabinet?.slug ? `${APP_URL}/cabinet/${site.cabinet.slug}` : null
  const tabs: { id: Tab; label: string }[] = [
    { id: 'template',     label: '🎨 Template' },
    { id: 'contenu',      label: '✏️ Contenu' },
    { id: 'temoignages',  label: '💬 Témoignages' },
    { id: 'parametres',   label: '⚙️ Paramètres' },
  ]

  const needsSaveButton = tab !== 'temoignages' && tab !== 'parametres'

  return (
    <div style={{ minHeight: '100vh', background: '#0F0A2E', padding: '32px 24px' }}>
      {/* Back + title */}
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <Link href="/super-admin/sites" style={{ color: '#818CF8', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 14 }}>
            <ArrowLeft size={16} /> Retour
          </Link>
          <div style={{ flex: 1 }}>
            {loading ? (
              <div style={{ color: '#818CF8', fontSize: 18 }}>Chargement…</div>
            ) : (
              <>
                <h1 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: 0 }}>
                  {site?.cabinet?.nom ?? 'Cabinet'}
                </h1>
                <p style={{ color: '#818CF8', fontSize: 13, margin: 0 }}>{site?.cabinet?.ville}</p>
              </>
            )}
          </div>
          {/* Status badge */}
          {site && (
            <span style={{
              padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
              background: published ? 'rgba(22,163,74,0.15)' : 'rgba(100,116,139,0.15)',
              color: published ? '#4ADE80' : '#94A3B8',
            }}>
              {published ? '🟢 Publié' : '⚫ Brouillon'}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '9px 6px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === t.id ? '#4F46E5' : 'transparent',
              color: tab === t.id ? 'white' : '#818CF8',
              transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#818CF8' }}>Chargement…</div>
        ) : (
          <>
            {/* ── TAB: Template ── */}
            {tab === 'template' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
                  {TEMPLATES.map(tmpl => (
                    <button key={tmpl.id} onClick={() => setTemplateId(tmpl.id)} style={{
                      background: templateId === tmpl.id ? 'rgba(79,70,229,0.2)' : 'rgba(255,255,255,0.04)',
                      border: `2px solid ${templateId === tmpl.id ? '#4F46E5' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 14, padding: 20, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      {/* Color preview swatch */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                        {tmpl.colors.map((c, i) => (
                          <div key={i} style={{ width: 24, height: 24, borderRadius: 6, background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 20 }}>{tmpl.emoji}</span>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>{tmpl.label}</span>
                        {templateId === tmpl.id && (
                          <span style={{ marginLeft: 'auto', background: '#4F46E5', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>✓ Sélectionné</span>
                        )}
                      </div>
                      <p style={{ color: '#94A3B8', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{tmpl.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Color overrides */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
                  <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Couleurs personnalisées</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600 }}>Couleur principale</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                          style={{ width: 44, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none', padding: 2 }} />
                        <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                          style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: 'white', fontSize: 13, fontFamily: 'monospace' }} />
                      </div>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600 }}>Couleur secondaire</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                          style={{ width: 44, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none', padding: 2 }} />
                        <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                          style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: 'white', fontSize: 13, fontFamily: 'monospace' }} />
                      </div>
                    </label>
                  </div>
                </div>

                <SaveButton saving={saving} saved={saved} onClick={save} />
              </div>
            )}

            {/* ── TAB: Contenu ── */}
            {tab === 'contenu' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <Section title="Section Hero">
                  <Field label="Titre principal" value={heroTitle} onChange={setHeroTitle} placeholder="Votre santé, notre priorité" />
                  <Field label="Sous-titre" value={heroSubtitle} onChange={setHeroSubtitle} placeholder="Cabinet de kinésithérapie à Casablanca" />
                  <Field label="URL de l'image hero" value={heroImageUrl} onChange={setHeroImageUrl} placeholder="https://..." />
                  {heroImageUrl && (
                    <div style={{ marginTop: 8 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heroImageUrl} alt="hero preview" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                  )}
                </Section>

                <Section title="À propos">
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600 }}>Texte de présentation</span>
                    <textarea value={aboutText} onChange={e => setAboutText(e.target.value)} rows={5}
                      placeholder="Notre cabinet vous accueille dans un cadre chaleureux…"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 14, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
                  </label>
                </Section>

                <Section title="Google Maps">
                  <Field label="URL d'intégration Google Maps (src de l'iframe)" value={googleMapsEmbed} onChange={setGoogleMapsEmbed} placeholder="https://www.google.com/maps/embed?pb=..." />
                  {googleMapsEmbed && (
                    <div style={{ marginTop: 8 }}>
                      <iframe src={googleMapsEmbed} width="100%" height={200} style={{ border: 0, borderRadius: 10 }} allowFullScreen loading="lazy" />
                    </div>
                  )}
                </Section>

                <SaveButton saving={saving} saved={saved} onClick={save} />
              </div>
            )}

            {/* ── TAB: Témoignages ── */}
            {tab === 'temoignages' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Add form */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 14, padding: 20 }}>
                  <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Ajouter un témoignage</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <Field label="Nom du patient" value={newPatientName} onChange={setNewPatientName} placeholder="Marie B." />
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600 }}>Note</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[1,2,3,4,5].map(s => (
                          <button key={s} onClick={() => setNewRating(s)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, padding: 0, opacity: s <= newRating ? 1 : 0.3, color: '#F59E0B', transition: 'opacity 0.1s' }}>
                            ★
                          </button>
                        ))}
                      </div>
                    </label>
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600 }}>Témoignage</span>
                    <textarea value={newText} onChange={e => setNewText(e.target.value)} rows={3}
                      placeholder="Excellent suivi, je recommande vivement…"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
                  </label>
                  <button onClick={addTestimonial} disabled={addingTestimonial || !newPatientName.trim() || !newText.trim()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: addingTestimonial ? 0.6 : 1 }}>
                    <Plus size={15} /> {addingTestimonial ? 'Ajout…' : 'Ajouter le témoignage'}
                  </button>
                </div>

                {/* List */}
                {(site?.testimonials ?? []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#818CF8', fontSize: 14 }}>Aucun témoignage pour l'instant.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {site!.testimonials.map(t => (
                      <div key={t.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{t.patientName}</span>
                            <span style={{ color: '#F59E0B', fontSize: 13 }}>{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</span>
                          </div>
                          <p style={{ color: '#C7D2FE', fontSize: 13, margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>"{t.text}"</p>
                        </div>
                        <button onClick={() => deleteTestimonial(t.id)}
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', flexShrink: 0 }}>
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
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Publication</h3>
                      <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>
                        {published ? 'Le site est visible par le public.' : 'Le site est en brouillon (invisible du public).'}
                      </p>
                    </div>
                    <button onClick={togglePublish} style={{
                      padding: '9px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                      background: published ? 'rgba(239,68,68,0.15)' : 'rgba(22,163,74,0.15)',
                      color: published ? '#FCA5A5' : '#4ADE80',
                    }}>
                      {published ? '🔴 Dépublier' : '🟢 Publier le site'}
                    </button>
                  </div>
                </div>

                {/* URL */}
                {siteUrl && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24 }}>
                    <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>URL du site</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 9, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Globe size={14} style={{ color: '#818CF8', flexShrink: 0 }} />
                      <span style={{ flex: 1, color: '#C7D2FE', fontSize: 13, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{siteUrl}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(99,102,241,0.2)', color: '#A5B4FC', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(99,102,241,0.3)' }}>
                        <Eye size={14} /> Voir le site
                      </a>
                      <button onClick={copyUrl}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: copied ? 'rgba(22,163,74,0.2)' : 'rgba(255,255,255,0.05)', color: copied ? '#4ADE80' : '#94A3B8', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copié !' : 'Copier le lien'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Slug info */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24 }}>
                  <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>Slug (identifiant URL)</h3>
                  <p style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 10px' }}>Modifiable dans les paramètres du cabinet.</p>
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '8px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <code style={{ color: '#C7D2FE', fontSize: 13 }}>
                      {site?.cabinet?.slug ? `/${site.cabinet.slug}` : <span style={{ color: '#64748B' }}>Non défini</span>}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ── Sub-components ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
      <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600 }}>{label}</span>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 14, outline: 'none' }} />
    </label>
  )
}

function SaveButton({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button onClick={onClick} disabled={saving}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: saved ? 'rgba(22,163,74,0.2)' : '#4F46E5', color: saved ? '#4ADE80' : 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', opacity: saving ? 0.7 : 1 }}>
        {saved ? <><Check size={16} /> Sauvegardé</> : saving ? 'Sauvegarde…' : <><Save size={16} /> Sauvegarder</>}
      </button>
    </div>
  )
}
