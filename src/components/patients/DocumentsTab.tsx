'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Upload, Trash2, Eye, Download, FileText, X } from 'lucide-react'
import Link from 'next/link'
import { useProAccess } from '@/lib/use-plan'

// ─── Constants ────────────────────────────────────────────────────────────────

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'djouneyaq'
const UPLOAD_PRESET = 'kinepro_docs'
const MAX_SIZE_MB = 10

const DOC_TYPES = [
  { value: 'ordonnance',   label: 'Ordonnance',     icon: '📋', color: '#2563EB', bg: '#EFF6FF' },
  { value: 'radio',        label: 'Radio / IRM',    icon: '🩻', color: '#7C3AED', bg: '#F5F3FF' },
  { value: 'compte_rendu', label: 'Compte-rendu',   icon: '📄', color: '#0D9488', bg: '#F0FDFA' },
  { value: 'autre',        label: 'Autre',           icon: '📁', color: '#64748B', bg: '#F8FAFC' },
]

function getDocType(value: string) {
  return DOC_TYPES.find(t => t.value === value) ?? DOC_TYPES[3]
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

function frDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── Document card ────────────────────────────────────────────────────────────

function DocCard({ doc, onDelete }: { doc: any; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const dt = getDocType(doc.type)

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return }
    setDeleting(true)
    await fetch(`/api/patients/${doc.patientId}/documents/${doc.id}`, { method: 'DELETE' })
    setDeleting(false)
    onDelete()
  }

  return (
    <div style={{
      background: 'white', border: '1px solid #E2E8F0', borderRadius: 12,
      padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: dt.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>
        {dt.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {doc.nom}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ background: dt.bg, color: dt.color, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
            {dt.label}
          </span>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>{formatSize(doc.size)}</span>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>{frDate(doc.createdAt)}</span>
          {doc.uploadedBy && <span style={{ fontSize: 11, color: '#94A3B8' }}>par {doc.uploadedBy}</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <a
          href={doc.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 12, color: '#374151', textDecoration: 'none' }}
        >
          <Eye size={13} /> Voir
        </a>
        <a
          href={doc.url} download={doc.nom}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: '1px solid #DBEAFE', borderRadius: 6, background: '#EFF6FF', cursor: 'pointer', fontSize: 12, color: '#2563EB', textDecoration: 'none' }}
        >
          <Download size={13} /> DL
        </a>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', border: `1px solid ${confirmDel ? '#FCA5A5' : '#E2E8F0'}`,
            borderRadius: 6, background: confirmDel ? '#FEF2F2' : 'white',
            cursor: 'pointer', fontSize: 12, color: confirmDel ? '#DC2626' : '#64748B',
          }}
          title={confirmDel ? 'Cliquez pour confirmer' : 'Supprimer'}
        >
          {deleting ? '...' : <><Trash2 size={13} /> {confirmDel ? 'Confirmer' : ''}</>}
        </button>
      </div>
    </div>
  )
}

// ─── Upload zone ──────────────────────────────────────────────────────────────

function UploadZone({ patientId, onUploaded }: { patientId: string; onUploaded: () => void }) {
  const [dragging, setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]  = useState(0)
  const [error, setError]        = useState('')
  const [docType, setDocType]    = useState('ordonnance')
  const [docName, setDocName]    = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showForm, setShowForm]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const pro = useProAccess()   // verrou Pro (UX) — l'API verrouille réellement

  function pickFile(file: File) {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Fichier trop volumineux. Max ${MAX_SIZE_MB} Mo.`)
      return
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Format non supporté. Utilisez PDF, JPG, PNG ou WEBP.')
      return
    }
    setError('')
    setSelectedFile(file)
    setDocName(file.name.replace(/\.[^/.]+$/, ''))
    setShowForm(true)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) pickFile(file)
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    setError('')
    setProgress(10)

    try {
      const fd = new FormData()
      fd.append('file', selectedFile)
      fd.append('upload_preset', UPLOAD_PRESET)
      fd.append('folder', 'kinepro/documents')

      setProgress(30)
      const cRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        { method: 'POST', body: fd }
      )
      setProgress(70)

      if (!cRes.ok) {
        const err = await cRes.json()
        throw new Error(err.error?.message ?? 'Erreur Cloudinary')
      }
      const cData = await cRes.json()

      setProgress(85)
      const dbRes = await fetch(`/api/patients/${patientId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom:  docName.trim() || selectedFile.name,
          type: docType,
          url:  cData.secure_url,
          size: cData.bytes,
        }),
      })
      if (!dbRes.ok) throw new Error('Erreur lors de la sauvegarde')

      setProgress(100)
      setTimeout(() => {
        setSelectedFile(null); setDocName(''); setShowForm(false)
        setUploading(false); setProgress(0)
        onUploaded()
      }, 400)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'upload')
      setUploading(false); setProgress(0)
    }
  }

  // Verrou Pro (UX) : upload de documents réservé au plan Pro.
  if (pro === false) {
    return (
      <div style={{ marginBottom: 24, border: '2px dashed #E2E8F0', borderRadius: 12, padding: 28, textAlign: 'center', background: '#F8FAFC' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Upload de documents — Disponible en Pro</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 14 }}>Passez au plan Pro pour téléverser des documents patients.</div>
        <Link href="/choisir-plan" style={{ display: 'inline-block', background: '#2563EB', color: 'white', padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
          Voir les plans
        </Link>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {!showForm ? (
        /* Drag & drop zone */
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#2563EB' : '#CBD5E1'}`,
            borderRadius: 12, padding: 36, textAlign: 'center',
            background: dragging ? '#EFF6FF' : '#F8FAFC',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <input
            ref={inputRef} type="file" hidden
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f) }}
          />
          <Upload size={32} color={dragging ? '#2563EB' : '#94A3B8'} style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
            Glissez un fichier ou <span style={{ color: '#2563EB' }}>cliquez pour parcourir</span>
          </div>
          <div style={{ fontSize: 13, color: '#94A3B8' }}>PDF, JPG, PNG, WEBP · Max {MAX_SIZE_MB} Mo</div>
          {error && <div style={{ marginTop: 10, fontSize: 13, color: '#DC2626', fontWeight: 500 }}>{error}</div>}
        </div>
      ) : (
        /* Upload form */
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} color="#2563EB" />
              {selectedFile?.name}
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 400 }}>({formatSize(selectedFile?.size ?? null)})</span>
            </div>
            <button onClick={() => { setShowForm(false); setSelectedFile(null); setError('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Nom du document</label>
              <input
                value={docName} onChange={e => setDocName(e.target.value)}
                placeholder="Ex: Ordonnance Dr. Martin"
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Type de document</label>
              <select
                value={docType} onChange={e => setDocType(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: 'white' }}
              >
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
              </select>
            </div>
          </div>

          {uploading && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ height: 6, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: '#2563EB', borderRadius: 999, transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Upload en cours... {progress}%</div>
            </div>
          )}
          {error && <div style={{ fontSize: 13, color: '#DC2626', marginBottom: 10, fontWeight: 500 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setShowForm(false); setSelectedFile(null) }}
              style={{ flex: '0 0 auto', padding: '9px 16px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', color: '#64748B', fontWeight: 500, fontSize: 13 }}>
              Annuler
            </button>
            <button onClick={handleUpload} disabled={uploading}
              style={{ flex: 1, padding: '9px 16px', border: 'none', borderRadius: 8, background: uploading ? '#93C5FD' : '#2563EB', color: 'white', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13 }}>
              {uploading ? 'Upload...' : '⬆ Envoyer le document'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DocumentsTab({ patientId }: { patientId: string }) {
  const [docs, setDocs]         = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [typeFilter, setTypeFilter] = useState('tous')

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/patients/${patientId}/documents`)
      const data = await res.json()
      setDocs(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }, [patientId])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const filters = [
    { value: 'tous',        label: 'Tous' },
    { value: 'ordonnance',  label: '📋 Ordonnances' },
    { value: 'radio',       label: '🩻 Radios' },
    { value: 'compte_rendu',label: '📄 Comptes-rendus' },
    { value: 'autre',       label: '📁 Autres' },
  ]

  const filtered = typeFilter === 'tous' ? docs : docs.filter(d => d.type === typeFilter)

  return (
    <div>
      {/* Upload zone */}
      <UploadZone patientId={patientId} onUploaded={fetchDocs} />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f.value} onClick={() => setTypeFilter(f.value)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: '1px solid',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
              background: typeFilter === f.value ? '#2563EB' : 'white',
              borderColor: typeFilter === f.value ? '#2563EB' : '#E2E8F0',
              color: typeFilter === f.value ? 'white' : '#374151',
            }}>
            {f.label} {f.value === 'tous' ? `(${docs.length})` : `(${docs.filter(d => d.type === f.value).length})`}
          </button>
        ))}
      </div>

      {/* Documents list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#94A3B8', fontSize: 14 }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, background: 'white', border: '1px solid #E2E8F0', borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Aucun document</div>
          <div style={{ fontSize: 13, color: '#94A3B8' }}>Utilisez la zone ci-dessus pour ajouter un fichier.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(doc => (
            <DocCard key={doc.id} doc={doc} onDelete={fetchDocs} />
          ))}
        </div>
      )}
    </div>
  )
}
