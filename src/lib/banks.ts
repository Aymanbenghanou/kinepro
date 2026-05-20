/**
 * Moroccan banks list with brand colors used for badges.
 * Used by the super-admin parametres page and the /abonnement page.
 */

export interface MoroccanBank {
  name: string
  color: string
  short: string
}

export const MOROCCAN_BANKS: MoroccanBank[] = [
  { name: 'Attijariwafa Bank',           color: '#E31837', short: 'AWB' },
  { name: 'Banque Populaire',            color: '#00843D', short: 'BP'  },
  { name: 'CIH Bank',                    color: '#F47920', short: 'CIH' },
  { name: 'BMCE Bank (Bank of Africa)',  color: '#003DA5', short: 'BOA' },
  { name: 'Société Générale Maroc',      color: '#E30513', short: 'SG'  },
  { name: 'Crédit Agricole du Maroc',    color: '#5C8727', short: 'CAM' },
  { name: 'Crédit du Maroc',             color: '#0057A8', short: 'CDM' },
  { name: 'CFG Bank',                    color: '#6B21A8', short: 'CFG' },
  { name: 'Al Barid Bank',               color: '#FDB913', short: 'ABB' },
  { name: 'Autre',                       color: '#64748B', short: '🏦' },
]

export function getBankMeta(name: string): MoroccanBank {
  const found = MOROCCAN_BANKS.find(b => name.toLowerCase().includes(b.name.toLowerCase().split(' ')[0]))
  return found ?? { name, color: '#64748B', short: name.slice(0, 3).toUpperCase() }
}

/** Format a 24-digit RIB into 4-4-4-4-4-2 groups */
export function formatRib(rib: string): string {
  const clean = rib.replace(/\s+/g, '')
  if (clean.length !== 24) return clean
  return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)} ${clean.slice(12, 16)} ${clean.slice(16, 20)} ${clean.slice(20, 24)}`
}

/** Mask a RIB: keep first 4 + last 2 chars visible */
export function maskRib(rib: string): string {
  const clean = rib.replace(/\s+/g, '')
  if (clean.length < 8) return clean
  const start = clean.slice(0, 4)
  const end   = clean.slice(-2)
  return `${start} XXXX XXXX XXXX XXXX ${end}`
}
