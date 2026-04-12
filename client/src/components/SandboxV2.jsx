// SandboxV2 — 10-player game sandbox built from the real game as a foundation.
// Layout: left (logo + quote + scoreboard) | center (monster grid + controls) | right (turn fan + chat)
// Card classes, status banners, and header badges mirror the real MonsterSpotterView /
// SpeakerView / WaitingPlayerView exactly.

import { useState, useRef, useEffect } from 'react'
import { MONSTERS } from '../data/monsters'
import RoundResults from './RoundResults'
import ChatPanel from './ChatPanel'
import Scoreboard from './Scoreboard'
import QuoteCard from './QuoteCard'
import VoicePanel from './VoicePanel'
import DevNumberCardFan from './DevNumberCardFan'
import cardBack from '../assets/monsters/card-back.png'
import monsterBanner from '../assets/brand/monster-banner.jpg'
import mvLogo from '../assets/brand/mv-logo.png'

// ── Mock data ──────────────────────────────────────────────────────────────────

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

const MOCK_ASSIGNMENTS = {
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

const PLAYERS        = MOCK_PLAYERS
const SPOTTER_ID     = 'p0'
const SPEAKING_ORDER = PLAYERS.slice(1).map(p => p.id)
const ASSIGNMENTS    = MOCK_ASSIGNMENTS
const BASE_SCORES    = PLAYERS.map(p => ({ id: p.id, name: p.name, score: p.score, avatarId: p.avatarId }))

// Build the shuffledMonsters array (position index → monsterIndex)
const SHUFFLED_MONSTERS = (() => {
  const arr = [5, 15, 25, 35, 45, 55, 65, 75, 85]
  Object.values(ASSIGNMENTS).forEach(({ position, monsterIndex }) => { arr[position] = monsterIndex })
  return arr
})()

const PHASES = [
  { value: 'thinking',      label: "Speaker's turn — thinking"  },
  { value: 'recording',     label: "Speaker's turn — recording" },
  { value: 'guessing',      label: 'Spotter is guessing'        },
  { value: 'correct',       label: 'Guess: Correct!'            },
  { value: 'wrong',         label: 'Guess: Wrong (Encore)'      },
  { value: 'second_chance', label: 'Second Chance round'        },
  { value: 'round_ended',   label: 'Round Ended'                },
]

function buildState(phase, speakerIdx) {
  const currentSpeakerId = SPEAKING_ORDER[speakerIdx]
  const assignment       = ASSIGNMENTS[currentSpeakerId]
  const waitingForGuess  = phase === 'guessing' || phase === 'correct' || phase === 'wrong'

  const speakerStatuses = {}
  SPEAKING_ORDER.slice(0, speakerIdx).forEach(pid => { speakerStatuses[pid] = 'guessed' })

  let guessResult      = null
  let flippedPositions = SPEAKING_ORDER.slice(0, speakerIdx).map(pid => ASSIGNMENTS[pid].position)

  if (phase === 'correct') {
    speakerStatuses[currentSpeakerId] = 'guessed'
    guessResult = { correct: true, position: assignment.position, monsterIndex: assignment.monsterIndex, guessedPosition: assignment.position }
    flippedPositions = [...flippedPositions, assignment.position]
  } else if (phase === 'wrong') {
    speakerStatuses[currentSpeakerId] = 'encore'
    guessResult = { correct: false, position: assignment.position, monsterIndex: assignment.monsterIndex, guessedPosition: (assignment.position + 2) % 9 }
  }

  const roundResults = phase === 'round_ended' ? {
    reveals: SPEAKING_ORDER.map((pid, i) => {
      const a = ASSIGNMENTS[pid]
      return { playerId: pid, playerName: PLAYERS.find(p => p.id === pid).name, position: a.position, monsterIndex: a.monsterIndex, guessed: i % 3 !== 2 }
    }),
    scores: BASE_SCORES,
  } : null

  const roundState = {
    spotterId: SPOTTER_ID,
    currentSpeakerId,
    speakingOrder: SPEAKING_ORDER,
    waitingForGuess,
    speakerIsRecording: phase === 'recording',
    speakerStatuses,
    shuffledMonsters: SHUFFLED_MONSTERS,
    quote: 0,
    speakerName: PLAYERS.find(p => p.id === currentSpeakerId)?.name ?? '',
    phase,
  }

  return { currentSpeakerId, speakerStatuses, guessResult, flippedPositions, roundResults, roundState, waitingForGuess }
}

// ── Monster grid — card classes match each real game view exactly ──────────────

function MonsterGrid({ isSpotter, isSpeaker, myAssignment, currentSpeakerId, flippedPositions, guessResult, waitingForGuess, phase }) {
  const [clickedPosition, setClickedPosition] = useState(null)
  useEffect(() => { setClickedPosition(null) }, [currentSpeakerId, phase])

  const isSecondChance = phase === 'second_chance'

  return (
    <div className="monster-grid monster-grid-fill">
      {Array.from({ length: 9 }, (_, position) => {
        const monsterIndex = SHUFFLED_MONSTERS[position]
        const isFlipped    = flippedPositions.includes(position)
        const isMine       = !isSpotter && myAssignment?.position === position

        const showCorrect = !!guessResult && guessResult.position === position && (guessResult.correct || isSecondChance)
        const showWrong   = !!guessResult && !guessResult.correct && guessResult.guessedPosition === position

        // ── Spotter-specific ──
        const isClickable = isSpotter && waitingForGuess && !isFlipped && clickedPosition === null
        const isSelected  = isSpotter && clickedPosition === position
        const isDisabled  = isSpotter && !isFlipped && !waitingForGuess && clickedPosition === null && !showCorrect && !showWrong

        let cardClasses = ['monster-card monster-card-face monster-card-front']

        if (isSpotter) {
          // Matches MonsterSpotterView exactly
          if (isClickable)  cardClasses.push('monster-card-clickable')
          if (isSelected)   cardClasses.push('monster-card-selected')
          if (showCorrect)  cardClasses.push('monster-card-correct')
          if (showWrong)    cardClasses.push('monster-card-wrong')
          if (isDisabled)   cardClasses.push('monster-card-disabled')
        } else if (isSpeaker) {
          // Matches SpeakerView exactly
          if (isMine && !showCorrect && !showWrong)   cardClasses.push('monster-card-mine')
          if (!isMine && !showCorrect && !showWrong)  cardClasses.push('monster-card-other')
          if (showCorrect) cardClasses.push('monster-card-correct')
          if (showWrong)   cardClasses.push('monster-card-wrong')
        } else {
          // Matches WaitingPlayerView exactly (no peek/wager state in sandbox)
          if (isMine && !showCorrect && !showWrong) cardClasses.push('monster-card-mine')
          if (showCorrect) cardClasses.push('monster-card-correct')
          if (showWrong)   cardClasses.push('monster-card-wrong')
        }

        return (
          <div
            key={position}
            className={[
              'monster-card-flipper',
              !isSpotter && isMine ? 'monster-card-flipper-mine'      : '',
              isClickable          ? 'monster-card-flipper-clickable' : '',
            ].filter(Boolean).join(' ')}
          >
            <div className={`monster-card-inner${isFlipped ? ' is-flipped' : ''}`}>
              <div
                className={cardClasses.join(' ')}
                onClick={() => isClickable && setClickedPosition(position)}
              >
                <img src={MONSTERS[monsterIndex]} alt="" className="monster-img" />
                {/* Spotter sees position numbers; speaker sees empty label; audience sees nothing */}
                {isSpotter  && <div className="monster-position-label">#{position + 1}</div>}
                {isSpeaker  && <div className="monster-position-label"></div>}
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

// ── Center column — header + grid + controls matching each real view ───────────

function CenterView({ isSpotter, isSpeaker, myAssignment, currentSpeakerId, flippedPositions, guessResult, waitingForGuess, phase, speakerName, spotterName }) {
  return (
    // waiting-layout gives correct column flex; max-width:none removes the centring cap
    // (same override as .game-view-wrap > .waiting-layout in the real game)
    <div className="waiting-layout" style={{ maxWidth: 'none', margin: 0 }}>

      {/* Header — matches each real view's waiting-header */}
      <div className="waiting-header" style={{ paddingRight: 0, justifyContent: 'center' }}>
        {isSpotter && (
          <>
            <div className="role-badge role-badge-spotter">You are the Monster Spotter</div>
            {phase === 'second_chance' && <div className="second-chance-badge">Second Chance Round</div>}
          </>
        )}
        {isSpeaker && (
          <div className="speaker-instruction-block">
            <h2 className="speaker-instruction-title">Your Turn to Speak!</h2>
            {phase === 'second_chance' && <div className="second-chance-badge">Second Chance Round</div>}
            <p className="speaker-instruction-sub">Read the Words of Wisdom in your monster's voice</p>
          </div>
        )}
        {!isSpotter && !isSpeaker && (
          <>
            <div className="role-badge role-badge-waiting">You are the Audience</div>
            {phase === 'second_chance' && <div className="second-chance-badge">Second Chance Round</div>}
          </>
        )}
      </div>

      {/* Grid + controls */}
      <div className="waiting-grid-col">
        <MonsterGrid
          isSpotter={isSpotter}
          isSpeaker={isSpeaker}
          myAssignment={myAssignment}
          currentSpeakerId={currentSpeakerId}
          flippedPositions={flippedPositions}
          guessResult={guessResult}
          waitingForGuess={waitingForGuess}
          phase={phase}
        />

        <div className="waiting-controls">
          {/* Spotter status — matches MonsterSpotterView */}
          {isSpotter && (
            <div className="status-banner">
              {waitingForGuess
                ? <span className="status-active">Which monster is <strong>{speakerName}</strong>? Tap to guess!</span>
                : <span className="status-waiting"><strong>{speakerName}</strong> is speaking — listen carefully!</span>
              }
            </div>
          )}

          {/* Audience status — matches WaitingPlayerView (speaker-status-banner class) */}
          {!isSpotter && !isSpeaker && (
            <div className="speaker-status-banner">
              {waitingForGuess
                ? <span className="status-guessing">The Monster Spotter is making their guess...</span>
                : <span className="status-speaking"><strong>{speakerName}</strong> is speaking — listen carefully!</span>
              }
            </div>
          )}

          {/* Speaker mic controls — visual only in sandbox */}
          {isSpeaker && (
            <div className="mic-action-section">
              {phase === 'thinking' && (
                <button className="btn btn-ready btn-ready-pulse" disabled style={{ opacity: 0.7, cursor: 'default' }}>
                  I'm Ready to Speak
                </button>
              )}
              {phase === 'recording' && (
                <div className="mic-recording-card" style={{ pointerEvents: 'none', opacity: 0.85 }}>
                  <div className="mic-recording-header">
                    <span className="rec-indicator">●</span>
                    <span className="rec-label">Recording</span>
                    <span className="rec-level-hint">Voice detected</span>
                  </div>
                  <button className="btn btn-stop-rec" disabled>Stop Recording</button>
                </div>
              )}
              {(phase === 'guessing' || phase === 'correct' || phase === 'wrong') && (
                <div className="done-message">
                  Uploading your voice… the Monster Spotter is listening!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Compact scorebug (no avatars, 2-column grid) ─────────────────────────────

const ROLE_COLORS = {
  guessing:      '#f0b429',
  being_guessed: '#e74c3c',
  speaking:      '#9b59b6',
  thinking:      '#3498db',
  next:          '#1abc9c',
  guessed:       '#2ecc71',
  encore:        '#e67e22',
}

function MiniScoreboard({ scores, roundState }) {
  if (!scores?.length) return null

  const { spotterId, currentSpeakerId, waitingForGuess, speakerIsRecording, speakerStatuses = {}, speakingOrder = [] } = roundState ?? {}

  function getRole(id) {
    if (id === spotterId)        return waitingForGuess ? 'guessing' : null
    if (id === currentSpeakerId) return waitingForGuess ? 'being_guessed' : speakerIsRecording ? 'speaking' : 'thinking'
    if (speakerStatuses[id])     return speakerStatuses[id]
    const curIdx = speakingOrder.indexOf(currentSpeakerId)
    const myIdx  = speakingOrder.indexOf(id)
    if (myIdx === curIdx + 1)    return 'next'
    return null
  }

  const sorted = [...scores].sort((a, b) => b.score - a.score)

  return (
    <div style={{ padding: '4px 4px 3px' }}>
      <div style={{ fontSize: 8, color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'monospace', marginBottom: 2, paddingLeft: 2 }}>
        Scores
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2px' }}>
        {sorted.map((player, idx) => {
          const role  = getRole(player.id)
          const color = role ? (ROLE_COLORS[role] ?? '#888') : null
          return (
            <div key={player.id} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '2px 5px', borderRadius: 4,
              background: idx === 0 ? 'rgba(240,180,41,0.18)' : 'rgba(0,0,0,0.06)',
            }}>
              {color && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
              )}
              <span style={{
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontSize: 11, fontFamily: "'MonsterHeadline', sans-serif",
                color: '#111',
              }}>
                {player.name}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#333', flexShrink: 0 }}>
                {player.score}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Floating dev controls ─────────────────────────────────────────────────────

function DevControls({ viewAsIdx, setViewAsIdx, speakerIdx, setSpeakerIdx, phase, setPhase, voiceChat, setVoiceChat, onClose, roleTag }) {
  const [pos, setPos] = useState({ right: 14, bottom: 14 })
  const dragging  = useRef(false)
  const dragStart = useRef(null)

  useEffect(() => {
    const onMove = e => {
      if (!dragging.current) return
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      setPos({ right: Math.max(0, dragStart.current.right - dx), bottom: Math.max(0, dragStart.current.bottom + dy) })
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  const onHeaderMouseDown = e => {
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY, right: pos.right, bottom: pos.bottom }
    e.preventDefault()
  }

  return (
    <div style={{
      position: 'fixed', bottom: pos.bottom, right: pos.right,
      background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10, padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 9999, backdropFilter: 'blur(8px)',
      minWidth: 210, boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      <div onMouseDown={onHeaderMouseDown} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab', userSelect: 'none' }}>
        <span style={{ color: '#f0b429', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>
          ⠿ SANDBOX V2 · <span style={{ color: '#aaa' }}>{roleTag}</span>
        </span>
        <button onClick={onClose} onMouseDown={e => e.stopPropagation()} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 11, padding: 0 }}>
          ← back
        </button>
      </div>

      <div>
        <div style={{ color: '#555', fontSize: 8, marginBottom: 4, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>View as</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {PLAYERS.map((p, i) => (
            <button key={p.id} onClick={() => setViewAsIdx(i)} style={{
              fontSize: 10, padding: '2px 6px', cursor: 'pointer', borderRadius: 3,
              background: viewAsIdx === i ? '#f0b429' : '#1a1a1a',
              color:      viewAsIdx === i ? '#000'    : '#888',
              border: `1px solid ${viewAsIdx === i ? '#f0b429' : '#2a2a2a'}`,
              fontWeight: viewAsIdx === i ? 700 : 400, fontFamily: 'monospace',
            }}>
              {i === 0 ? `${p.name} ★` : p.name}
            </button>
          ))}
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
        <input type="checkbox" checked={voiceChat} onChange={e => setVoiceChat(e.target.checked)} style={{ accentColor: '#f0b429' }} />
        <span style={{ color: '#aaa', fontSize: 10, fontFamily: 'monospace' }}>Voice chat on</span>
      </label>

      <div style={{ display: 'flex', gap: 6 }}>
        <div>
          <div style={{ color: '#555', fontSize: 8, marginBottom: 3, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>Speaker</div>
          <select value={speakerIdx} onChange={e => setSpeakerIdx(Number(e.target.value))} style={{ fontSize: 11, padding: '2px 4px', background: '#111', color: '#ccc', border: '1px solid #333', borderRadius: 3, width: '100%' }}>
            {SPEAKING_ORDER.map((pid, i) => (
              <option key={pid} value={i}>{PLAYERS.find(p => p.id === pid).name}</option>
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

export default function SandboxV2({ onClose }) {
  const [viewAsIdx,  setViewAsIdx]  = useState(0)
  const [speakerIdx, setSpeakerIdx] = useState(0)
  const [phase,      setPhase]      = useState('thinking')
  const [voiceChat,  setVoiceChat]  = useState(false)

  const safeViewAsIdx  = Math.min(viewAsIdx,  PLAYERS.length - 1)
  const safeSpeakerIdx = Math.min(speakerIdx, SPEAKING_ORDER.length - 1)

  const myPlayer = PLAYERS[safeViewAsIdx]
  const spotter  = PLAYERS.find(p => p.id === SPOTTER_ID)

  const { currentSpeakerId, speakerStatuses, guessResult, flippedPositions, roundResults, roundState, waitingForGuess } =
    buildState(phase, safeSpeakerIdx)

  const currentSpeaker  = PLAYERS.find(p => p.id === currentSpeakerId)
  const isSpotter       = myPlayer.id === SPOTTER_ID
  const isSpeaker       = myPlayer.id === currentSpeakerId
  const myOrderIdx      = SPEAKING_ORDER.indexOf(myPlayer.id)
  const currentOrderIdx = SPEAKING_ORDER.indexOf(currentSpeakerId)
  const isNext          = !isSpotter && !isSpeaker && myOrderIdx === currentOrderIdx + 1
  const myAssignment    = ASSIGNMENTS[myPlayer.id] ?? null
  const roleTag         = isSpotter ? 'SPOTTER' : isSpeaker ? 'SPEAKER' : isNext ? 'NEXT UP' : 'AUDIENCE'

  // Mirror GameView's mute logic: speaker mic muted only while actively recording
  const myVoiceMuted = isSpeaker && phase === 'recording'

  const mockChatMessages = [
    { playerId: 'p2', playerName: 'Casey', avatarId: 2, text: 'good luck everyone!', ts: 0 },
    { playerId: 'p5', playerName: 'Finn',  avatarId: 5, text: 'lmao',                ts: 1 },
  ]

  return (
    <div className="game-container">
      <div className="lobby-bg lobby-bg-game" style={{ backgroundImage: `url(${monsterBanner})` }} />

      {voiceChat && <VoicePanel isMuted={myVoiceMuted} />}

      {roundResults && (
        <RoundResults
          reveals={roundResults.reveals}
          scores={roundResults.scores}
          isHost={false}
          onStartNextRound={() => {}}
        />
      )}

      {/* 3-column layout */}
      <div style={{ display: 'flex', height: '100%', gap: 2, overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* ── LEFT: logo + quote card + chat ── */}
        <div className="sbv2-left-col" style={{
          flex: '0 0 220px', display: 'flex', flexDirection: 'column',
          gap: 2, paddingTop: 3, overflow: 'hidden',
        }}>
          <div className="game-sidebar-logo-wrap" style={{ flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
            <img src={mvLogo} alt="Monster Voices" className="game-sidebar-logo" />
          </div>
          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
            <QuoteCard quote={0} flipKey={0} />
          </div>
          <div className="sbv2-chat-wrap" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <ChatPanel
              messages={mockChatMessages}
              onSend={() => {}}
              myPlayer={myPlayer}
              onSendEmote={() => {}}
              style={{ flex: 1, minHeight: 0, width: '100%' }}
            />
          </div>
        </div>

        {/* ── CENTER: game view (grid + controls) ── */}
        <div className="sbv2-center" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <CenterView
            isSpotter={isSpotter}
            isSpeaker={isSpeaker}
            myAssignment={myAssignment}
            currentSpeakerId={currentSpeakerId}
            flippedPositions={flippedPositions}
            guessResult={guessResult}
            waitingForGuess={waitingForGuess}
            phase={phase}
            speakerName={currentSpeaker?.name ?? ''}
            spotterName={spotter?.name ?? ''}
          />
        </div>

        {/* ── RIGHT: turn order fan (fills available height) + compact scorebug ── */}
        <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden' }}>
          {/* Fan fills all space not taken by the scorebug */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <DevNumberCardFan
              players={PLAYERS}
              spotterId={SPOTTER_ID}
              speakingOrder={SPEAKING_ORDER}
              assignments={ASSIGNMENTS}
              currentSpeakerId={currentSpeakerId}
              speakerStatuses={speakerStatuses}
              myPlayerId={myPlayer.id}
              phase={phase}
            />
          </div>
          {/* Scorebug: compact, only as tall as its content */}
          <div style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.82)', borderRadius: 8, overflow: 'hidden' }}>
            <MiniScoreboard scores={BASE_SCORES} roundState={roundState} />
          </div>
        </div>

      </div>

      <DevControls
        viewAsIdx={safeViewAsIdx}   setViewAsIdx={setViewAsIdx}
        speakerIdx={safeSpeakerIdx} setSpeakerIdx={setSpeakerIdx}
        phase={phase}               setPhase={setPhase}
        voiceChat={voiceChat}       setVoiceChat={setVoiceChat}
        onClose={onClose}
        roleTag={roleTag}
      />
    </div>
  )
}
