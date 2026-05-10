import { Polyline } from 'react-leaflet'

// BUG 4 FIX: only ships actively rerouting around a zone show the dashed route line.
export default function ShipPath({ ships }) {
  return ships
    .filter(s => s.status === 'rerouting' && s.waypoints?.length > 0)
    .map(s => (
      <Polyline
        key={s.id + '-path'}
        positions={[[s.lat, s.lon], ...s.waypoints]}
        pathOptions={{
          color:     '#00d4ff',
          dashArray: '10 6',
          weight:    2,
          opacity:   0.65,
        }}
      />
    ))
}
