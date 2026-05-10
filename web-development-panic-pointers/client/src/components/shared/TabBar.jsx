export default function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display:'flex', gap:2, background:'#0a0f1e',
      borderBottom:'1px solid #1e3a5f', padding:'0 16px', flexShrink:0,
    }}>
      {tabs.map(tab => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              background:'none', border:'none', cursor:'pointer',
              padding:'10px 16px', fontSize:12, fontFamily:'JetBrains Mono, monospace',
              fontWeight:600, letterSpacing:1,
              color: isActive ? '#00d4ff' : '#64748b',
              borderBottom: isActive ? '2px solid #00d4ff' : '2px solid transparent',
              transition:'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
