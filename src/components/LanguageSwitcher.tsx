'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

interface Props {
  variant?: 'light' | 'dark'   // dark = sidebar/dark bg, light = topbar
  size?: 'sm' | 'md'
}

export default function LanguageSwitcher({ variant = 'light', size = 'md' }: Props) {
  const { lang } = useTranslation()
  const [busy, setBusy] = useState(false)

  async function switchTo(newLang: 'fr' | 'ar') {
    if (busy || newLang === lang) return
    setBusy(true)
    try {
      const r = await fetch('/api/compte/language', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: newLang }),
      })
      if (r.ok) window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  const isDark = variant === 'dark'
  const pad    = size === 'sm' ? '4px 10px' : '5px 12px'
  const fontSize = size === 'sm' ? 11.5 : 12.5

  return (
    <div style={{
      display: 'inline-flex',
      background: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9',
      borderRadius: 999, padding: 3, gap: 2,
    }}>
      {(['fr', 'ar'] as const).map(l => {
        const active = lang === l
        return (
          <button
            key={l}
            onClick={() => switchTo(l)}
            disabled={busy}
            aria-label={l === 'fr' ? 'Français' : 'العربية'}
            style={{
              padding: pad, borderRadius: 999, border: 'none',
              fontWeight: 800, fontSize, cursor: busy ? 'wait' : 'pointer',
              background: active ? 'white' : 'transparent',
              color:      active ? '#2563EB' : (isDark ? 'rgba(255,255,255,0.7)' : '#64748B'),
              transition: 'all 0.18s',
            }}
          >
            {l === 'fr' ? 'FR' : 'ع'}
          </button>
        )
      })}
    </div>
  )
}
