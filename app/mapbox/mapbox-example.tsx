'use client'

import { useEffect, useRef, useState } from 'react'

import mapboxgl from 'mapbox-gl'

import { useIsVisibleSurface } from '@/components/spaces/space-surface'

import 'mapbox-gl/dist/mapbox-gl.css'

export function MapboxExample({ accessToken }: { accessToken?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)
  const isVisible = useIsVisibleSurface()

  useEffect(() => {
    if (!isVisible || !accessToken || !containerRef.current) return

    let map: mapboxgl.Map
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        accessToken,
        style: 'mapbox://styles/mapbox/standard',
        center: [-0.126326, 51.533582],
        zoom: 15.27,
        pitch: 42,
        bearing: -50,
        minZoom: 15,
        maxZoom: 16
      })
    } catch (error) {
      console.error('Unable to initialize the Mapbox map:', error)
      // Initialization can fail synchronously before Mapbox emits an error.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(true)
      return
    }

    map.on('error', () => setError(true))
    map.on('style.load', () => {
      map.setConfigProperty('basemap', 'lightPreset', 'dusk')
      map.addSource('landmark-clip', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-0.12573, 51.53222],
                [-0.12458, 51.53219],
                [-0.12358, 51.53492],
                [-0.12701, 51.53391],
                [-0.12573, 51.53222]
              ]
            ]
          }
        }
      })
      map.addLayer({
        id: 'landmark-clip',
        type: 'clip',
        source: 'landmark-clip',
        layout: {
          'clip-layer-types': ['symbol', 'model'],
          'clip-layer-scope': ['basemap']
        }
      })
      map.addSource('replacement-building', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            model: 'https://docs.mapbox.com/mapbox-gl-js/assets/tower.glb'
          },
          geometry: { type: 'Point', coordinates: [-0.12501974, 51.5332374] }
        }
      })
      map.addLayer({
        id: 'replacement-building',
        type: 'model',
        source: 'replacement-building',
        slot: 'middle',
        minzoom: 15,
        layout: { 'model-id': ['get', 'model'] },
        paint: {
          'model-rotation': [0, 0, 35],
          'model-scale': [0.8, 0.8, 1.2],
          'model-cast-shadows': true,
          'model-emissive-strength': 0.8
        }
      })
    })

    const observer = new ResizeObserver(() => map.resize())
    observer.observe(containerRef.current)
    return () => {
      observer.disconnect()
      map.remove()
    }
  }, [accessToken, isVisible])

  if (!accessToken) {
    return (
      <div role="alert" className="p-6">
        Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to a Mapbox public access token to
        view this map.
      </div>
    )
  }

  return (
    <div className="relative size-full">
      <div
        ref={containerRef}
        className="size-full"
        aria-label="Map of London"
      />
      {error && (
        <div
          role="alert"
          className="absolute left-4 top-4 rounded bg-background p-3 text-foreground shadow"
        >
          The Mapbox map could not load completely. Check your token and network
          connection.
        </div>
      )}
    </div>
  )
}
