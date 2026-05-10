// Web Audio API — soft beep for warnings, klaxon for emergencies.
// AudioContext starts suspended in most browsers; we resume on first user
// gesture (any click). Failures are silent — sound is non-essential.
let ctx = null

function ensureCtx() {
  if (ctx) return ctx
  try {
    const Klass = window.AudioContext || window.webkitAudioContext
    if (!Klass) return null
    ctx = new Klass()
    const resume = () => { ctx.resume?.(); window.removeEventListener('click', resume) }
    window.addEventListener('click', resume, { once: true })
    return ctx
  } catch { return null }
}

function tone({ freq = 880, duration = 200, volume = 0.15, type = 'sine', delay = 0 }) {
  const c = ensureCtx()
  if (!c || c.state === 'suspended') return
  try {
    const start = c.currentTime + delay / 1000
    const end   = start + duration / 1000
    const osc   = c.createOscillator()
    const gain  = c.createGain()
    osc.type            = type
    osc.frequency.value = freq
    osc.connect(gain)
    gain.connect(c.destination)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01)
    gain.gain.setValueAtTime(volume, end - 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    osc.start(start)
    osc.stop(end + 0.02)
  } catch { /* silent */ }
}

// Soft two-tone notification — non-critical alerts (e.g. high distress).
export function playCriticalBeep() {
  tone({ freq: 660, duration: 150, volume: 0.18, type: 'sine', delay:   0 })
  tone({ freq: 990, duration: 250, volume: 0.18, type: 'sine', delay: 160 })
}

// Klaxon-style emergency alarm — geofence breach + critical distress.
// Square-wave alternating high/low repeated four times. Loud, harsh, urgent.
export function playEmergencyAlarm() {
  const HI = 880
  const LO = 440
  const STEP = 180
  const VOL = 0.32
  const pattern = [HI, LO, HI, LO, HI, LO]
  let delay = 0
  for (const f of pattern) {
    tone({ freq: f, duration: STEP - 20, volume: VOL, type: 'square', delay })
    delay += STEP
  }
}
