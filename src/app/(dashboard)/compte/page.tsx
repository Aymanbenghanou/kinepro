'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { User, Shield, Lock, Eye, EyeOff } from 'lucide-react'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #E2E8F0', borderRadius: 10,
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
  color: '#0F172A', background: 'white',
}

export default function ComptePage() {
  const { data: session, update: updateSession } = useSession()
  const user = session?.user

  // Password change
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null)

  // Profile
  const [profile, setProfile] = useState({ nom: user?.nom ?? '', prenom: user?.prenom ?? '', email: user?.email ?? '' })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null)

  // 2FA
  const [totpSetup, setTotpSetup] = useState<{ qrCode: string; secret: string } | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [totpLoading, setTotpLoading] = useState(false)
  const [totpMsg, setTotpMsg] = useState<{ text: string; ok: boolean } | null>(null)

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    if (!pwForm.current || !pwForm.next) return setPwMsg({ text: 'Remplissez tous les champs', ok: false })
    if (pwForm.next.length < 8) return setPwMsg({ text: 'Le mot de passe doit faire au moins 8 caractères', ok: false })
    if (pwForm.next !== pwForm.confirm) return setPwMsg({ text: 'Les mots de passe ne correspondent pas', ok: false })
    setPwLoading(true)
    try {
      const res = await fetch('/api/compte/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setPwMsg({ text: 'Mot de passe mis à jour avec succès !', ok: true })
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      setPwMsg({ text: err instanceof Error ? err.message : 'Erreur serveur', ok: false })
    }
    setPwLoading(false)
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setProfileMsg(null)
    setProfileLoading(true)
    try {
      const res = await fetch('/api/compte/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      await updateSession()
      setProfileMsg({ text: 'Profil mis à jour !', ok: true })
    } catch (err) {
      setProfileMsg({ text: err instanceof Error ? err.message : 'Erreur serveur', ok: false })
    }
    setProfileLoading(false)
  }

  async function handle2FASetup() {
    setTotpLoading(true)
    setTotpMsg(null)
    try {
      const res = await fetch('/api/compte/2fa/setup', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setTotpSetup({ qrCode: data.qrCode, secret: data.secret })
    } catch (err) {
      setTotpMsg({ text: err instanceof Error ? err.message : 'Erreur serveur', ok: false })
    }
    setTotpLoading(false)
  }

  async function handle2FAVerify(e: React.FormEvent) {
    e.preventDefault()
    setTotpLoading(true)
    setTotpMsg(null)
    try {
      const res = await fetch('/api/compte/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: totpCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Code invalide')
      setTotpMsg({ text: '✅ Authentification 2FA activée avec succès !', ok: true })
      setTotpSetup(null)
      setTotpCode('')
      await updateSession()
    } catch (err) {
      setTotpMsg({ text: err instanceof Error ? err.message : 'Code invalide', ok: false })
    }
    setTotpLoading(false)
  }

  async function handle2FADisable() {
    if (!confirm('Désactiver la double authentification ?')) return
    setTotpLoading(true)
    try {
      const res = await fetch('/api/compte/2fa/disable', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTotpMsg({ text: '2FA désactivé.', ok: true })
      await updateSession()
    } catch (err) {
      setTotpMsg({ text: err instanceof Error ? err.message : 'Erreur', ok: false })
    }
    setTotpLoading(false)
  }

  const initials = user
    ? `${(user.prenom?.[0] || '').toUpperCase()}${(user.nom?.[0] || '').toUpperCase()}`
    : 'KP'

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '32px 24px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, background: '#2563EB', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>{initials}</span>
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 2px' }}>
              {user?.prenom} {user?.nom}
            </h1>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{user?.email}</p>
          </div>
        </div>

        {/* Profile section */}
        <div style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid #E2E8F0', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <User size={18} color="#2563EB" />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>Informations personnelles</h2>
          </div>
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Prénom</label>
                <input value={profile.prenom} onChange={e => setProfile(s => ({ ...s, prenom: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Nom</label>
                <input value={profile.nom} onChange={e => setProfile(s => ({ ...s, nom: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" value={profile.email} onChange={e => setProfile(s => ({ ...s, email: e.target.value }))} style={inputStyle} />
            </div>
            {profileMsg && (
              <div style={{
                padding: '9px 14px', borderRadius: 8, fontSize: 13,
                background: profileMsg.ok ? '#F0FDF4' : '#FEF2F2',
                color: profileMsg.ok ? '#166534' : '#B91C1C',
                border: `1px solid ${profileMsg.ok ? '#BBF7D0' : '#FECACA'}`,
              }}>
                {profileMsg.text}
              </div>
            )}
            <button type="submit" disabled={profileLoading}
              style={{ padding: '11px', background: profileLoading ? '#93C5FD' : '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: profileLoading ? 'not-allowed' : 'pointer' }}>
              {profileLoading ? 'Enregistrement...' : 'Enregistrer le profil'}
            </button>
          </form>
        </div>

        {/* Password section */}
        <div style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid #E2E8F0', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Lock size={18} color="#2563EB" />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>Changer le mot de passe</h2>
          </div>
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Mot de passe actuel</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pwForm.current}
                  onChange={e => setPwForm(s => ({ ...s, current: e.target.value }))}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Nouveau mot de passe</label>
              <input type="password" value={pwForm.next} onChange={e => setPwForm(s => ({ ...s, next: e.target.value }))} placeholder="Min. 8 caractères" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Confirmer le nouveau mot de passe</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm(s => ({ ...s, confirm: e.target.value }))} placeholder="Répétez le mot de passe" style={inputStyle} />
            </div>
            {pwMsg && (
              <div style={{
                padding: '9px 14px', borderRadius: 8, fontSize: 13,
                background: pwMsg.ok ? '#F0FDF4' : '#FEF2F2',
                color: pwMsg.ok ? '#166534' : '#B91C1C',
                border: `1px solid ${pwMsg.ok ? '#BBF7D0' : '#FECACA'}`,
              }}>
                {pwMsg.text}
              </div>
            )}
            <button type="submit" disabled={pwLoading}
              style={{ padding: '11px', background: pwLoading ? '#93C5FD' : '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: pwLoading ? 'not-allowed' : 'pointer' }}>
              {pwLoading ? 'Changement...' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>

        {/* 2FA section */}
        <div style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Shield size={18} color="#2563EB" />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>Double authentification (2FA)</h2>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px' }}>
            Protégez votre compte avec une application d'authentification (Google Authenticator, Authy, etc.)
          </p>

          {/* Current 2FA status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderRadius: 10, marginBottom: 20,
            background: user?.twoFactorEnabled ? '#F0FDF4' : '#FEF9C3',
            border: `1px solid ${user?.twoFactorEnabled ? '#BBF7D0' : '#FDE68A'}`,
          }}>
            <span style={{ fontSize: 20 }}>{user?.twoFactorEnabled ? '🔒' : '🔓'}</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: user?.twoFactorEnabled ? '#166534' : '#92400E', margin: 0 }}>
                {user?.twoFactorEnabled ? '2FA activé' : '2FA non activé'}
              </p>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                {user?.twoFactorEnabled
                  ? 'Votre compte est protégé par une double authentification.'
                  : 'Activez le 2FA pour renforcer la sécurité de votre compte.'}
              </p>
            </div>
          </div>

          {/* QR code setup flow */}
          {totpSetup && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>
                1. Scannez ce QR code avec votre application d'authentification.
              </p>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={totpSetup.qrCode} alt="QR Code 2FA" style={{ width: 180, height: 180, border: '4px solid white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
              </div>
              <p style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Ou entrez ce code manuellement :</p>
              <code style={{ fontSize: 13, fontFamily: 'monospace', background: '#F1F5F9', padding: '6px 12px', borderRadius: 6, display: 'block', textAlign: 'center', marginBottom: 16, letterSpacing: 2 }}>
                {totpSetup.secret}
              </code>
              <p style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
                2. Entrez le code à 6 chiffres généré par l'application :
              </p>
              <form onSubmit={handle2FAVerify} style={{ display: 'flex', gap: 10 }}>
                <input
                  value={totpCode}
                  onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  style={{ ...inputStyle, flex: 1, textAlign: 'center', fontSize: 20, letterSpacing: 8 }}
                />
                <button type="submit" disabled={totpCode.length < 6 || totpLoading}
                  style={{ padding: '10px 20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Vérifier
                </button>
              </form>
            </div>
          )}

          {totpMsg && (
            <div style={{
              padding: '9px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
              background: totpMsg.ok ? '#F0FDF4' : '#FEF2F2',
              color: totpMsg.ok ? '#166534' : '#B91C1C',
              border: `1px solid ${totpMsg.ok ? '#BBF7D0' : '#FECACA'}`,
            }}>
              {totpMsg.text}
            </div>
          )}

          {!totpSetup && (
            user?.twoFactorEnabled ? (
              <button onClick={handle2FADisable} disabled={totpLoading}
                style={{ padding: '10px 20px', background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Désactiver la 2FA
              </button>
            ) : (
              <button onClick={handle2FASetup} disabled={totpLoading}
                style={{ padding: '10px 20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {totpLoading ? 'Génération...' : 'Configurer la 2FA'}
              </button>
            )
          )}
        </div>

      </div>
    </div>
  )
}
