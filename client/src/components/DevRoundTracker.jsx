// Virtual table — right-column vertical layout.
// Spotter at top, speaker queue below as a list.
// Uses the same visual language as the scoreboard.

import { AVATARS } from '../data/avatars'
import { MONSTERS } from '../data/monsters'

const STATUS = {
  waiting:     { border: 'rgba(255,255,255,0.08)', glow: 'none',                          dot: '#333',     label: null,    labelColor: '#555'    },
  current:     { border: '#f0b429',               glow: '0 0 10px rgba(240,180,41,0.35)', dot: '#f0b429',  label: 'NOW',   labelColor: '#f0b429' },
  next:        { border: 'rgba(255,255,255,0.2)', glow: 'none',                           dot: '#777',     label: 'NEXT',  labelColor: '#999'    },
  guessed:     { border: '#2ecc71',               glow: 'none',                           dot: '#2ecc71',  label: '✓',     labelColor: '#2ecc71' },
  not_guessed: { border: '#555',                  glow: 'none',                           dot: '#444',     label: '✗',     labelColor: '#555'    },
  encore:      { border: '#f39c12',               glow: 'none',                           dot: '#f39c12',  label: '↩',     labelColor: '#f39c12' },
}

export default function DevRoundTracker({
  players, spotterId, speakingOrder, assignments,
  currentSpeakerId, speakerStatuses, myPlayerId,
}) {
  const spotter        = players.find(p => p.id === spotterId)
  const isMySpot       = spotterId === myPlayerId
  const currentOrderIdx = speakingOrder.indexOf(currentSpeakerId)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(0,0,0,0.45)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      flexShrink: 0,
    }}>

      {/* ── Spotter row ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '9px 12px',
        background: 'rgba(80,80,200,0.09)',
        borderBottom: '1px solid rgba(100,100,220,0.15)',
      }}>
        <div style={{
          width: 3, alignSelf: 'stretch',
          background: '#8888dd', borderRadius: 2, flexShrink: 0, opacity: 0.8,
        }} />
        <div style={{ position: 'relative' }}>
          <div className="scoreboard-avatar-wrap" style={{
            width: 34, height: 34,
            border: '2px solid #8888dd',
            boxShadow: '0 0 8px rgba(140,140,230,0.3)',
          }}>
            <img src={AVATARS[spotter?.avatarId ?? 0]} alt="" className="scoreboard-avatar"
              style={{ animationName: 'none', width: '100%', height: '100%' }} />
          </div>
          {isMySpot && <YouTag />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'MonsterHeadline', sans-serif",
            fontSize: 8, color: '#8888dd', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2,
          }}>
            👁 Spotter
          </div>
          <div className="scoreboard-name" style={{ fontSize: 13, color: '#c8c8f8' }}>
            {spotter?.name}
          </div>
        </div>
      </div>

      {/* ── Speaker queue ── */}
      <div style={{ padding: '6px 0' }}>
        <div style={{
          fontFamily: "'MonsterHeadline', sans-serif",
          fontSize: 8, color: '#444', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '0 12px', marginBottom: 4,
        }}>
          Speakers
        </div>

        {speakingOrder.map((pid, idx) => {
          const player     = players.find(p => p.id === pid)
          const isCurrent  = pid === currentSpeakerId
          const isMe       = pid === myPlayerId
          const rawStatus  = speakerStatuses[pid]
          const isNext     = !rawStatus && idx === currentOrderIdx + 1
          const statusKey  = rawStatus || (isCurrent ? 'current' : isNext ? 'next' : 'waiting')
          const s          = STATUS[statusKey] || STATUS.waiting
          const assignment = assignments[pid]
          const monsterSrc = isCurrent && assignment ? MONSTERS[assignment.monsterIndex] : null
          const isDone     = rawStatus === 'guessed' || rawStatus === 'not_guessed'

          return (
            <div key={pid} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              background: isCurrent ? 'rgba(240,180,41,0.06)' : 'transparent',
              borderLeft: isCurrent ? '2px solid #f0b429' : '2px solid transparent',
              opacity: isDone ? 0.45 : 1,
              transition: 'background 0.2s',
            }}>
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div className="scoreboard-avatar-wrap" style={{
                  width: isCurrent ? 30 : 24,
                  height: isCurrent ? 30 : 24,
                  border: `1.5px solid ${s.border}`,
                  boxShadow: s.glow,
                  transition: 'width 0.2s, height 0.2s',
                }}>
                  <img src={AVATARS[player?.avatarId ?? 0]} alt="" className="scoreboard-avatar"
                    style={{ animationName: 'none', width: '100%', height: '100%' }} />
                </div>
                {isMe && <YouTag />}
              </div>

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'MonsterHeadline', sans-serif",
                  fontSize: isCurrent ? 12 : 10,
                  color: isCurrent ? '#fff' : isDone ? '#444' : '#999',
                  fontWeight: isCurrent ? 700 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {player?.name}
                </div>
              </div>

              {/* Monster card peek (current speaker only) */}
              {monsterSrc && (
                <div style={{
                  width: 20, height: 28,
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '1.5px solid #f0b429',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                  flexShrink: 0,
                }}>
                  <img src={monsterSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {/* Status badge */}
              {s.label && (
                <div style={{
                  fontFamily: "'MonsterHeadline', sans-serif",
                  fontSize: 8, fontWeight: 700,
                  color: s.labelColor, letterSpacing: '0.05em',
                  flexShrink: 0,
                }}>
                  {s.label}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function YouTag() {
  return (
    <div style={{
      position: 'absolute',
      bottom: -6, left: '50%',
      transform: 'translateX(-50%)',
      background: '#fff', color: '#000',
      fontSize: 6, fontWeight: 900,
      padding: '1px 3px', borderRadius: 2,
      letterSpacing: '0.08em', whiteSpace: 'nowrap',
      zIndex: 2,
    }}>
      YOU
    </div>
  )
}
