import { useState, useEffect } from 'react'
import { QUOTES } from '../data/quotes'
import quoteCardBack from '../assets/quote-card-back.png'

// flipKey changes whenever we want to trigger a new flip (new round or second chance)
export default function QuoteCard({ quote, flipKey, highlight }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [displayedQuote, setDisplayedQuote] = useState(quote)

  useEffect(() => {
    // New quote arrived — reset to back, then flip to front
    setIsFlipped(false)
    const revealTimer = setTimeout(() => {
      setDisplayedQuote(quote)
      setIsFlipped(true)
    }, 1400) // show back for 1.4s, then flip
    return () => clearTimeout(revealTimer)
  }, [flipKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const quoteImage = QUOTES[displayedQuote]

  return (
    <div className="quote-card-scene">
      <div className={`quote-card-3d ${isFlipped ? 'quote-card-revealed' : ''}`}>

        {/* Back: Words of Wisdom */}
        <div className="quote-card-face quote-card-face-back">
          <div className={`quote-card-physical${highlight === 'pulse' ? ' quote-card-highlight-pulse' : highlight === 'solid' ? ' quote-card-highlight-solid' : ''}`}>
            <img src={quoteCardBack} alt="Words of Wisdom" className="quote-card-back-img" />
          </div>
        </div>

        {/* Front: the quote */}
        <div className="quote-card-face quote-card-face-front">
          <div className={`quote-card-physical${highlight === 'pulse' ? ' quote-card-highlight-pulse' : highlight === 'solid' ? ' quote-card-highlight-solid' : ''}`}>
            <div className="quote-card-quote-wrap">
              <img
                src={quoteImage}
                alt="Words of Wisdom card"
                className="quote-card-quote-img"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
