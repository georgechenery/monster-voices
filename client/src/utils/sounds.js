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
