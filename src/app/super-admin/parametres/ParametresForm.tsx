'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { buildContactCtaUrl, formatPhoneFR } from '@/lib/contact-cta'

interface Props {
  initial: { supportWhatsapp: string }
}

const HELP = 'Format accepté : 0649911970 (MA local) ou +212649911970 (E.164).'

export default function ParametresForm({ initial }: Props) {
  const router = useRouter()
  const [value, setValue]   = useState(initial.supportWhatsapp)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState<{ text: string; ok: boolean } | null>(null)

  const dirty = value.trim() !== initial.supportWhatsapp
  const previewUrl = useMemo(() => buildContactCtaUrl(value.trim()), [value])
  const friendly   = useMemo(() => formatPhoneFR(value.trim()), [value])

  async function save() {
    setSaving(true); setMsg(null)
    try {
      const res = await fetch('/api/super-admin/app-config', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ supportWhatsapp: value.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || 'Erreur')
      setMsg({ text: 'Enregistré ✓', ok: true })
      setValue(data.supportWhatsapp) // valeur normalisée renvoyée par le serveur
      // Rafraîchit les server components pour réutiliser la nouvelle config en cache.
      router.refresh()
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : 'Erreur', ok: false })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      background: 'white', borderRadius: 16, border: '1px solid #E2E8F0',
      padding: 28, maxWidth: 580,
    }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
        Numéro WhatsApp support
      </label>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={saving}
        placeholder="+212649911970 ou 0649911970"
        style={{
          width: '100%', padding: '11px 14px',
          border: '1px solid #E2E8F0', borderRadius: 10,
          fontSize: 14, color: '#0F172A',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      />
      <p style={{ fontSize: 12, color: '#94A3B8', margin: '6px 0 0' }}>{HELP}</p>

      {value.trim() && (
        <div style={{
          marginTop: 16, background: '#F8FAFC', border: '1px solid #E2E8F0',
          borderRadius: 10, padding: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            Aperçu
          </div>
          {friendly && (
            <div style={{ fontSize: 14, color: '#0F172A', marginBottom: 6 }}>
              Format affiché : <strong>{friendly}</strong>
            </div>
          )}
          <a href={previewUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: '#2563EB', textDecoration: 'underline', wordBreak: 'break-all' }}>
            {previewUrl.replace(/^https:\/\//, '')} ↗
          </a>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 22 }}>
        <button
          onClick={save}
          disabled={!dirty || saving || !value.trim()}
          style={{
            padding: '11px 22px', border: 'none', borderRadius: 10,
            background: '#2563EB', color: 'white', fontWeight: 700, fontSize: 14,
            cursor: (!dirty || saving) ? 'not-allowed' : 'pointer',
            opacity:  (!dirty || saving) ? 0.5 : 1,
          }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {msg && (
          <span style={{ fontSize: 13, fontWeight: 600, color: msg.ok ? '#16A34A' : '#DC2626' }}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  )
}
