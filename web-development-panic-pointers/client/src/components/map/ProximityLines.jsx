import { useEffect, useState } from 'react'
import { Polyline } from 'react-leaflet'
import { socket } from '../../hooks/useSocket'

// STEP 8: yellow line between any two ships within proximity threshold.
export default function ProximityLines() {
  const [pairs, setPairs] = useState([])

  useEffect(() => {
    const onPairs = (list) => setPairs(list || [])
    socket.on('proximity_pairs', onPairs)
    return () => socket.off('proximity_pairs', onPairs)
  }, [])

  return pairs.map((p, i) => (
    <Polyline
      key={`${p.a.id}-${p.b.id}-${i}`}
      positions={[[p.a.lat, p.a.lon], [p.b.lat, p.b.lon]]}
      pathOptions={{
        color:     '#ffaa00',
        weight:    2,
        opacity:   0.85,
        dashArray: '6 4',
      }}
    />
  ))
}
