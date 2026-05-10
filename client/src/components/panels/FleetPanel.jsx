import StatusBadge from '../shared/StatusBadge'

const PORTS = {
  'KWT-1':'Kuwait', 'BUS-1':'Bushehr', 'DMM-1':'Dammam', 'BAH-1':'Manama',
  'DOH-1':'Doha', 'AUH-1':'Abu Dhabi', 'DXB-1':'Jebel Ali',
  'BND-1':'Bandar Abbas', 'SOH-1':'Sohar', 'MCT-1':'Muscat',
}
const MAX_FUEL = 9000

const TH = ({ children }) => (
  <th style={{
    padding:'8px 8px', textAlign:'left', fontSize:10, color:'#64748b',
    fontFamily:'JetBrains Mono, monospace', letterSpacing:1,
    borderBottom:'1px solid #1e3a5f', fontWeight:600, whiteSpace:'nowrap',
  }}>{children}</th>
)

export default function FleetPanel({ ships, onShipSelect }) {
  return (
    <div style={{ overflowY:'auto', height:'100%' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ position:'sticky', top:0, background:'#0a0f1e', zIndex:1 }}>
            <TH>SHIP</TH><TH>STATUS</TH><TH>CARGO</TH><TH>FUEL</TH><TH>SPD</TH><TH>DEST</TH>
          </tr>
        </thead>
        <tbody>
          {ships.map((ship, i) => {
            const pct = Math.round((ship.fuel / MAX_FUEL) * 100)
            const fuelColor = pct < 10 ? '#ff3355' : pct < 30 ? '#ffaa00' : '#00ff88'
            return (
              <tr
                key={ship.id}
                onClick={() => onShipSelect?.(ship)}
                style={{ cursor:'pointer', borderBottom:'1px solid #1e3a5f22', background: i % 2 ? '#ffffff05' : 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1e3a5f44'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 ? '#ffffff05' : 'transparent'}
              >
                <td style={{ padding:'7px 8px', fontFamily:'JetBrains Mono, monospace', fontSize:12, color:'#e2e8f0', fontWeight:600 }}>
                  {ship.name}
                </td>
                <td style={{ padding:'7px 8px' }}>
                  <StatusBadge status={ship.status} />
                </td>
                <td style={{ padding:'7px 8px', fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'#64748b', whiteSpace:'nowrap' }}>
                  {ship.cargo}
                </td>
                <td style={{ padding:'7px 8px', fontFamily:'JetBrains Mono, monospace', fontSize:11, color:fuelColor, fontWeight:600 }}>
                  {pct}%
                </td>
                <td style={{ padding:'7px 8px', fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'#e2e8f0' }}>
                  {ship.speed}kn
                </td>
                <td style={{ padding:'7px 8px', fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'#64748b', whiteSpace:'nowrap' }}>
                  {PORTS[ship.dest] ?? ship.dest}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
