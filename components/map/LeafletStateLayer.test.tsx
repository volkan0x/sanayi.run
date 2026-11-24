import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

import { LeafletStateLayer } from './LeafletStateLayer'

import { MapContext, type MapContextValue } from '@/contexts/MapContext'

const leaflet = vi.hoisted(() => ({
  geoJSON: vi.fn(),
  addTo: vi.fn(),
  remove: vi.fn(),
  resetStyle: vi.fn()
}))

vi.mock('leaflet', () => ({ default: { geoJSON: leaflet.geoJSON } }))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

test('styles states and handles hover, zoom, and active map tools', async () => {
  const data = { type: 'FeatureCollection', features: [] }
  const map = { fitBounds: vi.fn() }
  leaflet.geoJSON.mockReturnValue({ addTo: leaflet.addTo })
  leaflet.addTo.mockReturnValue({
    remove: leaflet.remove,
    resetStyle: leaflet.resetStyle
  })
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => data })
  )

  const { unmount, rerender } = render(
    <MapContext.Provider value={{ map } as MapContextValue}>
      <LeafletStateLayer />
    </MapContext.Provider>
  )

  await waitFor(() => expect(leaflet.addTo).toHaveBeenCalledWith(map))
  const options = leaflet.geoJSON.mock.calls[0][1]
  expect(options.style({ properties: { density: 75 } }).fillColor).toBe(
    '#FD8D3C'
  )
  const handlers: Record<string, () => void> = {}
  const featureLayer = {
    on: (event: string, handler: () => void) => {
      handlers[event] = handler
    },
    setStyle: vi.fn(),
    bringToFront: vi.fn(),
    getBounds: () => 'bounds'
  }
  options.onEachFeature(
    { properties: { name: 'Alabama', density: 94.65 } },
    featureLayer
  )
  act(() => handlers.mouseover())
  expect(screen.getByText('Alabama')).toBeInTheDocument()
  expect(screen.getByText('94.65 people / mi²')).toBeInTheDocument()
  act(() => handlers.click())
  expect(map.fitBounds).toHaveBeenCalledWith('bounds')
  act(() => handlers.mouseout())
  expect(leaflet.resetStyle).toHaveBeenCalledWith(featureLayer)
  expect(screen.getByText('Hover over a state')).toBeInTheDocument()

  rerender(
    <MapContext.Provider value={{ map } as MapContextValue}>
      <LeafletStateLayer toolActive />
    </MapContext.Provider>
  )
  act(() => handlers.click())
  expect(map.fitBounds).toHaveBeenCalledOnce()
  unmount()
  expect(leaflet.remove).toHaveBeenCalledOnce()
})
