import { useEffect, useRef } from 'react'

// Smoothly moves a Leaflet marker to a new target position each tick.
// Directly calls marker.setLatLng() via ref — no React re-renders.
export function useMarkerInterpolation(markerRef, targetLat, targetLon) {
  const display = useRef([targetLat, targetLon])
  const target  = useRef([targetLat, targetLon])
  const raf     = useRef(null)

  useEffect(() => {
    target.current = [targetLat, targetLon]
  }, [targetLat, targetLon])

  useEffect(() => {
    function tick() {
      const [dLat, dLon] = display.current
      const [tLat, tLon] = target.current
      const dLa = tLat - dLat
      const dLo = tLon - dLon

      if (markerRef.current && (Math.abs(dLa) > 1e-8 || Math.abs(dLo) > 1e-8)) {
        const f    = 0.07          // lerp factor — ~1s to settle at 60fps
        const nLat = dLat + dLa * f
        const nLon = dLon + dLo * f
        display.current = [nLat, nLon]
        markerRef.current.setLatLng([nLat, nLon])
      }

      raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
