import svgRaw from '../assets/avatar6.svg?raw'

const INNER = svgRaw.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')

export default function AvatarA6({ className, style, emoteId }) {
  const e = emoteId

  return (
    <svg
      viewBox="-5 -5 104 80"
      xmlns="http://www.w3.org/2000/svg"
      className={[className, e ? `a6-emote-${e}` : ''].filter(Boolean).join(' ')}
      style={style}
    >
      <g className="a6-character" dangerouslySetInnerHTML={{ __html: INNER }} />

      {/* LAUGH */}
      {e === 'laugh' && (
        <>
          <text className="a6-ha a6-ha-1" x="45" y="26"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="22" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a6-ha a6-ha-2" x="66" y="42"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="22" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
          <text className="a6-ha a6-ha-3" x="43" y="57"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="22" fill="#161616" stroke="white" strokeWidth="1.2" paintOrder="stroke">HA</text>
        </>
      )}

      {/* CHEER */}
      {e === 'cheer' && (
        <>
          <text className="a6-star a6-star-1" x="28" y="22"
            textAnchor="middle" fontSize="16"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a6-star a6-star-2" x="68" y="20"
            textAnchor="middle" fontSize="18"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a6-star a6-star-3" x="75" y="52"
            textAnchor="middle" fontSize="16"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a6-star a6-star-4" x="25" y="54"
            textAnchor="middle" fontSize="14"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a6-star a6-star-5" x="52" y="9"
            textAnchor="middle" fontSize="18"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a6-star a6-star-6" x="80" y="36"
            textAnchor="middle" fontSize="14"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a6-star a6-star-7" x="18" y="37"
            textAnchor="middle" fontSize="14"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
          <text className="a6-star a6-star-8" x="50" y="66"
            textAnchor="middle" fontSize="14"
            fill="#161616" stroke="white" strokeWidth="0.6" paintOrder="stroke">★</text>
        </>
      )}

      {/* SHOCKED */}
      {e === 'shocked' && (
        <text className="a6-bang" x="50" y="72"
          textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
          fontSize="90" fill="#161616" stroke="white" strokeWidth="2.5" paintOrder="stroke">!</text>
      )}

      {/* BOO */}
      {e === 'boo' && (
        <>
          <text className="a6-boo-text" x="98" y="44"
            textAnchor="start"
            fontFamily="MonsterHeadline, sans-serif"
            fontSize="22" fill="#161616"
            stroke="white" strokeWidth="0.8" paintOrder="stroke">
            BOOOOOOOOOOOOOOO
          </text>
          <text className="a6-boo-thumb a6-boo-thumb-l" x="20" y="64"
            textAnchor="middle" fontSize="16">👎</text>
          <text className="a6-boo-thumb a6-boo-thumb-r" x="76" y="64"
            textAnchor="middle" fontSize="16">👎</text>
        </>
      )}

      {/* LOVE */}
      {e === 'love' && (
        <>
          <text className="a6-heart a6-heart-1" x="38" y="46"
            textAnchor="middle" fontSize="10"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a6-heart a6-heart-2" x="52" y="49"
            textAnchor="middle" fontSize="8"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
          <text className="a6-heart a6-heart-3" x="63" y="43"
            textAnchor="middle" fontSize="11"
            fill="#161616" stroke="white" strokeWidth="0.8" paintOrder="stroke">♥</text>
        </>
      )}

      {/* THINK */}
      {e === 'think' && (
        <>
          <text className="a6-think-q a6-think-q-1" x="66" y="22"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="18" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a6-think-q a6-think-q-2" x="36" y="24"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="18" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
          <text className="a6-think-q a6-think-q-3" x="55" y="50"
            textAnchor="middle" fontFamily="MonsterHeadline, sans-serif"
            fontSize="18" fill="#161616" stroke="white" strokeWidth="1.0" paintOrder="stroke">?</text>
        </>
      )}
    </svg>
  )
}
