import { useMemo, useState } from 'react'

const TYPE_META = {
  geofence:  { color:'#ff3355', icon:'⚠', label:'GEOFENCE'  },
  proximity: { color:'#ffaa00', icon:'⇄', label:'PROXIMITY' },
  distress:  { color:'#ff3355', icon:'☠', label:'DISTRESS'  },
  weather:   { color:'#9ca3af', icon:'☁', label:'WEATHER'   },
}

const SEV_COLOR = {
  low:'#00ff88', medium:'#ffaa00', high:'#ff7733', critical:'#ff3355',
}

function AlertCard({ alert, onAck }) {
  const meta  = TYPE_META[alert.type] ?? { color:'#64748b', icon:'•', label:alert.type?.toUpperCase() ?? 'ALERT' }
  const acked = alert.acknowledged

  return (
    <div style={{
      background:'#0a0f1e',
      border: `1px solid ${acked ? '#1e3a5f' : meta.color + '55'}`,
      borderRadius:8, padding:'10px 12px',
      display:'flex', flexDirection:'column', gap:4,
      opacity: acked ? 0.55 : 1,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{
          color: meta.color, fontFamily:'JetBrains Mono, monospace',
          fontSize:11, fontWeight:700, letterSpacing:1,
        }}>
          {meta.icon} {meta.label}
        </span>
        <span style={{ color:'#64748b', fontSize:10, fontFamily:'JetBrains Mono, monospace' }}>
          {new Date(alert.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div style={{ color:'#e2e8f0', fontSize:12, fontFamily:'JetBrains Mono, monospace' }}>
        {alert.message}
      </div>

      {alert.shipName && (
        <div style={{ color:'#64748b', fontSize:11, fontFamily:'JetBrains Mono, monospace' }}>
          {alert.shipId} · {alert.shipName}
        </div>
      )}

      {alert.type === 'distress' && alert.analysis && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
          <span style={{
            background:`${SEV_COLOR[alert.analysis.severity] ?? '#ffaa00'}22`,
            color:    SEV_COLOR[alert.analysis.severity] ?? '#ffaa00',
            border:  `1px solid ${SEV_COLOR[alert.analysis.severity] ?? '#ffaa00'}55`,
            fontSize:10, padding:'2px 6px', borderRadius:4, letterSpacing:1,
            fontFamily:'JetBrains Mono, monospace', fontWeight:700,
          }}>
            {alert.analysis.severity?.toUpperCase()}
          </span>
          <span style={{ color:'#64748b', fontSize:11, fontFamily:'JetBrains Mono, monospace' }}>
            {alert.analysis.issueType} · {alert.analysis.injuredCount} injured
          </span>
        </div>
      )}

      {!acked && (
        <button
          onClick={() => onAck(alert.id)}
          style={{
            marginTop:6, alignSelf:'flex-start',
            background:'none', border:`1px solid ${meta.color}55`, color: meta.color,
            borderRadius:4, padding:'4px 10px', cursor:'pointer',
            fontSize:10, fontWeight:700, letterSpacing:1,
            fontFamily:'JetBrains Mono, monospace',
          }}
        >
          ACKNOWLEDGE
        </button>
      )}
    </div>
  )
}

export default function AlertPanel({ alerts, onAck, onClear }) {
  const [showHistory, setShowHistory] = useState(false)

  const { active, history } = useMemo(() => {
    const active  = alerts.filter(a => !a.acknowledged)
    const history = alerts.filter(a =>  a.acknowledged)
    return { active, history }
  }, [alerts])

  if (alerts.length === 0) {
    return (
      <div style={{
        height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
        color:'#64748b', fontFamily:'JetBrains Mono, monospace', fontSize:12,
      }}>
        No active alerts
      </div>
    )
  }

  return (
    <div style={{ overflowY:'auto', height:'100%', padding:12, display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:10, letterSpacing:2, color:'#64748b', fontFamily:'JetBrains Mono, monospace', fontWeight:700 }}>
          {active.length} ACTIVE · {history.length} ACKED
        </span>
        <button onClick={onClear} style={{
          background:'none', border:'1px solid #1e3a5f', color:'#64748b',
          borderRadius:4, padding:'4px 10px', cursor:'pointer',
          fontSize:11, fontFamily:'JetBrains Mono, monospace',
        }}>
          Clear All
        </button>
      </div>

      {active.map(a => <AlertCard key={a.id} alert={a} onAck={onAck} />)}

      {history.length > 0 && (
        <button
          onClick={() => setShowHistory(s => !s)}
          style={{
            marginTop:6, padding:'6px 0', background:'none',
            border:'1px dashed #1e3a5f', color:'#64748b', borderRadius:4,
            cursor:'pointer', fontFamily:'JetBrains Mono, monospace',
            fontSize:11, letterSpacing:1,
          }}
        >
          {showHistory ? '▼ HIDE HISTORY' : `▶ SHOW HISTORY (${history.length})`}
        </button>
      )}

      {showHistory && history.map(a => <AlertCard key={a.id} alert={a} onAck={onAck} />)}
    </div>
  )
}
