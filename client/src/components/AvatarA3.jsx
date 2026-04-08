import svgRaw from '../assets/avatar3.svg?raw'

const INNER = svgRaw.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')

export default function AvatarA3({ className, style, emoteId }) {
  const e = emoteId

  return (
    <svg
      viewBox="-3 -3 44 50"
      xmlns="http://www.w3.org/2000/svg"
      className={[className, e ? `a3-emote-${e}` : ''].filter(Boolean).join(' ')}
      style={style}
    >
      <g className="a3-character" dangerouslySetInnerHTML={{ __html: INNER }} />

      {/* LAUGH */}
      {e === 'laugh' && (
        <>
          <text className="a3-ha a3-ha-1" x="15" y="18"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="11" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a3-ha a3-ha-2" x="25" y="27"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="11" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a3-ha a3-ha-3" x="14" y="35"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="11" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
        </>
      )}

      {/* CHEER */}
      {e === 'cheer' && (
        <>
          <text className="a3-star a3-star-1" x="8" y="14"
            textAnchor="middle" fontSize="7"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a3-star a3-star-2" x="26" y="14"
            textAnchor="middle" fontSize="8"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a3-star a3-star-3" x="30" y="30"
            textAnchor="middle" fontSize="7"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a3-star a3-star-4" x="9" y="31"
            textAnchor="middle" fontSize="6"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a3-star a3-star-5" x="21" y="8"
            textAnchor="middle" fontSize="8"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a3-star a3-star-6" x="31" y="21"
            textAnchor="middle" fontSize="6"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a3-star a3-star-7" x="7" y="22"
            textAnchor="middle" fontSize="6"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a3-star a3-star-8" x="19" y="37"
            textAnchor="middle" fontSize="6"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
        </>
      )}

      {/* SHOCKED: one big centred ! swings like a punching bag from its dot */}
      {e === 'shocked' && (
        <text className="a3-bang" x="19" y="40"
          textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
          fontSize="50" fill="#161616" stroke="white" strokeWidth="1.5" paintOrder="stroke">!</text>
      )}

      {/* BOO */}
      {e === 'boo' && (
        <>
          <text className="a3-boo-text" x="43" y="23"
            textAnchor="start"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="10" fill="#161616"
            stroke="white" strokeWidth="0.8" paintOrder="stroke">
            BOOOOOOOOOOOOOOO
          </text>
          <text className="a3-boo-thumb a3-boo-thumb-l" x="6" y="32"
            textAnchor="middle" fontSize="8">👎</text>
          <text className="a3-boo-thumb a3-boo-thumb-r" x="32" y="32"
            textAnchor="middle" fontSize="8">👎</text>
        </>
      )}

      {/* LOVE */}
      {e === 'love' && (
        <>
          <text className="a3-heart a3-heart-1" x="14" y="28"
            textAnchor="middle" fontSize="6"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a3-heart a3-heart-2" x="21" y="29"
            textAnchor="middle" fontSize="5"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a3-heart a3-heart-3" x="27" y="25"
            textAnchor="middle" fontSize="6"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
        </>
      )}

      {/* THINK */}
      {e === 'think' && (
        <>
          <text className="a3-think-q a3-think-q-1" x="27" y="16"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="9" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a3-think-q a3-think-q-2" x="10" y="17"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="9" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a3-think-q a3-think-q-3" x="22" y="30"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="9" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
        </>
      )}
    </svg>
  )
}
