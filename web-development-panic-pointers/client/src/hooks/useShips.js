import { useEffect, useState } from 'react'
import { socket, useSocket } from './useSocket'

export function useShips() {
  const [ships, setShips] = useState([])
  const { connected } = useSocket()

  useEffect(() => {
    socket.on('ship_update', setShips)
    return () => socket.off('ship_update', setShips)
  }, [])

  function getShip(id) { return ships.find(s => s.id === id) ?? null }

  return { ships, getShip, connected }
}
