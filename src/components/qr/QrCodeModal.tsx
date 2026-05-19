'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Download, Printer, Share2 } from 'lucide-react'

interface QrCodeModalProps {
  url: string
  title: string
  subtitle?: string
  onClose: () => void
}

const QR_SIZE = 260   // px rendered on canvas

export default function QrCodeModal({ url, title, subtitle, onClose }: QrCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function draw() {
      const mod = await import('qrcode')
      const QRCode = (mod as any).default ?? mod
      const canvas = canvasRef.current
      if (!canvas || cancelled) return

      // 1. Draw QR
      await QRCode.toCanvas(canvas, url, {
        width: QR_SIZE,
        margin: 2,
        color: { dark: '#1E3A5F', light: '#FFFFFF' },
      })

      // 2. Overlay KinéPro logo in center
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const cx = canvas.width / 2
        const cy = canvas.height / 2
        const r  = Math.round(canvas.width * 0.11)   // ~11% radius

        // White halo (clear QR modules underneath)
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(cx, cy, r + 5, 0, 2 * Math.PI)
        ctx.fill()

        // Blue circle
        ctx.fillStyle = '#2563EB'
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, 2 * Math.PI)
        ctx.fill()

        // 'K' letter
        ctx.fillStyle = '#FFFFFF'
        ctx.font = `900 ${Math.round(r * 1.25)}px Georgia, serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('K', cx, cy + 1)
      }

      if (!cancelled) setReady(true)
    }

    draw().catch(console.error)
    return () => { cancelled = true }
  }, [url])

  function getDataUrl(): string | null {
    return canvasRef.current?.toDataURL('image/png') ?? null
  }

  function handleDownload() {
    const dataUrl = getDataUrl()
    if (!dataUrl) return
    const link = document.createElement('a')
    link.download = `qr-${title.toLowerCase().replace(/\s+/g, '-')}.png`
    link.href = dataUrl
    link.click()
  }

  function handlePrint() {
    const dataUrl = getDataUrl()
    if (!dataUrl) return

    const cabinetLine = subtitle ?? ''
    const win = window.open('', '_blank', 'width=480,height=720')
    if (!win) return

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>QR Code — ${title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }

          @page {
            size: A6 portrait;
            margin: 0;
          }

          body {
            font-family: -apple-system, system-ui, sans-serif;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }

          .card {
            width: 105mm;
            min-height: 148mm;
            padding: 12mm 10mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            border: 1.5px solid #CBD5E1;
            border-radius: 8px;
          }

          .logo-wrap {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8mm;
          }

          .logo-circle {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: linear-gradient(135deg, #1E3A5F, #2563EB);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .logo-circle span {
            color: white;
            font-size: 18px;
            font-weight: 900;
            font-family: Georgia, serif;
          }

          .brand {
            font-size: 14px;
            font-weight: 700;
            color: #1E3A5F;
            letter-spacing: 0.04em;
          }

          img.qr {
            width: 65mm;
            height: 65mm;
            display: block;
            margin-bottom: 7mm;
          }

          h2 {
            font-size: 16px;
            font-weight: 800;
            color: #0F172A;
            margin-bottom: 3px;
          }

          .cabinet {
            font-size: 11px;
            color: #64748B;
            margin-bottom: 6mm;
          }

          .divider {
            width: 40px;
            height: 2px;
            background: #2563EB;
            border-radius: 2px;
            margin: 0 auto 6mm;
          }

          .hint {
            font-size: 11px;
            color: #64748B;
            line-height: 1.55;
          }

          @media print {
            body { min-height: unset; }
            .card { border-color: #CBD5E1; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo-wrap">
            <div class="logo-circle"><span>K</span></div>
            <span class="brand">KinéPro</span>
          </div>

          <img class="qr" src="${dataUrl}" alt="QR Code" />

          <h2>${title}</h2>
          ${cabinetLine ? `<p class="cabinet">${cabinetLine}</p>` : ''}

          <div class="divider"></div>

          <p class="hint">Scannez pour accéder<br>à votre dossier patient</p>
        </div>
        <script>
          window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 400); }
        </script>
      </body>
      </html>
    `)
    win.document.close()
  }

  async function handleShare() {
    if (navigator.share) {
      try { await navigator.share({ title, text: subtitle ?? 'Dossier patient KinéPro', url }) } catch {}
    } else {
      try { await navigator.clipboard.writeText(url) } catch {}
      alert('Lien copié dans le presse-papiers !')
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 200 }} onClick={onClose}>
      <div
        className="modal-sheet"
        style={{ padding: 0, width: 360, overflow: 'hidden' }}
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

        {/* QR canvas */}
        <div style={{ padding: '28px 20px 20px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', padding: 14,
            background: 'white', borderRadius: 16,
            border: '2px solid #E2E8F0',
            boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
            position: 'relative',
          }}>
            <canvas
              ref={canvasRef}
              style={{
                display: 'block',
                borderRadius: 8,
                width: 220,
                height: 220,
                opacity: ready ? 1 : 0,
                transition: 'opacity 0.2s',
              }}
            />
            {!ready && (
              <div style={{
                position: 'absolute', inset: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94A3B8', fontSize: 13,
              }}>
                Génération…
              </div>
            )}
          </div>

          <p style={{ margin: '14px 0 4px', fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{title}</p>
          <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', wordBreak: 'break-all', padding: '0 8px' }}>{url}</p>
        </div>

        {/* Actions */}
        <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <ActionBtn icon={<Download size={16} />} label="Télécharger" onClick={handleDownload} disabled={!ready} />
          <ActionBtn icon={<Printer size={16} />} label="Imprimer"    onClick={handlePrint}    disabled={!ready} />
          <ActionBtn icon={<Share2  size={16} />} label="Partager"    onClick={handleShare}    disabled={!ready} />
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ icon, label, onClick, disabled }: {
  icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '12px 8px',
        border: '1px solid #E2E8F0', borderRadius: 10,
        background: 'white', cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? '#CBD5E1' : '#374151',
        fontSize: 11, fontWeight: 600,
        transition: 'background 0.12s',
        minHeight: 'unset',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white' }}
    >
      {icon}
      {label}
    </button>
  )
}
