'use client'

import { memo, useEffect, useState } from 'react'

import { Locate, Maximize2, Minimize2, Minus, Plus } from 'lucide-react'

import { useMapControls } from '@/hooks/useMapContext'

export const MapControls = memo(function MapControls() {
  const { map, zoomIn, zoomOut, toggleFullscreen, resetView } = useMapControls()
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  if (!map) return null

  return (
    <div className="absolute bottom-8 right-4 flex flex-col items-center gap-2 z-[1000]">
      {/* Location Button */}
      <button
        onClick={() => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
              map?.setView([pos.coords.latitude, pos.coords.longitude], 13)
            })
          }
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-700 shadow-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
        title="Find my location"
      >
        <Locate className="h-5 w-5 text-gray-600 dark:text-gray-100" />
      </button>

      {/* Zoom In */}
      <button
        onClick={zoomIn}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-700 shadow-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
        title="Zoom in"
      >
        <Plus className="h-5 w-5 text-gray-600 dark:text-gray-100" />
      </button>

      {/* Zoom Out */}
      <button
        onClick={zoomOut}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-700 shadow-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
        title="Zoom out"
      >
        <Minus className="h-5 w-5 text-gray-600 dark:text-gray-100" />
      </button>

      {/* Reset View */}
      <button
        onClick={resetView}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-700 shadow-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
        title="Reset view"
      >
        <svg
          className="h-5 w-5 text-gray-600 dark:text-gray-100"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </button>

      {/* Fullscreen */}
      <button
        onClick={toggleFullscreen}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-700 shadow-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
        title="Toggle fullscreen"
      >
        {isFullscreen ? (
          <Minimize2 className="h-5 w-5 text-gray-600 dark:text-gray-100" />
        ) : (
          <Maximize2 className="h-5 w-5 text-gray-600 dark:text-gray-100" />
        )}
      </button>
    </div>
  )
})
