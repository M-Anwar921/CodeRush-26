import { useEffect, useState } from 'react'
import { socket } from '../../hooks/useSocket'

const SEVERITY_COLOR = {
  low:      '#00ff88',
  medium:   '#ffaa00',
  high:     '#ff7733',
  critical: '#ff3355',
}

const inp = {
  width:'100%', background:'#0a0f1e', border:'1px solid #1e3a5f', borderRadius:4,
  color:'#e2e8f0', padding:'8px 10px', fontSize:13, lineHeight:1.5,
  fontFamily:'JetBrains Mono, monospace', boxSizing:'border-box', outline:'none',
  resize:'vertical',
}

const label = { fontSize:10, color:'#64748b', fontFamily:'JetBrains Mono, monospace', letterSpacing:1, fontWeight:600 }

function Row({ k, v, color = '#e2e8f0' }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #1e3a5f' }}>
      <span style={{ color:'#64748b', fontSize:11, fontFamily:'JetBrains Mono, monospace', letterSpacing:1 }}>{k}</span>
      <span style={{ color, fontSize:12, fontFamily:'JetBrains Mono, monospace', textAlign:'right', maxWidth:'60%' }}>{v}</span>
    </div>
  )
}

export default function DistressPanel({ shipId, shipName }) {
  const [text,    setText]    = useState('')
  const [sending, setSending] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    const onResult = (payload) => {
      if (payload.shipId !== shipId) return
      setSending(false)
      setResult(payload)
      setError(null)
    }
    const onError = (payload) => {
      if (payload.shipId !== shipId) return
      setSending(false)
      setError(payload.message || 'Distress parse failed')
    }
    socket.on('distress_result', onResult)
    socket.on('distress_error',  onError)
    return () => {
      socket.off('distress_result', onResult)
      socket.off('distress_error',  onError)
    }
  }, [shipId])

  const send = () => {
    if (!text.trim() || sending) return
    setSending(true); setError(null); setResult(null)
    socket.emit('distress_message', {
      shipId, shipName,
      text:      text.trim(),
      timestamp: new Date().toISOString(),
    })
  }

  const sevColor = result ? (SEVERITY_COLOR[result.severity] ?? '#ffaa00') : '#ffaa00'

  return (
    <div style={{ padding:14, display:'flex', flexDirection:'column', gap:10, overflowY:'auto', height:'100%' }}>
      <div style={label}>DISTRESS MESSAGE</div>
      <textarea
        rows={5}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Describe the situation in plain English…"
        style={inp}
      />

      <button
        onClick={send}
        disabled={!text.trim() || sending}
        style={{
          padding:'10px 0', borderRadius:6, fontWeight:700,
          fontFamily:'JetBrains Mono, monospace', fontSize:13, letterSpacing:1,
          cursor: (!text.trim() || sending) ? 'not-allowed' : 'pointer',
          background: sending ? '#64748b' : '#ff3355',
          color: '#0a0f1e', border:'none',
        }}
      >
        {sending ? 'PARSING…' : '⚠ SEND DISTRESS'}
      </button>

      {error && (
        <div style={{
          padding:'8px 10px', background:'#ff335522', border:'1px solid #ff335555',
          borderRadius:4, color:'#ff3355', fontSize:11, fontFamily:'JetBrains Mono, monospace',
        }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{
          marginTop:6, padding:12, background:'#0a0f1e',
          border:`1px solid ${sevColor}55`, borderRadius:8,
          display:'flex', flexDirection:'column', gap:4,
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <span style={{ fontSize:10, color:'#64748b', letterSpacing:2, fontFamily:'JetBrains Mono, monospace', fontWeight:700 }}>
              AI ANALYSIS
            </span>
            <span style={{
              background:`${sevColor}22`, color:sevColor, border:`1px solid ${sevColor}55`,
              borderRadius:4, padding:'2px 8px', fontSize:10, fontWeight:700, letterSpacing:2,
              fontFamily:'JetBrains Mono, monospace',
            }}>
              {result.severity?.toUpperCase()}
            </span>
          </div>
          <Row k="ISSUE"     v={result.issueType} />
          <Row k="INJURED"   v={result.injuredCount} color={result.injuredCount > 0 ? '#ff3355' : '#e2e8f0'} />
          <Row k="DAMAGE"    v={result.damageEstimate} />
          <div style={{ marginTop:6, padding:'8px 10px', background:'#0d1526', border:'1px solid #1e3a5f', borderRadius:4 }}>
            <div style={{ fontSize:10, color:'#64748b', letterSpacing:1, fontFamily:'JetBrains Mono, monospace', marginBottom:4 }}>
              RECOMMENDED ACTION
            </div>
            <div style={{ color:'#e2e8f0', fontSize:12, lineHeight:1.5 }}>{result.recommendedAction}</div>
          </div>
        </div>
      )}
    </div>
  )
}
