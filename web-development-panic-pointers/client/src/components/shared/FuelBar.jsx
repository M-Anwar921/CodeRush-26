const MAX_FUEL = 9000

export default function FuelBar({ fuel, maxFuel = MAX_FUEL, showLabel = true }) {
  const pct = Math.max(0, Math.min(100, (fuel / maxFuel) * 100))
  const color = pct < 10 ? '#ff3355' : pct < 30 ? '#ffaa00' : '#00ff88'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>FUEL</span>
          <span style={{ fontSize: 11, color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            {Math.round(fuel).toLocaleString()} L &nbsp;{pct.toFixed(0)}%
          </span>
        </div>
      )}
      <div style={{ height: 6, background: '#1e3a5f', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 3,
          transition: 'width 0.5s ease, background 0.3s ease',
          boxShadow: `0 0 6px ${color}88`,
        }} />
      </div>
    </div>
  )
}
