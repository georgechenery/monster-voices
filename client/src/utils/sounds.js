// Sound effect utility
// Drop MP3 files into src/assets/sounds/ with these exact names.
// Any missing file is silently ignored — sounds are purely cosmetic.

const modules = {
  deal:      () => import('../assets/sounds/deal.ogg'),
  pick:      () => import('../assets/sounds/pick.ogg'),
  correct:   () => import('../assets/sounds/correct.ogg'),
  wrong:     () => import('../assets/sounds/wrong.ogg'),
  your_turn: () => import('../assets/sounds/your_turn.ogg'),
  wager:     () => import('../assets/sounds/wager.ogg'),
  game_over: () => import('../assets/sounds/game_over.ogg'),
  tick:      () => import('../assets/sounds/tick.ogg'),
  drumroll:  () => import('../assets/sounds/drumroll.mp3'),
}

// Cache resolved URLs after first load
const urlCache = {}

async function getUrl(name) {
  if (urlCache[name]) return urlCache[name]
  try {
    const mod = await modules[name]?.()
    if (mod) urlCache[name] = mod.default
    return urlCache[name]
  } catch {
    return null // file not present yet — silent
  }
}

// Global SFX mute flag — toggled from App
let _sfxMuted = false
export function setSfxMuted(muted) { _sfxMuted = muted }

// Preload all sounds once on first call (fire-and-forget)
let preloaded = false
export function preloadSounds() {
  if (preloaded) return
  preloaded = true
  // Resolve and cache all asset URLs (including drumroll) so they're instant at play time
  Object.keys(modules).forEach(name => getUrl(name))
}

/**
 * Play a sound by name.
 * @param {string} name       Key from the modules map above
 * @param {number} [delay=0]  Optional delay in milliseconds
 * @param {number} [volume=1] Volume 0–1
 */
export async function playSound(name, delay = 0, volume = 1) {
  if (_sfxMuted) return
  const url = await getUrl(name)
  if (!url) return
  const play = () => {
    const audio = new Audio(url)
    audio.volume = Math.max(0, Math.min(1, volume))
    audio.play().catch(() => {}) // swallow autoplay / permission errors
  }
  if (delay > 0) {
    setTimeout(play, delay)
  } else {
    play()
  }
}

/**
 * Play the card-deal sound staggered across 9 cards,
 * matching the CSS animation delay of position * 225ms.
 */
export function playDealSounds() {
  for (let i = 0; i < 9; i++) {
    playSound('deal', i * 225)
  }
}

// Drumroll — total duration of the file in seconds
const DRUMROLL_TOTAL_S = 8.76
let _drumrollEl = null

/**
 * Play the tail end of the drumroll so the crash lands after suspenseMs milliseconds.
 * Creates a fresh Audio element each call (URL is served from Vite bundle cache so
 * it's instant), waits for loadedmetadata before seeking so currentTime is reliable.
 */
export async function playDrumroll(suspenseMs = 800) {
  if (_sfxMuted) return

  const url = urlCache['drumroll'] || await getUrl('drumroll')
  if (!url) return

  // Stop any previous drumroll
  stopDrumroll()

  const audio = new Audio(url)
  _drumrollEl = audio

  const startAt = Math.max(0, DRUMROLL_TOTAL_S - suspenseMs / 1000)

  // Seek after metadata loads — only then is currentTime reliable
  audio.addEventListener('loadedmetadata', () => {
    // Guard: stopDrumroll may have nulled _drumrollEl while we waited
    if (_drumrollEl !== audio) return
    audio.currentTime = startAt
    audio.play().catch(() => {})
  }, { once: true })

  audio.load()
}

export function stopDrumroll() {
  if (_drumrollEl) {
    _drumrollEl.pause()
    _drumrollEl = null
  }
}
