import svgRaw from '../assets/avatar1.svg?raw'

const INNER = svgRaw.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')

export default function AvatarA1({ className, style, emoteId }) {
  const e = emoteId

  return (
    <svg
      viewBox="-4 -5 77 74"
      xmlns="http://www.w3.org/2000/svg"
      className={[className, e ? `a1-emote-${e}` : ''].filter(Boolean).join(' ')}
      style={style}
    >
      <g className="a1-character" dangerouslySetInnerHTML={{ __html: INNER }} />

      {/* LAUGH */}
      {e === 'laugh' && (
        <>
          <text className="a1-ha a1-ha-1" x="27" y="26"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="19" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a1-ha a1-ha-2" x="46" y="39"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="19" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a1-ha a1-ha-3" x="25" y="50"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="19" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
        </>
      )}

      {/* CHEER */}
      {e === 'cheer' && (
        <>
          <text className="a1-star a1-star-1" x="15" y="21"
            textAnchor="middle" fontSize="12"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a1-star a1-star-2" x="48" y="20"
            textAnchor="middle" fontSize="14"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a1-star a1-star-3" x="54" y="44"
            textAnchor="middle" fontSize="12"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a1-star a1-star-4" x="17" y="46"
            textAnchor="middle" fontSize="11"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a1-star a1-star-5" x="38" y="11"
            textAnchor="middle" fontSize="14"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a1-star a1-star-6" x="57" y="31"
            textAnchor="middle" fontSize="11"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a1-star a1-star-7" x="12" y="32"
            textAnchor="middle" fontSize="11"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a1-star a1-star-8" x="34" y="54"
            textAnchor="middle" fontSize="11"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
        </>
      )}

      {/* SHOCKED: one big centred ! swings like a punching bag from its dot */}
      {e === 'shocked' && (
        <text className="a1-bang" x="34" y="57"
          textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
          fontSize="68" fill="#161616" stroke="white" strokeWidth="2" paintOrder="stroke">!</text>
      )}

      {/* BOO */}
      {e === 'boo' && (
        <>
          <text className="a1-boo-text" x="75" y="33"
            textAnchor="start"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="20" fill="#161616"
            stroke="white" strokeWidth="0.8" paintOrder="stroke">
            BOOOOOOOOOOOOOOO
          </text>
          <text className="a1-boo-thumb a1-boo-thumb-l" x="11" y="51"
            textAnchor="middle" fontSize="15">👎</text>
          <text className="a1-boo-thumb a1-boo-thumb-r" x="58" y="51"
            textAnchor="middle" fontSize="15">👎</text>
        </>
      )}

      {/* LOVE */}
      {e === 'love' && (
        <>
          <text className="a1-heart a1-heart-1" x="25" y="40"
            textAnchor="middle" fontSize="11"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a1-heart a1-heart-2" x="38" y="42"
            textAnchor="middle" fontSize="8"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a1-heart a1-heart-3" x="48" y="37"
            textAnchor="middle" fontSize="12"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
        </>
      )}

      {/* THINK */}
      {e === 'think' && (
        <>
          <text className="a1-think-q a1-think-q-1" x="49" y="23"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="17" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a1-think-q a1-think-q-2" x="18" y="25"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="17" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a1-think-q a1-think-q-3" x="40" y="44"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="17" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
        </>
      )}
    </svg>
  )
}
