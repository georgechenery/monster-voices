export const AVATAR_COUNT = 11

// URL paths served from public/avatars/
export const AVATARS = Array.from(
  { length: AVATAR_COUNT },
  (_, i) => `/avatars/a${i + 1}.jpg`
)

// Avatars hidden from the public selection UI (no SVG yet, etc.)
// Index 6 = A7. Kept in AVATARS so existing data and the dev EmotePreview still work.
const HIDDEN_AVATAR_IDS = new Set([6])

// Use this in the avatar picker — preserves original indices so avatarId values stay stable
export const SELECTABLE_AVATARS = AVATARS.map((url, id) => ({ url, id }))
  .filter(({ id }) => !HIDDEN_AVATAR_IDS.has(id))
