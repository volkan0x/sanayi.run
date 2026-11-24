'use client'

import { useContext, useEffect, useRef, useState } from 'react'

import { toast } from 'sonner'

import { MapContext } from '@/contexts/MapContext'

const DENSITY_BANDS = [
  { min: 0, color: '#FFEDA0' },
  { min: 10, color: '#FED976' },
  { min: 20, color: '#FEB24C' },
  { min: 50, color: '#FD8D3C' },
  { min: 100, color: '#FC4E2A' },
  { min: 200, color: '#E31A1C' },
  { min: 500, color: '#BD0026' },
  { min: 1000, color: '#800026' }
]

const POPULATION_ATTRIBUTION =
  'Population data &copy; <a href="https://www.census.gov/">US Census Bureau</a>'

type StateProperties = { name: string; density: number }

function densityColor(density: number) {
  return (
    [...DENSITY_BANDS].reverse().find(band => density > band.min)?.color ??
    DENSITY_BANDS[0].color
  )
}

export function LeafletStateLayer({
  toolActive = false
}: {
  toolActive?: boolean
}) {
  const map = useContext(MapContext)?.map
  const toolActiveRef = useRef(toolActive)
  const [selectedState, setSelectedState] = useState<StateProperties | null>(
    null
  )

  useEffect(() => {
    toolActiveRef.current = toolActive
  }, [toolActive])

  useEffect(() => {
    if (!map) return

    const controller = new AbortController()
    let cancelled = false
    let layer: import('leaflet').GeoJSON | undefined

    async function addStates() {
      try {
        const [response, { default: leaflet }] = await Promise.all([
          fetch('/us-states.geojson', { signal: controller.signal }),
          import('leaflet')
        ])
        if (!response.ok) throw new Error('Failed to load state boundaries')
        const data: GeoJSON.FeatureCollection = await response.json()
        if (cancelled) return
        layer = leaflet
          .geoJSON(data, {
            style: feature => ({
              weight: 2,
              opacity: 1,
              color: 'white',
              dashArray: '3',
              fillOpacity: 0.7,
              fillColor: densityColor(feature?.properties?.density ?? 0)
            }),
            onEachFeature: (feature, featureLayer) => {
              const stateLayer = featureLayer as import('leaflet').Polygon
              const properties = feature.properties as StateProperties
              stateLayer.on('mouseover', () => {
                stateLayer.setStyle({ weight: 5, color: '#666', dashArray: '' })
                stateLayer.bringToFront()
                setSelectedState(properties)
              })
              stateLayer.on('mouseout', () => {
                layer?.resetStyle(stateLayer)
                setSelectedState(null)
              })
              stateLayer.on('click', () => {
                setSelectedState(properties)
                if (!toolActiveRef.current)
                  map.fitBounds(stateLayer.getBounds())
              })
            }
          })
          .addTo(map)
        map.attributionControl?.addAttribution(POPULATION_ATTRIBUTION)
      } catch {
        if (!cancelled) toast.error('Could not load state boundaries')
      }
    }

    void addStates()

    return () => {
      cancelled = true
      controller.abort()
      layer?.remove()
      map.attributionControl?.removeAttribution(POPULATION_ATTRIBUTION)
    }
  }, [map])

  if (!map) return null

  return (
    <>
      <section
        className="pointer-events-none absolute right-3 top-32 z-[1000] rounded-md bg-background/95 p-3 text-sm shadow-md sm:top-3"
        aria-label="US population density"
      >
        <h2 className="font-semibold">US population density (2011)</h2>
        {selectedState ? (
          <p>
            <strong>{selectedState.name}</strong>
            <br />
            {selectedState.density.toLocaleString()} people / mi²
          </p>
        ) : (
          <p className="text-muted-foreground">Hover over a state</p>
        )}
      </section>
      <section
        className="pointer-events-none absolute bottom-24 left-3 z-[1000] rounded-md bg-background/95 p-2 text-xs shadow-md"
        aria-label="Population density legend"
      >
        <h2 className="mb-1 font-semibold">People / mi²</h2>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-1">
          {DENSITY_BANDS.map((band, index) => (
            <div key={band.min} className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0"
                style={{ backgroundColor: band.color }}
              />
              <span>
                {band.min}
                {DENSITY_BANDS[index + 1]
                  ? `–${DENSITY_BANDS[index + 1].min}`
                  : '+'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
