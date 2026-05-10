import { useEffect, useState } from 'react'
import { useSocket } from '../../hooks/useSocket'

export default function Navbar({ role, shipId, shipName }) {
  const [clock, setClock] = useState(new Date())
  const { connected } = useSocket()

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const timeStr = clock.toUTCString().slice(17, 25) + ' UTC'

  const roleColor = role === 'command' ? '#00d4ff' : '#00ff88'
  const roleLabel = role === 'command' ? 'COMMAND' : `CAPTAIN · ${shipId ?? ''}`

  return (
    <nav style={{
      height: 52, background: '#0d1526', borderBottom: '1px solid #1e3a5f',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', flexShrink: 0,
    }}>
      {/* Left: title */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:16, color:'#00d4ff', letterSpacing:2 }}>
          HORMUZ CCS
        </span>
        {shipName && (
          <span style={{ color:'#64748b', fontSize:13, fontFamily:'JetBrains Mono, monospace' }}>
            / {shipName}
          </span>
        )}
      </div>

      {/* Centre: clock */}
      <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:13, color:'#64748b' }}>
        {timeStr}
      </span>

      {/* Right: connection + role */}
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{
            width:7, height:7, borderRadius:'50%',
            background: connected ? '#00ff88' : '#ff3355',
            boxShadow: connected ? '0 0 6px #00ff88' : '0 0 6px #ff3355',
          }} />
          <span style={{ fontSize:11, color:'#64748b', fontFamily:'JetBrains Mono, monospace' }}>
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        <span style={{
          background: `${roleColor}22`, color: roleColor,
          border: `1px solid ${roleColor}55`,
          borderRadius:6, padding:'3px 10px',
          fontSize:11, fontFamily:'JetBrains Mono, monospace', fontWeight:600, letterSpacing:1,
        }}>
          {roleLabel}
        </span>
      </div>
    </nav>
  )
}
