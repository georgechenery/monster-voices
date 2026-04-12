import { useState, useRef, useEffect } from 'react'
import { MONSTERS } from '../data/monsters'
import { AVATARS } from '../data/avatars'
import RoundResults from './RoundResults'
import ChatPanel from './ChatPanel'
import Scoreboard from './Scoreboard'
import DevNumberCardFan from './DevNumberCardFan'
import cardBack from '../assets/monsters/card-back.png'
import monsterBanner from '../assets/brand/monster-banner.jpg'

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_PLAYERS = [
  { id: 'p0', name: 'Alex',   score: 12, avatarId: 0,  isHost: true },
  { id: 'p1', name: 'Blake',  score:  8, avatarId: 1 },
  { id: 'p2', name: 'Casey',  score: 15, avatarId: 2 },
  { id: 'p3', name: 'Dana',   score:  5, avatarId: 3 },
  { id: 'p4', name: 'Ellis',  score: 20, avatarId: 4 },
  { id: 'p5', name: 'Finn',   score:  3, avatarId: 5 },
  { id: 'p6', name: 'Gray',   score: 11, avatarId: 7 },
  { id: 'p7', name: 'Harper', score:  7, avatarId: 8 },
  { id: 'p8', name: 'Indie',  score:  9, avatarId: 9 },
  { id: 'p9', name: 'Jules',  score: 14, avatarId: 10 },
]

const ALL_ASSIGNMENTS = {
  p1: { position: 4, monsterIndex: 10 },
  p2: { position: 0, monsterIndex: 30 },
  p3: { position: 8, monsterIndex: 50 },
  p4: { position: 2, monsterIndex: 70 },
  p5: { position: 6, monsterIndex: 90 },
  p6: { position: 1, monsterIndex: 110 },
  p7: { position: 3, monsterIndex: 130 },
  p8: { position: 5, monsterIndex: 150 },
  p9: { position: 7, monsterIndex: 170 },
}

function buildConfig(n) {
  const players       = MOCK_PLAYERS.slice(0, n)
  const spotterId     = 'p0'
  const speakingOrder = players.slice(1).map(p => p.id)
  const assignments   = {}
  speakingOrder.forEach(pid => { assignments[pid] = ALL_ASSIGNMENTS[pid] })
  const scores        = players.map(p => ({ id: p.id, name: p.name, score: p.score, avatarId: p.avatarId }))
  return { players, spotterId, speakingOrder, assignments, scores }
}

const PHASES = [
  { value: 'thinking',      label: "Speaker's turn — thinking"  },
  { value: 'recording',     label: "Speaker's turn — recording" },
  { value: 'guessing',      label: 'Spotter is guessing'        },
  { value: 'correct',       label: 'Guess: Correct!'            },
  { value: 'wrong',         label: 'Guess: Wrong (Encore)'      },
  { value: 'second_chance', label: 'Second Chance round'        },
  { value: 'round_ended',   label: 'Round Ended'                },
]

// ── State builder ─────────────────────────────────────────────────────────────

function buildState(phase, speakerIdx, speakingOrder, assignments, players, scores) {
  const currentSpeakerId = speakingOrder[speakerIdx]
  const assignment       = assignments[currentSpeakerId]

  const speakerStatuses = {}
  speakingOrder.slice(0, speakerIdx).forEach(pid => { speakerStatuses[pid] = 'guessed' })

  let guessResult      = null
  let flippedPositions = speakingOrder.slice(0, speakerIdx).map(pid => assignments[pid].position)

  if (phase === 'correct') {
    speakerStatuses[currentSpeakerId] = 'guessed'
    guessResult = { correct: true, position: assignment.position, monsterIndex: assignment.monsterIndex, guessedPosition: assignment.position }
    flippedPositions = [...flippedPositions, assignment.position]
  } else if (phase === 'wrong') {
    speakerStatuses[currentSpeakerId] = 'encore'
    guessResult = { correct: false, position: assignment.position, monsterIndex: assignment.monsterIndex, guessedPosition: (assignment.position + 2) % 9 }
  }

  const roundResults = phase === 'round_ended' ? {
    reveals: speakingOrder.map((pid, i) => {
      const a = assignments[pid]
      return { playerId: pid, playerName: players.find(p => p.id === pid).name, position: a.position, monsterIndex: a.monsterIndex, guessed: i % 3 !== 2 }
    }),
    scores,
  } : null

  return { currentSpeakerId, speakerStatuses, guessResult, flippedPositions, roundResults }
}

// ── Monster grid ──────────────────────────────────────────────────────────────

function DevMonsterGrid({ isSpotter, myAssignment, currentSpeakerId, flippedPositions, guessResult, waitingForGuess, speakingOrder, assignments, players }) {
  const posMap = {}
  speakingOrder.forEach(pid => {
    const a = assignments[pid]
    posMap[a.position] = { pid, monsterIndex: a.monsterIndex }
  })

  return (
    <div className="monster-grid monster-grid-fill">
      {Array.from({ length: 9 }, (_, position) => {
        const info       = posMap[position]
        const pid        = info?.pid
        const player     = pid ? players.find(p => p.id === pid) : null
        const monsterIdx = info?.monsterIndex ?? MOCK_MONSTERS[position]
        const isFlipped  = flippedPositions.includes(position)
        const isCurrent  = pid === currentSpeakerId && !isFlipped
        const isMyPos    = !isSpotter && myAssignment?.position === position
        const isWrong    = guessResult && !guessResult.correct && guessResult.guessedPosition === position
        const isCorrect  = guessResult && guessResult.correct && guessResult.position === position

        return (
          <div key={position} className="monster-card-flipper">
            <div className={`monster-card-inner${isFlipped ? ' is-flipped' : ''}`}>

              {/* Front */}
              <div className={[
                'monster-card monster-card-face monster-card-front',
                isSpotter && waitingForGuess && !isFlipped ? 'monster-card-clickable' : '',
                isCurrent ? 'monster-card-selected' : '',
                isWrong   ? 'monster-card-wrong'    : '',
                isCorrect && isFlipped ? 'monster-card-correct' : '',
                !isSpotter && !isMyPos && !isFlipped ? 'monster-card-disabled' : '',
              ].filter(Boolean).join(' ')}>
                <img src={MONSTERS[monsterIdx]} alt="" className="monster-img" />
                <div className="monster-position-label">#{position + 1}</div>

                {isMyPos && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'rgba(0,0,0,0.72)', color: '#fff',
                    fontSize: 8, fontWeight: 700, textAlign: 'center',
                    padding: '2px 0', letterSpacing: '0.07em',
                    fontFamily: "'MonsterHeadline', sans-serif",
                  }}>
                    YOUR MONSTER
                  </div>
                )}
                {isCurrent && !waitingForGuess && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    background: 'rgba(240,180,41,0.82)', color: '#000',
                    fontSize: 8, fontWeight: 900, textAlign: 'center',
                    padding: '2px 0', letterSpacing: '0.07em',
                    fontFamily: "'MonsterHeadline', sans-serif",
                  }}>
                    PERFORMING
                  </div>
                )}
                {isFlipped && player && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'rgba(0,0,0,0.78)',
                    display: 'flex', alignItems: 'center', gap: 4, padding: '3px 5px',
                  }}>
                    <img src={AVATARS[player.avatarId ?? 0]} alt="" style={{ width: 13, height: 13, borderRadius: '50%', objectFit: 'cover' }} />
                    <span style={{ color: '#2ecc71', fontSize: 8, fontWeight: 700, fontFamily: "'MonsterHeadline', sans-serif" }}>{player.name}</span>
                  </div>
                )}
              </div>

              {/* Back */}
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

// ── Controls strip below grid ─────────────────────────────────────────────────

function DevWaitingControls({ isSpotter, isSpeaker, phase, speakerName, spotterName }) {
  const waitingForGuess = phase === 'guessing' || phase === 'correct' || phase === 'wrong'
  return (
    <div className="waiting-controls">
      <div className="status-banner">
        {isSpotter && (
          waitingForGuess
            ? <span className="status-active">Which monster is <strong>{speakerName}</strong>? Tap to guess!</span>
            : <span className="status-waiting"><strong>{speakerName}</strong> is speaking — listen carefully!</span>
        )}
        {isSpeaker && phase === 'thinking' && <span className="status-waiting">Press when you're ready to speak</span>}
        {isSpeaker && phase === 'recording' && <span className="status-active">Recording — give it your all!</span>}
        {isSpeaker && phase === 'guessing' && <span className="status-waiting"><strong>{spotterName}</strong> is guessing…</span>}
        {!isSpotter && !isSpeaker && <span className="status-waiting"><strong>{speakerName}</strong> is performing — listen up</span>}
      </div>
      {isSpeaker && phase === 'thinking' && (
        <button className="btn btn-ready" disabled style={{ opacity: 0.5, cursor: 'default' }}>I'm Ready</button>
      )}
      {isSpeaker && phase === 'recording' && (
        <button className="btn btn-record btn-record-active" disabled style={{ opacity: 0.7, cursor: 'default' }}>● Recording</button>
      )}
    </div>
  )
}

// ── Floating dev controls ─────────────────────────────────────────────────────

function DevControls({ viewAsIdx, setViewAsIdx, speakerIdx, setSpeakerIdx, phase, setPhase, onClose, roleTag, players, speakingOrder }) {
  const [pos, setPos] = useState({ right: 14, bottom: 14 })
  const dragging = useRef(false)
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

  const onHeaderMouseDown = e => {
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY, right: pos.right, bottom: pos.bottom }
    e.preventDefault()
  }

  return (
    <div style={{
      position: 'fixed', bottom: pos.bottom, right: pos.right,
      background: 'rgba(0,0,0,0.9)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10,
      padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 9999,
      backdropFilter: 'blur(8px)',
      minWidth: 210,
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      <div
        onMouseDown={onHeaderMouseDown}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab', userSelect: 'none' }}
      >
        <span style={{ color: '#f0b429', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>
          ⠿ DEV · <span style={{ color: '#aaa' }}>{roleTag}</span>
        </span>
        <button onClick={onClose} onMouseDown={e => e.stopPropagation()} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 11, padding: 0 }}>
          ← back
        </button>
      </div>

      <div>
        <div style={{ color: '#555', fontSize: 8, marginBottom: 4, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>View as</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {players.map((p, i) => (
            <button key={p.id} onClick={() => setViewAsIdx(i)} style={{
              fontSize: 10, padding: '2px 6px', cursor: 'pointer', borderRadius: 3,
              background: viewAsIdx === i ? '#f0b429' : '#1a1a1a',
              color: viewAsIdx === i ? '#000' : '#888',
              border: `1px solid ${viewAsIdx === i ? '#f0b429' : '#2a2a2a'}`,
              fontWeight: viewAsIdx === i ? 700 : 400,
              fontFamily: 'monospace',
            }}>
              {i === 0 ? `${p.name} ★` : p.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <div>
          <div style={{ color: '#555', fontSize: 8, marginBottom: 3, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>Speaker</div>
          <select value={speakerIdx} onChange={e => setSpeakerIdx(Number(e.target.value))} style={{ fontSize: 11, padding: '2px 4px', background: '#111', color: '#ccc', border: '1px solid #333', borderRadius: 3, width: '100%' }}>
            {speakingOrder.map((pid, i) => (
              <option key={pid} value={i}>{players.find(p => p.id === pid).name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#555', fontSize: 8, marginBottom: 3, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>Phase</div>
          <select value={phase} onChange={e => setPhase(e.target.value)} style={{ fontSize: 11, padding: '2px 4px', background: '#111', color: '#ccc', border: '1px solid #333', borderRadius: 3, width: '100%' }}>
            {PHASES.map(ph => <option key={ph.value} value={ph.value}>{ph.label}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DevGameView({ onClose, playerCount = 10 }) {
  const [viewAsIdx,  setViewAsIdx]  = useState(0)
  const [phase,      setPhase]      = useState('thinking')
  const [speakerIdx, setSpeakerIdx] = useState(0)

  const { players, spotterId, speakingOrder, assignments, scores } = buildConfig(playerCount)

  // Reset viewAsIdx and speakerIdx if they exceed the new player count
  const safeViewAsIdx  = Math.min(viewAsIdx,  players.length - 1)
  const safeSpeakerIdx = Math.min(speakerIdx, speakingOrder.length - 1)

  const myPlayer   = players[safeViewAsIdx]
  const spotter    = players.find(p => p.id === spotterId)
  const { currentSpeakerId, speakerStatuses, guessResult, flippedPositions, roundResults } = buildState(phase, safeSpeakerIdx, speakingOrder, assignments, players, scores)
  const currentSpeaker = players.find(p => p.id === currentSpeakerId)

  const isSpotter       = myPlayer.id === spotterId
  const isSpeaker       = myPlayer.id === currentSpeakerId
  const myOrderIdx      = speakingOrder.indexOf(myPlayer.id)
  const currentOrderIdx = speakingOrder.indexOf(currentSpeakerId)
  const isNext          = !isSpotter && !isSpeaker && myOrderIdx === currentOrderIdx + 1
  const myAssignment    = assignments[myPlayer.id] || null
  const waitingForGuess = phase === 'guessing' || phase === 'correct' || phase === 'wrong'
  const roleTag         = isSpotter ? 'SPOTTER' : isSpeaker ? 'SPEAKER' : isNext ? 'NEXT UP' : 'AUDIENCE'
  const mockRoundState  = { spotterId: null, currentSpeakerId: null, speakingOrder: [], waitingForGuess: false, speakerIsRecording: false, speakerStatuses: {} }

  return (
    <div className="game-container">
      <div style={{ position: 'absolute', inset: 0, background: '#fff', zIndex: 0 }} />

      {roundResults && (
        <RoundResults reveals={roundResults.reveals} scores={roundResults.scores} isHost={false} onStartNextRound={() => {}} />
      )}

      <div className="game-chat-layout">

        {/* ── Scoreboard — narrow left column ── */}
        <div style={{ width: 220, flexShrink: 0, marginTop: '2.8rem', overflowY: 'auto' }}>
          <Scoreboard scores={scores} roundState={mockRoundState} activeEmotes={{}} />
        </div>

        <div className="game-view-wrap" style={{ display: 'flex', flexDirection: 'column' }}>

          {/* ── Game body ── */}
          <div className="waiting-body" style={{ flex: 1, minHeight: 0 }}>

            <div className="waiting-grid-col">
              <DevMonsterGrid
                isSpotter={isSpotter}
                myAssignment={myAssignment}
                currentSpeakerId={currentSpeakerId}
                flippedPositions={flippedPositions}
                guessResult={guessResult}
                waitingForGuess={waitingForGuess}
                speakingOrder={speakingOrder}
                assignments={assignments}
                players={players}
              />
              <DevWaitingControls
                isSpotter={isSpotter}
                isSpeaker={isSpeaker}
                phase={phase}
                speakerName={currentSpeaker?.name}
                spotterName={spotter?.name}
              />
            </div>

            {/* ── Right column: fan + chat stacked ── */}
            <div className="waiting-right-col" style={{ flex: '0 0 360px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <DevNumberCardFan
                players={players}
                spotterId={spotterId}
                speakingOrder={speakingOrder}
                assignments={assignments}
                currentSpeakerId={currentSpeakerId}
                speakerStatuses={speakerStatuses}
                myPlayerId={myPlayer.id}
                phase={phase}
              />
              <ChatPanel
                messages={[
                  { playerId: 'p2', playerName: 'Casey', avatarId: 2, text: 'good luck everyone!', ts: 0 },
                  { playerId: 'p5', playerName: 'Finn',  avatarId: 5, text: 'lmao', ts: 1 },
                ]}
                onSend={() => {}}
                myPlayer={myPlayer}
                onSendEmote={() => {}}
                style={{ width: '100%', flex: 1, minHeight: 0 }}
              />
            </div>
          </div>
        </div>
      </div>

      <DevControls
        viewAsIdx={safeViewAsIdx}   setViewAsIdx={setViewAsIdx}
        speakerIdx={safeSpeakerIdx} setSpeakerIdx={setSpeakerIdx}
        phase={phase}               setPhase={setPhase}
        onClose={onClose}
        roleTag={roleTag}
        players={players}
        speakingOrder={speakingOrder}
      />
    </div>
  )
}
