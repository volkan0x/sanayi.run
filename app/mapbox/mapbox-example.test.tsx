import { act, render, screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'

import { MapboxExample } from './mapbox-example'

const mocks = vi.hoisted(() => ({
  on: vi.fn(),
  addSource: vi.fn(),
  addLayer: vi.fn(),
  setConfigProperty: vi.fn(),
  resize: vi.fn(),
  remove: vi.fn(),
  map: vi.fn()
}))

vi.mock('mapbox-gl', () => ({
  default: {
    Map: class {
      constructor(options: unknown) {
        mocks.map(options)
      }
      on = mocks.on
      addSource = mocks.addSource
      addLayer = mocks.addLayer
      setConfigProperty = mocks.setConfigProperty
      resize = mocks.resize
      remove = mocks.remove
    }
  }
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  )
})

test('explains how to configure a missing token', () => {
  render(<MapboxExample />)
  expect(screen.getByRole('alert')).toHaveTextContent(
    'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN'
  )
  expect(mocks.map).not.toHaveBeenCalled()
})

test('adds the scoped clip and replacement model and cleans up the map', () => {
  const { unmount } = render(<MapboxExample accessToken="public-token" />)
  expect(mocks.map).toHaveBeenCalledWith(
    expect.objectContaining({ accessToken: 'public-token' })
  )
  const styleLoad = mocks.on.mock.calls.find(
    ([event]) => event === 'style.load'
  )
  expect(styleLoad).toBeDefined()
  act(() => styleLoad?.[1]())
  expect(mocks.addLayer).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'clip',
      layout: {
        'clip-layer-types': ['symbol', 'model'],
        'clip-layer-scope': ['basemap']
      }
    })
  )
  expect(mocks.addLayer).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'model', source: 'replacement-building' })
  )
  unmount()
  expect(mocks.remove).toHaveBeenCalledOnce()
})

test('reports map loading errors', () => {
  render(<MapboxExample accessToken="public-token" />)
  const onError = mocks.on.mock.calls.find(([event]) => event === 'error')
  expect(onError).toBeDefined()
  act(() => onError?.[1]())
  expect(screen.getByRole('alert')).toHaveTextContent('could not load')
})

test('reports synchronous initialization errors', () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  mocks.map.mockImplementationOnce(() => {
    throw new Error('Map initialization failed')
  })
  render(<MapboxExample accessToken="public-token" />)
  expect(screen.getByRole('alert')).toHaveTextContent('could not load')
  expect(log).toHaveBeenCalled()
  log.mockRestore()
})
