import svgRaw from '../assets/avatar11.svg?raw'

const INNER = svgRaw.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')

export default function AvatarA11({ className, style, emoteId }) {
  const e = emoteId

  return (
    <svg
      viewBox="-4 -4 49 57"
      xmlns="http://www.w3.org/2000/svg"
      className={[className, e ? `a11-emote-${e}` : ''].filter(Boolean).join(' ')}
      style={style}
    >
      <g className="a11-character" dangerouslySetInnerHTML={{ __html: INNER }} />

      {/* LAUGH */}
      {e === 'laugh' && (
        <>
          <text className="a11-ha a11-ha-1" x="15" y="17"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="13" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a11-ha a11-ha-2" x="28" y="26"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="13" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a11-ha a11-ha-3" x="13" y="37"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="13" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
        </>
      )}

      {/* CHEER */}
      {e === 'cheer' && (
        <>
          <text className="a11-star a11-star-1" x="9" y="18"
            textAnchor="middle" fontSize="10"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a11-star a11-star-2" x="31" y="17"
            textAnchor="middle" fontSize="12"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a11-star a11-star-3" x="36" y="36"
            textAnchor="middle" fontSize="10"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a11-star a11-star-4" x="10" y="37"
            textAnchor="middle" fontSize="9"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a11-star a11-star-5" x="22" y="8"
            textAnchor="middle" fontSize="12"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a11-star a11-star-6" x="38" y="26"
            textAnchor="middle" fontSize="9"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a11-star a11-star-7" x="6" y="27"
            textAnchor="middle" fontSize="9"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a11-star a11-star-8" x="21" y="49"
            textAnchor="middle" fontSize="9"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
        </>
      )}

      {/* SHOCKED */}
      {e === 'shocked' && (
        <text className="a11-bang" x="20" y="52"
          textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
          fontSize="60" fill="#161616" stroke="white" strokeWidth="2" paintOrder="stroke">!</text>
      )}

      {/* BOO */}
      {e === 'boo' && (
        <>
          <text className="a11-boo-text" x="44" y="28"
            textAnchor="start"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="12" fill="#161616"
            stroke="white" strokeWidth="0.8" paintOrder="stroke">
            BOOOOOOOOOOOOOOO
          </text>
          <text className="a11-boo-thumb a11-boo-thumb-l" x="8" y="39"
            textAnchor="middle" fontSize="10">👎</text>
          <text className="a11-boo-thumb a11-boo-thumb-r" x="33" y="39"
            textAnchor="middle" fontSize="10">👎</text>
        </>
      )}

      {/* LOVE */}
      {e === 'love' && (
        <>
          <text className="a11-heart a11-heart-1" x="14" y="29"
            textAnchor="middle" fontSize="7"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a11-heart a11-heart-2" x="21" y="31"
            textAnchor="middle" fontSize="5"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a11-heart a11-heart-3" x="28" y="26"
            textAnchor="middle" fontSize="7"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
        </>
      )}

      {/* THINK */}
      {e === 'think' && (
        <>
          <text className="a11-think-q a11-think-q-1" x="28" y="14"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="12" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a11-think-q a11-think-q-2" x="12" y="16"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="12" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a11-think-q a11-think-q-3" x="21" y="32"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="12" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
        </>
      )}
    </svg>
  )
}
