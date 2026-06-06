'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

interface SidebarContextValue {
  /** Mobile : sidebar slide-in/out (true = overlay visible). */
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  /** Desktop : sidebar collapsée (true = cachée, main content élargi). */
  desktopCollapsed: boolean
  collapseDesktop: () => void
  expandDesktop: () => void
  toggleDesktopCollapsed: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
  desktopCollapsed: false,
  collapseDesktop: () => {},
  expandDesktop: () => {},
  toggleDesktopCollapsed: () => {},
})

const STORAGE_KEY = 'kinepro:sidebar:desktopCollapsed'

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)

  // Restore desktop collapse preference au mount (hydration-safe).
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') setDesktopCollapsed(true)
    } catch { /* SSR / private mode → ignore */ }
  }, [])

  const open   = useCallback(() => setIsOpen(true), [])
  const close  = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(v => !v), [])

  const persist = (v: boolean) => {
    try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0') } catch {}
  }
  const collapseDesktop = useCallback(() => { setDesktopCollapsed(true);  persist(true) }, [])
  const expandDesktop   = useCallback(() => { setDesktopCollapsed(false); persist(false) }, [])
  const toggleDesktopCollapsed = useCallback(() => {
    setDesktopCollapsed(v => { const next = !v; persist(next); return next })
  }, [])

  return (
    <SidebarContext.Provider value={{
      isOpen, open, close, toggle,
      desktopCollapsed, collapseDesktop, expandDesktop, toggleDesktopCollapsed,
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
