import { useContext, useEffect } from 'react'

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'

import { LeafletMap } from './LeafletMap'
import { LeafletTileLayer } from './LeafletTileLayer'
import { MapWorkspace } from './MapWorkspace'

import { MapContext, MapProvider } from '@/contexts/MapContext'

let map: import('leaflet').Map | null = null

function MapProbe() {
  const context = useContext(MapContext)
  useEffect(() => {
    map = context?.map ?? null
  }, [context?.map])
  return null
}

beforeEach(() => {
  localStorage.clear()
  map = null
})

test('saves and deletes a place selected on the map', async () => {
  render(
    <MapProvider>
      <LeafletMap>
        <LeafletTileLayer />
      </LeafletMap>
      <MapWorkspace />
      <MapProbe />
    </MapProvider>
  )
  await waitFor(() => expect(map).not.toBeNull())
  fireEvent.click(screen.getByRole('button', { name: 'Places' }))
  fireEvent.change(screen.getByPlaceholderText('Place name'), {
    target: { value: 'Workshop' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Pick location' }))
  act(() => map?.fire('click', { latlng: { lat: 41, lng: 29 } }))
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(screen.getByText('Workshop')).toBeInTheDocument()
  await waitFor(() =>
    expect(localStorage.getItem('map-saved-places')).toContain('Workshop')
  )
  fireEvent.click(screen.getByRole('button', { name: 'Delete Workshop' }))
  expect(screen.queryByText('Workshop')).not.toBeInTheDocument()
})

test('calculates the distance between selected map points', async () => {
  render(
    <MapProvider>
      <LeafletMap>
        <LeafletTileLayer />
      </LeafletMap>
      <MapWorkspace />
      <MapProbe />
    </MapProvider>
  )
  await waitFor(() => expect(map).not.toBeNull())
  fireEvent.click(screen.getByRole('button', { name: 'Measure' }))
  fireEvent.click(screen.getByRole('button', { name: 'Distance' }))
  act(() => {
    map?.fire('click', { latlng: { lat: 0, lng: 0 } })
    map?.fire('click', { latlng: { lat: 0, lng: 1 } })
  })
  expect(screen.getByText('111.19 km')).toBeInTheDocument()
})
