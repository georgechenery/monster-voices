import svgRaw from '../assets/avatar10.svg?raw'

const INNER = svgRaw.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')

export default function AvatarA10({ className, style, emoteId }) {
  const e = emoteId

  return (
    <svg
      viewBox="-6 -5 52 66"
      xmlns="http://www.w3.org/2000/svg"
      className={[className, e ? `a10-emote-${e}` : ''].filter(Boolean).join(' ')}
      style={style}
    >
      <g className="a10-character" dangerouslySetInnerHTML={{ __html: INNER }} />

      {/* LAUGH */}
      {e === 'laugh' && (
        <>
          <text className="a10-ha a10-ha-1" x="14" y="19"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="13" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a10-ha a10-ha-2" x="27" y="29"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="13" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a10-ha a10-ha-3" x="12" y="39"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="13" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
        </>
      )}

      {/* CHEER */}
      {e === 'cheer' && (
        <>
          <text className="a10-star a10-star-1" x="10" y="18"
            textAnchor="middle" fontSize="11"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a10-star a10-star-2" x="32" y="16"
            textAnchor="middle" fontSize="13"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a10-star a10-star-3" x="36" y="38"
            textAnchor="middle" fontSize="11"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a10-star a10-star-4" x="10" y="40"
            textAnchor="middle" fontSize="10"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a10-star a10-star-5" x="22" y="8"
            textAnchor="middle" fontSize="13"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a10-star a10-star-6" x="38" y="27"
            textAnchor="middle" fontSize="10"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a10-star a10-star-7" x="6" y="28"
            textAnchor="middle" fontSize="10"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a10-star a10-star-8" x="21" y="51"
            textAnchor="middle" fontSize="10"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
        </>
      )}

      {/* SHOCKED */}
      {e === 'shocked' && (
        <text className="a10-bang" x="20" y="60"
          textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
          fontSize="68" fill="#161616" stroke="white" strokeWidth="2" paintOrder="stroke">!</text>
      )}

      {/* BOO */}
      {e === 'boo' && (
        <>
          <text className="a10-boo-text" x="46" y="32"
            textAnchor="start"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="13" fill="#161616"
            stroke="white" strokeWidth="0.8" paintOrder="stroke">
            BOOOOOOOOOOOOOOO
          </text>
          <text className="a10-boo-thumb a10-boo-thumb-l" x="8" y="44"
            textAnchor="middle" fontSize="10">👎</text>
          <text className="a10-boo-thumb a10-boo-thumb-r" x="34" y="44"
            textAnchor="middle" fontSize="10">👎</text>
        </>
      )}

      {/* LOVE */}
      {e === 'love' && (
        <>
          <text className="a10-heart a10-heart-1" x="15" y="30"
            textAnchor="middle" fontSize="7"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a10-heart a10-heart-2" x="22" y="32"
            textAnchor="middle" fontSize="5"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a10-heart a10-heart-3" x="29" y="27"
            textAnchor="middle" fontSize="7"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
        </>
      )}

      {/* THINK */}
      {e === 'think' && (
        <>
          <text className="a10-think-q a10-think-q-1" x="29" y="17"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="12" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a10-think-q a10-think-q-2" x="11" y="19"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="12" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a10-think-q a10-think-q-3" x="22" y="33"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="12" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
        </>
      )}
    </svg>
  )
}
