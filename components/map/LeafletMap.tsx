'use client'

import { useContext, useEffect, useRef, useState } from 'react'

import { DEFAULT_MAP_CONFIG } from '@/constants/map-config'
import { MapContext } from '@/contexts/MapContext'

interface LeafletMapProps {
  center?: [number, number]
  zoom?: number
  minZoom?: number
  maxZoom?: number
  className?: string
  children?: React.ReactNode
  onClick?: (e: any) => void
}

export function LeafletMap({
  center = DEFAULT_MAP_CONFIG.defaultCenter,
  zoom = DEFAULT_MAP_CONFIG.defaultZoom,
  minZoom = DEFAULT_MAP_CONFIG.minZoom,
  maxZoom = DEFAULT_MAP_CONFIG.maxZoom,
  className = '',
  children,
  onClick
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const isInitializedRef = useRef(false)
  const context = useContext(MapContext)
  const setMap = context?.setMap
  const setMapError = context?.setMapError
  const startInitializing = context?.startInitializing
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (
      !isClient ||
      !containerRef.current ||
      isInitializedRef.current ||
      !setMap ||
      !setMapError ||
      !startInitializing
    ) {
      return
    }

    let cancelled = false

    const initializeMap = async () => {
      try {
        startInitializing()

        // Dynamically import leaflet only on client
        const L = (await import('leaflet')).default
        if (cancelled || !containerRef.current) return

        // Create map instance
        const map = L.map(containerRef.current!, {
          center,
          zoom,
          minZoom,
          maxZoom,
          zoomControl: false,
          attributionControl: true
        })

        mapRef.current = map
        isInitializedRef.current = true

        // Set up click handler
        if (onClick) {
          map.on('click', onClick)
        }

        // Register map with context
        setMap(map)
      } catch (err) {
        if (cancelled) return
        const error =
          err instanceof Error ? err : new Error('Failed to initialize map')
        setMapError(error)
      }
    }

    initializeMap()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        isInitializedRef.current = false
        setMap(null)
      }
    }
  }, [
    isClient,
    center,
    zoom,
    minZoom,
    maxZoom,
    onClick,
    setMap,
    setMapError,
    startInitializing
  ])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: '100vh' }}
    >
      {children}
    </div>
  )
}
