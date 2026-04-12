// Speaker panel — spotter left, speakers in a gentle cosine arc to the right.
// Pure SVG, fills 100% of parent. ViewBox 380×700 + xMidYMid slice fills column
// edge-to-edge with only ~3px clipped top/bottom.
//
// Strike boxes: white=pending, amber=being guessed, green=correct, red/white=encore, red/red=failed
// Active speaker + viewer shown in bold black with a sublabel; all others at reduced opacity.

import { AVATARS } from '../data/avatars'

const VB_W        = 380           // wider than old 280 — fills column with xMidYMid slice
const VB_H        = 700
const SPOT_X      = 54
const SPOT_Y      = 350           // vertical centre
const SPOT_R      = 46
const COIN_R      = 28
const COIN_R_BIG  = 44            // current speaker
const Y_TOP       = 12
const Y_BOT       = 688
const ARC_X_MAX   = 195           // middle players furthest right
const ARC_X_MIN   = Math.round((SPOT_X + ARC_X_MAX) / 2)   // ≈ 125
const STK_W       = 16
const STK_GAP     = 4
const ARROW_LEN   = 26
const YOU_COLOR   = '#55aaff'
const AMBER       = '#f0b429'

function speakerY(idx, total) {
  if (total <= 1) return (Y_TOP + Y_BOT) / 2
  return Y_TOP + idx * (Y_BOT - Y_TOP) / (total - 1)
}

function speakerX(idx, total) {
  if (total <= 1) return ARC_X_MAX
  const t      = idx / (total - 1)
  const p      = (t - 0.5) * Math.PI
  const factor = Math.pow(Math.cos(p), 2)
  return ARC_X_MIN + (ARC_X_MAX - ARC_X_MIN) * factor
}

// [box1Fill, box2Fill] — white=empty, amber=being guessed, green=correct, red variants
function strikeFills(status, isBeingGuessed) {
  if (isBeingGuessed)       return [AMBER,     AMBER    ]
  if (status === 'guessed') return ['#2ecc71', '#2ecc71']
  if (status === 'encore')  return ['#e74c3c', '#fff'   ]
  if (status === 'failed')  return ['#e74c3c', '#e74c3c']
  return ['#fff', '#fff']
}

export default function DevNumberCardFan({
  players, spotterId, speakingOrder, speakerStatuses,
  currentSpeakerId, myPlayerId, phase,
}) {
  const spotter        = players.find(p => p.id === spotterId)
  const currentSpeaker = players.find(p => p.id === currentSpeakerId)
  const isMySpot       = spotterId === myPlayerId
  const total          = speakingOrder.length
  const waitingForGuess = phase === 'guessing' || phase === 'correct' || phase === 'wrong'

  const spotterLabel = isMySpot                        ? 'You' : (spotter?.name      ?? '…')
  const speakerLabel = currentSpeakerId === myPlayerId ? 'You' : (currentSpeaker?.name ?? '…')

  const slots = speakingOrder.map((pid, idx) => {
    const cy    = speakerY(idx, total)
    const cx    = speakerX(idx, total)
    const r     = pid === currentSpeakerId ? COIN_R_BIG : COIN_R
    const stk1x = cx + r + 6
    const stk2x = stk1x + STK_W + STK_GAP
    const lblX  = stk2x + STK_W + 6
    return {
      pid, idx, cy, cx, r, stk1x, stk2x, lblX,
      isCurrent:      pid === currentSpeakerId,
      isMe:           pid === myPlayerId,
      player:         players.find(p => p.id === pid),
      status:         speakerStatuses[pid],
      isBeingGuessed: pid === currentSpeakerId && waitingForGuess,
    }
  })

  const curSlot = slots.find(s => s.isCurrent)

  // Arrow from spotter edge toward current speaker
  let arrow = null
  if (curSlot) {
    const dx   = curSlot.cx - SPOT_X
    const dy   = curSlot.cy - SPOT_Y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const ux   = dx / dist, uy = dy / dist
    arrow = {
      x1: SPOT_X + (SPOT_R + 3) * ux,
      y1: SPOT_Y + (SPOT_R + 3) * uy,
      x2: SPOT_X + (SPOT_R + 3 + ARROW_LEN) * ux,
      y2: SPOT_Y + (SPOT_R + 3 + ARROW_LEN) * uy,
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMinYMid meet"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <marker id="mv-arr" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
            <polygon points="0 0, 10 4, 0 8" fill="#000" />
          </marker>
          <clipPath id="clip-spot">
            <circle cx={SPOT_X} cy={SPOT_Y} r={SPOT_R * 0.84} />
          </clipPath>
          {slots.map(slot => (
            <clipPath key={`clip-${slot.pid}`} id={`clip-${slot.pid}`}>
              <circle cx={slot.cx} cy={slot.cy} r={slot.r * 0.83} />
            </clipPath>
          ))}
        </defs>

        {/* ── Arrow ── */}
        {arrow && (
          <line
            x1={arrow.x1.toFixed(1)} y1={arrow.y1.toFixed(1)}
            x2={arrow.x2.toFixed(1)} y2={arrow.y2.toFixed(1)}
            stroke="#000" strokeWidth="4" strokeLinecap="round"
            markerEnd="url(#mv-arr)"
          />
        )}

        {/* ── Spotter coin ── */}
        <circle cx={SPOT_X} cy={SPOT_Y} r={SPOT_R}
          fill="#fff" stroke={isMySpot ? YOU_COLOR : '#111'} strokeWidth="4.5"
        />
        <image
          href={AVATARS[spotter?.avatarId ?? 0]}
          x={SPOT_X - SPOT_R * 0.84} y={SPOT_Y - SPOT_R * 0.84}
          width={SPOT_R * 1.68} height={SPOT_R * 1.68}
          clipPath="url(#clip-spot)"
          preserveAspectRatio="xMidYMid meet"
        />
        <text x={SPOT_X} y={SPOT_Y + SPOT_R + 7}
          textAnchor="middle" dominantBaseline="hanging"
          fontSize="17" fontFamily="'MonsterHeadline', sans-serif" fontWeight="900" fill="#111"
        >{spotterLabel}</text>
        <text x={SPOT_X} y={SPOT_Y + SPOT_R + 28}
          textAnchor="middle" dominantBaseline="hanging"
          fontSize="13" fontFamily="'MonsterHeadline', sans-serif" fontWeight="700" fill="#444"
        >is guessing</text>

        {/* ── Speaker slots ── */}
        {slots.map(slot => {
          const [f1, f2] = strikeFills(slot.status, slot.isBeingGuessed)
          const isDone   = slot.status === 'guessed' || slot.status === 'failed'
          const correct  = slot.isCurrent && phase === 'correct'
          const sy       = slot.cy - STK_W / 2

          // Decide label content
          // Active speaker → bold black name + sublabel
          // Viewer (not current) → bold blue "You" + turns away
          // Others → name at reduced opacity
          const isHighlighted = slot.isCurrent || (slot.isMe && !slot.isCurrent)
          const displayName   = slot.isMe ? 'You' : (slot.player?.name ?? '…')

          let sublabel = null
          if (slot.isCurrent) {
            sublabel = slot.isBeingGuessed ? 'being guessed' : 'speaking'
          } else if (slot.isMe && curSlot) {
            const away = slot.idx - curSlot.idx
            if (away > 0) sublabel = `${away} ${away === 1 ? 'turn' : 'turns'} away`
          }

          // Inactive = fully done, not the current speaker
          const inactive = isDone && !slot.isCurrent

          return (
            <g key={slot.pid}>
              {/* Strike boxes */}
              <rect x={slot.stk1x} y={sy} width={STK_W} height={STK_W} rx="2.5"
                fill={f1} stroke={f1 === '#fff' ? '#aaa' : 'rgba(0,0,0,0.2)'} strokeWidth="1.5"
                opacity={inactive ? 0.35 : 1}
              />
              <rect x={slot.stk2x} y={sy} width={STK_W} height={STK_W} rx="2.5"
                fill={f2} stroke={f2 === '#fff' ? '#aaa' : 'rgba(0,0,0,0.2)'} strokeWidth="1.5"
                opacity={inactive ? 0.35 : 1}
              />

              {/* Correct glow ring */}
              {correct && (
                <circle cx={slot.cx} cy={slot.cy} r={slot.r + 5}
                  fill="none" stroke="#2ecc71" strokeWidth="3.5" opacity="0.8"
                />
              )}

              {/* Coin */}
              <circle cx={slot.cx} cy={slot.cy} r={slot.r}
                fill="#fff"
                stroke={slot.isMe ? YOU_COLOR : '#111'}
                strokeWidth={slot.isCurrent ? 4.5 : 3}
                opacity={inactive ? 0.35 : 1}
              />

              {/* Avatar */}
              <image
                href={AVATARS[slot.player?.avatarId ?? 0]}
                x={slot.cx - slot.r * 0.83} y={slot.cy - slot.r * 0.83}
                width={slot.r * 1.66} height={slot.r * 1.66}
                clipPath={`url(#clip-${slot.pid})`}
                preserveAspectRatio="xMidYMid meet"
                opacity={inactive ? 0.35 : 1}
              />

              {/* Name label */}
              <text
                x={slot.lblX} y={sublabel ? slot.cy - 7 : slot.cy}
                dominantBaseline="middle"
                fontSize={isHighlighted ? 15 : 12}
                fontFamily="'MonsterHeadline', sans-serif"
                fontWeight={isHighlighted ? '900' : '700'}
                fill={isHighlighted ? '#000' : '#000'}
                opacity={inactive ? 0.35 : isHighlighted ? 1 : 0.38}
              >{displayName}</text>

              {/* Sublabel (active speaker / turns away) */}
              {sublabel && (
                <text
                  x={slot.lblX} y={slot.cy + 9}
                  dominantBaseline="hanging"
                  fontSize="10"
                  fontFamily="'MonsterHeadline', sans-serif"
                  fontWeight="700"
                  fill="#333"
                >{sublabel}</text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
