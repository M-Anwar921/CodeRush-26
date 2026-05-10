import { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '../components/shared/Navbar'
import TabBar from '../components/shared/TabBar'
import MapView from '../components/map/MapView'
import ShipDetailPanel from '../components/panels/ShipDetailPanel'
import FleetPanel from '../components/panels/FleetPanel'
import AlertPanel from '../components/panels/AlertPanel'
import ZonesPanel from '../components/panels/ZonesPanel'
import PlaybackPanel from '../components/panels/PlaybackPanel'
import DirectiveSender from '../components/command/DirectiveSender'
import SummaryBar from '../components/command/SummaryBar'
import { useShips } from '../hooks/useShips'
import { socket } from '../hooks/useSocket'
import { playCriticalBeep, playEmergencyAlarm } from '../lib/sound'

const TABS = [
  { id:'fleet',     label:'FLEET'     },
  { id:'alerts',    label:'ALERTS'    },
  { id:'zones',     label:'ZONES'     },
  { id:'directive', label:'DIRECTIVE' },
  { id:'playback',  label:'PLAYBACK'  },
]

// Returns 'emergency' for danger-zone breaches and critical distress (klaxon),
// 'beep' for high-severity distress (soft chime), null for the rest.
function alertSound(alert) {
  if (!alert) return null
  if (alert.type === 'geofence') return 'emergency'
  if (alert.type === 'distress') {
    const sev = alert.analysis?.severity ?? alert.severity
    if (sev === 'critical') return 'emergency'
    if (sev === 'high')     return 'beep'
  }
  return null
}

export default function Command() {
  const { ships } = useShips()
  const [selectedShip,    setSelectedShip]    = useState(null)
  const [alerts,          setAlerts]          = useState([])
  const [zones,           setZones]           = useState([])
  const [tab,             setTab]             = useState('fleet')
  const [replaySnapshot,  setReplaySnapshot]  = useState(null)
  const seenInitial = useRef(false)

  useEffect(() => {
    const onSync   = (list) => { setAlerts(list || []); seenInitial.current = true }
    const onAlert  = (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 200))
      if (seenInitial.current) {
        const kind = alertSound(alert)
        if (kind === 'emergency') playEmergencyAlarm()
        else if (kind === 'beep') playCriticalBeep()
      }
    }
    const onAck    = ({ alertId }) =>
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a))
    const onAckBulk = ({ ids }) =>
      setAlerts(prev => prev.map(a => ids.includes(a.id) ? { ...a, acknowledged: true } : a))
    const onCleared = () => setAlerts([])

    const onZonesSync   = (list)   => setZones(list)
    const onZoneAdded   = (zone)   => setZones(prev => [...prev.filter(z => z.id !== zone.id), zone])
    const onZoneRemoved = (zoneId) => setZones(prev => prev.filter(z => z.id !== zoneId))

    socket.on('alerts_sync',     onSync)
    socket.on('alert',           onAlert)
    socket.on('alert_ack',       onAck)
    socket.on('alerts_ack_bulk', onAckBulk)
    socket.on('alerts_cleared',  onCleared)
    socket.on('zones_sync',      onZonesSync)
    socket.on('zone_added',      onZoneAdded)
    socket.on('zone_removed',    onZoneRemoved)
    socket.emit('request_zones')
    socket.emit('request_alerts')

    return () => {
      socket.off('alerts_sync',     onSync)
      socket.off('alert',           onAlert)
      socket.off('alert_ack',       onAck)
      socket.off('alerts_ack_bulk', onAckBulk)
      socket.off('alerts_cleared',  onCleared)
      socket.off('zones_sync',      onZonesSync)
      socket.off('zone_added',      onZoneAdded)
      socket.off('zone_removed',    onZoneRemoved)
    }
  }, [])

  const handleAck     = (id) => socket.emit('alert_ack', { alertId: id })
  const handleClear   = ()   => socket.emit('alerts_clear')
  const handlePreview = useCallback((snap) => setReplaySnapshot(snap), [])
  const handleExit    = useCallback(() => { setReplaySnapshot(null); setTab('fleet') }, [])

  const liveSelected = selectedShip
    ? ships.find(s => s.id === selectedShip.id) ?? selectedShip
    : null
  const latestActive = alerts.find(a => !a.acknowledged)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#0a0f1e', overflow:'hidden' }}>
      <Navbar role="command" />

      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>
        <div style={{ flex:1, position:'relative', overflow:'hidden', minWidth:0 }}>
          <MapView ships={ships} onShipSelect={setSelectedShip} role="command"
            focusShipId={liveSelected?.id} replaySnapshot={replaySnapshot} />

          {liveSelected && !replaySnapshot && (
            <ShipDetailPanel ship={liveSelected} onClose={() => setSelectedShip(null)} />
          )}

          {latestActive && !replaySnapshot && (
            <div onClick={() => setTab('alerts')}
              style={{
                position:'absolute', bottom:24, left:'50%', transform:'translateX(-50%)',
                zIndex:2000, background:'#1a0810',
                border:`1px solid ${latestActive.type === 'proximity' ? '#ffaa00' : '#ff3355'}`,
                borderRadius:8, padding:'10px 20px', cursor:'pointer',
                display:'flex', alignItems:'center', gap:16,
                boxShadow:'0 4px 24px rgba(255,51,85,0.3)',
                fontFamily:'JetBrains Mono, monospace', fontSize:13, maxWidth:'80vw',
              }}>
              <span style={{ color: latestActive.type === 'proximity' ? '#ffaa00' : '#ff3355', fontWeight:700 }}>
                ⚠ {latestActive.type?.toUpperCase()}
              </span>
              <span style={{ color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {latestActive.message}
              </span>
              <button onClick={e => { e.stopPropagation(); handleAck(latestActive.id) }}
                style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:16 }}>✕</button>
            </div>
          )}
        </div>

        <div className="cmd-sidebar" style={{
          width:320, display:'flex', flexDirection:'column',
          borderLeft:'1px solid #1e3a5f', background:'#0d1526', overflow:'hidden',
        }}>
          <SummaryBar ships={ships} />
          <TabBar tabs={TABS} active={tab} onChange={setTab} />
          <div style={{ flex:1, overflow:'hidden' }}>
            {tab === 'fleet'     && <FleetPanel ships={ships} onShipSelect={setSelectedShip} />}
            {tab === 'alerts'    && <AlertPanel alerts={alerts} onAck={handleAck} onClear={handleClear} />}
            {tab === 'zones'     && <ZonesPanel zones={zones} />}
            {tab === 'directive' && <DirectiveSender ships={ships} />}
            {tab === 'playback'  && <PlaybackPanel onPreview={handlePreview} onExit={handleExit} />}
          </div>
        </div>
      </div>
    </div>
  )
}
