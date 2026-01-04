import { useSettingsStore } from '@/stores/settingsStore'

let audioContext = null
let isInitialized = false

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
  return audioContext
}

function initAudio() {
  if (isInitialized) return
  isInitialized = true
  getAudioContext()
  document.removeEventListener('click', initAudio)
  document.removeEventListener('touchstart', initAudio)
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', initAudio, { once: true })
  document.addEventListener('touchstart', initAudio, { once: true })
}

// Soft tone with exponential decay for natural sound
function playSoftTone(frequency, duration, volume = 0.1) {
  const settingsStore = useSettingsStore()
  if (!settingsStore.soundEnabled) return

  try {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    // Soft attack, natural exponential decay
    const now = ctx.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.008)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration)

    oscillator.start(now)
    oscillator.stop(now + duration)
  } catch (e) {
    // Audio not supported
  }
}

// Gentle wobble for subtle feedback
function playWobble(baseFreq, duration, volume = 0.08) {
  const settingsStore = useSettingsStore()
  if (!settingsStore.soundEnabled) return

  try {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = baseFreq
    oscillator.type = 'sine'

    // Add slight vibrato for warmth
    const vibrato = ctx.createOscillator()
    const vibratoGain = ctx.createGain()
    vibrato.frequency.value = 8
    vibratoGain.gain.value = 15
    vibrato.connect(vibratoGain)
    vibratoGain.connect(oscillator.frequency)

    const now = ctx.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration)

    oscillator.start(now)
    vibrato.start(now)
    oscillator.stop(now + duration)
    vibrato.stop(now + duration)
  } catch (e) {
    // Audio not supported
  }
}

// Soft chord with staggered notes
function playSoftChord(frequencies, duration, volume = 0.08) {
  frequencies.forEach((freq, i) => {
    setTimeout(() => playSoftTone(freq, duration, volume * (1 - i * 0.15)), i * 60)
  })
}

export function useSounds() {
  // Soft plink - gentle and satisfying
  function playFill() {
    playSoftTone(660, 0.06, 0.12)
  }

  // Very subtle tap
  function playMark() {
    playSoftTone(440, 0.04, 0.06)
  }

  // Gentle "nope" - sympathetic, not harsh
  function playWrong() {
    playWobble(220, 0.18, 0.08)
  }

  // Quick sparkle for auto-complete
  function playAutomark() {
    playSoftTone(880, 0.05, 0.08)
    setTimeout(() => playSoftTone(1100, 0.05, 0.06), 40)
  }

  // Gentle celebration - ascending notes
  function playWin() {
    const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => playSoftTone(freq, 0.35, 0.12 - i * 0.02), i * 120)
    })
  }

  // Subtle sparkle for line complete
  function playLineComplete() {
    playSoftTone(880, 0.08, 0.08)
    setTimeout(() => playSoftTone(1047, 0.1, 0.06), 50)
  }

  // Soft chime for hints
  function playHint() {
    playSoftTone(1047, 0.15, 0.08)
  }

  // Sympathetic minor notes - gentle, not punishing
  function playGameOver() {
    const notes = [392, 349, 330, 294] // G4, F4, E4, D4 - descending
    notes.forEach((freq, i) => {
      setTimeout(() => playSoftTone(freq, 0.3, 0.08 - i * 0.015), i * 180)
    })
  }

  function handleSound(type) {
    switch (type) {
      case 'fill': playFill(); break
      case 'mark': playMark(); break
      case 'wrong': playWrong(); break
      case 'automark': playAutomark(); break
      case 'win': playWin(); break
      case 'line': playLineComplete(); break
      case 'gameover': playGameOver(); break
      case 'hint': playHint(); break
    }
  }

  return {
    playFill,
    playMark,
    playWrong,
    playAutomark,
    playWin,
    playLineComplete,
    playHint,
    handleSound
  }
}
