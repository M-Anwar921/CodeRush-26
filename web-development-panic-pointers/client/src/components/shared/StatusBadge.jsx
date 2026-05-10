const STATUS_MAP = {
  underway:          { label: 'UNDERWAY',     color: '#00d4ff' },
  low_fuel:          { label: 'LOW FUEL',     color: '#ffaa00' },
  distress:          { label: 'DISTRESS',     color: '#ff3355' },
  in_zone:           { label: 'ZONE BREACH',  color: '#ff3355' },
  rerouting:         { label: 'REROUTING',    color: '#ffaa00' },
  stranded:          { label: 'STRANDED',     color: '#ff3355' },
  insufficient_fuel: { label: 'FUEL CRITICAL',color: '#ff3355' },
  arrived:           { label: 'ARRIVED',      color: '#00ff88' },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const { label, color } = STATUS_MAP[status] ?? { label: status?.toUpperCase(), color: '#64748b' }
  const fontSize = size === 'lg' ? 13 : 11

  return (
    <span style={{
      background: `${color}22`,
      color,
      border: `1px solid ${color}55`,
      borderRadius: 4,
      padding: size === 'lg' ? '4px 12px' : '2px 8px',
      fontSize,
      fontFamily: 'JetBrains Mono, monospace',
      fontWeight: 600,
      letterSpacing: 1,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}
