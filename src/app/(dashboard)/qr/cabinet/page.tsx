'use client'

import { useState, useEffect, useRef } from 'react'
import Topbar from '@/components/layout/Topbar'
import { QrCode, Download, Printer, Share2, ExternalLink } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kinepro-omega.vercel.app'

export default function CabinetQrPage() {
  const [token, setToken] = useState<string | null>(null)
  const [cabinetNom, setCabinetNom] = useState('')
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [QRCode, setQRCode] = useState<any>(null)

  useEffect(() => {
    import('qrcode').then(mod => setQRCode(mod.default || mod))
  }, [])

  useEffect(() => {
    fetch('/api/cabinet/qr-token')
      .then(r => r.json())
      .then(d => {
        setToken(d.token)
        setCabinetNom(d.nom)
      })
      .finally(() => setLoading(false))
  }, [])

  const checkinUrl = token ? `${APP_URL}/checkin/${token}` : ''

  useEffect(() => {
    if (!QRCode || !canvasRef.current || !checkinUrl) return
    QRCode.toCanvas(canvasRef.current, checkinUrl, {
      width: 260,
      margin: 2,
      color: { dark: '#1E3A5F', light: '#FFFFFF' },
    }).catch(console.error)
  }, [QRCode, checkinUrl])

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `qr-cabinet-${cabinetNom.toLowerCase().replace(/\s+/g, '-')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function handlePrint() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const win = window.open('', '_blank', 'width=700,height=900')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Check-in — ${cabinetNom}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, sans-serif; background: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 40px; }
          .card { max-width: 340px; width: 100%; border: 2px solid #E2E8F0; border-radius: 20px; padding: 32px 24px; text-align: center; }
          .logo-wrap { width: 60px; height: 60px; border-radius: 16px; background: linear-gradient(135deg,#1E3A5F,#2563EB); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
          .logo-k { color: white; font-size: 28px; font-weight: 800; font-family: Georgia, serif; }
          h1 { font-size: 20px; font-weight: 800; color: #0F172A; margin: 0 0 4px; }
          p.sub { font-size: 13px; color: #64748B; margin-bottom: 24px; }
          img.qr { width: 240px; height: 240px; display: block; margin: 0 auto 20px; }
          h2 { font-size: 16px; font-weight: 700; color: #0F172A; margin: 0 0 6px; }
          p.hint { font-size: 13px; color: #64748B; line-height: 1.5; }
          .steps { background: #EFF6FF; border-radius: 12px; padding: 16px; margin-top: 20px; text-align: left; }
          .step { font-size: 13px; color: #1D4ED8; margin-bottom: 6px; }
          @media print { body { margin: 0; } .card { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo-wrap"><span class="logo-k">K</span></div>
          <h1>${cabinetNom}</h1>
          <p class="sub">Borne de check-in patient</p>
          <img class="qr" src="${dataUrl}" alt="QR Code" />
          <h2>Scannez pour vous enregistrer</h2>
          <p class="hint">Présentez votre numéro de téléphone pour confirmer votre présence</p>
          <div class="steps">
            <div class="step">1. Scannez ce QR code avec votre téléphone</div>
            <div class="step">2. Entrez votre numéro de téléphone</div>
            <div class="step">3. Confirmez votre présence</div>
          </div>
        </div>
        <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
      </body>
      </html>
    `)
    win.document.close()
  }

  async function handleShare() {
    if (!checkinUrl) return
    if (navigator.share) {
      try { await navigator.share({ title: `Check-in ${cabinetNom}`, url: checkinUrl }) } catch {}
    } else {
      await navigator.clipboard.writeText(checkinUrl)
      alert('Lien copié !')
    }
  }

  return (
    <div>
      <Topbar title="QR Code Cabinet" subtitle="Borne de check-in patient" />
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* QR Card */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 32, textAlign: 'center' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'linear-gradient(135deg,#1E3A5F,#2563EB)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <span style={{ color: 'white', fontSize: 24, fontWeight: 800, fontFamily: 'Georgia, serif' }}>K</span>
              </div>
              <p style={{ fontWeight: 700, fontSize: 16, color: '#0F172A', margin: 0 }}>{cabinetNom}</p>
              <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>QR Code de réception</p>
            </div>

            {loading ? (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                Génération du QR...
              </div>
            ) : (
              <div style={{ display: 'inline-block', padding: 16, background: 'white', borderRadius: 16, border: '2px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 8 }} />
              </div>
            )}

            <p style={{ fontSize: 12, color: '#94A3B8', margin: '16px 0 0', wordBreak: 'break-all' }}>{checkinUrl}</p>

            {/* Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 20 }}>
              {[
                { icon: <Download size={16} />, label: 'Télécharger', fn: handleDownload },
                { icon: <Printer size={16} />, label: 'Imprimer', fn: handlePrint },
                { icon: <Share2 size={16} />, label: 'Partager', fn: handleShare },
              ].map(({ icon, label, fn }) => (
                <button key={label} onClick={fn} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '12px 8px', border: '1px solid #E2E8F0', borderRadius: 10,
                  background: 'white', cursor: 'pointer', color: '#374151',
                  fontSize: 11, fontWeight: 600, minHeight: 'unset',
                }}>
                  {icon}{label}
                </button>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', margin: '0 0 16px' }}>
                📋 Comment ça marche
              </p>
              {[
                { num: '1', title: 'Patient scanne', desc: 'Le patient scanne le QR code affiché à la réception avec son téléphone' },
                { num: '2', title: 'Saisie du numéro', desc: 'Il entre son numéro de téléphone enregistré dans KinéPro' },
                { num: '3', title: 'Confirmation', desc: 'Le système trouve son prochain RDV et marque sa présence automatiquement' },
              ].map(step => (
                <div key={step.num} style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#2563EB', color: 'white',
                    fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>{step.num}</div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13, color: '#0F172A', margin: '0 0 2px' }}>{step.title}</p>
                    <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.4 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 16, padding: 20 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#1D4ED8', margin: '0 0 10px' }}>
                💡 Conseils d'utilisation
              </p>
              {[
                'Imprimez et plastifiez le QR code pour la réception',
                'Affichez-le sur un écran ou un support visible',
                'Fonctionne sur tous les smartphones (iOS & Android)',
                'Le lien reste permanent — ne change jamais',
              ].map(tip => (
                <p key={tip} style={{ fontSize: 13, color: '#2563EB', margin: '0 0 6px', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span>•</span> {tip}
                </p>
              ))}
            </div>

            {checkinUrl && (
              <a href={checkinUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px', border: '1px solid #E2E8F0', borderRadius: 10,
                  background: 'white', color: '#374151', textDecoration: 'none',
                  fontWeight: 500, fontSize: 14,
                }}>
                <ExternalLink size={16} /> Tester la page check-in
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
