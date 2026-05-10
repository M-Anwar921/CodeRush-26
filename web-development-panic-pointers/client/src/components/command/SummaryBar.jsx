// Ship-count summary pinned above the Command tab bar.
const WARN_STATUSES   = ['low_fuel', 'rerouting']
const DANGER_STATUSES = ['in_zone', 'stranded', 'distress', 'insufficient_fuel']

function Chip({ label, count, color }) {
  return (
    <div style={{
      flex: 1,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'8px 4px', background:`${color}11`, border:`1px solid ${color}33`,
      borderRadius:6, gap:2, minWidth:0,
    }}>
      <span style={{
        fontFamily:'JetBrains Mono, monospace', fontSize:18, fontWeight:700, color,
        lineHeight:1,
      }}>{count}</span>
      <span style={{
        fontFamily:'JetBrains Mono, monospace', fontSize:9, letterSpacing:1.5,
        color:'#64748b', fontWeight:600,
      }}>{label}</span>
    </div>
  )
}

export default function SummaryBar({ ships }) {
  const total   = ships.length
  const arrived = ships.filter(s => s.status === 'arrived').length
  const danger  = ships.filter(s => DANGER_STATUSES.includes(s.status)).length
  const warn    = ships.filter(s => WARN_STATUSES.includes(s.status)).length
  const weather = ships.filter(s => s.weatherPenalty).length
  const normal  = total - arrived - danger - warn

  return (
    <div style={{
      display:'flex', gap:6, padding:'10px 12px',
      borderBottom:'1px solid #1e3a5f', background:'#0a0f1e', flexShrink:0,
    }}>
      <Chip label="FLEET"   count={total}   color="#00d4ff" />
      <Chip label="NORMAL"  count={normal}  color="#00ff88" />
      <Chip label="WARN"    count={warn}    color="#ffaa00" />
      <Chip label="DANGER"  count={danger}  color="#ff3355" />
      <Chip label="WEATHER" count={weather} color="#9ca3af" />
    </div>
  )
}
