'use client'

import { useEffect, useState } from 'react'

/**
 * Récupère le nom du cabinet courant (tenant) une fois au mount, pour
 * personnaliser les templates WhatsApp (cf. msgConfirmationRDV, etc.).
 * Retourne `null` pendant le chargement. Erreur-permissif : si le fetch
 * échoue, on garde `null` et les templates appliquent leur fallback
 * "votre cabinet".
 */
export function useCabinetNom(): string | null {
  const [nom, setNom] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    fetch('/api/cabinet')
      .then(r => r.json())
      .then(d => { if (alive && typeof d?.nom === 'string') setNom(d.nom) })
      .catch(() => { /* fallback côté template */ })
    return () => { alive = false }
  }, [])
  return nom
}
