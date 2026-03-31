import q110 from '../assets/quote-110.png'
import q111 from '../assets/quote-111.png'
import q112 from '../assets/quote-112.png'

// Map quote text to its card image
export const QUOTE_IMAGES = {
  "My family is very normal": q110,
  "Be your own best friend": q111,
  "Who's going to drink the yogurt water?": q112,
}

export function getQuoteImage(text) {
  return QUOTE_IMAGES[text] || null
}
