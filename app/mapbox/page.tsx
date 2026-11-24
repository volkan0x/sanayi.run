import { MapboxExample } from './mapbox-example'

export default function MapboxPage() {
  return (
    <MapboxExample accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN} />
  )
}
