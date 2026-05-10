import { useEffect, useState } from 'react'
import { Rectangle } from 'react-leaflet'
import { socket } from '../../hooks/useSocket'

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

// Color/opacity by wind speed (knots). Lower thresholds always render so the
// toggle shows actual conditions even in calm weather.
function styleFor(cell) {
  const w = cell.windKt
  if (w < 5)  return { color:'#00d4ff', opacity:0.04 } // calm — barely visible
  if (w < 15) return { color:'#00d4ff', opacity:0.10 } // breezy — cyan
  if (w < 25) return { color:'#ffaa00', opacity:0.18 } // strong — amber
  return        { color:'#ff3355', opacity:0.25 }      // gale  — red
}

export default function WeatherLayer() {
  const [cells, setCells] = useState([])
  const [step,  setStep]  = useState(2)

  useEffect(() => {
    const onGrid = (payload) => {
      setCells(payload?.cells || [])
      if (payload?.step) setStep(payload.step)
    }
    socket.on('weather_grid', onGrid)
    fetch(`${SERVER}/api/weather`)
      .then(r => r.json())
      .then(j => onGrid(j))
      .catch(() => {})
    return () => socket.off('weather_grid', onGrid)
  }, [])

  const half = step / 2

  return cells.map((c, i) => {
    const { color, opacity } = styleFor(c)
    return (
      <Rectangle
        key={`${c.lat}-${c.lon}-${i}`}
        bounds={[
          [c.lat - half, c.lon - half],
          [c.lat + half, c.lon + half],
        ]}
        pathOptions={{
          color,
          fillColor:   color,
          fillOpacity: opacity,
          weight:      c.adverse ? 1.5 : 0.5,
          opacity:     c.adverse ? 0.6 : 0.3,
          dashArray:   c.adverse ? '4 4' : '2 6',
        }}
      />
    )
  })
}
