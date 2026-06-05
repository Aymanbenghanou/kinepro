'use client'

import { useEffect, useState } from 'react'

export type CabinetSummary = {
  nom: string | null
  telephone: string | null
}

/**
 * Récupère un résumé du cabinet courant (tenant) une fois au mount, pour
 * personnaliser les templates WhatsApp (nom + téléphone de contact).
 * Une seule requête `/api/cabinet`, partagée entre nom et téléphone : on
 * évite ainsi une fenêtre où l'un est chargé mais pas l'autre.
 * Champs `null` pendant le chargement ou si le fetch échoue ; les templates
 * appliquent alors leur fallback (cf. cabinetLabel + lignes conditionnelles).
 */
export function useCabinet(): CabinetSummary {
  const [c, setC] = useState<CabinetSummary>({ nom: null, telephone: null })
  useEffect(() => {
    let alive = true
    fetch('/api/cabinet')
      .then(r => r.json())
      .then(d => {
        if (!alive) return
        setC({
          nom: typeof d?.nom === 'string' ? d.nom : null,
          telephone: typeof d?.telephone === 'string' ? d.telephone : null,
        })
      })
      .catch(() => { /* fallback côté template */ })
    return () => { alive = false }
  }, [])
  return c
}

/** Compat : ancien hook qui n'expose que le nom. Préférer `useCabinet()`. */
export function useCabinetNom(): string | null {
  return useCabinet().nom
}
