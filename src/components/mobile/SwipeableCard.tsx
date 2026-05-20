'use client'

import { useRef, useState, type ReactNode, type TouchEvent } from 'react'

export interface SwipeAction {
  label: string
  icon?: ReactNode
  color: string        // background color
  textColor?: string   // text color (defaults to white)
  onPress: () => void
}

interface Props {
  children: ReactNode
  leftActions?:  SwipeAction[]   // revealed when swiping right
  rightActions?: SwipeAction[]   // revealed when swiping left
  threshold?: number             // px to trigger reveal (default 60)
}

/**
 * Touch-only swipeable card. Reveals action buttons when the user
 * swipes horizontally. Snap-open at threshold, tap card or any action
 * closes after action runs.
 */
export default function SwipeableCard({
  children, leftActions = [], rightActions = [], threshold = 60,
}: Props) {
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const moved  = useRef(0)
  const locked = useRef<'h' | 'v' | null>(null)
  const [offset, setOffset] = useState(0)
  const [open, setOpen] = useState<'left' | 'right' | null>(null)

  const leftWidth  = leftActions.length * 80   // 80px per action
  const rightWidth = rightActions.length * 80

  function onStart(e: TouchEvent) {
    const t = e.touches[0]
    startX.current = t.clientX
    startY.current = t.clientY
    moved.current  = 0
    locked.current = null
  }

  function onMove(e: TouchEvent) {
    if (startX.current == null || startY.current == null) return
    const t = e.touches[0]
    const dx = t.clientX - startX.current
    const dy = t.clientY - startY.current

    // Decide axis lock once we've moved > 8px
    if (!locked.current && Math.abs(dx) + Math.abs(dy) > 8) {
      locked.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
    }
    if (locked.current !== 'h') return

    let next = (open === 'left' ? leftWidth : open === 'right' ? -rightWidth : 0) + dx
    // Bound: can't swipe past available actions
    if (next > leftWidth)   next = leftWidth
    if (next < -rightWidth) next = -rightWidth
    moved.current = dx
    setOffset(next)
  }

  function onEnd() {
    if (locked.current === 'h') {
      if (offset >  threshold && leftActions.length)  { setOffset(leftWidth);   setOpen('left')  }
      else if (offset < -threshold && rightActions.length) { setOffset(-rightWidth); setOpen('right') }
      else { setOffset(0); setOpen(null) }
      // Haptic
      if (Math.abs(offset) >= threshold && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { (navigator as any).vibrate?.(10) } catch {}
      }
    }
    startX.current = null
    startY.current = null
    locked.current = null
  }

  function close() { setOffset(0); setOpen(null) }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 14, marginBottom: 10 }}>
      {/* Left action bar (revealed when swiping right) */}
      {leftActions.length > 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'flex-start' }}>
          {leftActions.map((a, i) => (
            <button key={i}
              onClick={() => { a.onPress(); close() }}
              style={swipeBtn(a)}
            >
              {a.icon}<span style={{ fontSize: 11, fontWeight: 700 }}>{a.label}</span>
            </button>
          ))}
        </div>
      )}
      {/* Right action bar (revealed when swiping left) */}
      {rightActions.length > 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'flex-end' }}>
          {rightActions.map((a, i) => (
            <button key={i}
              onClick={() => { a.onPress(); close() }}
              style={swipeBtn(a)}
            >
              {a.icon}<span style={{ fontSize: 11, fontWeight: 700 }}>{a.label}</span>
            </button>
          ))}
        </div>
      )}
      {/* Foreground card */}
      <div
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        onClick={open ? close : undefined}
        style={{
          position: 'relative',
          transform: `translateX(${offset}px)`,
          transition: locked.current ? 'none' : 'transform 0.25s cubic-bezier(0.32,0.72,0,1)',
          willChange: 'transform',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function swipeBtn(a: SwipeAction): React.CSSProperties {
  return {
    width: 80, height: '100%',
    background: a.color, color: a.textColor ?? 'white',
    border: 'none', cursor: 'pointer',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 4,
  }
}
