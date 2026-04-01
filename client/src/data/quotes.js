export const QUOTE_COUNT = 112

// URL paths served from public/quotes/ — no static imports needed.
export const QUOTES = Array.from(
  { length: QUOTE_COUNT },
  (_, i) => `/quotes/quote-${i + 1}.jpg`
)
