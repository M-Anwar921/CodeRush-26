import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Anchor } from 'lucide-react'
import { useShips } from '../hooks/useShips'

const SHIP_IDS = [
  'MV-1','MV-2','MV-3','MV-4','MV-5',
  'MV-6','MV-7','MV-8','MV-9','MV-10',
  'MV-11','MV-12','MV-13','MV-14','MV-15',
]

const SHIP_NAMES = {
  'MV-1':'Aurora','MV-2':'Borealis','MV-3':'Cygnus','MV-4':'Dragon',
  'MV-5':'Emerald','MV-6':'Falcon','MV-7':'Gharial','MV-8':'Halcyon',
  'MV-9':'Iris','MV-10':'Jade','MV-11':'Kite','MV-12':'Lotus',
  'MV-13':'Mirage','MV-14':'Nova','MV-15':'Orca',
}

export default function Login() {
  const [role, setRole]     = useState(null)
  const [shipId, setShipId] = useState('MV-1')
  const navigate = useNavigate()
  const { connected } = useShips()

  function handleEnter() {
    if (role === 'command') navigate('/command')
    if (role === 'captain') navigate(`/captain/${shipId}`)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0a0f1e', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:32, padding:24 }}>
      {/* Header */}
      <div style={{ textAlign:'center' }}>
        <h1 style={{ fontFamily:'Space Grotesk', fontSize:32, fontWeight:700, color:'#00d4ff', letterSpacing:2 }}>
          STRAIT OF HORMUZ
        </h1>
        <p style={{ color:'#64748b', fontSize:14, marginTop:8, fontFamily:'JetBrains Mono, monospace' }}>
          MARITIME CRISIS COMMAND SYSTEM
        </p>
        <div style={{ marginTop:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background: connected ? '#00ff88' : '#ff3355', boxShadow: connected ? '0 0 8px #00ff88' : '0 0 8px #ff3355' }} />
          <span style={{ color:'#64748b', fontSize:12, fontFamily:'JetBrains Mono, monospace' }}>
            {connected ? 'CONNECTED TO FLEET' : 'CONNECTING…'}
          </span>
        </div>
      </div>

      {/* Role cards */}
      <div style={{ display:'flex', gap:24, flexWrap:'wrap', justifyContent:'center' }}>
        <RoleCard
          icon={<Shield size={36} color="#00d4ff" />}
          title="COMMAND"
          description="Full fleet oversight. Draw restricted zones, send directives, monitor all 15 vessels."
          selected={role === 'command'}
          onClick={() => setRole('command')}
        />
        <RoleCard
          icon={<Anchor size={36} color="#00ff88" />}
          title="CAPTAIN"
          description="Single-vessel view. Receive directives, send distress messages, manage your ship."
          selected={role === 'captain'}
          onClick={() => setRole('captain')}
        />
      </div>

      {/* Ship selector for Captain */}
      {role === 'captain' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'center' }}>
          <label style={{ color:'#64748b', fontSize:12, fontFamily:'JetBrains Mono, monospace', letterSpacing:1 }}>
            SELECT VESSEL
          </label>
          <select
            value={shipId}
            onChange={e => setShipId(e.target.value)}
            style={{
              background:'#0d1526', color:'#e2e8f0', border:'1px solid #1e3a5f',
              borderRadius:8, padding:'10px 16px', fontSize:15, fontFamily:'Space Grotesk, sans-serif',
              cursor:'pointer', minWidth:220,
            }}
          >
            {SHIP_IDS.map(id => (
              <option key={id} value={id}>{id} — {SHIP_NAMES[id]}</option>
            ))}
          </select>
        </div>
      )}

      {/* Enter button */}
      {role && (
        <button
          onClick={handleEnter}
          style={{
            background:'#00d4ff', color:'#0a0f1e', border:'none', borderRadius:8,
            padding:'14px 48px', fontSize:16, fontWeight:700, fontFamily:'Space Grotesk, sans-serif',
            cursor:'pointer', letterSpacing:1, transition:'opacity 0.2s',
          }}
          onMouseOver={e => e.target.style.opacity = 0.85}
          onMouseOut={e => e.target.style.opacity = 1}
        >
          ENTER {role.toUpperCase()}
        </button>
      )}
    </div>
  )
}

function RoleCard({ icon, title, description, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background:'#0d1526',
        border: `2px solid ${selected ? '#00d4ff' : '#1e3a5f'}`,
        borderRadius:12, padding:32, width:260, cursor:'pointer',
        display:'flex', flexDirection:'column', alignItems:'center', gap:16,
        transition:'border-color 0.2s, box-shadow 0.2s',
        boxShadow: selected ? '0 0 24px rgba(0,212,255,0.2)' : 'none',
      }}
    >
      {icon}
      <h2 style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:20, color: selected ? '#00d4ff' : '#e2e8f0', letterSpacing:2 }}>
        {title}
      </h2>
      <p style={{ color:'#64748b', fontSize:13, textAlign:'center', lineHeight:1.6 }}>
        {description}
      </p>
    </div>
  )
}
