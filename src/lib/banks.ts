/**
 * Moroccan banks list with brand colors used for badges.
 * Used by the super-admin parametres page and the /abonnement page.
 */

export interface MoroccanBank {
  name: string
  color: string
  short: string
}

export interface BankLogoMeta {
  url: string
  color: string
  bgColor: string
}

export const BANK_LOGOS: Record<string, BankLogoMeta> = {
  'Attijariwafa Bank':           { url: 'https://www.attijariwafabank.com/sites/default/files/favicon.ico', color: '#E31837', bgColor: '#FEE2E2' },
  'Banque Populaire':            { url: 'https://www.gbp.ma/favicon.ico',                                   color: '#00843D', bgColor: '#DCFCE7' },
  'CIH Bank':                    { url: 'https://www.cihbank.ma/favicon.ico',                               color: '#F47920', bgColor: '#FEF3C7' },
  'BMCE Bank (Bank of Africa)':  { url: 'https://www.bankofafrica.ma/favicon.ico',                          color: '#003DA5', bgColor: '#DBEAFE' },
  'Société Générale Maroc':      { url: 'https://www.societegenerale.ma/favicon.ico',                       color: '#E30513', bgColor: '#FEE2E2' },
  'Crédit Agricole du Maroc':    { url: 'https://www.creditagricole.ma/favicon.ico',                        color: '#5C8727', bgColor: '#DCFCE7' },
  'Crédit du Maroc':             { url: 'https://www.creditdumaroc.ma/favicon.ico',                         color: '#0057A8', bgColor: '#DBEAFE' },
  'CFG Bank':                    { url: 'https://www.cfgbank.com/favicon.ico',                              color: '#6B21A8', bgColor: '#F3E8FF' },
  'Al Barid Bank':               { url: 'https://www.albaridbank.ma/favicon.ico',                           color: '#FDB913', bgColor: '#FEF9C3' },
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
