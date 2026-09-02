'use client'

import { useEffect } from 'react'

export function GlobalAntiCheat({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    const handleCopy = (e: ClipboardEvent) => e.preventDefault()
    const handleCut = (e: ClipboardEvent) => e.preventDefault()
    
    // Note: We don't prevent 'paste' globally here because the essay section needs
    // to detect it and trigger a specific penalty trap.

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('cut', handleCut)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('cut', handleCut)
    }
  }, [])

  return (
    <div className="select-none flex flex-col min-h-screen w-full bg-neutral-50 text-neutral-900">
      {children}
    </div>
  )
}
