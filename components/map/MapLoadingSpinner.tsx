'use client'

import { useContext } from 'react'

import { MapContext } from '@/contexts/MapContext'

export function MapLoadingSpinner() {
  const context = useContext(MapContext)

  if (!context) {
    return null
  }

  const { isReady } = context

  if (isReady) {
    return null
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm z-40 animate-in fade-in-0">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-zinc-200 dark:border-zinc-700 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Loading map...
        </p>
      </div>
    </div>
  )
}
