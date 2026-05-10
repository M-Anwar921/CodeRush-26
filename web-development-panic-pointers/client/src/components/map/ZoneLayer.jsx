import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import '@geoman-io/leaflet-geoman-free'
import { socket } from '../../hooks/useSocket'

const ZONE_STYLE = {
  color:       '#ff3355',
  fillColor:   '#ff3355',
  fillOpacity: 0.25,
  weight:      3,
  opacity:     0.9,
}

// BUG 5 FIX: render-only zone layer. No click-to-delete; deletion lives in ZonesPanel.
export default function ZoneLayer({ role }) {
  const map    = useMap()
  const layers = useRef({})

  useEffect(() => {
    function addLayer(zone) {
      if (layers.current[zone.id]) return
      const poly = L.polygon(zone.coordinates, ZONE_STYLE).addTo(map)
      layers.current[zone.id] = poly
    }

    function dropLayer(id) {
      if (layers.current[id]) {
        map.removeLayer(layers.current[id])
        delete layers.current[id]
      }
    }

    function onZonesSync(zones) {
      Object.keys(layers.current).forEach(dropLayer)
      zones.forEach(addLayer)
    }

    socket.on('zones_sync',   onZonesSync)
    socket.on('zone_added',   addLayer)
    socket.on('zone_removed', dropLayer)
    socket.emit('request_zones')

    if (role === 'command') {
      map.pm.addControls({
        position:         'topright',
        drawPolygon:      true,
        drawMarker:       false,
        drawCircleMarker: false,
        drawPolyline:     false,
        drawRectangle:    false,
        drawCircle:       false,
        editMode:         false,
        dragMode:         false,
        cutPolygon:       false,
        removalMode:      false,
      })
      map.pm.setGlobalOptions({ pathOptions: ZONE_STYLE })

      map.on('pm:create', (e) => {
        const coords = e.layer.getLatLngs()[0].map(ll => [ll.lat, ll.lng])
        socket.emit('zone_added', {
          id:          'zone_' + Date.now(),
          coordinates: coords,
          createdAt:   new Date().toISOString(),
        })
        map.removeLayer(e.layer)
      })
    }

    return () => {
      socket.off('zones_sync',   onZonesSync)
      socket.off('zone_added',   addLayer)
      socket.off('zone_removed', dropLayer)
      if (role === 'command') {
        map.pm.removeControls()
        map.off('pm:create')
      }
      Object.keys(layers.current).forEach(dropLayer)
    }
  }, [map, role])

  return null
}
