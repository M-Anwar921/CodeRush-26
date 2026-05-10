import { X, Anchor, Gauge, Navigation, Package, Fuel, Clock } from 'lucide-react'
import StatusBadge from '../shared/StatusBadge'
import FuelBar from '../shared/FuelBar'

const PORTS = {
  'KWT-1':'Kuwait City','BUS-1':'Bushehr','DMM-1':'Dammam',
  'BAH-1':'Manama','DOH-1':'Doha','AUH-1':'Abu Dhabi',
  'DXB-1':'Jebel Ali','BND-1':'Bandar Abbas','SOH-1':'Sohar','MCT-1':'Muscat',
}

function Row({ icon, label, value }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #1e3a5f' }}>
      <span style={{ color:'#64748b', flexShrink:0 }}>{icon}</span>
      <span style={{ color:'#64748b', fontSize:11, fontFamily:'JetBrains Mono, monospace', letterSpacing:1, width:80, flexShrink:0 }}>{label}</span>
      <span style={{ color:'#e2e8f0', fontSize:13, fontFamily:'JetBrains Mono, monospace', marginLeft:'auto', textAlign:'right' }}>{value}</span>
    </div>
  )
}

export default function ShipDetailPanel({ ship, onClose }) {
  if (!ship) return null

  const etaStr = ship.eta
    ? new Date(ship.eta).toUTCString().slice(5, 22) + ' UTC'
    : '—'

  return (
    <div style={{
      position: 'absolute', top: 16, right: 16, zIndex: 1000,
      width: 300, background: '#0d1526',
      border: '1px solid #1e3a5f', borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding:'14px 16px', borderBottom:'1px solid #1e3a5f', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#0a0f1e' }}>
        <div>
          <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:17, color:'#e2e8f0' }}>
            {ship.name}
          </div>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'#64748b', marginTop:2 }}>
            {ship.id}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <StatusBadge status={ship.status} />
          <button
            onClick={onClose}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', padding:4, display:'flex' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:'0 16px 8px' }}>
        <Row icon={<Navigation size={14}/>} label="POSITION"
          value={`${ship.lat.toFixed(4)}°N  ${ship.lon.toFixed(4)}°E`} />
        <Row icon={<Gauge size={14}/>}      label="SPEED"
          value={`${ship.speed} kn`} />
        <Row icon={<Navigation size={14}/>} label="HEADING"
          value={`${ship.heading}°`} />
        <Row icon={<Anchor size={14}/>}     label="DEST"
          value={PORTS[ship.dest] ?? ship.dest} />
        <Row icon={<Package size={14}/>}    label="CARGO"
          value={ship.cargo} />
        <Row icon={<Clock size={14}/>}      label="ETA"
          value={etaStr} />

        <div style={{ paddingTop:12, paddingBottom:4 }}>
          <FuelBar fuel={ship.fuel} />
        </div>

        {ship.weatherPenalty && (
          <div style={{ marginTop:8, padding:'6px 10px', background:'#ffaa0022', border:'1px solid #ffaa0044', borderRadius:6, fontSize:11, color:'#ffaa00', fontFamily:'JetBrains Mono, monospace' }}>
            ⚠ ADVERSE WEATHER — +30% fuel burn
          </div>
        )}
      </div>
    </div>
  )
}
