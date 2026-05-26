'use client'

import { useEffect, useState } from 'react'

/**
 * Accès Pro côté UI (UX uniquement — la vraie sécurité est dans les guards API).
 * Renvoie `null` pendant le chargement, puis `true`/`false`. En cas d'erreur on
 * laisse passer (true) : c'est l'API qui verrouille réellement.
 */
export function useProAccess(): boolean | null {
  const [pro, setPro] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    fetch('/api/plan/me')
      .then(r => r.json())
      .then(d => { if (alive) setPro(!!d.pro) })
      .catch(() => { if (alive) setPro(true) })
    return () => { alive = false }
  }, [])
  return pro
}
