import { StrictMode, useContext } from 'react'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'

import { LeafletMap } from './LeafletMap'
import { LeafletTileLayer } from './LeafletTileLayer'

import { MapContext, MapProvider } from '@/contexts/MapContext'

function ContextUpdateButton() {
  const context = useContext(MapContext)

  return <button onClick={context?.startInitializing}>Update context</button>
}

test('keeps the map and tile layer mounted when context changes', async () => {
  const { container, unmount } = render(
    <StrictMode>
      <MapProvider>
        <LeafletMap>
          <LeafletTileLayer />
        </LeafletMap>
        <ContextUpdateButton />
      </MapProvider>
    </StrictMode>
  )

  await waitFor(() => {
    expect(
      container.querySelector('.leaflet-tile-container')
    ).toBeInTheDocument()
    expect(
      container.querySelector<HTMLImageElement>('img.leaflet-tile')
        ?.referrerPolicy
    ).toBe('strict-origin')
  })

  const tilePane = container.querySelector('.leaflet-tile-pane')
  fireEvent.click(screen.getByText('Update context'))

  expect(container.querySelector('.leaflet-tile-pane')).toBe(tilePane)
  expect(container.querySelector('.leaflet-tile-container')).toBeInTheDocument()

  unmount()
})
