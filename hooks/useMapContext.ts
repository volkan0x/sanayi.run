'use client'

import { useContext } from 'react'

import { DEFAULT_MAP_CONFIG } from '@/constants/map-config'
import { MapContext, MapContextValue } from '@/contexts/MapContext'

export function useMapContext(): MapContextValue {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider')
  }
  return context
}

export function useMapControls() {
  const { map } = useMapContext()

  return {
    map,
    zoomIn: () => map?.zoomIn(),
    zoomOut: () => map?.zoomOut(),
    toggleFullscreen: () => {
      const container = map?.getContainer()
      if (container) {
        if (!document.fullscreenElement) {
          container.requestFullscreen()
        } else {
          document.exitFullscreen()
        }
      }
    },
    resetView: () => {
      if (map) {
        map.setView(
          DEFAULT_MAP_CONFIG.defaultCenter,
          DEFAULT_MAP_CONFIG.defaultZoom
        )
      }
    }
  }
}
