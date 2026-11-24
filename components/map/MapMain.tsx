'use client'

import { useState } from 'react'

import { BursaLandmarksLayer } from './BursaLandmarksLayer'
import { LeafletMap } from './LeafletMap'
import { LeafletTileLayer } from './LeafletTileLayer'
import { MapControls } from './MapControls'
import { MapWorkspace } from './MapWorkspace'

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

const TILE_PROVIDERS = {
  street: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri and its contributors'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  mapbox: MAPBOX_ACCESS_TOKEN
    ? {
        url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=${encodeURIComponent(MAPBOX_ACCESS_TOKEN)}`,
        attribution:
          '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 22
      }
    : undefined
} as const

export function MapMain() {
  const [tileProvider, setTileProvider] =
    useState<keyof typeof TILE_PROVIDERS>(
      MAPBOX_ACCESS_TOKEN ? 'mapbox' : 'street'
    )
  return (
    <div className="relative w-full h-full">
      <LeafletMap>
        <LeafletTileLayer
          {...(TILE_PROVIDERS[tileProvider] ?? TILE_PROVIDERS.street)}
        />
        <BursaLandmarksLayer />
      </LeafletMap>
      <MapControls />
      <MapWorkspace />
      <label className="absolute bottom-8 left-4 z-[1000] rounded-md bg-background p-2 text-sm shadow-md">
        <span className="sr-only">Map style</span>
        <select
          aria-label="Map style"
          value={tileProvider}
          onChange={event =>
            setTileProvider(event.target.value as keyof typeof TILE_PROVIDERS)
          }
          className="bg-transparent"
        >
          <option value="street">Street</option>
          <option value="satellite">Satellite</option>
          <option value="dark">Dark</option>
          <option value="mapbox" disabled={!MAPBOX_ACCESS_TOKEN}>
            {MAPBOX_ACCESS_TOKEN ? 'Mapbox Streets' : 'Mapbox (token required)'}
          </option>
        </select>
      </label>
    </div>
  )
}
