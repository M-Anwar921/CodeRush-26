import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import TabBar from '../components/shared/TabBar'
import MapView from '../components/map/MapView'
import ShipDetailPanel from '../components/panels/ShipDetailPanel'
import DirectivesPanel from '../components/captain/DirectivesPanel'
import DistressPanel from '../components/captain/DistressPanel'
import StatusBadge from '../components/shared/StatusBadge'
import FuelBar from '../components/shared/FuelBar'
import { useShips } from '../hooks/useShips'
import { socket } from '../hooks/useSocket'

const TABS = [
  { id:'myship',     label:'MY SHIP'    },
  { id:'directives', label:'DIRECTIVES' },
  { id:'distress',   label:'DISTRESS'   },
]

const PORTS = {
  'KWT-1':'Kuwait City', 'BUS-1':'Bushehr', 'DMM-1':'Dammam', 'BAH-1':'Manama',
  'DOH-1':'Doha', 'AUH-1':'Abu Dhabi', 'DXB-1':'Jebel Ali',
  'BND-1':'Bandar Abbas', 'SOH-1':'Sohar', 'MCT-1':'Muscat',
}

const ROW_ITEMS = (ship) => [
  ['POSITION', `${ship.lat.toFixed(4)}°N  ${ship.lon.toFixed(4)}°E`],
  ['SPEED',    `${ship.speed} kn`],
  ['HEADING',  `${ship.heading}°`],
  ['DEST',     PORTS[ship.dest] ?? ship.dest],
  ['CARGO',    ship.cargo],
]

export default function Captain() {
  const { shipId } = useParams()
  const { ships }  = useShips()
  const [selectedShip, setSelectedShip] = useState(null)
  const [tab,          setTab]          = useState('myship')

  const [directives, setDirectives] = useState([])
  const [responded,  setResponded]  = useState({})

  useEffect(() => {
    const onDirective = (d) => {
      if (d.shipId !== shipId) return
      setDirectives(prev => [d, ...prev].slice(0, 10))
    }
    const onResponse = (r) => {
      if (r.shipId !== shipId) return
      setResponded(prev => ({ ...prev, [r.directiveId]: r.response }))
    }
    socket.on('directive_sent',     onDirective)
    socket.on('directive_response', onResponse)
    return () => {
      socket.off('directive_sent',     onDirective)
      socket.off('directive_response', onResponse)
    }
  }, [shipId])

  const handleRespond = (directive, response) => {
    socket.emit('directive_response', {
      directiveId: directive.id,
      shipId:      directive.shipId,
      response,
      timestamp:   new Date().toISOString(),
    })
    setResponded(prev => ({ ...prev, [directive.id]: response }))
  }

  const myShip       = ships.find(s => s.id === shipId) ?? null
  const liveSelected = selectedShip
    ? ships.find(s => s.id === selectedShip.id) ?? selectedShip
    : null

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#0a0f1e', overflow:'hidden' }}>
      <Navbar role="captain" shipId={shipId} shipName={myShip?.name} />

      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>
        <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
          <MapView ships={ships} onShipSelect={setSelectedShip} focusShipId={shipId} role="captain" />
          {liveSelected && liveSelected.id !== shipId && (
            <ShipDetailPanel ship={liveSelected} onClose={() => setSelectedShip(null)} />
          )}
        </div>

        <div style={{ width:300, display:'flex', flexDirection:'column', borderLeft:'1px solid #1e3a5f', background:'#0d1526', overflow:'hidden' }}>
          <TabBar tabs={TABS} active={tab} onChange={setTab} />
          <div style={{ flex:1, overflow:'hidden' }}>

            <div style={{ display: tab === 'myship' ? 'flex' : 'none', flexDirection:'column', height:'100%', overflowY:'auto' }}>
              {myShip && (
                <div style={{ padding:16, display:'flex', flexDirection:'column', gap:12, boxSizing:'border-box' }}>
                  <div>
                    <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:18, color:'#e2e8f0' }}>{myShip.name}</div>
                    <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'#64748b', marginTop:2 }}>{myShip.id}</div>
                  </div>
                  <StatusBadge status={myShip.status} size="lg" />
                  {ROW_ITEMS(myShip).map(([label, value]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #1e3a5f' }}>
                      <span style={{ color:'#64748b', fontSize:11, fontFamily:'JetBrains Mono, monospace', letterSpacing:1 }}>{label}</span>
                      <span style={{ color:'#e2e8f0', fontSize:12, fontFamily:'JetBrains Mono, monospace', textAlign:'right' }}>{value}</span>
                    </div>
                  ))}
                  <FuelBar fuel={myShip.fuel} />
                  {myShip.weatherPenalty && (
                    <div style={{ padding:'6px 10px', background:'#ffaa0022', border:'1px solid #ffaa0044', borderRadius:6, fontSize:11, color:'#ffaa00', fontFamily:'JetBrains Mono, monospace' }}>
                      ⚠ ADVERSE WEATHER — +30% fuel burn
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: tab === 'directives' ? 'block' : 'none', height:'100%', overflow:'hidden' }}>
              <DirectivesPanel
                directives={directives}
                responded={responded}
                onRespond={handleRespond}
              />
            </div>

            <div style={{ display: tab === 'distress' ? 'block' : 'none', height:'100%', overflow:'hidden' }}>
              <DistressPanel shipId={shipId} shipName={myShip?.name} />
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
