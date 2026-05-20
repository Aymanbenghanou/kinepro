'use client'

import { useState } from 'react'
import { BANK_LOGOS } from '@/lib/banks'

/**
 * Reusable bank logo with favicon URL + graceful fallback to a colored
 * initial circle. Used in super-admin table, /abonnement cards, and the
 * bank picker dropdown.
 */
export function BankLogo({ bankName, size = 40 }: { bankName: string; size?: number }) {
  const bank = BANK_LOGOS[bankName]
  const [imgError, setImgError] = useState(false)

  if (!bank || imgError) {
    return (
      <div
        style={{
          width: size, height: size,
          borderRadius: '50%',
          background: bank?.bgColor || '#EFF6FF',
          color:      bank?.color   || '#2563EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.4, fontWeight: 800,
          flexShrink: 0,
        }}
        aria-label={bankName}
      >
        {bankName.charAt(0)}
      </div>
    )
  }

  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: '50%',
        background: bank.bgColor,
        border: `1.5px solid ${bank.color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: size * 0.15,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bank.url}
        alt={bankName}
        width={size * 0.6}
        height={size * 0.6}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        style={{ objectFit: 'contain', display: 'block' }}
      />
    </div>
  )
}
