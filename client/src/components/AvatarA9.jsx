import svgRaw from '../assets/avatar9.svg?raw'

// Strip the outer <svg> tag — keep all inner content (groups + paths + styles)
const INNER = svgRaw.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')

export default function AvatarA9({ className, style, emoteId }) {
  const e = emoteId

  return (
    <svg
      viewBox="0 0 90 104"
      xmlns="http://www.w3.org/2000/svg"
      className={[className, e ? `a9-emote-${e}` : ''].filter(Boolean).join(' ')}
      style={style}
    >
      {/*
        .a9-character wraps all vector paths.
        Per-emote CSS animates THIS group — so only the character moves.
        Text overlays are siblings (outside this group) and stay fixed.
      */}
      <g className="a9-character" dangerouslySetInnerHTML={{ __html: INNER }} />

      {/* ── Per-emote overlays (outside .a9-character — they don't move) ── */}

      {/* LAUGH: three staggered HAs — big, covering character */}
      {e === 'laugh' && (
        <>
          <text className="a9-ha a9-ha-1" x="35" y="42"
            textAnchor="middle"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="26" fill="#161616"
            stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a9-ha a9-ha-2" x="60" y="63"
            textAnchor="middle"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="26" fill="#161616"
            stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a9-ha a9-ha-3" x="32" y="82"
            textAnchor="middle"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="26" fill="#161616"
            stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
        </>
      )}

      {/* CHEER: eight black stars scattered (character spins behind them) */}
      {e === 'cheer' && (
        <>
          <text className="a9-star a9-star-1" x="20" y="34"
            textAnchor="middle" fontSize="16"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a9-star a9-star-2" x="62" y="32"
            textAnchor="middle" fontSize="18"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a9-star a9-star-3" x="70" y="72"
            textAnchor="middle" fontSize="16"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a9-star a9-star-4" x="22" y="74"
            textAnchor="middle" fontSize="14"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a9-star a9-star-5" x="50" y="18"
            textAnchor="middle" fontSize="18"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a9-star a9-star-6" x="74" y="50"
            textAnchor="middle" fontSize="14"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a9-star a9-star-7" x="16" y="52"
            textAnchor="middle" fontSize="14"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a9-star a9-star-8" x="44" y="88"
            textAnchor="middle" fontSize="14"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
        </>
      )}

      {/* SHOCKED: one big centred ! swings like a punching bag from its dot */}
      {e === 'shocked' && (
        <text className="a9-bang" x="45" y="100"
          textAnchor="middle"
          fontFamily="MonsterHeadline, sans-serif"
          fontSize="120" fill="#161616"
          stroke="white" strokeWidth="3" paintOrder="stroke">!</text>
      )}

      {/* BOO: ticker scrolls right-to-left while character is flipped; thumbs appear on sides */}
      {e === 'boo' && (
        <>
          {/* Ticker starts off-screen right (x=92 clipped by viewBox), scrolls left.
              animateTransform uses SVG user units so it scales correctly with the avatar. */}
          <text className="a9-boo-text" x="92" y="54"
            textAnchor="start"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="26" fill="#161616"
            stroke="white" strokeWidth="0.8" paintOrder="stroke">
            BOOOOOOOOOOOOOOO
          </text>
          <text className="a9-boo-thumb a9-boo-thumb-l" x="14" y="77"
            textAnchor="middle" fontSize="20">👎</text>
          <text className="a9-boo-thumb a9-boo-thumb-r" x="76" y="77"
            textAnchor="middle" fontSize="20">👎</text>
        </>
      )}

      {/* LOVE: three hearts rise and fade */}
      {e === 'love' && (
        <>
          <text className="a9-heart a9-heart-1" x="33" y="65"
            textAnchor="middle" fontSize="14"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a9-heart a9-heart-2" x="50" y="68"
            textAnchor="middle" fontSize="11"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a9-heart a9-heart-3" x="63" y="60"
            textAnchor="middle" fontSize="15"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
        </>
      )}

      {/* THINK: three ?s staggered — upper-right, upper-left, lower-center */}
      {e === 'think' && (
        <>
          <text className="a9-think-q a9-think-q-1" x="64" y="38"
            textAnchor="middle"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="22" fill="#161616"
            stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a9-think-q a9-think-q-2" x="24" y="40"
            textAnchor="middle"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="22" fill="#161616"
            stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a9-think-q a9-think-q-3" x="52" y="72"
            textAnchor="middle"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="22" fill="#161616"
            stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
        </>
      )}
    </svg>
  )
}
