'use client'

import { useContext, useEffect, useState } from 'react'

import { MapContext } from '@/contexts/MapContext'

interface LeafletTileLayerProps {
  url?: string
  attribution?: string
  maxZoom?: number
  tileSize?: number
}

export function LeafletTileLayer({
  url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom = 19,
  tileSize = 256
}: LeafletTileLayerProps) {
  const context = useContext(MapContext)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !context?.map) return

    let cancelled = false
    let tileLayer: import('leaflet').TileLayer | undefined

    const initializeTileLayer = async () => {
      const L = (await import('leaflet')).default
      if (cancelled) return

      tileLayer = L.tileLayer(url, {
        attribution,
        maxZoom,
        tileSize,
        referrerPolicy: 'strict-origin'
      })

      tileLayer.addTo(context.map)
    }

    initializeTileLayer()

    return () => {
      cancelled = true
      tileLayer?.remove()
    }
  }, [isClient, context?.map, url, attribution, maxZoom, tileSize])

  return null
}
