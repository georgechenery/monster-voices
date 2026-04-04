export const AVATAR_COUNT = 11

// URL paths served from public/avatars/
export const AVATARS = Array.from(
  { length: AVATAR_COUNT },
  (_, i) => `/avatars/a${i + 1}.jpg`
)
