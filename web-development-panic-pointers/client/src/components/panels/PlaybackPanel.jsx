import { useEffect, useRef, useState } from 'react'

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

const inp = {
  width:'100%', accentColor:'#00d4ff', cursor:'pointer',
}

export default function PlaybackPanel({ onPreview, onExit }) {
  const [snapshots, setSnapshots] = useState([])
  const [idx,       setIdx]       = useState(0)
  const [playing,   setPlaying]   = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const timer = useRef(null)

  // Fetch snapshots on mount and refresh every 30s
  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const res  = await fetch(`${SERVER}/api/snapshots`)
        const json = await res.json()
        if (!alive) return
        setSnapshots(json.snapshots || [])
        setLoading(false)
      } catch (e) {
        if (!alive) return
        setError('Could not load snapshots')
        setLoading(false)
      }
    }
    load()
    const iv = setInterval(load, 30000)
    return () => { alive = false; clearInterval(iv) }
  }, [])

  // Push the focused snapshot up to MapView via callback
  useEffect(() => {
    if (snapshots.length === 0) {
      onPreview?.(null)
      return
    }
    const snap = snapshots[Math.min(idx, snapshots.length - 1)]
    onPreview?.(snap)
  }, [idx, snapshots, onPreview])

  // Auto-advance when playing
  useEffect(() => {
    if (!playing) {
      if (timer.current) { clearInterval(timer.current); timer.current = null }
      return
    }
    timer.current = setInterval(() => {
      setIdx(i => {
        if (i + 1 >= snapshots.length) { setPlaying(false); return i }
        return i + 1
      })
    }, 800)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [playing, snapshots.length])

  // Reset preview on unmount
  useEffect(() => () => onPreview?.(null), [onPreview])

  if (loading) {
    return <div style={{ padding:16, color:'#64748b', fontFamily:'JetBrains Mono, monospace', fontSize:12 }}>Loading snapshots…</div>
  }

  if (error || snapshots.length === 0) {
    return (
      <div style={{ padding:16, color:'#64748b', fontFamily:'JetBrains Mono, monospace', fontSize:12, textAlign:'center' }}>
        {error || 'No snapshots yet — server records every 30s.'}
      </div>
    )
  }

  const snap   = snapshots[Math.min(idx, snapshots.length - 1)]
  const first  = new Date(snapshots[0].timestamp)
  const cur    = new Date(snap.timestamp)
  const elapsed = Math.round((cur - first) / 1000)

  return (
    <div style={{ padding:14, display:'flex', flexDirection:'column', gap:12, height:'100%', overflowY:'auto' }}>
      <div style={{ fontSize:10, letterSpacing:2, color:'#64748b', fontFamily:'JetBrains Mono, monospace', fontWeight:700 }}>
        TIMELINE — {snapshots.length} SNAPSHOTS
      </div>

      <div style={{
        background:'#0a0f1e', border:'1px solid #1e3a5f', borderRadius:8, padding:'10px 12px',
        fontFamily:'JetBrains Mono, monospace', fontSize:12, color:'#e2e8f0',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span style={{ color:'#64748b' }}>FRAME</span>
          <span>{idx + 1} / {snapshots.length}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
          <span style={{ color:'#64748b' }}>TIME</span>
          <span>{cur.toLocaleTimeString()}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
          <span style={{ color:'#64748b' }}>ELAPSED</span>
          <span>+{Math.floor(elapsed / 60)}m {elapsed % 60}s</span>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(0, snapshots.length - 1)}
        value={idx}
        onChange={e => setIdx(Number(e.target.value))}
        style={inp}
      />

      <div style={{ display:'flex', gap:8 }}>
        <button
          onClick={() => setPlaying(p => !p)}
          style={{
            flex:1, padding:'8px 0', borderRadius:6, fontWeight:700, letterSpacing:1,
            fontFamily:'JetBrains Mono, monospace', fontSize:12,
            background: playing ? '#ffaa00' : '#00d4ff', color:'#0a0f1e', border:'none',
            cursor:'pointer',
          }}
        >
          {playing ? '⏸ PAUSE' : '▶ PLAY'}
        </button>
        <button
          onClick={() => { setIdx(0); setPlaying(false) }}
          style={{
            flex:1, padding:'8px 0', borderRadius:6, fontWeight:700, letterSpacing:1,
            fontFamily:'JetBrains Mono, monospace', fontSize:12,
            background:'none', color:'#64748b', border:'1px solid #1e3a5f',
            cursor:'pointer',
          }}
        >
          ⏮ RESET
        </button>
        <button
          onClick={() => { setPlaying(false); onExit?.() }}
          style={{
            flex:1, padding:'8px 0', borderRadius:6, fontWeight:700, letterSpacing:1,
            fontFamily:'JetBrains Mono, monospace', fontSize:12,
            background:'none', color:'#ff3355', border:'1px solid #ff335555',
            cursor:'pointer',
          }}
        >
          ✕ LIVE
        </button>
      </div>
    </div>
  )
}
