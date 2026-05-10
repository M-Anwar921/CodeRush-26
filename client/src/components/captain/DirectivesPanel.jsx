const PORTS = {
  'KWT-1':'Kuwait City', 'BUS-1':'Bushehr', 'DMM-1':'Dammam', 'BAH-1':'Manama',
  'DOH-1':'Doha', 'AUH-1':'Abu Dhabi', 'DXB-1':'Jebel Ali',
  'BND-1':'Bandar Abbas', 'SOH-1':'Sohar', 'MCT-1':'Muscat',
}

function btnStyle(color) {
  return {
    flex:1, padding:'7px 0', border:`1px solid ${color}55`, borderRadius:4,
    background:`${color}11`, color, cursor:'pointer',
    fontFamily:'JetBrains Mono, monospace', fontSize:11, fontWeight:700, letterSpacing:1,
  }
}

export default function DirectivesPanel({ directives = [], responded = {}, onRespond }) {
  return (
    <div style={{ height:'100%', overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{
        fontSize:10, letterSpacing:2, color:'#64748b', fontWeight:600,
        fontFamily:'JetBrains Mono, monospace', paddingBottom:8, borderBottom:'1px solid #1e3a5f',
      }}>
        INCOMING DIRECTIVES
      </div>

      {directives.length === 0 ? (
        <div style={{ color:'#64748b', fontSize:12, fontFamily:'JetBrains Mono, monospace', padding:'16px 0' }}>
          No directives received
        </div>
      ) : directives.map(d => {
        const resp = responded[d.id]
        return (
          <div key={d.id} style={{
            background:'#0a0f1e', border:'1px solid #1e3a5f', borderRadius:8,
            padding:'10px 12px', display:'flex', flexDirection:'column', gap:6,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'#00d4ff', fontSize:10, fontFamily:'JetBrains Mono, monospace', fontWeight:700 }}>
                FROM COMMAND
              </span>
              <span style={{ color:'#64748b', fontSize:10, fontFamily:'JetBrains Mono, monospace' }}>
                {new Date(d.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div style={{ color:'#e2e8f0', fontSize:13 }}>{d.text}</div>

            {d.heading != null && (
              <div style={{ color:'#64748b', fontSize:11, fontFamily:'JetBrains Mono, monospace' }}>
                New heading: {d.heading}°
              </div>
            )}
            {d.dest && (
              <div style={{ color:'#64748b', fontSize:11, fontFamily:'JetBrains Mono, monospace' }}>
                Reroute to: {PORTS[d.dest] ?? d.dest}
              </div>
            )}

            {!resp ? (
              <div style={{ display:'flex', gap:8, marginTop:4 }}>
                <button onClick={() => onRespond(d, 'accept')}   style={btnStyle('#00ff88')}>ACCEPT</button>
                <button onClick={() => onRespond(d, 'escalate')} style={btnStyle('#ffaa00')}>ESCALATE</button>
              </div>
            ) : (
              <div style={{ fontSize:11, fontFamily:'JetBrains Mono, monospace', fontWeight:700, marginTop:4, color: resp === 'accept' ? '#00ff88' : '#ffaa00' }}>
                {resp === 'accept' ? '✓ ACCEPTED' : '⚠ ESCALATED'}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
