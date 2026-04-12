// Speaker panel — spotter left, speakers in a gentle arc to the right.
// Arc: top/bottom players curve halfway back toward the spotter x, middle sits furthest right.
// Current speaker is 50% bigger with their name + "is being guessed" inline to the right.
// All other names hidden. Strike squares per player.

import { AVATARS } from '../data/avatars'

const VB          = 200
const SPOT_X      = 50
const SPOT_Y      = 100
const SPOT_D      = 38
const COIN_D      = 18
const COIN_D_BIG  = 27           // current speaker 50% bigger
const Y_TOP       = 14
const Y_BOT       = 186
const COIN_X_MAX  = 110          // middle player — furthest right
const COIN_X_MIN  = (SPOT_X + COIN_X_MAX) / 2   // = 80 — halfway back to spotter
const STK_W       = 8
const ARROW_LEN   = 16
const YOU_COLOR   = '#55aaff'

function speakerY(idx, total) {
  if (total <= 1) return (Y_TOP + Y_BOT) / 2
  return Y_TOP + idx * (Y_BOT - Y_TOP) / (total - 1)
}

// Cosine arc: centre players sit at COIN_X_MAX, top/bottom curve back to COIN_X_MIN
function speakerX(idx, total) {
  if (total <= 1) return COIN_X_MAX
  const t      = idx / (total - 1)              // 0 = top, 1 = bottom
  const phase  = (t - 0.5) * Math.PI            // -π/2 … +π/2
  const factor = Math.pow(Math.cos(phase), 2)   // 1 at centre, 0 at extremes
  return COIN_X_MIN + (COIN_X_MAX - COIN_X_MIN) * factor
}

function strikeFills(status) {
  if (status === 'guessed') return ['#2ecc71', '#2ecc71']
  if (status === 'encore')  return ['#e74c3c', '#333']
  if (status === 'failed')  return ['#e74c3c', '#e74c3c']
  return ['#333', '#333']
}

function pct(v) { return `${(v / VB * 100).toFixed(3)}%` }

export default function DevNumberCardFan({
  players, spotterId, speakingOrder, speakerStatuses,
  currentSpeakerId, myPlayerId, phase,
}) {
  const spotter        = players.find(p => p.id === spotterId)
  const currentSpeaker = players.find(p => p.id === currentSpeakerId)
  const isMySpot       = spotterId === myPlayerId
  const total          = speakingOrder.length

  const spotterName = isMySpot                        ? 'You' : (spotter?.name      ?? '…')
  const speakerName = currentSpeakerId === myPlayerId ? 'You' : (currentSpeaker?.name ?? '…')

  // Build slots with all geometry pre-computed
  const slots = speakingOrder.map((pid, idx) => {
    const cy     = speakerY(idx, total)
    const cx     = speakerX(idx, total)
    const coinD  = pid === currentSpeakerId ? COIN_D_BIG : COIN_D
    const stk1x  = cx + coinD / 2 + 5
    const stk2x  = stk1x + STK_W + 4
    const nameX  = stk2x + STK_W + 3   // left edge of name label (SVG units)
    return {
      pid, idx, cy, cx, coinD, stk1x, stk2x, nameX,
      isCurrent: pid === currentSpeakerId,
      isMe:      pid === myPlayerId,
      player:    players.find(p => p.id === pid),
      status:    speakerStatuses[pid],
    }
  })

  const curSlot = slots.find(s => s.isCurrent)

  // Short black directional arrow from spotter edge toward current speaker arc position
  let arrow = null
  if (curSlot) {
    const dx   = curSlot.cx - SPOT_X
    const dy   = curSlot.cy - SPOT_Y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const ux   = dx / dist, uy = dy / dist
    arrow = {
      x1: SPOT_X + (SPOT_D / 2 + 2) * ux,
      y1: SPOT_Y + (SPOT_D / 2 + 2) * uy,
      x2: SPOT_X + (SPOT_D / 2 + 2 + ARROW_LEN) * ux,
      y2: SPOT_Y + (SPOT_D / 2 + 2 + ARROW_LEN) * uy,
    }
  }

  return (
    <div style={{ width: '100%', aspectRatio: '1 / 1', position: 'relative' }}>

      {/* ── SVG: spine, highlight, arrow, strikes, spotter name ── */}
      <svg viewBox={`0 0 ${VB} ${VB}`} width="100%" height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}>

        <defs>
          <marker id="mv-arr" markerWidth="9" markerHeight="7"
            refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 9 3.5, 0 7" fill="#000" />
          </marker>
        </defs>

        {/* Short black directional arrow */}
        {arrow && (
          <line
            x1={arrow.x1.toFixed(1)} y1={arrow.y1.toFixed(1)}
            x2={arrow.x2.toFixed(1)} y2={arrow.y2.toFixed(1)}
            stroke="#000" strokeWidth="3" strokeLinecap="round"
            markerEnd="url(#mv-arr)"
          />
        )}

        {/* Strike squares per speaker */}
        {slots.map(slot => {
          const [f1, f2] = strikeFills(slot.status)
          const isDone   = slot.status === 'guessed' || slot.status === 'failed'
          const sy       = (slot.cy - STK_W / 2).toFixed(1)
          return (
            <g key={`stk-${slot.pid}`} opacity={isDone && !slot.isCurrent ? 0.35 : 1}>
              <rect x={slot.stk1x.toFixed(1)} y={sy} width={STK_W} height={STK_W} rx="2"
                fill={f1}
                stroke={f1 === '#333' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                strokeWidth="1"
              />
              <rect x={slot.stk2x.toFixed(1)} y={sy} width={STK_W} height={STK_W} rx="2"
                fill={f2}
                stroke={f2 === '#333' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                strokeWidth="1"
              />
            </g>
          )
        })}

        {/* Spotter "is guessing" — two lines below coin */}
        <text
          x={SPOT_X} y={(SPOT_Y + SPOT_D / 2 + 5).toFixed(1)}
          textAnchor="middle" dominantBaseline="hanging"
          fill="#000" fontSize="13"
          fontFamily="'MonsterHeadline', sans-serif" fontWeight="900"
        >
          {spotterName}
        </text>
        <text
          x={SPOT_X} y={(SPOT_Y + SPOT_D / 2 + 21).toFixed(1)}
          textAnchor="middle" dominantBaseline="hanging"
          fill="#000" fontSize="11"
          fontFamily="'MonsterHeadline', sans-serif" fontWeight="700"
        >
          is guessing
        </text>

      </svg>

      {/* ── Spotter coin ── */}
      <div style={{
        position: 'absolute',
        left: pct(SPOT_X - SPOT_D / 2), top: pct(SPOT_Y - SPOT_D / 2),
        width: pct(SPOT_D), height: pct(SPOT_D),
        borderRadius: '50%', background: '#fff',
        border: `7px solid ${isMySpot ? YOU_COLOR : '#000'}`,
        boxShadow: isMySpot ? `0 0 12px ${YOU_COLOR}99` : '0 2px 8px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 5,
      }}>
        <img src={AVATARS[spotter?.avatarId ?? 0]} alt=""
          style={{ width: '88%', height: '88%', objectFit: 'contain',
            animationName: 'avatar-bob', animationDuration: '3.2s',
            animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite',
            animationDirection: 'alternate' }}
        />
      </div>

      {/* ── Speaker coins ── */}
      {slots.map(slot => {
        const isDone  = slot.status === 'guessed' || slot.status === 'failed'
        const correct = slot.isCurrent && phase === 'correct'
        return (
          <div key={slot.pid} style={{
            position: 'absolute',
            left: pct(slot.cx - slot.coinD / 2),
            top:  pct(slot.cy - slot.coinD / 2),
            width:  pct(slot.coinD),
            height: pct(slot.coinD),
            borderRadius: '50%', background: '#fff',
            border: `${slot.isCurrent ? 4 : 2.5}px solid ${slot.isMe ? YOU_COLOR : '#000'}`,
            boxShadow: correct        ? '0 0 0 3px #2ecc71, 0 0 10px rgba(46,204,113,0.5)' :
                       slot.isCurrent ? '0 2px 10px rgba(0,0,0,0.35)' :
                       'none',
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: slot.isCurrent ? 6 : 3,
            opacity: isDone && !slot.isCurrent ? 0.35 : 1,
          }}>
            <img src={AVATARS[slot.player?.avatarId ?? 0]} alt=""
              style={{ width: '82%', height: '82%', objectFit: 'contain' }}
            />
          </div>
        )
      })}

      {/* ── Current speaker "[name] is being guessed" — next to their strikes ── */}
      {curSlot && (
        <div style={{
          position: 'absolute',
          left:   pct(curSlot.nameX),
          top:    pct(curSlot.cy - COIN_D_BIG / 2),
          width:  `calc(100% - ${pct(curSlot.nameX)})`,
          height: pct(COIN_D_BIG),
          display: 'flex', alignItems: 'center',
          pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          <div style={{
            fontFamily: "'MonsterHeadline', sans-serif",
            fontSize: 16,
            fontWeight: 900,
            color: '#000',
            lineHeight: 1.2,
            wordBreak: 'break-word',
          }}>
            {speakerName} is being guessed
          </div>
        </div>
      )}

      {/* ── "You (X turns away)" — next to viewer's own coin when not current ── */}
      {slots.map(slot => {
        if (!slot.isMe || slot.isCurrent) return null
        const turnsAway = curSlot ? slot.idx - curSlot.idx : null
        if (turnsAway === null || turnsAway <= 0) return null
        return (
          <div key={`you-${slot.pid}`} style={{
            position: 'absolute',
            left:   pct(slot.nameX),
            top:    pct(slot.cy - slot.coinD / 2),
            width:  `calc(100% - ${pct(slot.nameX)})`,
            height: pct(slot.coinD),
            display: 'flex', alignItems: 'center',
            pointerEvents: 'none',
            overflow: 'hidden',
          }}>
            <div style={{
              fontFamily: "'MonsterHeadline', sans-serif",
              fontSize: 16,
              fontWeight: 900,
              color: '#000',
              lineHeight: 1.2,
              wordBreak: 'break-word',
            }}>
              You ({turnsAway} {turnsAway === 1 ? 'turn' : 'turns'} away)
            </div>
          </div>
        )
      })}

    </div>
  )
}
