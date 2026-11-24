'use client'

import { useEffect, useRef, useState } from 'react'

import area from '@turf/area'
import { polygon } from '@turf/helpers'
import {
  Copy,
  Download,
  MapPin,
  Pencil,
  Ruler,
  Search,
  Trash2,
  Upload,
  X
} from 'lucide-react'
import { toast } from 'sonner'

import { useMapContext } from '@/hooks/useMapContext'

type Point = { lat: number; lng: number }
type Place = Point & { id: string; name: string; category: string }
type Country = {
  cca2: string
  name: { common: string; official: string }
  capital?: string[]
  region?: string
  population?: number
  latlng: [number, number]
}
type Mode = 'browse' | 'distance' | 'area' | 'place'

const STORAGE_KEY = 'map-saved-places'
const CATEGORIES = [
  'Other',
  'Food & drink',
  'Shopping',
  'Transport',
  'Lodging',
  'Health',
  'Entertainment',
  'Nature',
  'Services',
  'Education',
  'Religion',
  'Business',
  'Tourism',
  'Emergency',
  'Utilities'
]
const buttonClass =
  'inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm hover:bg-accent disabled:opacity-50'
const inputClass =
  'h-9 w-full rounded-md border border-border bg-background px-2 text-sm'

export function MapWorkspace() {
  const { map: contextMap } = useMapContext()
  const map = contextMap as import('leaflet').Map | null
  const [mode, setMode] = useState<Mode>('browse')
  const [points, setPoints] = useState<Point[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [loaded, setLoaded] = useState(false)
  const [panel, setPanel] = useState<'places' | 'measure' | null>(null)
  const [selected, setSelected] = useState<Point | null>(null)
  const [menu, setMenu] = useState<(Point & { x: number; y: number }) | null>(
    null
  )
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Other')
  const [filter, setFilter] = useState('All')
  const [editing, setEditing] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [countries, setCountries] = useState<Country[]>([])
  const [country, setCountry] = useState<Country | null>(null)
  const [searching, setSearching] = useState(false)
  const [geojson, setGeojson] = useState<GeoJSON.GeoJsonObject | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (Array.isArray(saved)) {
        setPlaces(saved.filter(isPlace))
      }
    } catch {
      toast.error('Could not read saved places')
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(places))
    } catch {
      toast.error('Could not save places on this device')
    }
  }, [loaded, places])

  useEffect(() => {
    if (!map) return
    const handleClick = (event: import('leaflet').LeafletMouseEvent) => {
      const point = { lat: event.latlng.lat, lng: event.latlng.lng }
      setMenu(null)
      if (mode === 'distance' || mode === 'area')
        setPoints(previous => [...previous, point])
      else if (mode === 'place') {
        setSelected(point)
        setMode('browse')
        setPanel('places')
      } else setSelected(point)
    }
    const handleContextMenu = (event: import('leaflet').LeafletMouseEvent) => {
      setMenu({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
        x: event.containerPoint.x,
        y: event.containerPoint.y
      })
    }
    map.on('click', handleClick)
    map.on('contextmenu', handleContextMenu)
    return () => {
      map.off('click', handleClick)
      map.off('contextmenu', handleContextMenu)
    }
  }, [map, mode])

  useEffect(() => {
    if (!map) return
    let cancelled = false
    let layer: import('leaflet').LayerGroup | undefined
    import('leaflet')
      .then(({ default: leaflet }) => {
        if (cancelled) return
        layer = leaflet.layerGroup().addTo(map)
        places
          .filter(place => filter === 'All' || place.category === filter)
          .forEach(place => {
            const label = document.createElement('span')
            label.textContent = place.name
            leaflet
              .circleMarker([place.lat, place.lng], {
                radius: 7,
                color: '#087f70',
                fillOpacity: 0.9
              })
              .bindTooltip(label)
              .addTo(layer!)
          })
        if (points.length) {
          const coordinates = points.map(
            point => [point.lat, point.lng] as [number, number]
          )
          if (mode === 'area' && points.length >= 3)
            leaflet.polygon(coordinates, { color: '#db5b29' }).addTo(layer)
          else leaflet.polyline(coordinates, { color: '#db5b29' }).addTo(layer)
          coordinates.forEach(point =>
            leaflet
              .circleMarker(point, { radius: 4, color: '#db5b29' })
              .addTo(layer!)
          )
        }
        if (geojson) {
          try {
            leaflet.geoJSON(geojson).addTo(layer)
          } catch {
            toast.error('Could not display this GeoJSON')
          }
        }
      })
      .catch(() => toast.error('Could not load map layers'))
    return () => {
      cancelled = true
      layer?.remove()
    }
  }, [map, places, filter, points, mode, geojson])

  const distance = map
    ? points
        .slice(1)
        .reduce(
          (total, point, index) =>
            total +
            map.distance(
              [points[index].lat, points[index].lng],
              [point.lat, point.lng]
            ),
          0
        )
    : 0
  const measuredArea =
    mode === 'area' && points.length >= 3
      ? area(
          polygon([
            [
              ...points.map(point => [point.lng, point.lat]),
              [points[0].lng, points[0].lat]
            ]
          ])
        )
      : 0

  function savePlace() {
    if (!name.trim() || !selected) return
    const place = {
      ...selected,
      name: name.trim(),
      category,
      id: editing || crypto.randomUUID()
    }
    setPlaces(previous =>
      editing
        ? previous.map(item => (item.id === editing ? place : item))
        : [...previous, place]
    )
    setName('')
    setEditing(null)
    setSelected(null)
    toast.success('Place saved')
  }

  async function searchCountries(event: React.FormEvent) {
    event.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setCountries([])
    try {
      const response = await fetch(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(query.trim())}?fields=name,cca2,capital,region,population,latlng`
      )
      if (!response.ok) throw new Error('No countries found')
      const result: Country[] = await response.json()
      setCountries(
        result.filter(
          item => Array.isArray(item.latlng) && item.latlng.length === 2
        )
      )
      if (!result.length) toast.info('No countries found')
    } catch {
      toast.error('Country search failed or returned no results')
    } finally {
      setSearching(false)
    }
  }

  async function importFile(file: File) {
    try {
      const data = JSON.parse(await file.text()) as GeoJSON.GeoJSON
      if (!data || typeof data !== 'object' || !('type' in data))
        throw new Error('Invalid GeoJSON')
      setGeojson(data)
      if (data.type === 'FeatureCollection') {
        const imported = data.features.flatMap(feature => {
          if (feature.geometry?.type !== 'Point') return []
          const [lng, lat] = feature.geometry.coordinates
          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            Math.abs(lat) > 90 ||
            Math.abs(lng) > 180
          )
            return []
          return [
            {
              id: crypto.randomUUID(),
              lat,
              lng,
              name: String(feature.properties?.name || 'Imported place'),
              category: String(feature.properties?.category || 'Other')
            }
          ]
        })
        if (imported.length) setPlaces(previous => [...previous, ...imported])
      }
      toast.success('GeoJSON imported')
    } catch {
      toast.error('Invalid GeoJSON file')
    }
  }

  function exportPlaces() {
    const features = places.map(place => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [place.lng, place.lat] },
      properties: { name: place.name, category: place.category }
    }))
    const url = URL.createObjectURL(
      new Blob(
        [JSON.stringify({ type: 'FeatureCollection', features }, null, 2)],
        { type: 'application/geo+json' }
      )
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'places.geojson'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="absolute left-3 top-3 z-[1000] w-[min(24rem,calc(100%-1.5rem))] space-y-2">
        <form
          onSubmit={searchCountries}
          className="flex gap-2 rounded-md bg-background p-2 shadow-md"
        >
          <input
            className={inputClass}
            aria-label="Search countries"
            placeholder="Search countries"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
          <button
            className={buttonClass}
            type="submit"
            title="Search countries"
            aria-label="Search countries"
            disabled={searching}
          >
            <Search size={16} />
          </button>
        </form>
        {countries.length > 0 && (
          <div className="max-h-48 overflow-auto rounded-md bg-background p-1 shadow-md">
            {countries.map(item => (
              <button
                key={item.cca2}
                className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  setCountry(item)
                  setCountries([])
                  setQuery(item.name.common)
                  map?.flyTo(item.latlng, 5)
                }}
              >
                {item.name.common}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            className={buttonClass}
            onClick={() => setPanel(panel === 'places' ? null : 'places')}
          >
            <MapPin size={16} /> Places
          </button>
          <button
            className={buttonClass}
            onClick={() => setPanel(panel === 'measure' ? null : 'measure')}
          >
            <Ruler size={16} /> Measure
          </button>
          <button
            className={buttonClass}
            title="Import GeoJSON"
            aria-label="Import GeoJSON"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={16} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.geojson,application/geo+json"
            className="hidden"
            onChange={event => {
              const file = event.target.files?.[0]
              if (file) void importFile(file)
              event.target.value = ''
            }}
          />
        </div>
        {country && (
          <section className="rounded-md bg-background p-3 text-sm shadow-md">
            <div className="flex justify-between gap-2">
              <strong>{country.name.common}</strong>
              <button
                title="Close country details"
                aria-label="Close country details"
                onClick={() => setCountry(null)}
              >
                <X size={16} />
              </button>
            </div>
            <p>{country.name.official}</p>
            <p>
              {country.region}
              {country.capital?.length
                ? ` · ${country.capital.join(', ')}`
                : ''}
            </p>
            {country.population != null && (
              <p>Population: {country.population.toLocaleString()}</p>
            )}
          </section>
        )}
        {panel === 'measure' && (
          <section className="space-y-3 rounded-md bg-background p-3 text-sm shadow-md">
            <div className="flex items-center justify-between">
              <strong>Measure</strong>
              <button
                title="Close measurement"
                aria-label="Close measurement"
                onClick={() => {
                  setPanel(null)
                  setMode('browse')
                  setPoints([])
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                className={buttonClass}
                aria-pressed={mode === 'distance'}
                onClick={() => {
                  setMode('distance')
                  setPoints([])
                }}
              >
                Distance
              </button>
              <button
                className={buttonClass}
                aria-pressed={mode === 'area'}
                onClick={() => {
                  setMode('area')
                  setPoints([])
                }}
              >
                Area
              </button>
              <button className={buttonClass} onClick={() => setPoints([])}>
                Clear
              </button>
            </div>
            <p>
              {mode === 'area'
                ? `${(measuredArea / 1000000).toFixed(2)} km²`
                : `${(distance / 1000).toFixed(2)} km`}
            </p>
          </section>
        )}
        {panel === 'places' && (
          <section className="max-h-[55vh] space-y-3 overflow-auto rounded-md bg-background p-3 text-sm shadow-md">
            <div className="flex items-center justify-between">
              <strong>Saved places</strong>
              <div className="flex gap-3">
                <button
                  title="Export places"
                  aria-label="Export places"
                  onClick={exportPlaces}
                >
                  <Download size={16} />
                </button>
                <button
                  title="Close places"
                  aria-label="Close places"
                  onClick={() => {
                    setPanel(null)
                    setMode('browse')
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <input
              className={inputClass}
              placeholder="Place name"
              value={name}
              onChange={event => setName(event.target.value)}
            />
            <select
              aria-label="Place category"
              className={inputClass}
              value={category}
              onChange={event => setCategory(event.target.value)}
            >
              {CATEGORIES.map(item => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={buttonClass}
                onClick={() => setMode('place')}
                aria-pressed={mode === 'place'}
              >
                <MapPin size={16} /> Pick location
              </button>
              <button
                className={buttonClass}
                onClick={savePlace}
                disabled={!name.trim() || !selected}
              >
                Save
              </button>
            </div>
            <p className="text-muted-foreground">
              {selected
                ? `${selected.lat.toFixed(5)}, ${selected.lng.toFixed(5)}`
                : mode === 'place'
                  ? 'Select a location on the map'
                  : 'No location selected'}
            </p>
            <select
              aria-label="Filter places"
              className={inputClass}
              value={filter}
              onChange={event => setFilter(event.target.value)}
            >
              <option>All</option>
              {CATEGORIES.map(item => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <ul className="divide-y divide-border">
              {places
                .filter(place => filter === 'All' || place.category === filter)
                .map(place => (
                  <li key={place.id} className="flex items-center gap-2 py-2">
                    <button
                      className="min-w-0 flex-1 truncate text-left"
                      onClick={() => map?.flyTo([place.lat, place.lng], 14)}
                    >
                      <strong>{place.name}</strong>
                      <span className="block text-xs text-muted-foreground">
                        {place.category}
                      </span>
                    </button>
                    <button
                      title="Edit place"
                      aria-label={`Edit ${place.name}`}
                      onClick={() => {
                        setEditing(place.id)
                        setName(place.name)
                        setCategory(place.category)
                        setSelected(place)
                      }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      title="Delete place"
                      aria-label={`Delete ${place.name}`}
                      onClick={() =>
                        setPlaces(previous =>
                          previous.filter(item => item.id !== place.id)
                        )
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        )}
      </div>
      {menu && (
        <div
          className="absolute z-[1001] w-48 rounded-md border border-border bg-background p-1 text-sm shadow-lg"
          style={{
            left: `min(${menu.x}px, calc(100% - 12.5rem))`,
            top: `min(${menu.y}px, calc(100% - 9rem))`
          }}
        >
          <button
            className="flex w-full items-center gap-2 rounded px-2 py-2 text-left hover:bg-accent"
            onClick={() => {
              void navigator.clipboard
                .writeText(`${menu.lat.toFixed(6)}, ${menu.lng.toFixed(6)}`)
                .then(() => toast.success('Coordinates copied'))
                .catch(() => toast.error('Could not copy coordinates'))
              setMenu(null)
            }}
          >
            <Copy size={15} /> Copy coordinates
          </button>
          <button
            className="flex w-full items-center gap-2 rounded px-2 py-2 text-left hover:bg-accent"
            onClick={() => {
              setSelected(menu)
              setEditing(null)
              setName('')
              setPanel('places')
              setMenu(null)
            }}
          >
            <MapPin size={15} /> Save place
          </button>
          <button
            className="flex w-full items-center gap-2 rounded px-2 py-2 text-left hover:bg-accent"
            onClick={() => {
              setPoints([{ lat: menu.lat, lng: menu.lng }])
              setMode('distance')
              setPanel('measure')
              setMenu(null)
            }}
          >
            <Ruler size={15} /> Measure distance
          </button>
        </div>
      )}
    </>
  )
}

function isPlace(value: unknown): value is Place {
  if (!value || typeof value !== 'object') return false
  const place = value as Record<string, unknown>
  return (
    typeof place.id === 'string' &&
    typeof place.name === 'string' &&
    typeof place.category === 'string' &&
    typeof place.lat === 'number' &&
    Number.isFinite(place.lat) &&
    Math.abs(place.lat) <= 90 &&
    typeof place.lng === 'number' &&
    Number.isFinite(place.lng) &&
    Math.abs(place.lng) <= 180
  )
}
