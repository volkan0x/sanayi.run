import { render, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

import { BursaLandmarksLayer } from './BursaLandmarksLayer'

import { MapContext, type MapContextValue } from '@/contexts/MapContext'

const leaflet = vi.hoisted(() => ({ marker: vi.fn() }))

vi.mock('leaflet', () => ({ default: { marker: leaflet.marker } }))

afterEach(() => {
  vi.clearAllMocks()
})

test('adds keyboard-accessible Bursa landmark markers and removes them on unmount', async () => {
  const map = {}
  const remove = vi.fn()
  const addTo = vi.fn().mockReturnValue({ remove })
  const bindPopup = vi.fn().mockReturnValue({ addTo })
  leaflet.marker.mockReturnValue({ bindPopup, addTo })

  const { unmount } = render(
    <MapContext.Provider value={{ map } as MapContextValue}>
      <BursaLandmarksLayer />
    </MapContext.Provider>
  )

  await waitFor(() => expect(leaflet.marker).toHaveBeenCalledTimes(5))
  const [coordinates, options] = leaflet.marker.mock.calls[0]
  expect(coordinates).toEqual([40.1843, 29.061])
  expect(options).toEqual({
    alt: 'Grand Mosque of Bursa (Ulu Cami)',
    title: 'Grand Mosque of Bursa (Ulu Cami)',
    keyboard: true
  })
  expect(bindPopup).toHaveBeenCalledWith(
    '<strong>Grand Mosque of Bursa (Ulu Cami)</strong><br>Historic mosque in the center of Bursa.'
  )
  expect(addTo).toHaveBeenCalledWith(map)

  unmount()
  expect(remove).toHaveBeenCalledTimes(5)
})
