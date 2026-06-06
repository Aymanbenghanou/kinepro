'use client'

import { useEffect, useState } from 'react'
import { useCabinetContext, type CabinetClient } from './cabinet-context'

export type CabinetSummary = {
  nom: string | null
  telephone: string | null
}

/**
 * Source des données cabinet côté client.
 *
 * Si un `CabinetProvider` est monté plus haut dans l'arbre (cas des routes
 * `(dashboard)/*` depuis le commit perf P1), le hook lit le contexte → 0
 * requête réseau, 0 latence. Sinon (hors layout, tests, /m/*), il retombe
 * sur l'ancien comportement `fetch('/api/cabinet')` au mount.
 */
export function useCabinet(): CabinetSummary {
  const ctx = useCabinetContext()
  const [fallback, setFallback] = useState<CabinetSummary>({ nom: null, telephone: null })

  useEffect(() => {
    if (ctx) return // contexte présent → pas de fetch
    let alive = true
    fetch('/api/cabinet')
      .then(r => r.json())
      .then(d => {
        if (!alive) return
        setFallback({
          nom: typeof d?.nom === 'string' ? d.nom : null,
          telephone: typeof d?.telephone === 'string' ? d.telephone : null,
        })
      })
      .catch(() => { /* fallback côté template */ })
    return () => { alive = false }
  }, [ctx])

  if (ctx) return { nom: ctx.nom, telephone: ctx.telephone }
  return fallback
}

/** Compat : ancien hook qui n'expose que le nom. */
export function useCabinetNom(): string | null {
  return useCabinet().nom
}

/**
 * Variante "objet complet" pour les pages qui faisaient leur propre
 * `fetch('/api/cabinet')` et stockaient toute la réponse dans un useState.
 * Lit le contexte si disponible, sinon fetch côté client (fallback).
 */
export function useCabinetFull(): CabinetClient {
  const ctx = useCabinetContext()
  const [fallback, setFallback] = useState<CabinetClient>(null)

  useEffect(() => {
    if (ctx) return
    let alive = true
    fetch('/api/cabinet')
      .then(r => r.json())
      .then(d => { if (alive && d && typeof d === 'object' && d.id) setFallback(d) })
      .catch(() => {})
    return () => { alive = false }
  }, [ctx])

  return ctx ?? fallback
}
