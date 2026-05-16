'use client'

import { useEffect } from 'react'

export interface ToastData {
  message: string
  type: 'success' | 'error'
}

interface Props extends ToastData {
  onClose: () => void
}

export default function Toast({ message, type, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500)
    return () => clearTimeout(t)
  }, [onClose])

  const isSuccess = type === 'success'
  const bg   = isSuccess ? '#16A34A' : '#DC2626'
  const icon = isSuccess ? '✓' : '✗'

  return (
    <div
      role="alert"
      style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
        background: bg, color: 'white',
        borderRadius: 12, padding: '14px 20px',
        fontSize: 14, fontWeight: 500,
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        display: 'flex', alignItems: 'center', gap: 12,
        maxWidth: 420, minWidth: 260,
        animation: 'toast-in 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
      <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{message}</span>
      <button
        onClick={onClose}
        aria-label="Fermer"
        style={{
          background: 'rgba(255,255,255,0.25)', border: 'none',
          color: 'white', cursor: 'pointer', borderRadius: 6,
          width: 24, height: 24, fontSize: 16, lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >×</button>
    </div>
  )
}
