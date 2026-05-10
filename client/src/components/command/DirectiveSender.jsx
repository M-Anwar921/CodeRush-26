import { useState } from 'react'
import { socket } from '../../hooks/useSocket'

const PORTS = {
  'KWT-1':'Kuwait City', 'BUS-1':'Bushehr', 'DMM-1':'Dammam', 'BAH-1':'Manama',
  'DOH-1':'Doha', 'AUH-1':'Abu Dhabi', 'DXB-1':'Jebel Ali',
  'BND-1':'Bandar Abbas', 'SOH-1':'Sohar', 'MCT-1':'Muscat',
}

const inp = {
  width:'100%', background:'#0a0f1e', border:'1px solid #1e3a5f', borderRadius:4,
  color:'#e2e8f0', padding:'7px 10px', fontSize:12,
  fontFamily:'JetBrains Mono, monospace', boxSizing:'border-box', outline:'none',
}

const label = { fontSize:10, color:'#64748b', fontFamily:'JetBrains Mono, monospace', letterSpacing:1, fontWeight:600 }

export default function DirectiveSender({ ships }) {
  const [targetId, setTargetId] = useState('')
  const [text,     setText]     = useState('')
  const [heading,  setHeading]  = useState('')
  const [dest,     setDest]     = useState('')
  const [flash,    setFlash]    = useState(false)

  const send = () => {
    if (!targetId || !text.trim()) return
    const ship = ships.find(s => s.id === targetId)
    socket.emit('directive_sent', {
      id:           'dir_' + Date.now(),
      shipId:       targetId,
      shipName:     ship?.name,
      from:         'Command',
      text:         text.trim(),
      heading:      heading !== '' ? Number(heading) : undefined,
      dest:         dest || undefined,
      timestamp:    new Date().toISOString(),
      acknowledged: false,
    })
    setText(''); setHeading(''); setDest('')
    setFlash(true)
    setTimeout(() => setFlash(false), 2000)
  }

  return (
    <div style={{ padding:12, display:'flex', flexDirection:'column', gap:10, overflowY:'auto', height:'100%' }}>
      <div style={label}>TARGET SHIP</div>
      <select value={targetId} onChange={e => setTargetId(e.target.value)} style={inp}>
        <option value=''>— select ship —</option>
        {ships.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
      </select>

      <div style={label}>MESSAGE</div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
        placeholder="Enter directive..." style={{ ...inp, resize:'vertical', lineHeight:1.5 }} />

      <div style={label}>NEW HEADING (optional, 0–360°)</div>
      <input type='number' min={0} max={360} value={heading}
        onChange={e => setHeading(e.target.value)} placeholder='e.g. 270' style={inp} />

      <div style={label}>REROUTE DESTINATION (optional)</div>
      <select value={dest} onChange={e => setDest(e.target.value)} style={inp}>
        <option value=''>— no change —</option>
        {Object.entries(PORTS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
      </select>

      <button onClick={send} disabled={!targetId || !text.trim()}
        style={{
          marginTop:4, padding:'10px 0', borderRadius:6, fontWeight:700,
          fontFamily:'JetBrains Mono, monospace', fontSize:13, letterSpacing:1,
          cursor: (!targetId || !text.trim()) ? 'not-allowed' : 'pointer',
          background: flash ? '#00ff88' : '#00d4ff',
          color:'#0a0f1e', border:'none', transition:'background 0.3s',
        }}>
        {flash ? '✓ SENT' : 'SEND DIRECTIVE'}
      </button>
    </div>
  )
}
