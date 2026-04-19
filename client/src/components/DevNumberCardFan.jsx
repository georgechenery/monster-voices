// Turn-order visualiser — spotter on the left, speakers in a cosine arc.
// Fully responsive: uses ResizeObserver so the SVG fills any container shape
// (landscape right-column in the real game, tall column in the sandbox) without
// dead space or cropping. All sizing is derived from the actual pixel dimensions
// and the number of speakers (2–9 people, i.e. 3–10 total players).

import { useRef, useEffect, useState } from 'react'
import { EMOTES } from '../data/emotes'
import { AVATARS } from '../data/avatars'
import AvatarA1 from './AvatarA1'
import AvatarA2 from './AvatarA2'
import AvatarA3 from './AvatarA3'
import AvatarA4 from './AvatarA4'
import AvatarA5 from './AvatarA5'
import AvatarA6 from './AvatarA6'
import AvatarA8 from './AvatarA8'
import AvatarA9 from './AvatarA9'
import AvatarA10 from './AvatarA10'
import AvatarA11 from './AvatarA11'

const YOU_COLOR = '#f0b429'
const AMBER     = '#f0b429'

function strikeFills(status, isCurrent, phase) {
  if (status === 'not_guessed')  return ['#e74c3c', '#e74c3c']   // both red — failed both tries
  if (status === 'guessed')      return ['#2ecc71', '#2ecc71']   // both green — correct first try (2pts)
  if (status === 'guessed_second') return ['#e74c3c', '#2ecc71'] // red + green — correct second try (1pt)
  if (status === 'encore') {
    // First try was wrong: first box is permanently red.
    // Second box: blank while showing the wrong-result (phase='wrong'),
    // orange once second-chance speaking/guessing begins.
    const secondBox = phase === 'wrong' ? '#fff' : (isCurrent ? AMBER : '#fff')
    return ['#e74c3c', secondBox]
  }
  if (isCurrent) return [AMBER, '#fff']  // first try active: orange, empty
  return ['#fff', '#fff']               // waiting for their turn
}

function renderAvatarComponent(avatarId, emoteId) {
  const style = { width: '100%', height: '100%' }
  switch (avatarId) {
    case 0:  return <AvatarA1  emoteId={emoteId} style={style} />
    case 1:  return <AvatarA2  emoteId={emoteId} style={style} />
    case 2:  return <AvatarA3  emoteId={emoteId} style={style} />
    case 3:  return <AvatarA4  emoteId={emoteId} style={style} />
    case 4:  return <AvatarA5  emoteId={emoteId} style={style} />
    case 5:  return <AvatarA6  emoteId={emoteId} style={style} />
    case 7:  return <AvatarA8  emoteId={emoteId} style={style} />
    case 8:  return <AvatarA9  emoteId={emoteId} style={style} />
    case 9:  return <AvatarA10 emoteId={emoteId} style={style} />
    case 10: return <AvatarA11 emoteId={emoteId} style={style} />
    default: return <img src={AVATARS[avatarId]} alt="" style={style} />
  }
}

/**
 * Compute every layout constant from the real container size and
 * the number of speakers.  All values are in SVG user units, which
 * equal CSS pixels because the viewBox matches the container exactly.
 */
function computeLayout(w, h, n) {
  const N = Math.max(1, n)

  // Equal vertical slot per speaker ─────────────────────────────────────────
  const slotH = h / N

  // Normal coin radius:
  //   • 42 % of slot height keeps a ~16 % gap between adjacent coins
  //   • 9 % of container width stops coins getting absurdly wide
  //   • hard cap of 28 px for very tall containers with few players
  const COIN_R = Math.max(5, Math.round(
    Math.min(slotH * 0.42, w * 0.09, 28)
  ))

  // Active-speaker coin — up to 35 % bigger, but must stay inside its slot.
  // slotH/2 − 4 gives a few px margin so the stroke doesn't clip neighbours or the top edge.
  const COIN_R_BIG = Math.max(COIN_R, Math.round(
    Math.min(COIN_R * 1.35, slotH / 2 - 4, 40)
  ))

  // Strike boxes — scale with coin size, minimum 7 px wide
  const STK_W   = Math.max(7,  Math.round(COIN_R * 0.62))
  const STK_GAP = Math.max(2,  Math.round(COIN_R * 0.14))

  // Reserve space for name labels on the right so text never clips.
  const TEXT_RESERVE = Math.max(60, Math.round(w * 0.30))
  const COIN_MAX_X   = w - COIN_R_BIG - 4 - 2 * STK_W - STK_GAP - 4 - TEXT_RESERVE

  const pad      = Math.max(12, Math.round(w * 0.06))
  const arcGapV  = Math.max(6,  Math.round(w * 0.025))
  const arcSpanV = Math.round(Math.min(w * 0.08, 28))
  const SPOT_Y   = h / 2

  // Spotter coin — 1.75× a regular speaker coin, always at least as big
  // as the active speaker coin. Then shrink iteratively until there is a
  // visible arrow gap between spotter and every speaker coin.
  let SPOT_R = Math.max(COIN_R_BIG, Math.round(
    Math.min(COIN_R * 1.75, h * 0.45, w * 0.18, 56)
  ))
  for (let iter = 0; iter < 50 && SPOT_R > COIN_R; iter++) {
    const sX   = SPOT_R + pad
    const arcS = sX + SPOT_R + arcGapV + COIN_R_BIG
    const axMin = Math.min(arcS, COIN_MAX_X)
    const axMax = Math.min(arcS + arcSpanV, COIN_MAX_X)
    const arrowNeeded = Math.max(8, Math.round(SPOT_R * 0.5)) + 4
    let ok = true
    for (let i = 0; i < N; i++) {
      const sy     = (i + 0.5) * slotH
      const factor = N <= 1 ? 1 : Math.cos(((i / (N - 1)) - 0.5) * Math.PI) ** 2
      const sx     = axMin + (axMax - axMin) * factor
      const gap    = Math.hypot(sx - sX, sy - SPOT_Y) - SPOT_R - COIN_R_BIG
      if (gap < arrowNeeded) { ok = false; break }
    }
    if (ok) break
    SPOT_R = Math.max(COIN_R, SPOT_R - 1)
  }

  const SPOT_X = SPOT_R + pad

  // Arrow from spotter to current speaker
  const ARROW_LEN = Math.max(8, Math.round(SPOT_R * 0.5))

  // Speaker arc ──────────────────────────────────────────────────────────────
  const arcGap    = arcGapV
  const arcStart  = SPOT_X + SPOT_R + arcGap + COIN_R_BIG
  const arcSpan   = arcSpanV
  const ARC_X_MIN = Math.min(arcStart, COIN_MAX_X)
  const ARC_X_MAX = Math.min(arcStart + arcSpan, COIN_MAX_X)

  // Text sizes
  const nameFontSize     = Math.max(10, Math.round(COIN_R * 0.85))
  const sublabelFontSize = Math.max(8,  Math.round(COIN_R * 0.75))
  const spotNameSize     = Math.max(10, Math.round(SPOT_R * 0.58))
  const spotSubSize      = Math.max(8,  Math.round(SPOT_R * 0.44))

  return {
    slotH, COIN_R, COIN_R_BIG, SPOT_R, SPOT_X, SPOT_Y,
    STK_W, STK_GAP, ARROW_LEN, ARC_X_MIN, ARC_X_MAX,
    nameFontSize, sublabelFontSize, spotNameSize, spotSubSize,
  }
}

export default function DevNumberCardFan({
  players = [], spotterId, speakingOrder = [], speakerStatuses = {},
  currentSpeakerId, myPlayerId, phase, roundNumber = 1, totalRounds = 1,
  activeEmotes = {},
}) {
  const wrapRef  = useRef(null)
  const innerRef = useRef(null)  // SVG + overlay container (measured for dims)
  const [dims, setDims] = useState({ w: 320, h: 280 })

  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 10 && height > 10)
        setDims({ w: Math.round(width), h: Math.round(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { w, h } = dims
  const n = speakingOrder.length

  const {
    slotH, COIN_R, COIN_R_BIG, SPOT_R, SPOT_X, SPOT_Y,
    STK_W, STK_GAP, ARROW_LEN, ARC_X_MIN, ARC_X_MAX,
    nameFontSize, sublabelFontSize, spotNameSize, spotSubSize,
  } = computeLayout(w, h, n)

  const spotter         = players.find(p => p.id === spotterId)
  const isMySpot        = spotterId === myPlayerId
  const waitingForGuess = phase === 'guessing' || phase === 'correct' || phase === 'wrong'
  const isRedemption    = phase === 'second_chance'

  const getSpeakerY = idx => (idx + 0.5) * slotH
  const getSpeakerX = idx => {
    if (n <= 1) return ARC_X_MAX
    const factor = Math.cos(((idx / (n - 1)) - 0.5) * Math.PI) ** 2
    return ARC_X_MIN + (ARC_X_MAX - ARC_X_MIN) * factor
  }

  const slots = speakingOrder.map((pid, idx) => {
    const cy    = getSpeakerY(idx)
    const cx    = getSpeakerX(idx)
    const r     = pid === currentSpeakerId ? COIN_R_BIG : COIN_R
    const stk1x = Math.round(cx + r + 4)
    const stk2x = stk1x + STK_W + STK_GAP
    const lblX  = stk2x + STK_W + 4
    const isCurrent      = pid === currentSpeakerId
    const isMe           = pid === myPlayerId
    const status         = speakerStatuses[pid]
    const isDone         = status === 'guessed' || status === 'guessed_second' || status === 'not_guessed'
    const inactive       = isDone && !isCurrent
    const isHighlit      = isCurrent || isMe
    const isBeingGuessed = pid === currentSpeakerId && waitingForGuess
    const opacity        = inactive ? 0.30 : isHighlit ? 1 : 0.42
    return {
      pid, idx, cy, cx, r, stk1x, stk2x, lblX,
      isCurrent, isMe, inactive, isHighlit, isBeingGuessed, opacity,
      player: players.find(p => p.id === pid),
      status,
    }
  })

  const curSlot = slots.find(s => s.isCurrent)

  // Arrow from spotter toward current speaker
  let arrow = null
  if (curSlot) {
    const dx = curSlot.cx - SPOT_X
    const dy = curSlot.cy - SPOT_Y
    const d  = Math.hypot(dx, dy) || 1
    const ux = dx / d, uy = dy / d
    arrow = {
      x1: SPOT_X + (SPOT_R + 3) * ux,
      y1: SPOT_Y + (SPOT_R + 3) * uy,
      x2: SPOT_X + (SPOT_R + 3 + ARROW_LEN) * ux,
      y2: SPOT_Y + (SPOT_R + 3 + ARROW_LEN) * uy,
    }
  }

  const showSpotterSub = SPOT_Y + SPOT_R + spotNameSize + spotSubSize + 12 < h

  // Spotter emote
  const spotterEmoteEntry = activeEmotes[spotterId]
  const spotterEmoteId    = spotterEmoteEntry?.emoteId ?? null
  const spotterFireKey    = spotterEmoteEntry?.fireKey  ?? null
  const spotterEmote      = spotterEmoteId ? EMOTES.find(e => e.id === spotterEmoteId) : null

  // How much of the coin radius is white background vs avatar clip
  // Avatar clips at 0.84× (spotter) and 0.83× (speakers) of the coin radius.
  // The HTML overlay covers the full coin (r × 2); the avatar clips inward.
  const SPOT_BORDER_W  = Math.max(2.5, SPOT_R * 0.22)
  const SPOT_AV_INSET  = SPOT_R * 0.16  // = SPOT_R - SPOT_R*0.84

  // Round label positioning: if there's enough space above the first coin, float
  // the label as an overlay centered in that gap. Otherwise use a compact header div.
  const spaceAboveCoin  = Math.max(0, slotH / 2 - COIN_R_BIG - 4)
  const showInlineRound = spaceAboveCoin >= 24
  const roundFontSize   = showInlineRound
    ? `${Math.max(14, Math.min(Math.round(spaceAboveCoin * 0.55), 26))}px`
    : '2rem'

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', overflow: 'visible', display: 'flex', flexDirection: 'column' }}>
      {!showInlineRound && (
        <div style={{ margin: '0 0 4px', textAlign: 'center', flexShrink: 0, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.4em' }}>
          <span style={{ fontFamily: "'MonsterHeadline', sans-serif", fontWeight: 900, fontSize: roundFontSize, color: '#111', lineHeight: 1, whiteSpace: 'nowrap' }}>
            Round {roundNumber}/{totalRounds}
          </span>
          {isRedemption && (
            <span style={{ fontFamily: "'MonsterHeadline', sans-serif", fontWeight: 900, fontSize: roundFontSize, color: '#f0860a', lineHeight: 1 }}>
              Redemption
            </span>
          )}
        </div>
      )}

      {/* SVG (text/arrows/strike boxes) + HTML coin overlays */}
      <div ref={innerRef} style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {showInlineRound && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 0,
            height: spaceAboveCoin,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4em',
            pointerEvents: 'none', zIndex: 3,
          }}>
            <span style={{ fontFamily: "'MonsterHeadline', sans-serif", fontWeight: 900, fontSize: roundFontSize, color: '#111', lineHeight: 1, whiteSpace: 'nowrap' }}>
              Round {roundNumber}/{totalRounds}
            </span>
            {isRedemption && (
              <span style={{ fontFamily: "'MonsterHeadline', sans-serif", fontWeight: 900, fontSize: roundFontSize, color: '#f0860a', lineHeight: 1 }}>
                Redemption
              </span>
            )}
          </div>
        )}
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        >
          <defs>
            <marker id="mv-arr" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
              <polygon points="0 0, 7 2.5, 0 5" fill="#000" />
            </marker>
          </defs>

          {/* ── Arrow ─────────────────────────────────────────────────────── */}
          {arrow && (
            <line
              x1={arrow.x1.toFixed(1)} y1={arrow.y1.toFixed(1)}
              x2={arrow.x2.toFixed(1)} y2={arrow.y2.toFixed(1)}
              stroke="#000" strokeWidth="2.5" strokeLinecap="round"
              markerEnd="url(#mv-arr)"
            />
          )}

          {/* ── Spotter text labels ────────────────────────────────────────── */}
          <text x={SPOT_X} y={SPOT_Y + SPOT_R + 7}
            textAnchor="middle" dominantBaseline="hanging"
            fontSize={spotNameSize} fontFamily="'MonsterHeadline', sans-serif"
            fontWeight="900" fill="#111"
          >{isMySpot ? 'You' : (spotter?.name ?? '…')}</text>
          {showSpotterSub && (
            <text x={SPOT_X} y={SPOT_Y + SPOT_R + 8 + spotNameSize}
              textAnchor="middle" dominantBaseline="hanging"
              fontSize={spotSubSize} fontFamily="'MonsterHeadline', sans-serif"
              fontWeight="700" fill="#555"
            >guessing</text>
          )}

          {/* ── Speaker slots: text + strike boxes only ───────────────────── */}
          {slots.map(s => {
            const [f1, f2] = strikeFills(s.status, s.isCurrent, phase)

            let sublabel = null
            if (s.isCurrent) {
              sublabel = s.isBeingGuessed ? 'guessing' : 'speaking'
            } else if (s.isMe && curSlot) {
              const away = s.idx - curSlot.idx
              if (away > 0) sublabel = away === 1 ? '1 turn away' : `${away} turns away`
            }

            const sy      = Math.round(s.cy - STK_W / 2)
            const nameY   = sublabel ? s.cy - sublabelFontSize / 2 - 1 : s.cy
            const subY    = s.cy + nameFontSize / 2 + 1
            const displayName = s.isMe ? 'You' : (s.player?.name ?? '…')

            return (
              <g key={s.pid} opacity={s.opacity}>
                {/* Correct-guess glow ring — slightly outside the coin */}
                {s.isCurrent && phase === 'correct' && (
                  <circle cx={s.cx} cy={s.cy} r={s.r + Math.max(2, COIN_R * 0.2)}
                    fill="none" stroke="#2ecc71" strokeWidth="2.5" opacity="0.85"
                  />
                )}

                {/* Strike boxes */}
                <rect x={s.stk1x} y={sy} width={STK_W} height={STK_W} rx="1.5"
                  fill={f1} stroke={f1 === '#fff' ? '#bbb' : 'rgba(0,0,0,0.2)'} strokeWidth="1"
                />
                <rect x={s.stk2x} y={sy} width={STK_W} height={STK_W} rx="1.5"
                  fill={f2} stroke={f2 === '#fff' ? '#bbb' : 'rgba(0,0,0,0.2)'} strokeWidth="1"
                />

                {/* Name */}
                <text x={s.lblX} y={nameY}
                  dominantBaseline="middle"
                  fontSize={nameFontSize}
                  fontFamily="'MonsterHeadline', sans-serif"
                  fontWeight={s.isHighlit ? '900' : '700'}
                  fill="#111"
                >{displayName}</text>

                {/* Sublabel */}
                {sublabel && (
                  <text x={s.lblX} y={subY}
                    dominantBaseline="hanging"
                    fontSize={sublabelFontSize}
                    fontFamily="'MonsterHeadline', sans-serif"
                    fontWeight="700"
                    fill="#444"
                  >{sublabel}</text>
                )}
              </g>
            )
          })}
        </svg>

        {/* ── Spotter coin HTML overlay ─────────────────────────────────── */}
        {/* Sized to the full coin (SPOT_R × 2) so ring + avatar scale together */}
        <div
          key={`spotter-${spotterId}-${spotterFireKey ?? 'idle'}`}
          className={spotterEmote ? 'emote-active' : ''}
          style={{
            position: 'absolute',
            left:   SPOT_X - SPOT_R,
            top:    SPOT_Y - SPOT_R,
            width:  SPOT_R * 2,
            height: SPOT_R * 2,
            pointerEvents: 'none',
          }}
        >
          {/* White disc + ring */}
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            backgroundColor: '#fff',
            border: `${SPOT_BORDER_W}px solid ${isMySpot ? YOU_COLOR : '#111'}`,
            boxSizing: 'border-box',
            boxShadow: '0 3px 12px rgba(0,0,0,0.35)',
          }} />
          {/* Avatar clipped to inner circle */}
          <div style={{
            position: 'absolute',
            left: SPOT_AV_INSET, top: SPOT_AV_INSET,
            right: SPOT_AV_INSET, bottom: SPOT_AV_INSET,
            borderRadius: '50%',
            overflow: 'hidden',
          }}>
            {renderAvatarComponent(spotter?.avatarId ?? 0, spotterEmoteId)}
          </div>
        </div>

        {/* ── Speaker coin HTML overlays ────────────────────────────────── */}
        {slots.map(s => {
          const emoteEntry = activeEmotes[s.pid]
          const emoteId    = emoteEntry?.emoteId ?? null
          const fireKey    = emoteEntry?.fireKey  ?? null
          const emote      = emoteId ? EMOTES.find(e => e.id === emoteId) : null

          const ringColor  = s.isMe ? YOU_COLOR : (s.isBeingGuessed ? AMBER : '#111')
          const ringW      = s.isCurrent
            ? Math.max(2.5, COIN_R * 0.22)
            : s.isMe ? 2 : 1.5
          const avInset    = s.r * 0.17  // = r - r*0.83

          return (
            <div
              key={`speaker-${s.pid}-${fireKey ?? 'idle'}`}
              className={emote ? 'emote-active' : ''}
              style={{
                position: 'absolute',
                left:    s.cx - s.r,
                top:     s.cy - s.r,
                width:   s.r * 2,
                height:  s.r * 2,
                opacity: s.opacity,
                pointerEvents: 'none',
              }}
            >
              {/* White disc + ring */}
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                backgroundColor: '#fff',
                border: `${ringW}px solid ${ringColor}`,
                boxSizing: 'border-box',
                boxShadow: '0 3px 10px rgba(0,0,0,0.30)',
              }} />
              {/* Avatar clipped to inner circle */}
              <div style={{
                position: 'absolute',
                left: avInset, top: avInset,
                right: avInset, bottom: avInset,
                borderRadius: '50%',
                overflow: 'hidden',
              }}>
                {renderAvatarComponent(s.player?.avatarId ?? 0, emoteId)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
