'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

interface QrScannerModalProps {
  onClose: () => void
}

export default function QrScannerModal({ onClose }: QrScannerModalProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error' | 'found'>('starting')
  const [errorMsg, setErrorMsg] = useState('')
  const readerRef = useRef<any>(null)

  useEffect(() => {
    let stopped = false

    async function startScanner() {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/library')
        const reader = new BrowserQRCodeReader()
        readerRef.current = reader

        const devices = await reader.listVideoInputDevices()
        if (devices.length === 0) {
          setErrorMsg('Aucune caméra détectée')
          setStatus('error')
          return
        }

        // Prefer back camera
        const backCam = devices.find((d: MediaDeviceInfo) =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('arrière')
        ) || devices[devices.length - 1]

        setStatus('scanning')

        await reader.decodeFromVideoDevice(backCam.deviceId, videoRef.current!, (result, err) => {
          if (stopped) return
          if (result) {
            const text = result.getText()
            setStatus('found')
            stopped = true

            // Extract patient token from URL
            // Expected: https://kinepro-omega.vercel.app/patient-public/[token]
            const match = text.match(/\/patient-public\/([a-f0-9]{32})/)
            if (match) {
              // Find patient by token and redirect to their detail page
              fetch(`/api/patients/by-token/${match[1]}`)
                .then(r => r.json())
                .then(d => {
                  if (d.patientId) {
                    router.push(`/patients/${d.patientId}`)
                    onClose()
                  } else {
                    // Fall back: open the public page
                    window.open(text, '_blank')
                    onClose()
                  }
                })
                .catch(() => {
                  window.open(text, '_blank')
                  onClose()
                })
            } else if (text.startsWith('http')) {
              window.open(text, '_blank')
              onClose()
            }
          }
        })
      } catch (err: any) {
        if (!stopped) {
          setErrorMsg(err?.message || "Impossible d'accéder à la caméra")
          setStatus('error')
        }
      }
    }

    startScanner()

    return () => {
      stopped = true
      readerRef.current?.reset?.()
    }
  }, [router, onClose])

  return (
    <div className="modal-overlay" style={{ zIndex: 9000, background: 'rgba(0,0,0,0.85)' }}>
      <div style={{
        background: '#0F172A', borderRadius: 20, overflow: 'hidden',
        width: '100%', maxWidth: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'white' }}>Scanner QR Patient</p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Pointez la caméra vers le QR code</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'white', padding: 8, borderRadius: 8 }}>
            <X size={18} />
          </button>
        </div>

        {/* Camera view */}
        <div style={{ position: 'relative', background: '#000', aspectRatio: '1/1' }}>
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: status === 'scanning' ? 'block' : 'none' }}
            playsInline
            muted
          />

          {/* Scanning overlay */}
          {status === 'scanning' && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Corner marks */}
              <div style={{ position: 'relative', width: 200, height: 200 }}>
                {[
                  { top: 0, left: 0, borderTop: '3px solid #2563EB', borderLeft: '3px solid #2563EB' },
                  { top: 0, right: 0, borderTop: '3px solid #2563EB', borderRight: '3px solid #2563EB' },
                  { bottom: 0, left: 0, borderBottom: '3px solid #2563EB', borderLeft: '3px solid #2563EB' },
                  { bottom: 0, right: 0, borderBottom: '3px solid #2563EB', borderRight: '3px solid #2563EB' },
                ].map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: 28, height: 28, borderRadius: 3, ...s } as React.CSSProperties} />
                ))}
              </div>
            </div>
          )}

          {status === 'starting' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>Démarrage de la caméra...</p>
            </div>
          )}

          {status === 'found' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(22,163,74,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 56 }}>✅</span>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: 0 }}>QR détecté !</p>
            </div>
          )}

          {status === 'error' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 20 }}>
              <span style={{ fontSize: 40 }}>📵</span>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: 0, textAlign: 'center' }}>Caméra inaccessible</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0, textAlign: 'center' }}>{errorMsg}</p>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 20px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
            Scannez le QR code d'un patient pour ouvrir son dossier
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
