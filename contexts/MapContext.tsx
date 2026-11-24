'use client'

import { createContext, ReactNode, useCallback, useMemo, useState } from 'react'

export interface MapContextValue {
  map: any
  setMap: (map: any) => void
  isReady: boolean
  error: Error | null
  isInitializing: boolean
  setMapError: (error: Error | null) => void
  startInitializing: () => void
}

export const MapContext = createContext<MapContextValue | undefined>(undefined)

interface MapProviderProps {
  children: ReactNode
}

export function MapProvider({ children }: MapProviderProps) {
  const [map, setMapState] = useState<any>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  const setMap = useCallback((newMap: any) => {
    setMapState(newMap)
    if (newMap) {
      setIsInitializing(false)
      setError(null)
    }
  }, [])

  const setMapError = useCallback((err: Error | null) => {
    setError(err)
    setIsInitializing(false)
  }, [])

  const startInitializing = useCallback(() => {
    setIsInitializing(true)
    setError(null)
  }, [])

  const isReady = map !== null && error === null

  const value: MapContextValue = useMemo(
    () => ({
      map,
      setMap,
      isReady,
      error,
      isInitializing,
      setMapError,
      startInitializing
    }),
    [
      map,
      setMap,
      isReady,
      error,
      isInitializing,
      setMapError,
      startInitializing
    ]
  )

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
}
