import { socket } from '../../hooks/useSocket'

// BUG 5 FIX: dedicated zones panel — list active zones, remove via button (no map clicks).
export default function ZonesPanel({ zones }) {
  if (!zones.length) {
    return (
      <div style={{
        height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
        color:'#64748b', fontFamily:'JetBrains Mono, monospace', fontSize:12,
        textAlign:'center', padding:16,
      }}>
        No active zones.<br />Use the polygon tool on the map to draw one.
      </div>
    )
  }

  return (
    <div style={{ overflowY:'auto', height:'100%', padding:12, display:'flex', flexDirection:'column', gap:8 }}>
      {zones.map(zone => {
        const created = zone.createdAt ? new Date(zone.createdAt) : null
        return (
          <div key={zone.id} style={{
            background:'#0a0f1e', border:'1px solid #ff335544', borderRadius:8,
            padding:'10px 12px', display:'flex', flexDirection:'column', gap:6,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{
                color:'#ff3355', fontFamily:'JetBrains Mono, monospace',
                fontSize:11, fontWeight:700, letterSpacing:1,
              }}>
                ⚠ {zone.id}
              </span>
              <span style={{ color:'#64748b', fontSize:10, fontFamily:'JetBrains Mono, monospace' }}>
                {created ? created.toLocaleTimeString() : '—'}
              </span>
            </div>
            <div style={{
              color:'#64748b', fontSize:11, fontFamily:'JetBrains Mono, monospace',
            }}>
              {zone.coordinates.length} vertices
            </div>
            <button
              onClick={() => socket.emit('zone_removed', zone.id)}
              style={{
                marginTop:4, background:'#ff3355', color:'#0a0f1e', border:'none',
                borderRadius:4, padding:'7px 12px', cursor:'pointer',
                fontFamily:'JetBrains Mono, monospace', fontSize:11,
                fontWeight:700, letterSpacing:1,
              }}
            >
              REMOVE
            </button>
          </div>
        )
      })}
    </div>
  )
}
