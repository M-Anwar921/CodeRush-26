import { useRef, useMemo, useEffect } from 'react'
import { Marker } from 'react-leaflet'
import L from 'leaflet'
import { useMarkerInterpolation } from '../../lib/interpolate'

function statusColor(status) {
  switch (status) {
    case 'arrived':           return '#00ff88'
    case 'low_fuel':          return '#ffaa00'
    case 'rerouting':         return '#ffaa00'
    case 'distress':          return '#ff3355'
    case 'in_zone':           return '#ff3355'
    case 'stranded':          return '#ff3355'
    case 'insufficient_fuel': return '#ff3355'
    default:                  return '#00d4ff'
  }
}

function makeDivIcon(color, heading, isDistress) {
  const pulse = isDistress ? 'ship-pulse' : ''
  return L.divIcon({
    className: '',
    html: `
      <div class="${pulse}" style="
        position:relative; width:24px; height:24px;
        transform:rotate(${heading}deg);
        display:flex; align-items:center; justify-content:center;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
          <polygon points="11,1 19,19 11,15 3,19"
            fill="${color}" stroke="#0a0f1e" stroke-width="1.2" opacity="0.95"/>
        </svg>
      </div>`,
    iconSize:    [24, 24],
    iconAnchor:  [12, 12],
    popupAnchor: [0, -14],
  })
}

export default function ShipMarker({ ship, onSelect, dimmed = false }) {
  const markerRef = useRef(null)

  // Smooth 60fps interpolation via direct Leaflet API — no React re-renders for movement
  useMarkerInterpolation(markerRef, ship.lat, ship.lon)

  const isDistress = ship.status === 'distress'
  const color      = statusColor(ship.status)

  // Recreate icon only when status or heading changes
  const icon = useMemo(
    () => makeDivIcon(color, ship.heading, isDistress),
    [color, ship.heading, isDistress]
  )

  // Apply opacity for dimmed ships (Captain view)
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setOpacity(dimmed ? 0.25 : 1)
    }
  }, [dimmed])

  return (
    <Marker
      ref={markerRef}
      position={[ship.lat, ship.lon]}
      icon={icon}
      eventHandlers={{ click: () => onSelect(ship) }}
    />
  )
}
