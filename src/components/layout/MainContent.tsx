'use client'

import { useSidebar } from '@/lib/sidebar-context'

/**
 * Wrapper client autour du contenu principal du dashboard.
 * Applique la classe `main-content-expanded` quand la sidebar desktop est
 * collapsée, pour que la zone principale s'élargisse (margin-left: 0).
 * Sur mobile (<768px) la classe n'a pas d'effet visuel (margin déjà 0
 * via les règles responsive existantes).
 */
export default function MainContent({ children }: { children: React.ReactNode }) {
  const { desktopCollapsed } = useSidebar()
  return (
    <div className={`main-content flex-1${desktopCollapsed ? ' main-content-expanded' : ''}`}>
      {children}
    </div>
  )
}
