import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

// Singleton — created once at module load, shared by all hooks/components
export const socket = io(URL, { transports: ['websocket', 'polling'] })

export function useSocket() {
  const [connected, setConnected] = useState(socket.connected)

  useEffect(() => {
    function onConnect()    { setConnected(true) }
    function onDisconnect() { setConnected(false) }
    socket.on('connect',    onConnect)
    socket.on('disconnect', onDisconnect)
    return () => {
      socket.off('connect',    onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  return {
    socket,
    connected,
    emit: (event, data) => socket.emit(event, data),
  }
}
