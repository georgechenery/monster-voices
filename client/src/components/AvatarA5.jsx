import svgRaw from '../assets/avatar5.svg?raw'

const INNER = svgRaw.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')

export default function AvatarA5({ className, style, emoteId }) {
  const e = emoteId

  return (
    <svg
      viewBox="-4 -5 50 70"
      xmlns="http://www.w3.org/2000/svg"
      className={[className, e ? `a5-emote-${e}` : ''].filter(Boolean).join(' ')}
      style={style}
    >
      <g className="a5-character" dangerouslySetInnerHTML={{ __html: INNER }} />

      {/* LAUGH */}
      {e === 'laugh' && (
        <>
          <text className="a5-ha a5-ha-1" x="15" y="20"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="16" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a5-ha a5-ha-2" x="29" y="33"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="16" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a5-ha a5-ha-3" x="13" y="46"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="16" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
        </>
      )}

      {/* CHEER */}
      {e === 'cheer' && (
        <>
          <text className="a5-star a5-star-1" x="13" y="22"
            textAnchor="middle" fontSize="12"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a5-star a5-star-2" x="33" y="20"
            textAnchor="middle" fontSize="14"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a5-star a5-star-3" x="38" y="45"
            textAnchor="middle" fontSize="12"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a5-star a5-star-4" x="14" y="47"
            textAnchor="middle" fontSize="11"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a5-star a5-star-5" x="26" y="11"
            textAnchor="middle" fontSize="14"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a5-star a5-star-6" x="41" y="33"
            textAnchor="middle" fontSize="11"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a5-star a5-star-7" x="9" y="34"
            textAnchor="middle" fontSize="11"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a5-star a5-star-8" x="24" y="58"
            textAnchor="middle" fontSize="11"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
        </>
      )}

      {/* SHOCKED */}
      {e === 'shocked' && (
        <text className="a5-bang" x="21" y="62"
          textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
          fontSize="74" fill="#161616" stroke="white" strokeWidth="2" paintOrder="stroke">!</text>
      )}

      {/* BOO */}
      {e === 'boo' && (
        <>
          <text className="a5-boo-text" x="46" y="33"
            textAnchor="start"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="17" fill="#161616"
            stroke="white" strokeWidth="0.8" paintOrder="stroke">
            BOOOOOOOOOOOOOOO
          </text>
          <text className="a5-boo-thumb a5-boo-thumb-l" x="9" y="48"
            textAnchor="middle" fontSize="12">👎</text>
          <text className="a5-boo-thumb a5-boo-thumb-r" x="36" y="48"
            textAnchor="middle" fontSize="12">👎</text>
        </>
      )}

      {/* LOVE */}
      {e === 'love' && (
        <>
          <text className="a5-heart a5-heart-1" x="16" y="38"
            textAnchor="middle" fontSize="8"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a5-heart a5-heart-2" x="25" y="40"
            textAnchor="middle" fontSize="6"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a5-heart a5-heart-3" x="33" y="35"
            textAnchor="middle" fontSize="8"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
        </>
      )}

      {/* THINK */}
      {e === 'think' && (
        <>
          <text className="a5-think-q a5-think-q-1" x="31" y="19"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="13" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a5-think-q a5-think-q-2" x="11" y="21"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="13" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a5-think-q a5-think-q-3" x="25" y="39"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="13" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
        </>
      )}
    </svg>
  )
}
