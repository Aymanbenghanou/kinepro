'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Download, Printer, Share2 } from 'lucide-react'

interface QrCodeModalProps {
  url: string
  title: string
  subtitle?: string
  onClose: () => void
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kinepro-omega.vercel.app'

export default function QrCodeModal({ url, title, subtitle, onClose }: QrCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [QRCode, setQRCode] = useState<any>(null)

  // Dynamically import qrcode to avoid SSR issues
  useEffect(() => {
    import('qrcode').then(mod => setQRCode(mod.default || mod))
  }, [])

  useEffect(() => {
    if (!QRCode || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, url, {
      width: 220,
      margin: 2,
      color: { dark: '#1E3A5F', light: '#FFFFFF' },
    }).catch(console.error)
  }, [QRCode, url])

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `qr-${title.toLowerCase().replace(/\s+/g, '-')}.png`
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
        <title>QR Code — ${title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', -apple-system, sans-serif; background: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { width: 320px; border: 2px solid #E2E8F0; border-radius: 20px; padding: 32px 24px; text-align: center; box-shadow: 0 8px 40px rgba(0,0,0,0.08); }
          .logo { width: 52px; height: 52px; border-radius: 14px; background: linear-gradient(135deg,#1E3A5F,#2563EB); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
          .k { color: white; font-size: 24px; font-weight: 800; font-family: Georgia, serif; }
          .brand { font-size: 12px; color: #64748B; letter-spacing: 0.08em; margin-bottom: 24px; }
          img.qr { width: 220px; height: 220px; display: block; margin: 0 auto 20px; }
          h2 { font-size: 18px; font-weight: 700; color: #0F172A; margin-bottom: 4px; }
          p.sub { font-size: 13px; color: #64748B; margin-bottom: 16px; }
          p.hint { font-size: 12px; color: #94A3B8; line-height: 1.5; }
          @media print { body { margin: 0; } .card { box-shadow: none; border-color: #CBD5E1; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo"><span class="k">K</span></div>
          <p class="brand">KinéPro</p>
          <img class="qr" src="${dataUrl}" alt="QR Code" />
          <h2>${title}</h2>
          ${subtitle ? `<p class="sub">${subtitle}</p>` : ''}
          <p class="hint">Scannez pour voir<br>votre dossier patient</p>
        </div>
        <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
      </body>
      </html>
    `)
    win.document.close()
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: subtitle ?? '', url })
      } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      alert('Lien copié dans le presse-papiers !')
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 200 }} onClick={onClose}>
      <div
        className="modal-sheet"
        style={{ padding: 0, width: 340, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #E2E8F0',
          background: '#F8FAFC',
        }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#0F172A' }}>QR Code Patient</p>
            {subtitle && <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* QR Canvas */}
        <div style={{ padding: '28px 20px 20px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', padding: 16,
            background: 'white', borderRadius: 16,
            border: '2px solid #E2E8F0',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 8 }} />
          </div>

          <p style={{ margin: '14px 0 4px', fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{title}</p>
          <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', wordBreak: 'break-all' }}>{url}</p>
        </div>

        {/* Actions */}
        <div style={{
          padding: '0 20px 20px',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
        }}>
          <ActionBtn icon={<Download size={16} />} label="Télécharger" onClick={handleDownload} />
          <ActionBtn icon={<Printer size={16} />} label="Imprimer" onClick={handlePrint} />
          <ActionBtn icon={<Share2 size={16} />} label="Partager" onClick={handleShare} />
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: '12px 8px',
      border: '1px solid #E2E8F0', borderRadius: 10,
      background: 'white', cursor: 'pointer', color: '#374151',
      fontSize: 11, fontWeight: 600,
      transition: 'background 0.12s',
      minHeight: 'unset',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white' }}>
      {icon}
      {label}
    </button>
  )
}
