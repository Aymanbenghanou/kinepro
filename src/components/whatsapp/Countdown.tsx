'use client'

import { useEffect, useState } from 'react'

interface Props {
  /** ISO string or Date — the timer counts down to this moment */
  target: string | Date
  /** Optional label shown when the target is reached (default: "Prêt !") */
  doneLabel?: string
  /** Refresh interval in ms (default 1000) */
  intervalMs?: number
}

/**
 * Live "X min Y sec" countdown. Stops at zero, shows doneLabel, and
 * cleans up its interval on unmount.
 */
export default function Countdown({ target, doneLabel = 'Prêt !', intervalMs = 1000 }: Props) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    const t = new Date(target).getTime()
    const tick = () => {
      const diff = t - Date.now()
      if (diff <= 0) { setRemaining(doneLabel); return false }
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setRemaining(`${mins} min ${String(secs).padStart(2, '0')} sec`)
      return true
    }
    if (!tick()) return
    const id = setInterval(() => { if (!tick()) clearInterval(id) }, intervalMs)
    return () => clearInterval(id)
  }, [target, doneLabel, intervalMs])

  return <span>{remaining}</span>
}

/**
 * Percentage of elapsed time for a progress bar (0..100).
 * Useful with `<Countdown>` for the "20 minute feedback timer" pattern.
 */
export function elapsedPct(start: string | Date, end: string | Date): number {
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  if (e <= s) return 100
  const pct = ((Date.now() - s) / (e - s)) * 100
  return Math.max(0, Math.min(100, pct))
}
