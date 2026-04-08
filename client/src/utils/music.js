import menusSrc from '../assets/music/menus.mp3'
import themeSrc from '../assets/music/theme.mp3'

const VOLUME_NORMAL = 0.4
const VOLUME_DUCKED = 0.07
const FADE_MS       = 700

let menuAudio       = null
let themeAudio      = null
let _current        = null  // 'menus' | 'theme' | null
let _muted          = false  // user's preference toggle
let _gameplayMuted  = false  // gameplay events (recording, listening, drumroll)
let _ducked         = false
let _fadeTimer      = null

function getAudio(track) {
  if (track === 'menus') {
    if (!menuAudio) { menuAudio = new Audio(menusSrc); menuAudio.loop = true }
    return menuAudio
  }
  if (!themeAudio) { themeAudio = new Audio(themeSrc); themeAudio.loop = true }
  return themeAudio
}

function targetVol() {
  if (_muted || _gameplayMuted) return 0
  return _ducked ? VOLUME_DUCKED : VOLUME_NORMAL
}

function fadeTo(audioEl, toVol, ms, onDone) {
  const steps    = 20
  const interval = ms / steps
  const from     = audioEl.volume
  const delta    = (toVol - from) / steps
  let step = 0
  const id = setInterval(() => {
    step++
    audioEl.volume = Math.max(0, Math.min(1, from + delta * step))
    if (step >= steps) {
      clearInterval(id)
      audioEl.volume = toVol
      onDone?.()
    }
  }, interval)
  return id
}

export function playTrack(track) {
  if (_current === track) return

  // Fade out old track
  if (_current) {
    const old = getAudio(_current)
    fadeTo(old, 0, FADE_MS, () => { old.pause(); old.currentTime = 0 })
  }

  _current = track
  const next = getAudio(track)
  next.volume = 0
  next.play().catch(() => {
    // Autoplay blocked — will retry on next user interaction
    document.addEventListener('click', function retry() {
      if (_current === track) {
        next.play().catch(() => {})
        fadeTo(next, targetVol(), FADE_MS)
      }
      document.removeEventListener('click', retry)
    }, { once: true })
  })
  fadeTo(next, targetVol(), FADE_MS)
}

export function stopMusic() {
  if (!_current) return
  const a = getAudio(_current)
  fadeTo(a, 0, FADE_MS, () => a.pause())
  _current = null
}

export function setDucked(ducked) {
  if (_ducked === ducked) return
  _ducked = ducked
  if (_current) fadeTo(getAudio(_current), targetVol(), ducked ? 400 : 900)
}

// User's on/off preference — called from App's toggle button
export function setMusicMuted(muted) {
  _muted = muted
  if (_current) fadeTo(getAudio(_current), targetVol(), 200)
}

// Gameplay mute — called by game views during recording/listening/drumroll suspense.
// Respects user preference: unmuting gameplay never overrides the user's own mute.
export function setGameplayMuted(muted) {
  if (_gameplayMuted === muted) return
  _gameplayMuted = muted
  if (_current) fadeTo(getAudio(_current), targetVol(), muted ? 150 : 400)
}
