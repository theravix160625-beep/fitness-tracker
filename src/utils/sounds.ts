type OscType = OscillatorType

function tone(freq: number, duration: number, delay = 0, type: OscType = 'sine', volume = 0.15) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.value = freq
    const t = ctx.currentTime + delay
    gain.gain.setValueAtTime(volume, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
    osc.start(t)
    osc.stop(t + duration)
  } catch {}
}

export function playClick() {
  tone(900, 0.04, 0, 'sine', 0.08)
}

export function playSave() {
  tone(523, 0.15, 0, 'sine', 0.12)
  tone(659, 0.15, 0.1, 'sine', 0.12)
  tone(784, 0.2, 0.2, 'sine', 0.14)
}

export function playDelete() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.25)
  } catch {}
}

export function playAchievement() {
  // Four-note fanfare: C-E-G-C
  ;[523, 659, 784, 1047].forEach((freq, i) => tone(freq, 0.3, i * 0.13, 'sine', 0.18))
}

export function playMilestone() {
  // C major arpeggio going up fast
  ;[523, 659, 784, 1047, 1319].forEach((freq, i) => tone(freq, 0.25, i * 0.09, 'sine', 0.2))
}
