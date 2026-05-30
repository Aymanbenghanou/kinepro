import 'server-only'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

/**
 * Chiffrement at-rest pour secrets sensibles (TOTP, etc.).
 *
 * Algorithme : AES-256-GCM.
 * Format de sortie : "v1:<iv_b64>:<ciphertext_b64>:<tag_b64>".
 * Le préfixe "v1:" permet de détecter le format et de planifier une rotation
 * future sans casser les valeurs déjà en base.
 *
 * Configuration : définir TOTP_ENCRYPTION_KEY dans Vercel
 * (Production + Preview + Development) AVANT qu'un utilisateur n'active 2FA.
 * Génération : `openssl rand -hex 32`  (32 octets = 64 caractères hex).
 * Ne PAS changer cette clé sans un plan de rotation (re-chiffrement de tous
 * les secrets en base).
 */

const VERSION = 'v1'
const ALGO = 'aes-256-gcm'
const IV_BYTES = 12 // recommandé pour GCM
const KEY_BYTES = 32

function loadKey(): Buffer {
  const hex = process.env.TOTP_ENCRYPTION_KEY
  if (!hex) {
    throw new Error(
      'TOTP_ENCRYPTION_KEY env variable is missing. ' +
      'Set it in Vercel (Production + Preview + Development) ' +
      'with the output of `openssl rand -hex 32`.',
    )
  }
  const buf = Buffer.from(hex.trim(), 'hex')
  if (buf.length !== KEY_BYTES) {
    throw new Error(
      `TOTP_ENCRYPTION_KEY must decode to exactly ${KEY_BYTES} bytes ` +
      `(got ${buf.length}). Generate one with \`openssl rand -hex 32\`.`,
    )
  }
  return buf
}

/** Chiffre un secret en clair → string "v1:iv:ct:tag" (base64 url-safe). */
export function encryptSecret(plain: string): string {
  const key = loadKey()
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGO, key, iv)
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${VERSION}:${iv.toString('base64')}:${ct.toString('base64')}:${tag.toString('base64')}`
}

let legacyWarningEmitted = false

/**
 * Déchiffre un secret précédemment chiffré avec encryptSecret().
 * Compat ancien format : une string qui ne commence PAS par "v1:" est considérée
 * comme un secret legacy en clair et renvoyée telle quelle (avec un warning
 * émis une seule fois pour le savoir si ça arrive en prod).
 */
export function decryptSecret(payload: string): string {
  if (!payload.startsWith(`${VERSION}:`)) {
    if (!legacyWarningEmitted) {
      console.warn(
        '[crypto] decryptSecret received a legacy plaintext secret. ' +
        'Existing TOTP secrets predate encryption — consider re-enrolling 2FA.',
      )
      legacyWarningEmitted = true
    }
    return payload
  }

  const parts = payload.split(':')
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted secret format')
  }
  const [, ivB64, ctB64, tagB64] = parts
  const key = loadKey()
  const iv = Buffer.from(ivB64, 'base64')
  const ct = Buffer.from(ctB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  const plain = Buffer.concat([decipher.update(ct), decipher.final()])
  return plain.toString('utf8')
}
