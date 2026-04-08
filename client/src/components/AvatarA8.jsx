import svgRaw from '../assets/avatar8.svg?raw'

const INNER = svgRaw.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')

export default function AvatarA8({ className, style, emoteId }) {
  const e = emoteId

  return (
    <svg
      viewBox="-5 -5 74 80"
      xmlns="http://www.w3.org/2000/svg"
      className={[className, e ? `a8-emote-${e}` : ''].filter(Boolean).join(' ')}
      style={style}
    >
      <g className="a8-character" dangerouslySetInnerHTML={{ __html: INNER }} />

      {/* LAUGH */}
      {e === 'laugh' && (
        <>
          <text className="a8-ha a8-ha-1" x="27" y="24"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="20" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a8-ha a8-ha-2" x="44" y="37"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="20" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a8-ha a8-ha-3" x="25" y="50"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="20" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
        </>
      )}

      {/* CHEER */}
      {e === 'cheer' && (
        <>
          <text className="a8-star a8-star-1" x="18" y="22"
            textAnchor="middle" fontSize="14"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a8-star a8-star-2" x="50" y="20"
            textAnchor="middle" fontSize="16"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a8-star a8-star-3" x="56" y="48"
            textAnchor="middle" fontSize="14"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a8-star a8-star-4" x="16" y="50"
            textAnchor="middle" fontSize="13"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a8-star a8-star-5" x="38" y="11"
            textAnchor="middle" fontSize="16"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a8-star a8-star-6" x="60" y="35"
            textAnchor="middle" fontSize="13"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a8-star a8-star-7" x="12" y="36"
            textAnchor="middle" fontSize="13"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a8-star a8-star-8" x="36" y="62"
            textAnchor="middle" fontSize="13"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
        </>
      )}

      {/* SHOCKED */}
      {e === 'shocked' && (
        <text className="a8-bang" x="32" y="73"
          textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
          fontSize="85" fill="#161616" stroke="white" strokeWidth="2" paintOrder="stroke">!</text>
      )}

      {/* BOO */}
      {e === 'boo' && (
        <>
          <text className="a8-boo-text" x="68" y="38"
            textAnchor="start"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="19" fill="#161616"
            stroke="white" strokeWidth="0.8" paintOrder="stroke">
            BOOOOOOOOOOOOOOO
          </text>
          <text className="a8-boo-thumb a8-boo-thumb-l" x="12" y="55"
            textAnchor="middle" fontSize="15">👎</text>
          <text className="a8-boo-thumb a8-boo-thumb-r" x="55" y="55"
            textAnchor="middle" fontSize="15">👎</text>
        </>
      )}

      {/* LOVE */}
      {e === 'love' && (
        <>
          <text className="a8-heart a8-heart-1" x="24" y="42"
            textAnchor="middle" fontSize="9"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a8-heart a8-heart-2" x="34" y="45"
            textAnchor="middle" fontSize="7"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a8-heart a8-heart-3" x="43" y="39"
            textAnchor="middle" fontSize="10"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
        </>
      )}

      {/* THINK */}
      {e === 'think' && (
        <>
          <text className="a8-think-q a8-think-q-1" x="44" y="22"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="16" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a8-think-q a8-think-q-2" x="18" y="24"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="16" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a8-think-q a8-think-q-3" x="36" y="44"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="16" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
        </>
      )}
    </svg>
  )
}
