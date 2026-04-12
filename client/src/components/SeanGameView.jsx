// Sean's redesign sandbox — v3
//
// Layout: [Left 200px] | [Center: grid + action strip] | [Right 230px]
// Full-screen overlay sits over all three columns.
// SPEAK / emotes live below the grid in the centre column.
// Phrase box is a transparent bordered text area, not a card.
//
// Grid fix: use .monster-grid WITHOUT .monster-grid-fill.
// .monster-card-flipper has aspect-ratio:1, so the grid self-sizes
// naturally from its width — no flex-based height needed.

import { useState, useEffect, useRef } from 'react'
import { MONSTERS } from '../data/monsters'
import cardBack from '../assets/monsters/card-back.png'
import monsterBanner from '../assets/brand/monster-banner.jpg'

// ── Player colours ────────────────────────────────────────────────────────────
const PLAYER_COLORS = [
  '#e74c3c', // red
  '#2ecc71', // green
  '#3498db', // blue
  '#f1c40f', // yellow
  '#e67e22', // orange
  '#9b59b6', // purple
  '#1abc9c', // teal
  '#ff69b4', // pink
  '#ff5722', // deep orange
]

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_PLAYERS = [
  { id: 'p0', name: 'Alex',   score: 12, avatarId: 0 },
  { id: 'p1', name: 'Blake',  score:  8, avatarId: 1 },
  { id: 'p2', name: 'Casey',  score: 15, avatarId: 2 },
  { id: 'p3', name: 'Dana',   score:  5, avatarId: 3 },
  { id: 'p4', name: 'Ellis',  score: 20, avatarId: 4 },
  { id: 'p5', name: 'Finn',   score:  3, avatarId: 5 },
  { id: 'p6', name: 'Gray',   score: 11, avatarId: 7 },
  { id: 'p7', name: 'Harper', score:  7, avatarId: 8 },
  { id: 'p8', name: 'Indie',  score:  9, avatarId: 9 },
]

const SPOTTER_ID     = 'p0'
const SPEAKING_ORDER = ['p1','p2','p3','p4','p5','p6','p7','p8']

const ASSIGNMENTS = {
  p1: { position: 4, monsterIndex: 10 },
  p2: { position: 0, monsterIndex: 30 },
  p3: { position: 8, monsterIndex: 50 },
  p4: { position: 2, monsterIndex: 70 },
  p5: { position: 6, monsterIndex: 90 },
  p6: { position: 1, monsterIndex: 110 },
  p7: { position: 3, monsterIndex: 130 },
  p8: { position: 5, monsterIndex: 150 },
}

const MOCK_PHRASE = 'If not for me, do it for science'

const MOCK_CHAT = [
  { pid: 'p2', text: 'good luck everyone!' },
  { pid: 'p4', text: 'lmao'               },
  { pid: 'p1', text: 'i totally choked'   },
  { pid: 'p6', text: 'no way that was amazing' },
  { pid: 'p3', text: 'whose monster was that??' },
]

const PHASES = [
  { value: 'thinking',      label: "Speaker's turn — thinking"  },
  { value: 'recording',     label: "Speaker's turn — recording" },
  { value: 'guessing',      label: 'Spotter is guessing'        },
  { value: 'correct',       label: 'Guess: Correct!'            },
  { value: 'wrong',         label: 'Guess: Wrong (Encore)'      },
  { value: 'second_chance', label: 'Second Chance round'        },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function colorOf(pid) {
  const idx = MOCK_PLAYERS.findIndex(p => p.id === pid)
  return PLAYER_COLORS[idx] ?? '#fff'
}

function nameOf(pid, myId) {
  if (pid === myId) return 'You'
  return MOCK_PLAYERS.find(p => p.id === pid)?.name ?? pid
}

function buildState(phase, speakerIdx) {
  const currentSpeakerId = SPEAKING_ORDER[speakerIdx]
  const assignment       = ASSIGNMENTS[currentSpeakerId]
  const speakerStatuses  = {}
  SPEAKING_ORDER.slice(0, speakerIdx).forEach(pid => { speakerStatuses[pid] = 'guessed' })
  let guessResult      = null
  let flippedPositions = SPEAKING_ORDER.slice(0, speakerIdx).map(pid => ASSIGNMENTS[pid].position)
  if (phase === 'correct') {
    speakerStatuses[currentSpeakerId] = 'guessed'
    guessResult = {
      correct: true,
      position: assignment.position,
      monsterIndex: assignment.monsterIndex,
      guessedPosition: assignment.position,
    }
    flippedPositions = [...flippedPositions, assignment.position]
  } else if (phase === 'wrong') {
    speakerStatuses[currentSpeakerId] = 'encore'
    guessResult = {
      correct: false,
      position: assignment.position,
      monsterIndex: assignment.monsterIndex,
      guessedPosition: (assignment.position + 2) % 9,
    }
  }
  return { currentSpeakerId, speakerStatuses, guessResult, flippedPositions }
}

// ── Full-screen overlay ───────────────────────────────────────────────────────
function FullOverlay({ lines, subLines, showSpeak, visible }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16,
      background: 'rgba(0,0,0,0.75)',
      zIndex: 50,
      pointerEvents: showSpeak ? 'auto' : 'none',
      opacity: visible ? 1 : 0,
      transition: visible ? 'opacity 0.15s ease' : 'opacity 0.5s ease',
    }}>
      {lines && (
        <div style={{
          fontFamily: "'MonsterHeadline', sans-serif",
          fontSize: 'clamp(34px, 6vw, 68px)',
          lineHeight: 1,
          textAlign: 'center',
          padding: '0 24px',
          textShadow: '0 3px 24px rgba(0,0,0,0.9)',
        }}>
          {lines.map((seg, i) => (
            <span key={i} style={{ color: seg.color }}>{seg.text}</span>
          ))}
        </div>
      )}

      {subLines?.map((line, li) => (
        <div key={li} style={{
          fontFamily: "'MonsterHeadline', sans-serif",
          fontSize: 'clamp(16px, 2.8vw, 28px)',
          lineHeight: 1.1,
          textAlign: 'center',
          padding: '0 24px',
        }}>
          {line.map((seg, i) => (
            <span key={i} style={{ color: seg.color }}>{seg.text}</span>
          ))}
        </div>
      ))}

      {showSpeak && (
        <button style={{
          marginTop: 8,
          padding: '14px 52px',
          background: '#f0b429', color: '#000',
          border: 'none', borderRadius: 6,
          fontFamily: "'MonsterHeadline', sans-serif",
          fontSize: 26, fontWeight: 900,
          letterSpacing: '0.06em', cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(240,180,41,0.6)',
        }}>
          SPEAK
        </button>
      )}
    </div>
  )
}

// ── Left panel ────────────────────────────────────────────────────────────────
function LeftPanel({ speakerIdx, myPlayerId }) {
  const total   = SPEAKING_ORDER.length
  const turnNum = speakerIdx + 1

  const queue = []
  for (let i = speakerIdx; i < Math.min(speakerIdx + 3, total); i++) {
    queue.push({ i, pid: SPEAKING_ORDER[i] })
  }

  return (
    <div style={{
      width: 200,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 14px',
      gap: 14,
      background: 'rgba(0,0,0,0.42)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      overflowY: 'auto',
    }}>

      {/* Logo */}
      <div style={{
        fontFamily: "'MonsterHeadline', sans-serif",
        fontSize: 19, color: '#fff', lineHeight: 1.05,
      }}>
        Monster<br />Voices
      </div>

      {/* ROUND stamp */}
      <div style={{
        alignSelf: 'flex-start',
        border: '2.5px solid rgba(255,255,255,0.88)',
        borderRadius: 4,
        padding: '3px 12px',
        fontFamily: "'MonsterHeadline', sans-serif",
        fontSize: 11, color: '#fff',
        letterSpacing: '0.12em',
      }}>
        ROUND 1
      </div>

      {/* Phrase — transparent box, large text */}
      <div style={{
        border: '2.5px solid rgba(255,255,255,0.88)',
        borderRadius: 4,
        padding: '10px 12px',
        background: 'transparent',
        fontFamily: "'MonsterHeadline', sans-serif",
        fontSize: 15, color: '#fff',
        lineHeight: 1.4,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
      }}>
        {MOCK_PHRASE}
      </div>

      {/* TURN stamp */}
      <div style={{
        alignSelf: 'flex-start',
        border: '2.5px solid rgba(255,255,255,0.88)',
        borderRadius: 4,
        padding: '3px 12px',
        fontFamily: "'MonsterHeadline', sans-serif",
        fontSize: 11, color: '#fff',
        letterSpacing: '0.12em',
      }}>
        TURN {turnNum} / {total}
      </div>

      {/* Turn queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {queue.map(({ i, pid }) => {
          const isCurrent    = i === speakerIdx
          const label        = nameOf(pid, myPlayerId)
          const spotterLabel = nameOf(SPOTTER_ID, myPlayerId)
          return (
            <div key={pid} style={{
              fontFamily: "'MonsterHeadline', sans-serif",
              fontSize: isCurrent ? 14 : 10,
              lineHeight: 1.35,
              opacity: isCurrent ? 1 : 0.35,
            }}>
              {isCurrent ? (
                <>
                  <span style={{ color: colorOf(SPOTTER_ID) }}>{spotterLabel}</span>
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}> guessing </span>
                  <span style={{ color: colorOf(pid) }}>{label}</span>
                </>
              ) : (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Turn {i + 1}: </span>
                  <span style={{ color: colorOf(pid) }}>{label}</span>
                </>
              )}
            </div>
          )
        })}

        {total - speakerIdx - 3 > 0 && (
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
            +{total - speakerIdx - 3} more
          </div>
        )}
      </div>
    </div>
  )
}

// ── Monster grid ──────────────────────────────────────────────────────────────
// Uses .monster-grid WITHOUT .monster-grid-fill so the grid sizes by
// column width naturally (cards have aspect-ratio:1 from CSS).
function SeanGrid({ isSpotter, myAssignment, currentSpeakerId, flippedPositions, guessResult, waitingForGuess }) {
  const posMap = {}
  SPEAKING_ORDER.forEach(pid => {
    const a = ASSIGNMENTS[pid]
    posMap[a.position] = { pid, monsterIndex: a.monsterIndex }
  })

  return (
    <div className="monster-grid" style={{ width: '100%' }}>
      {Array.from({ length: 9 }, (_, position) => {
        const info    = posMap[position]
        const pid     = info?.pid
        const player  = pid ? MOCK_PLAYERS.find(p => p.id === pid) : null
        const mIdx    = info?.monsterIndex

        // Empty slot
        if (mIdx === undefined) {
          return (
            <div key={position} className="monster-card-flipper">
              <div className="monster-card-inner">
                <div className="monster-card monster-card-face monster-card-front"
                  style={{ opacity: 0.08 }}>
                  <div className="monster-position-label">#{position + 1}</div>
                </div>
              </div>
            </div>
          )
        }

        const isFlipped = flippedPositions.includes(position)
        const isCurrent = pid === currentSpeakerId && !isFlipped
        const isMyPos   = !isSpotter && myAssignment?.position === position
        const isWrong   = guessResult && !guessResult.correct && guessResult.guessedPosition === position
        const isCorrect = guessResult && guessResult.correct && guessResult.position === position

        return (
          <div key={position} className="monster-card-flipper">
            <div className={`monster-card-inner${isFlipped ? ' is-flipped' : ''}`}>
              <div className={[
                'monster-card monster-card-face monster-card-front',
                isSpotter && waitingForGuess && !isFlipped ? 'monster-card-clickable' : '',
                isCurrent ? 'monster-card-selected' : '',
                isWrong   ? 'monster-card-wrong'    : '',
                isCorrect && isFlipped ? 'monster-card-correct' : '',
                !isSpotter && !isMyPos && !isFlipped ? 'monster-card-disabled' : '',
              ].filter(Boolean).join(' ')}>
                <img src={MONSTERS[mIdx]} alt="" className="monster-img" />
                <div className="monster-position-label">#{position + 1}</div>

                {isMyPos && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'rgba(0,0,0,0.75)', color: '#fff',
                    fontSize: 8, fontWeight: 700, textAlign: 'center',
                    padding: '2px 0', letterSpacing: '0.07em',
                    fontFamily: "'MonsterHeadline', sans-serif",
                  }}>YOUR MONSTER</div>
                )}

                {isCurrent && !waitingForGuess && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    background: 'rgba(240,180,41,0.88)', color: '#000',
                    fontSize: 8, fontWeight: 900, textAlign: 'center',
                    padding: '2px 0', letterSpacing: '0.07em',
                    fontFamily: "'MonsterHeadline', sans-serif",
                  }}>PERFORMING</div>
                )}

                {isFlipped && player && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'rgba(0,0,0,0.82)', padding: '3px 5px',
                  }}>
                    <span style={{
                      color: colorOf(player.id), fontSize: 8, fontWeight: 700,
                      fontFamily: "'MonsterHeadline', sans-serif",
                    }}>{player.name}</span>
                  </div>
                )}
              </div>

              <div className="monster-card monster-card-face monster-card-back">
                <img src={cardBack} alt="" className="monster-img" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Below-grid action strip ───────────────────────────────────────────────────
const EMOTE_SVGS = [
  <svg key="m" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" width="20" height="20">
    <ellipse cx="16" cy="14" rx="8" ry="9"/>
    <circle cx="12.5" cy="12" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="19.5" cy="12" r="1.4" fill="currentColor" stroke="none"/>
    <path d="M12 17.5 Q16 21 20 17.5"/>
    <path d="M10 23 L8 28M22 23 L24 28M14 23 L14 27M18 23 L18 27"/>
  </svg>,
  <svg key="s" viewBox="0 0 32 32" fill="currentColor" width="20" height="20">
    <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2.2"/>
    <rect x="14.5" y="8" width="3" height="9" rx="1.5"/>
    <rect x="14.5" y="20" width="3" height="3" rx="1.5"/>
  </svg>,
  <svg key="h" viewBox="0 0 32 32" fill="currentColor" width="20" height="20">
    <path d="M16 27C16 27 3 19 3 11c0-4 3-7 7-7 2.5 0 4.7 1.4 6 3.5C17.3 5.4 19.5 4 22 4c4 0 7 3 7 7 0 8-13 16-13 16z"/>
  </svg>,
  <svg key="b" viewBox="0 0 32 32" fill="currentColor" width="20" height="20">
    <path d="M18 3L8 18h8L14 29 24 14h-8L18 3z"/>
  </svg>,
]

function BottomStrip({ isSpeaker, isSpotter, phase }) {
  const showSpeak = isSpeaker && (phase === 'thinking' || phase === 'recording' || phase === 'second_chance')
  const showWager = !isSpeaker && !isSpotter

  if (showSpeak) {
    return (
      <div style={{
        flexShrink: 0,
        height: 70,
        padding: '8px 14px 12px',
        display: 'flex',
      }}>
        <button style={{
          flex: 1, height: '100%',
          background: '#f0b429', color: '#000',
          border: 'none', borderRadius: 6,
          fontFamily: "'MonsterHeadline', sans-serif",
          fontSize: 24, fontWeight: 900,
          letterSpacing: '0.06em', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(240,180,41,0.45)',
        }}>
          SPEAK
        </button>
      </div>
    )
  }

  return (
    <div style={{
      flexShrink: 0,
      height: 70,
      padding: '8px 14px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      {EMOTE_SVGS.map((svg, i) => (
        <button key={i} style={{
          flex: 1, height: '100%',
          background: 'rgba(255,255,255,0.06)',
          border: '2px solid rgba(255,255,255,0.16)',
          borderRadius: 6, cursor: 'pointer',
          color: 'rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {svg}
        </button>
      ))}
      {showWager && (
        <button style={{
          flexShrink: 0,
          height: '100%',
          padding: '0 10px',
          background: 'rgba(240,180,41,0.12)',
          border: '2px solid rgba(240,180,41,0.5)',
          borderRadius: 6,
          fontFamily: "'MonsterHeadline', sans-serif",
          fontSize: 10, color: '#f0b429',
          fontWeight: 700, letterSpacing: '0.06em',
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          ⚡ WAGER
        </button>
      )}
    </div>
  )
}

// ── Right panel: scoreboard ───────────────────────────────────────────────────
function SeanScoreboard({ myPlayerId }) {
  const sorted = [...MOCK_PLAYERS].sort((a, b) => b.score - a.score)
  return (
    <div style={{
      flexShrink: 0,
      padding: '14px 14px 10px',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      {sorted.map(p => {
        const c    = colorOf(p.id)
        const isMe = p.id === myPlayerId
        return (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: 2,
              background: c, flexShrink: 0,
            }} />
            <span style={{
              fontFamily: "'MonsterHeadline', sans-serif",
              fontSize: 20, fontWeight: 900,
              color: c, lineHeight: 1,
              minWidth: 26,
            }}>
              {p.score}
            </span>
            <span style={{
              fontFamily: "'MonsterHeadline', sans-serif",
              fontSize: 12,
              color: c,
              fontWeight: isMe ? 900 : 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {nameOf(p.id, myPlayerId)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Right panel: chat as coloured pill chips ──────────────────────────────────
function SeanChat({ myPlayerId }) {
  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      padding: '10px 12px',
      display: 'flex', flexDirection: 'column',
      gap: 6, justifyContent: 'flex-end',
    }}>
      {MOCK_CHAT.map((msg, i) => {
        const c = colorOf(msg.pid)
        return (
          <div key={i}>
            <div style={{
              fontSize: 8, color: `${c}99`,
              fontFamily: "'MonsterHeadline', sans-serif",
              letterSpacing: '0.06em', marginBottom: 2, paddingLeft: 2,
            }}>
              {nameOf(msg.pid, myPlayerId)}
            </div>
            <div style={{
              display: 'inline-block',
              background: c,
              borderRadius: 5,
              padding: '5px 10px',
              maxWidth: '100%',
            }}>
              <span style={{
                fontFamily: "'MonsterHeadline', sans-serif",
                fontSize: 12, fontWeight: 700,
                color: '#fff',
                textShadow: '0 1px 4px rgba(0,0,0,0.25)',
              }}>
                {msg.text}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ChatInput() {
  return (
    <div style={{
      flexShrink: 0,
      display: 'flex', gap: 5,
      padding: '6px 10px 10px',
      borderTop: '1px solid rgba(255,255,255,0.07)',
    }}>
      <input disabled placeholder="type…" style={{
        flex: 1,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 4, padding: '6px 9px',
        color: '#555', fontSize: 12,
        fontFamily: "'MonsterHeadline', sans-serif",
        outline: 'none',
      }} />
      <button style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 4, padding: '6px 10px',
        color: '#666', fontSize: 14, cursor: 'default',
      }}>↑</button>
    </div>
  )
}

// ── Dev controls ──────────────────────────────────────────────────────────────
function SeanDevControls({ viewAsIdx, setViewAsIdx, speakerIdx, setSpeakerIdx, phase, setPhase, onClose, roleTag }) {
  const [pos, setPos] = useState({ right: 14, bottom: 14 })
  const dragging  = useRef(false)
  const dragStart = useRef(null)

  useEffect(() => {
    const onMove = e => {
      if (!dragging.current) return
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      setPos({
        right:  Math.max(0, dragStart.current.right  - dx),
        bottom: Math.max(0, dragStart.current.bottom + dy),
      })
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  return (
    <div style={{
      position: 'fixed', bottom: pos.bottom, right: pos.right,
      background: 'rgba(0,0,0,0.92)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10, padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 9999, backdropFilter: 'blur(8px)',
      minWidth: 220, boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      <div
        onMouseDown={e => {
          dragging.current = true
          dragStart.current = { x: e.clientX, y: e.clientY, right: pos.right, bottom: pos.bottom }
          e.preventDefault()
        }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab', userSelect: 'none' }}
      >
        <span style={{ color: '#f0b429', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>
          ⠿ SEAN EDIT · <span style={{ color: '#aaa' }}>{roleTag}</span>
        </span>
        <button onClick={onClose} onMouseDown={e => e.stopPropagation()}
          style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 11, padding: 0 }}>
          ← back
        </button>
      </div>

      <div>
        <div style={{ color: '#555', fontSize: 8, marginBottom: 4, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>View as</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {MOCK_PLAYERS.map((p, i) => {
            const c = colorOf(p.id)
            return (
              <button key={p.id} onClick={() => setViewAsIdx(i)} style={{
                fontSize: 10, padding: '2px 6px', cursor: 'pointer', borderRadius: 3,
                background: viewAsIdx === i ? c : '#1a1a1a',
                color:      viewAsIdx === i ? '#000' : c,
                border:     `1px solid ${c}`,
                fontWeight: viewAsIdx === i ? 700 : 400,
                fontFamily: 'monospace',
              }}>
                {i === 0 ? `${p.name} ★` : p.name}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <div>
          <div style={{ color: '#555', fontSize: 8, marginBottom: 3, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>Speaker</div>
          <select value={speakerIdx} onChange={e => setSpeakerIdx(Number(e.target.value))}
            style={{ fontSize: 11, padding: '2px 4px', background: '#111', color: '#ccc', border: '1px solid #333', borderRadius: 3, width: '100%' }}>
            {SPEAKING_ORDER.map((pid, i) => (
              <option key={pid} value={i}>{MOCK_PLAYERS.find(p => p.id === pid).name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#555', fontSize: 8, marginBottom: 3, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>Phase</div>
          <select value={phase} onChange={e => setPhase(e.target.value)}
            style={{ fontSize: 11, padding: '2px 4px', background: '#111', color: '#ccc', border: '1px solid #333', borderRadius: 3, width: '100%' }}>
            {PHASES.map(ph => <option key={ph.value} value={ph.value}>{ph.label}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SeanGameView({ onClose }) {
  // Default to Blake (first speaker, index 1) so SPEAK button is immediately visible
  const [viewAsIdx,  setViewAsIdx]  = useState(1)
  const [phase,      setPhase]      = useState('thinking')
  const [speakerIdx, setSpeakerIdx] = useState(0)

  const [overlayLines,    setOverlayLines]    = useState(null)
  const [overlaySubLines, setOverlaySubLines] = useState(null)
  const [overlaySpeak,    setOverlaySpeak]    = useState(false)
  const [overlayVisible,  setOverlayVisible]  = useState(false)
  const overlayTimer = useRef(null)
  const prevPhase    = useRef(phase)
  const prevSpeaker  = useRef(speakerIdx)

  const myPlayer        = MOCK_PLAYERS[viewAsIdx]
  const { currentSpeakerId, speakerStatuses, guessResult, flippedPositions } = buildState(phase, speakerIdx)

  const isSpotter       = myPlayer.id === SPOTTER_ID
  const isSpeaker       = myPlayer.id === currentSpeakerId
  const myAssignment    = ASSIGNMENTS[myPlayer.id] || null
  const waitingForGuess = phase === 'guessing' || phase === 'correct' || phase === 'wrong'
  const roleTag         = isSpotter ? 'SPOTTER' : isSpeaker ? 'SPEAKER' : 'AUDIENCE'

  function triggerOverlay(lines, subLines = null, showSpeak = false, duration = 1900) {
    clearTimeout(overlayTimer.current)
    setOverlayLines(lines)
    setOverlaySubLines(subLines)
    setOverlaySpeak(showSpeak)
    setOverlayVisible(true)
    overlayTimer.current = setTimeout(() => setOverlayVisible(false), duration)
  }

  useEffect(() => {
    const phaseChanged   = phase !== prevPhase.current
    const speakerChanged = speakerIdx !== prevSpeaker.current

    if (phaseChanged || speakerChanged) {
      const speakerName  = nameOf(currentSpeakerId, myPlayer.id)
      const spotterName  = nameOf(SPOTTER_ID, myPlayer.id)
      const sc           = colorOf(currentSpeakerId)
      const stc          = colorOf(SPOTTER_ID)
      const myc          = colorOf(myPlayer.id)

      if (phase === 'guessing' && phaseChanged) {
        triggerOverlay(
          [{ text: spotterName, color: stc }, { text: ' is guessing', color: '#fff' }],
          [[{ text: speakerName, color: sc }]],
        )
      } else if ((phase === 'thinking' || phase === 'second_chance') && speakerChanged) {
        if (isSpeaker) {
          triggerOverlay(
            [{ text: 'You ', color: myc }, { text: 'are talking', color: '#fff' }],
            [[{ text: spotterName, color: stc }, { text: ' is guessing', color: '#fff' }]],
            true,
            2500,
          )
        } else {
          triggerOverlay(
            [{ text: speakerName, color: sc }, { text: "'s turn", color: '#fff' }],
          )
        }
      } else if (phase === 'correct' && phaseChanged) {
        triggerOverlay(
          [{ text: 'Correct!', color: '#2ecc71' }],
          [[{ text: spotterName, color: stc }, { text: ' got ', color: '#fff' }, { text: speakerName, color: sc }]],
        )
      } else if (phase === 'wrong' && phaseChanged) {
        triggerOverlay(
          [{ text: 'Wrong!', color: '#e74c3c' }],
          [[{ text: speakerName, color: sc }, { text: ' slips through', color: '#fff' }]],
        )
      }
    }

    prevPhase.current   = phase
    prevSpeaker.current = speakerIdx
  }, [phase, speakerIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="game-container">
      <div className="lobby-bg lobby-bg-game" style={{ backgroundImage: `url(${monsterBanner})` }} />

      {/* position: relative so the full-screen overlay can cover all 3 columns */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', height: '100%', overflow: 'hidden',
      }}>

        {/* ── Left panel ── */}
        <LeftPanel speakerIdx={speakerIdx} myPlayerId={myPlayer.id} />

        {/* ── Centre: grid + action strip ── */}
        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Grid area: vertically centred, overflow hidden to contain the grid */}
          <div style={{
            flex: 1, minHeight: 0,
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: '10px 12px 0',
          }}>
            <SeanGrid
              isSpotter={isSpotter}
              myAssignment={myAssignment}
              currentSpeakerId={currentSpeakerId}
              flippedPositions={flippedPositions}
              guessResult={guessResult}
              waitingForGuess={waitingForGuess}
            />
          </div>

          {/* Action strip: fixed 70px, always visible */}
          <BottomStrip isSpeaker={isSpeaker} isSpotter={isSpotter} phase={phase} />
        </div>

        {/* ── Right panel ── */}
        <div style={{
          width: 230, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          background: 'rgba(0,0,0,0.45)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          overflow: 'hidden',
        }}>
          <SeanScoreboard myPlayerId={myPlayer.id} />
          <SeanChat       myPlayerId={myPlayer.id} />
          <ChatInput />
        </div>

        {/* ── Full-screen overlay: covers all 3 columns ── */}
        <FullOverlay
          lines={overlayLines}
          subLines={overlaySubLines}
          showSpeak={overlaySpeak}
          visible={overlayVisible}
        />

      </div>

      <SeanDevControls
        viewAsIdx={viewAsIdx}   setViewAsIdx={setViewAsIdx}
        speakerIdx={speakerIdx} setSpeakerIdx={setSpeakerIdx}
        phase={phase}           setPhase={setPhase}
        onClose={onClose}
        roleTag={roleTag}
      />
    </div>
  )
}
