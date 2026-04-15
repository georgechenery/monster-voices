// Sandbox — a live viewer for the three real game view components.
//
// Renders MonsterSpotterView, SpeakerView, or WaitingPlayerView directly —
// the same components used in actual games. Any styling or layout changes made
// to those components automatically appear here.
//
// A stub socket prevents crashes; WebRTC won't connect and emits are no-ops.
// Use the floating dev panel to switch player count, whose perspective you see,
// which speaker is active, and what game phase you're in.

import { useState, useRef, useEffect } from 'react'
import MonsterSpotterView from './MonsterSpotterView'
import SpeakerView from './SpeakerView'
import WaitingPlayerView from './WaitingPlayerView'
import DevNumberCardFan from './DevNumberCardFan'
import QuoteCard from './QuoteCard'
import RoundResults from './RoundResults'

// ── Stub socket ────────────────────────────────────────────────────────────────
// Game views call socket.emit() and socket.on/off() for WebRTC signalling and
// game events. With these stubs nothing connects; the UI renders normally.
const MOCK_SOCKET = { id: 'sandbox', emit: () => {}, on: () => {}, off: () => {} }

// ── Mock data ──────────────────────────────────────────────────────────────────
// p0 is always the spotter. Speakers are p1 … p(n-1).
const ALL_PLAYERS = [
  { id: 'p0', name: 'Alex',   score: 12, avatarId: 0, isHost: true },
  { id: 'p1', name: 'Blake',  score:  8, avatarId: 1 },
  { id: 'p2', name: 'Casey',  score: 15, avatarId: 2 },
  { id: 'p3', name: 'Dana',   score:  5, avatarId: 3 },
  { id: 'p4', name: 'Ellis',  score: 20, avatarId: 4 },
  { id: 'p5', name: 'Finn',   score:  3, avatarId: 5 },
  { id: 'p6', name: 'Gray',   score: 11, avatarId: 7 },
  { id: 'p7', name: 'Harper', score:  7, avatarId: 8 },
  { id: 'p8', name: 'Indie',  score:  9, avatarId: 9 },
]

const ALL_ASSIGNMENTS = {
  p1: { position: 4, monsterIndex: 10  },
  p2: { position: 0, monsterIndex: 30  },
  p3: { position: 8, monsterIndex: 50  },
  p4: { position: 2, monsterIndex: 70  },
  p5: { position: 6, monsterIndex: 90  },
  p6: { position: 1, monsterIndex: 110 },
  p7: { position: 3, monsterIndex: 130 },
  p8: { position: 5, monsterIndex: 150 },
}

// Filler monster indices for unassigned board positions
const BASE_BOARD = [5, 15, 25, 35, 45, 55, 65, 75, 85]

const PHASES = [
  { value: 'thinking',      label: 'Thinking (pre-speak)'  },
  { value: 'recording',     label: 'Recording voice'        },
  { value: 'guessing',      label: 'Spotter guessing'       },
  { value: 'correct',       label: 'Guess correct!'         },
  { value: 'wrong',         label: 'Guess wrong (encore)'   },
  { value: 'second_chance', label: 'Second chance'          },
  { value: 'round_ended',   label: 'Round ended'            },
]

const MOCK_CHAT = [
  { playerId: 'p2', playerName: 'Casey', avatarId: 2, text: 'good luck everyone!', ts: 0 },
  { playerId: 'p5', playerName: 'Finn',  avatarId: 5, text: 'lmao',                ts: 1 },
]

// ── Data helpers ───────────────────────────────────────────────────────────────

const MEDIUM_COUNTS = { 3: 6, 4: 6, 5: 7, 6: 8, 7: 8, 8: 8 }

function getMonsterCount(difficulty, numPlayers) {
  if (difficulty === 'easy')   return numPlayers
  if (difficulty === 'medium') return MEDIUM_COUNTS[numPlayers] ?? 9
  return 9
}

// Fixed positions for each slot index so monsters always land in sensible spots
const POSITION_ORDER = [4, 0, 8, 2, 6, 1, 3, 5, 7]

function buildGameData(n, difficulty = 'hard') {
  const players       = ALL_PLAYERS.slice(0, n)
  const spotterId     = 'p0'
  const speakingOrder = players.slice(1).map(p => p.id)
  const numMonsters   = getMonsterCount(difficulty, n)

  // Assign each speaker a position — only use positions that fit within the grid
  const validPositions = POSITION_ORDER.filter(p => p < numMonsters)
  const assignments = {}
  speakingOrder.forEach((pid, i) => {
    const position = validPositions[i % validPositions.length]
    assignments[pid] = { position, monsterIndex: ALL_ASSIGNMENTS[pid].monsterIndex }
  })

  const shuffledMonsters = BASE_BOARD.slice(0, numMonsters)
  Object.values(assignments).forEach(({ position, monsterIndex }) => {
    shuffledMonsters[position] = monsterIndex
  })

  const scores = players.map(p => ({ id: p.id, name: p.name, score: p.score, avatarId: p.avatarId }))
  return { players, spotterId, speakingOrder, assignments, shuffledMonsters, scores }
}

function buildState({ players, spotterId, speakingOrder, assignments, shuffledMonsters, scores }, phase, speakerIdx, roundNum, playerCount) {
  const currentSpeakerId = speakingOrder[speakerIdx]
  const assignment       = assignments[currentSpeakerId]
  const waitingForGuess  = phase === 'guessing' || phase === 'correct' || phase === 'wrong'

  const speakerStatuses  = {}
  speakingOrder.slice(0, speakerIdx).forEach(pid => { speakerStatuses[pid] = 'guessed' })

  let guessResult      = null
  let flippedPositions = speakingOrder.slice(0, speakerIdx).map(pid => assignments[pid].position)

  if (phase === 'correct') {
    speakerStatuses[currentSpeakerId] = 'guessed'
    guessResult = {
      correct: true,
      position: assignment.position, monsterIndex: assignment.monsterIndex,
      guessedPosition: assignment.position, points: 2,
    }
    flippedPositions = [...flippedPositions, assignment.position]
  } else if (phase === 'wrong') {
    speakerStatuses[currentSpeakerId] = 'encore'
    guessResult = {
      correct: false,
      position: assignment.position, monsterIndex: assignment.monsterIndex,
      guessedPosition: (assignment.position + 2) % shuffledMonsters.length,
    }
  }

  const roundResults = phase === 'round_ended' ? {
    reveals: speakingOrder.map((pid, i) => {
      const a = assignments[pid]
      return { playerId: pid, playerName: players.find(p => p.id === pid).name, position: a.position, monsterIndex: a.monsterIndex, guessed: i % 3 !== 2 }
    }),
    scores,
  } : null

  const roundState = {
    spotterId,
    currentSpeakerId,
    speakingOrder,
    waitingForGuess,
    speakerIsRecording: phase === 'recording',
    speakerStatuses,
    shuffledMonsters,
    quote: 0,
    speakerName: players.find(p => p.id === currentSpeakerId)?.name ?? '',
    phase,
    roundNumber: roundNum,
    totalRounds: playerCount,
  }

  return { guessResult, flippedPositions, roundResults, roundState }
}

// ── Floating dev controls ──────────────────────────────────────────────────────

function DevControls({ playerCount, setPlayerCount, viewAsIdx, setViewAsIdx, speakerIdx, setSpeakerIdx, phase, setPhase, roundNum, setRoundNum, difficulty, setDifficulty, players, speakingOrder, onClose, roleTag }) {
  const [pos,     setPos]  = useState({ right: 14, bottom: 14 })
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

  const onHeaderDown = e => {
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY, right: pos.right, bottom: pos.bottom }
    e.preventDefault()
  }

  const btn = (label, active, onClick) => (
    <button onClick={onClick} style={{
      fontSize: 10, padding: '2px 7px', cursor: 'pointer', borderRadius: 3,
      background: active ? '#f0b429' : '#1a1a1a',
      color:      active ? '#000'    : '#888',
      border: `1px solid ${active ? '#f0b429' : '#2a2a2a'}`,
      fontWeight: active ? 700 : 400, fontFamily: 'monospace',
    }}>{label}</button>
  )

  return (
    <div style={{
      position: 'fixed', bottom: pos.bottom, right: pos.right,
      background: 'rgba(0,0,0,0.92)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 9999, backdropFilter: 'blur(8px)',
      minWidth: 220, boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      {/* Header / drag handle */}
      <div onMouseDown={onHeaderDown} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab', userSelect: 'none' }}>
        <span style={{ color: '#f0b429', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'monospace' }}>
          ⠿ SANDBOX · <span style={{ color: '#aaa' }}>{roleTag}</span>
        </span>
        <button onClick={onClose} onMouseDown={e => e.stopPropagation()} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 11, padding: 0 }}>
          ← back
        </button>
      </div>

      {/* Player count */}
      <div>
        <div style={{ color: '#555', fontSize: 8, marginBottom: 4, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>Players</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[3, 5, 7, 9].map(n => btn(n, playerCount === n, () => {
            setPlayerCount(n); setViewAsIdx(0); setSpeakerIdx(0)
            if (n > 8) setDifficulty(d => d === 'easy' || d === 'medium' ? 'hard' : d)
            else if (n > 7) setDifficulty(d => d === 'easy' ? 'medium' : d)
          }))}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <div style={{ color: '#555', fontSize: 8, marginBottom: 4, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>Difficulty</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { value: 'easy',   label: 'Easy',   disabled: playerCount > 7 },
            { value: 'medium', label: 'Medium',  disabled: playerCount > 8 },
            { value: 'hard',   label: 'Hard',    disabled: false           },
          ].map(({ value, label, disabled }) => (
            <button key={value} onClick={() => !disabled && setDifficulty(value)} style={{
              fontSize: 10, padding: '2px 7px', cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: 3,
              background: difficulty === value ? '#f0b429' : '#1a1a1a',
              color:      difficulty === value ? '#000' : disabled ? '#333' : '#888',
              border: `1px solid ${difficulty === value ? '#f0b429' : '#2a2a2a'}`,
              fontWeight: difficulty === value ? 700 : 400, fontFamily: 'monospace',
              opacity: disabled ? 0.4 : 1,
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* View as */}
      <div>
        <div style={{ color: '#555', fontSize: 8, marginBottom: 4, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>View as</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {players.map((p, i) => btn(i === 0 ? `${p.name} ★` : p.name, viewAsIdx === i, () => setViewAsIdx(i)))}
        </div>
      </div>

      {/* Speaker + Phase */}
      <div style={{ display: 'flex', gap: 6 }}>
        <div>
          <div style={{ color: '#555', fontSize: 8, marginBottom: 3, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>Speaker</div>
          <select value={speakerIdx} onChange={e => setSpeakerIdx(Number(e.target.value))}
            style={{ fontSize: 11, padding: '2px 4px', background: '#111', color: '#ccc', border: '1px solid #333', borderRadius: 3 }}>
            {speakingOrder.map((pid, i) => (
              <option key={pid} value={i}>{players.find(p => p.id === pid)?.name}</option>
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

      {/* Round number */}
      <div>
        <div style={{ color: '#555', fontSize: 8, marginBottom: 4, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>Round</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {Array.from({ length: playerCount }, (_, i) => btn(i + 1, roundNum === i + 1, () => setRoundNum(i + 1)))}
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Sandbox({ onClose }) {
  const [playerCount, setPlayerCount] = useState(5)
  const [viewAsIdx,   setViewAsIdx]   = useState(0)
  const [speakerIdx,  setSpeakerIdx]  = useState(0)
  const [phase,       setPhase]       = useState('thinking')
  const [roundNum,    setRoundNum]    = useState(1)
  const [difficulty,  setDifficulty]  = useState('hard')

  const gameData = buildGameData(playerCount, difficulty)
  const { players, spotterId, speakingOrder, scores } = gameData

  // Clamp indices whenever player count changes
  const safeViewAsIdx  = Math.min(viewAsIdx,  players.length - 1)
  const safeSpeakerIdx = Math.min(speakerIdx, speakingOrder.length - 1)
  const safeRoundNum   = Math.min(roundNum, playerCount)

  const myPlayer    = players[safeViewAsIdx]
  const { guessResult, flippedPositions, roundResults, roundState } =
    buildState(gameData, phase, safeSpeakerIdx, safeRoundNum, playerCount)

  const isSpotter   = myPlayer.id === spotterId
  const isSpeaker   = myPlayer.id === roundState.currentSpeakerId
  const myMonster   = gameData.assignments[myPlayer.id] ?? null
  const spotterName = isSpotter ? 'you' : (players.find(p => p.id === spotterId)?.name ?? '…')
  const roleTag     = isSpotter ? 'SPOTTER' : isSpeaker ? 'SPEAKER' : 'AUDIENCE'

  return (
    <div className="game-container">
      {roundResults && (
        <RoundResults
          reveals={roundResults.reveals}
          scores={roundResults.scores}
          isHost={false}
          onStartNextRound={() => {}}
        />
      )}

      {/* Identical layout to GameView so real CSS rules apply */}
      <div className="game-chat-layout">
        <div className="game-left-col">
          <div className={isSpotter ? 'quote-card-amber-wrap' : ''}>
            <QuoteCard quote={roundState.quote} flipKey={0} />
          </div>
          <div className="game-left-fan-wrap">
            <DevNumberCardFan
              players={players}
              spotterId={spotterId}
              speakingOrder={roundState.speakingOrder}
              speakerStatuses={roundState.speakerStatuses}
              currentSpeakerId={roundState.currentSpeakerId}
              myPlayerId={myPlayer.id}
              phase={roundState.phase}
              roundNumber={roundState.roundNumber ?? 1}
              totalRounds={roundState.totalRounds ?? 1}
              activeEmotes={{}}
            />
          </div>
        </div>

        <div className="game-view-wrap">
          {isSpotter && (
            <MonsterSpotterView
              roundState={roundState}
              guessResult={guessResult}
              scores={scores}
              players={players}
              socket={MOCK_SOCKET}
              flippedPositions={flippedPositions}
              quoteFlipKey={0}
              cardRevealActive={false}
              activeEmotes={{}}
              chatMessages={MOCK_CHAT}
              onSendChat={() => {}}
              onSendEmote={() => {}}
              myPlayer={myPlayer}
            />
          )}
          {!isSpotter && isSpeaker && (
            <SpeakerView
              roundState={roundState}
              myMonster={myMonster}
              guessResult={guessResult}
              scores={scores}
              players={players}
              socket={MOCK_SOCKET}
              flippedPositions={flippedPositions}
              quoteFlipKey={0}
              cardRevealActive={false}
              activeEmotes={{}}
              chatMessages={MOCK_CHAT}
              onSendChat={() => {}}
              onSendEmote={() => {}}
              myPlayer={myPlayer}
            />
          )}
          {!isSpotter && !isSpeaker && (
            <WaitingPlayerView
              roundState={roundState}
              myMonster={myMonster}
              guessResult={guessResult}
              scores={scores}
              players={players}
              socket={MOCK_SOCKET}
              quoteFlipKey={0}
              flippedPositions={flippedPositions}
              cardRevealActive={false}
              activeEmotes={{}}
              isMidgameWatcher={false}
              myPlayerId={myPlayer.id}
              chatMessages={MOCK_CHAT}
              onSendChat={() => {}}
              onSendEmote={() => {}}
              myPlayer={myPlayer}
            />
          )}
        </div>
      </div>

      <DevControls
        playerCount={playerCount}   setPlayerCount={setPlayerCount}
        viewAsIdx={safeViewAsIdx}   setViewAsIdx={setViewAsIdx}
        speakerIdx={safeSpeakerIdx} setSpeakerIdx={setSpeakerIdx}
        phase={phase}               setPhase={setPhase}
        roundNum={safeRoundNum}     setRoundNum={setRoundNum}
        difficulty={difficulty}     setDifficulty={setDifficulty}
        players={players}
        speakingOrder={speakingOrder}
        onClose={onClose}
        roleTag={roleTag}
      />
    </div>
  )
}
