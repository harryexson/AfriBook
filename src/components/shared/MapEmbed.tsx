import { MapPin } from 'lucide-react'

export interface LatLng {
  latitude: number
  longitude: number
}

export interface BoundingBox {
  minLat: number
  minLng: number
  maxLat: number
  maxLng: number
}

interface MapEmbedProps {
  /** Center of the map view. Defaults to Lagos, Nigeria if unspecified. */
  center: LatLng
  /** Marker pin position; defaults to `center`. */
  marker?: LatLng
  /** Optional explicit bounding box (e.g. spanning pickup + dropoff). */
  bbox?: BoundingBox
  /** Height utility class for the map wrapper. Default `h-40`. Ignored in `bare` mode. */
  heightClass?: string
  /** Accessibility title for the iframe. */
  title?: string
  /** Show an "Open in Maps" link beneath the map. */
  openInMaps?: boolean
  /** Render without wrapper styling, filling the parent (for custom containers). */
  bare?: boolean
}

export default function MapEmbed({
  center,
  marker,
  bbox,
  heightClass = 'h-40',
  title = 'Location map',
  openInMaps = false,
  bare = false,
}: MapEmbedProps) {
  const lat = center.latitude || 6.5244
  const lng = center.longitude || 3.3792
  const pinLat = marker?.latitude || lat
  const pinLng = marker?.longitude || lng
  const minLat = bbox?.minLat ?? lat - 0.01
  const minLng = bbox?.minLng ?? lng - 0.01
  const maxLat = bbox?.maxLat ?? lat + 0.01
  const maxLng = bbox?.maxLng ?? lng + 0.01

  const src =
    `https://www.openstreetmap.org/export/embed.html?bbox=${minLng},${minLat},${maxLng},${maxLat}` +
    `&layer=mapnik&marker=${pinLat},${pinLng}`

  if (bare) {
    return (
      <iframe src={src} className="w-full h-full border-0" loading="lazy" title={title} />
    )
  }

  return (
    <div>
      <div className={`${heightClass} rounded-xl overflow-hidden border border-border`}>
        <iframe src={src} className="w-full h-full border-0" loading="lazy" title={title} />
      </div>
      {openInMaps && (
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-amber-500 text-xs font-medium hover:text-amber-600 mt-2 transition-colors"
        >
          <MapPin className="w-3 h-3" />
          Open in Maps
        </a>
      )}
    </div>
  )
}
