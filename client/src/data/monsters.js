export const MONSTER_COUNT = 308

// URL paths served from public/monsters/ — no static imports needed.
// Only the 9 chosen per round are ever fetched by the browser.
export const MONSTERS = Array.from(
  { length: MONSTER_COUNT },
  (_, i) => `/monsters/monster-${i + 1}.jpg`
)
