'use client'

import { useContext, useEffect } from 'react'

import { MapContext } from '@/contexts/MapContext'

const BURSA_LANDMARKS = [
  {
    name: 'Grand Mosque of Bursa (Ulu Cami)',
    coordinates: [40.1843, 29.061] as [number, number],
    description: 'Historic mosque in the center of Bursa.'
  },
  {
    name: 'Koza Han',
    coordinates: [40.1849, 29.063] as [number, number],
    description: 'Historic silk market and caravanserai.'
  },
  {
    name: 'Green Mosque (Yeşil Cami)',
    coordinates: [40.1828, 29.074] as [number, number],
    description: 'Landmark mosque in Bursa’s historic Green Complex.'
  },
  {
    name: 'Tophane Clock Tower',
    coordinates: [40.1874, 29.0574] as [number, number],
    description: 'Clock tower overlooking central Bursa.'
  },
  {
    name: 'Muradiye Complex',
    coordinates: [40.1909, 29.0485] as [number, number],
    description: 'Historic mosque and tomb complex in Bursa.'
  }
]

export function BursaLandmarksLayer() {
  const map = useContext(MapContext)?.map

  useEffect(() => {
    if (!map) return

    let cancelled = false
    let markers: import('leaflet').Marker[] = []

    async function addLandmarks() {
      const { default: leaflet } = await import('leaflet')
      if (cancelled) return

      markers = BURSA_LANDMARKS.map(landmark =>
        leaflet
          .marker(landmark.coordinates, {
            alt: landmark.name,
            title: landmark.name,
            keyboard: true
          })
          .bindPopup(
            `<strong>${landmark.name}</strong><br>${landmark.description}`
          )
          .addTo(map)
      )
    }

    void addLandmarks()

    return () => {
      cancelled = true
      markers.forEach(marker => marker.remove())
    }
  }, [map])

  return null
}
