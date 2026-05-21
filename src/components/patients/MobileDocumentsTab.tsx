'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Mobile-only Docs tab for /patients/[id]. Uses the same API endpoints
 * as the desktop DocumentsTab (Cloudinary unsigned upload → POST to
 * /api/patients/:id/documents). No data-flow forking.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'djouneyaq'
const UPLOAD_PRESET = 'kinepro_docs'
const MAX_SIZE_MB = 10

const DOC_TYPES = [
  { value: 'ordonnance',   label: 'Ordonnance',   icon: '📋', color: '#2563EB', bg: '#EFF6FF' },
  { value: 'radio',        label: 'Radio / IRM',  icon: '🩻', color: '#7C3AED', bg: '#F0F9FF' },
  { value: 'compte_rendu', label: 'Compte-rendu', icon: '📄', color: '#D97706', bg: '#FFFBEB' },
  { value: 'autre',        label: 'Autre',         icon: '📎', color: '#64748B', bg: '#F8FAFC' },
] as const

const FILTERS = [
  { value: 'tous',         label: 'Tous' },
  { value: 'ordonnance',   label: 'Ordonnances' },
  { value: 'radio',        label: 'Radios' },
  { value: 'autre',        label: 'Autres' },
]

function getDocType(value: string) {
  return DOC_TYPES.find(t => t.value === value) ?? DOC_TYPES[3]
}
function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}
function frDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function MobileDocumentsTab({ patientId }: { patientId: string }) {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<string>('tous')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/patients/${patientId}/documents`)
      const d = await r.json()
      if (Array.isArray(d)) setDocs(d)
    } finally { setLoading(false) }
  }, [patientId])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const filtered = filter === 'tous' ? docs : docs.filter(d => d.type === filter)

  async function handleFile(file: File) {
    setError(null)
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setError(`Max ${MAX_SIZE_MB} MB`); return }
    const ok = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!ok.includes(file.type)) { setError('PDF / JPG / PNG uniquement'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', UPLOAD_PRESET)
      fd.append('folder', 'kinepro/documents')
      const c = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, { method: 'POST', body: fd })
      const cd = await c.json()
      if (!c.ok) throw new Error(cd.error?.message || 'Erreur Cloudinary')
      const db = await fetch(`/api/patients/${patientId}/documents`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: file.name.replace(/\.[^/.]+$/, ''),
          type: 'autre',
          url: cd.secure_url,
          size: cd.bytes,
        }),
      })
      if (!db.ok) throw new Error('Échec sauvegarde')
      await fetchDocs()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <div>
      {/* ── Upload zone ── */}
      <div style={{
        background: 'white', border: '2px dashed #CBD5E1', borderRadius: 16,
        padding: 24, textAlign: 'center', marginTop: 4, marginBottom: 8,
      }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>📎</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>
          Ajouter un document
        </div>
        <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 12 }}>
          PDF, JPG, PNG · max {MAX_SIZE_MB} MB
        </div>
        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          style={{
            background: '#2563EB', color: 'white', border: 'none',
            borderRadius: 10, padding: '8px 18px',
            fontSize: 12, fontWeight: 600,
            cursor: uploading ? 'wait' : 'pointer',
            opacity: uploading ? 0.7 : 1,
          }}
        >
          {uploading ? 'Envoi…' : '+ Uploader'}
        </button>
        <input
          ref={fileInput} type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {error && (
          <div style={{ marginTop: 10, fontSize: 11, color: '#DC2626', fontWeight: 600 }}>
            {error}
          </div>
        )}
      </div>

      {/* ── Filter chips (horizontal scroll) ── */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        margin: '0 -16px',
        padding: '4px 16px 12px',
      }}>
        {FILTERS.map(f => {
          const active = filter === f.value
          const count = f.value === 'tous' ? docs.length : docs.filter(d => d.type === f.value).length
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                flexShrink: 0,
                padding: '6px 14px', borderRadius: 20,
                fontSize: 12, fontWeight: 500,
                background:   active ? '#2563EB' : '#F1F5F9',
                color:        active ? 'white'    : '#64748B',
                border: 'none',
                whiteSpace: 'nowrap', cursor: 'pointer',
              }}
            >
              {f.label}{f.value === 'tous' && ` (${count})`}
            </button>
          )
        })}
      </div>

      {/* ── Doc cards 2-col grid ── */}
      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'white', border: '1px solid #E2E8F0', borderRadius: 14,
          padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 13, marginBottom: 16,
        }}>
          Aucun document
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 8,
          marginBottom: 16,
        }}>
          {filtered.map(doc => {
            const dt = getDocType(doc.type)
            return (
              <div key={doc.id} style={{
                background: 'white', borderRadius: 14, border: '1px solid #E2E8F0',
                overflow: 'hidden', minWidth: 0,
              }}>
                {/* Body */}
                <div style={{ padding: 12, textAlign: 'center' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: dt.bg, color: dt.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, margin: '0 auto 8px',
                  }}>
                    {dt.icon}
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: '#0F172A',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: 2,
                  }}>
                    {doc.nom}
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8' }}>
                    {frDate(doc.createdAt)}
                  </div>
                  {doc.size && (
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>{formatSize(doc.size)}</div>
                  )}
                </div>
                {/* Footer */}
                <div style={{ display: 'flex', borderTop: '1px solid #F1F5F9' }}>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      flex: 1, padding: '8px 4px', textAlign: 'center',
                      fontSize: 11, fontWeight: 600, color: '#2563EB',
                      textDecoration: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                    👁 Voir
                  </a>
                  <div style={{ width: 1, background: '#F1F5F9' }} />
                  <a href={doc.url} download
                    style={{
                      flex: 1, padding: '8px 4px', textAlign: 'center',
                      fontSize: 11, fontWeight: 600, color: '#64748B',
                      textDecoration: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    ⬇
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
