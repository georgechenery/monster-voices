import svgRaw from '../assets/avatar2.svg?raw'

const INNER = svgRaw.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')

export default function AvatarA2({ className, style, emoteId }) {
  const e = emoteId

  return (
    <svg
      viewBox="-4 -4 59 71"
      xmlns="http://www.w3.org/2000/svg"
      className={[className, e ? `a2-emote-${e}` : ''].filter(Boolean).join(' ')}
      style={style}
    >
      <g className="a2-character" dangerouslySetInnerHTML={{ __html: INNER }} />

      {/* LAUGH */}
      {e === 'laugh' && (
        <>
          <text className="a2-ha a2-ha-1" x="20" y="25"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="15" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a2-ha a2-ha-2" x="34" y="38"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="15" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a2-ha a2-ha-3" x="18" y="50"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="15" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
        </>
      )}

      {/* CHEER */}
      {e === 'cheer' && (
        <>
          <text className="a2-star a2-star-1" x="11" y="21"
            textAnchor="middle" fontSize="9"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a2-star a2-star-2" x="35" y="19"
            textAnchor="middle" fontSize="10"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a2-star a2-star-3" x="40" y="44"
            textAnchor="middle" fontSize="9"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a2-star a2-star-4" x="12" y="45"
            textAnchor="middle" fontSize="8"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a2-star a2-star-5" x="28" y="11"
            textAnchor="middle" fontSize="10"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a2-star a2-star-6" x="42" y="30"
            textAnchor="middle" fontSize="8"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a2-star a2-star-7" x="9" y="31"
            textAnchor="middle" fontSize="8"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a2-star a2-star-8" x="25" y="53"
            textAnchor="middle" fontSize="8"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
        </>
      )}

      {/* SHOCKED: one big centred ! swings like a punching bag from its dot */}
      {e === 'shocked' && (
        <text className="a2-bang" x="25" y="58"
          textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
          fontSize="72" fill="#161616" stroke="white" strokeWidth="2" paintOrder="stroke">!</text>
      )}

      {/* BOO */}
      {e === 'boo' && (
        <>
          <text className="a2-boo-text" x="57" y="33"
            textAnchor="start"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="14" fill="#161616"
            stroke="white" strokeWidth="0.8" paintOrder="stroke">
            BOOOOOOOOOOOOOOO
          </text>
          <text className="a2-boo-thumb a2-boo-thumb-l" x="8" y="46"
            textAnchor="middle" fontSize="11">👎</text>
          <text className="a2-boo-thumb a2-boo-thumb-r" x="43" y="46"
            textAnchor="middle" fontSize="11">👎</text>
        </>
      )}

      {/* LOVE */}
      {e === 'love' && (
        <>
          <text className="a2-heart a2-heart-1" x="19" y="39"
            textAnchor="middle" fontSize="8"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a2-heart a2-heart-2" x="28" y="41"
            textAnchor="middle" fontSize="6"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a2-heart a2-heart-3" x="36" y="36"
            textAnchor="middle" fontSize="8"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
        </>
      )}

      {/* THINK */}
      {e === 'think' && (
        <>
          <text className="a2-think-q a2-think-q-1" x="36" y="23"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="12" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a2-think-q a2-think-q-2" x="14" y="24"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="12" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a2-think-q a2-think-q-3" x="29" y="44"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="12" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
        </>
      )}
    </svg>
  )
}
