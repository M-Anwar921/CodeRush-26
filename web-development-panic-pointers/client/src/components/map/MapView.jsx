import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import ShipMarker      from './ShipMarker'
import ShipPath        from './ShipPath'
import ZoneLayer       from './ZoneLayer'
import ProximityLines  from './ProximityLines'
import WeatherLayer    from './WeatherLayer'

const CARTO_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const CARTO_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

const CENTER = [26.0, 55.0]
const ZOOM   = 7

function FlyTo({ focusPos }) {
  const map  = useMap()
  const prev = useRef(null)
  useEffect(() => {
    if (!focusPos) return
    const key = `${focusPos[0].toFixed(3)},${focusPos[1].toFixed(3)}`
    if (key === prev.current) return
    prev.current = key
    map.flyTo(focusPos, 9, { duration: 1.5 })
  }, [focusPos, map])
  return null
}

export default function MapView({ ships, onShipSelect, focusShipId, role, replaySnapshot = null }) {
  const [showWeather, setShowWeather] = useState(false)

  const renderShips = replaySnapshot ? replaySnapshot.ships : ships
  const focusShip   = focusShipId ? renderShips.find(s => s.id === focusShipId) : null
  const focusPos    = focusShip ? [focusShip.lat, focusShip.lon] : null

  return (
    <div style={{ height:'100%', width:'100%', position:'relative' }}>
      <MapContainer center={CENTER} zoom={ZOOM}
        style={{ height:'100%', width:'100%', background:'#0a0f1e' }}
        zoomControl attributionControl
      >
        <TileLayer url={CARTO_DARK} attribution={CARTO_ATTR} />
        {focusPos && <FlyTo focusPos={focusPos} />}

        <ZoneLayer role={role} />
        {showWeather && <WeatherLayer />}
        {!replaySnapshot && <ShipPath ships={renderShips} />}
        {!replaySnapshot && <ProximityLines />}

        {renderShips.map(ship => (
          <ShipMarker key={ship.id} ship={ship} onSelect={onShipSelect}
            dimmed={role === 'captain' && ship.id !== focusShipId} />
        ))}
      </MapContainer>

      {/* STEP 11: weather toggle */}
      <button
        onClick={() => setShowWeather(s => !s)}
        style={{
          position:'absolute', top:80, right:10, zIndex:1000,
          background: showWeather ? '#ffaa00' : '#0d1526',
          color:      showWeather ? '#0a0f1e' : '#e2e8f0',
          border:    `1px solid ${showWeather ? '#ffaa00' : '#1e3a5f'}`,
          borderRadius:6, padding:'6px 12px', cursor:'pointer',
          fontFamily:'JetBrains Mono, monospace', fontSize:11, fontWeight:700, letterSpacing:1,
        }}
      >
        {showWeather ? '☁ WEATHER ON' : '☁ WEATHER'}
      </button>

      {replaySnapshot && (
        <div style={{
          position:'absolute', top:12, left:'50%', transform:'translateX(-50%)',
          zIndex:1500, background:'#1a1208', border:'1px solid #ffaa0055',
          borderRadius:6, padding:'6px 14px',
          fontFamily:'JetBrains Mono, monospace', fontSize:11, fontWeight:700,
          color:'#ffaa00', letterSpacing:2,
        }}>
          ⏪ REPLAY · {new Date(replaySnapshot.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
