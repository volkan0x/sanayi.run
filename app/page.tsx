'use client'

import { MapErrorBoundary, MapLoadingSpinner, MapMain } from '@/components/map'

import { MapProvider } from '@/contexts/MapContext'

/**
 * Map page component
 *
 * Following Next.js 16 best practices:
 * - Client component for real-time map interactions
 * - Full-screen map layout with Leaflet integration
 * - Error boundary for graceful error handling
 * - Loading spinner during initialization
 */
export default function MapPage() {
  return (
    <div className="relative w-full h-screen">
      <MapErrorBoundary>
        <MapProvider>
          <MapMain />
          <MapLoadingSpinner />
        </MapProvider>
      </MapErrorBoundary>
    </div>
  )
}
