import svgRaw from '../assets/avatar4.svg?raw'

// Strip the outer <svg> tag — keep all inner content (groups + paths + styles)
const INNER = svgRaw.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')

export default function AvatarA4({ className, style, emoteId }) {
  const e = emoteId

  return (
    <svg
      viewBox="-6 -4 76 82"
      xmlns="http://www.w3.org/2000/svg"
      className={[className, e ? `a4-emote-${e}` : ''].filter(Boolean).join(' ')}
      style={style}
    >
      {/*
        .a4-character wraps all vector paths.
        Per-emote CSS animates THIS group — so only the character moves.
        Text overlays are siblings (outside this group) and stay fixed.
      */}
      <g className="a4-character" dangerouslySetInnerHTML={{ __html: INNER }} />

      {/* ── Per-emote overlays (outside .a4-character — they don't move) ── */}

      {/* LAUGH: three staggered HAs — big, covering character */}
      {e === 'laugh' && (
        <>
          <text className="a4-ha a4-ha-1" x="25" y="29"
            textAnchor="middle"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="18" fill="#161616"
            stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a4-ha a4-ha-2" x="43" y="44"
            textAnchor="middle"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="18" fill="#161616"
            stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a4-ha a4-ha-3" x="23" y="57"
            textAnchor="middle"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="18" fill="#161616"
            stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
        </>
      )}

      {/* CHEER: eight black stars scattered (character spins behind them) */}
      {e === 'cheer' && (
        <>
          <text className="a4-star a4-star-1" x="14" y="24"
            textAnchor="middle" fontSize="11"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a4-star a4-star-2" x="44" y="22"
            textAnchor="middle" fontSize="13"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a4-star a4-star-3" x="50" y="50"
            textAnchor="middle" fontSize="11"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a4-star a4-star-4" x="16" y="51"
            textAnchor="middle" fontSize="10"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a4-star a4-star-5" x="36" y="13"
            textAnchor="middle" fontSize="13"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a4-star a4-star-6" x="53" y="35"
            textAnchor="middle" fontSize="10"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a4-star a4-star-7" x="11" y="36"
            textAnchor="middle" fontSize="10"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a4-star a4-star-8" x="31" y="61"
            textAnchor="middle" fontSize="10"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
        </>
      )}

      {/* SHOCKED: one big centred ! swings like a punching bag from its dot */}
      {e === 'shocked' && (
        <text className="a4-bang" x="32" y="68"
          textAnchor="middle"
          fontFamily="MonsterHeadline, sans-serif"
          fontSize="82" fill="#161616"
          stroke="white" strokeWidth="2.5" paintOrder="stroke">!</text>
      )}

      {/* BOO: ticker scrolls right-to-left while character is flipped; thumbs appear on sides */}
      {e === 'boo' && (
        <>
          {/* Ticker starts off-screen right (x=66 clipped by viewBox), scrolls left.
              animateTransform uses SVG user units so it scales correctly with the avatar. */}
          <text className="a4-boo-text" x="66" y="37"
            textAnchor="start"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="18" fill="#161616"
            stroke="white" strokeWidth="0.8" paintOrder="stroke">
            BOOOOOOOOOOOOOOO
          </text>
          <text className="a4-boo-thumb a4-boo-thumb-l" x="10" y="53"
            textAnchor="middle" fontSize="14">👎</text>
          <text className="a4-boo-thumb a4-boo-thumb-r" x="54" y="53"
            textAnchor="middle" fontSize="14">👎</text>
        </>
      )}

      {/* LOVE: three hearts rise and fade */}
      {e === 'love' && (
        <>
          <text className="a4-heart a4-heart-1" x="23" y="45"
            textAnchor="middle" fontSize="14"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a4-heart a4-heart-2" x="36" y="47"
            textAnchor="middle" fontSize="11"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a4-heart a4-heart-3" x="45" y="42"
            textAnchor="middle" fontSize="15"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
        </>
      )}

      {/* THINK: three ?s staggered — upper-right, upper-left, lower-center */}
      {e === 'think' && (
        <>
          <text className="a4-think-q a4-think-q-1" x="46" y="26"
            textAnchor="middle"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="16" fill="#161616"
            stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a4-think-q a4-think-q-2" x="17" y="28"
            textAnchor="middle"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="16" fill="#161616"
            stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a4-think-q a4-think-q-3" x="37" y="50"
            textAnchor="middle"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="16" fill="#161616"
            stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
        </>
      )}
    </svg>
  )
}
