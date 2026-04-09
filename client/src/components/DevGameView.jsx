import { useState } from 'react'
import MonsterSpotterView from './MonsterSpotterView'
import SpeakerView from './SpeakerView'
import WaitingPlayerView from './WaitingPlayerView'
import RoundResults from './RoundResults'
import ChatPanel from './ChatPanel'
import monsterBanner from '../assets/brand/monster-banner.jpg'

// ---- Mock Data ----

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

const MOCK_SPOTTER_ID = 'p0'
const MOCK_SPEAKING_ORDER = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9']
const MOCK_MONSTERS = [10, 30, 50, 70, 90, 110, 130, 150, 170]
const MOCK_QUOTE = 15

// Grid positions (0-8) and monster indices for each speaker
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

const MOCK_SCORES = MOCK_PLAYERS.map(p => ({
  id: p.id, name: p.name, score: p.score, avatarId: p.avatarId,
}))

// No-op socket — keeps hooks alive without crashing
const MOCK_SOCKET = { on: () => {}, off: () => {}, emit: () => {}, id: 'dev' }

const PHASES = [
  { value: 'thinking',      label: "Speaker's turn — thinking" },
  { value: 'recording',     label: "Speaker's turn — recording" },
  { value: 'guessing',      label: 'Spotter is guessing' },
  { value: 'correct',       label: 'Guess: Correct!' },
  { value: 'wrong',         label: 'Guess: Wrong (Encore)' },
  { value: 'second_chance', label: 'Second Chance round' },
  { value: 'round_ended',   label: 'Round Ended' },
]

function buildState(phase, speakerIdx) {
  const currentSpeakerId = MOCK_SPEAKING_ORDER[speakerIdx]
  const currentSpeaker   = MOCK_PLAYERS.find(p => p.id === currentSpeakerId)
  const assignment       = MOCK_ASSIGNMENTS[currentSpeakerId]

  const isSecondChance  = phase === 'second_chance'
  const waitingForGuess = phase === 'guessing' || phase === 'correct' || phase === 'wrong'
  const speakerIsRecording = phase === 'recording'

  // Build speakerStatuses for "done" players (everyone before the current speaker has been guessed)
  const speakerStatuses = {}
  MOCK_SPEAKING_ORDER.slice(0, speakerIdx).forEach(pid => {
    speakerStatuses[pid] = 'guessed'
  })

  const roundState = {
    spotterId: MOCK_SPOTTER_ID,
    shuffledMonsters: MOCK_MONSTERS,
    quote: MOCK_QUOTE,
    currentSpeakerId,
    speakerName: currentSpeaker?.name || '',
    waitingForGuess,
    phase: isSecondChance ? 'second_chance' : 'speaking',
    speakingOrder: MOCK_SPEAKING_ORDER,
    speakerIsRecording,
    speakerStatuses,
  }

  let guessResult = null
  let flippedPositions = MOCK_SPEAKING_ORDER.slice(0, speakerIdx).map(
    pid => MOCK_ASSIGNMENTS[pid].position
  )

  if (phase === 'correct') {
    guessResult = {
      correct: true,
      speakerId: currentSpeakerId,
      speakerName: currentSpeaker?.name || '',
      position: assignment.position,
      monsterIndex: assignment.monsterIndex,
      guessedPosition: assignment.position,
      points: 2,
      isSecondChance: false,
      wagerOutcomes: [],
    }
    flippedPositions = [...flippedPositions, assignment.position]
  } else if (phase === 'wrong') {
    guessResult = {
      correct: false,
      speakerId: currentSpeakerId,
      speakerName: currentSpeaker?.name || '',
      position: assignment.position,
      monsterIndex: assignment.monsterIndex,
      guessedPosition: (assignment.position + 2) % 9,
      points: 0,
      isSecondChance: false,
      wagerOutcomes: [],
    }
  }

  const roundResults = phase === 'round_ended' ? {
    reveals: MOCK_SPEAKING_ORDER.map((pid, i) => {
      const a = MOCK_ASSIGNMENTS[pid]
      const player = MOCK_PLAYERS.find(p => p.id === pid)
      return {
        playerId: pid,
        playerName: player.name,
        position: a.position,
        monsterIndex: a.monsterIndex,
        guessed: i % 3 !== 2, // deterministic: every 3rd player missed
      }
    }),
    scores: MOCK_SCORES,
  } : null

  return { roundState, guessResult, flippedPositions, roundResults }
}

const barStyle = {
  background: '#111',
  borderBottom: '2px solid #444',
  padding: '8px 12px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap',
  zIndex: 1000,
  flexShrink: 0,
}

const labelStyle = {
  color: '#888',
  fontFamily: 'monospace',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
}

const selectStyle = {
  fontFamily: 'monospace',
  fontSize: '12px',
  padding: '3px 6px',
  background: '#333',
  color: '#ccc',
  border: '1px solid #555',
  borderRadius: '3px',
}

export default function DevGameView({ onClose }) {
  const [viewAsIdx, setViewAsIdx] = useState(0)
  const [phase,     setPhase]     = useState('thinking')
  const [speakerIdx, setSpeakerIdx] = useState(0)

  const myPlayer = MOCK_PLAYERS[viewAsIdx]
  const { roundState, guessResult, flippedPositions, roundResults } = buildState(phase, speakerIdx)

  const isSpotter = myPlayer.id === MOCK_SPOTTER_ID
  const isSpeaker = myPlayer.id === MOCK_SPEAKING_ORDER[speakerIdx]
  const myMonster = MOCK_ASSIGNMENTS[myPlayer.id] || null

  const roleTag = isSpotter ? 'SPOTTER' : isSpeaker ? 'SPEAKER' : 'AUDIENCE'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1a1a1a' }}>

      {/* ── Dev controls bar ── */}
      <div style={barStyle}>
        <button
          onClick={onClose}
          style={{ fontFamily: 'monospace', fontSize: '13px', padding: '4px 10px', cursor: 'pointer' }}
        >
          ← Back
        </button>

        <span style={labelStyle}>View as:</span>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {MOCK_PLAYERS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setViewAsIdx(i)}
              style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '3px 8px',
                cursor: 'pointer',
                background: viewAsIdx === i ? '#f0b429' : '#2a2a2a',
                color: viewAsIdx === i ? '#000' : '#ccc',
                border: '1px solid #555',
                borderRadius: '3px',
                fontWeight: viewAsIdx === i ? 'bold' : 'normal',
              }}
            >
              {i === 0 ? `${p.name} ★` : p.name}
            </button>
          ))}
        </div>

        <span style={labelStyle}>Speaker:</span>
        <select
          value={speakerIdx}
          onChange={e => setSpeakerIdx(Number(e.target.value))}
          style={selectStyle}
        >
          {MOCK_SPEAKING_ORDER.map((pid, i) => {
            const p = MOCK_PLAYERS.find(pl => pl.id === pid)
            return <option key={pid} value={i}>{p.name}</option>
          })}
        </select>

        <span style={labelStyle}>Phase:</span>
        <select
          value={phase}
          onChange={e => setPhase(e.target.value)}
          style={selectStyle}
        >
          {PHASES.map(ph => (
            <option key={ph.value} value={ph.value}>{ph.label}</option>
          ))}
        </select>

        <span style={{ color: '#f0b429', fontFamily: 'monospace', fontSize: '11px', marginLeft: 4 }}>
          [{roleTag}]
        </span>
      </div>

      {/* ── Game area — mirrors the real game layout ── */}
      <div className="game-container" style={{ flex: 1, minHeight: 0 }}>
        <div className="lobby-bg lobby-bg-game" style={{ backgroundImage: `url(${monsterBanner})` }} />

        {roundResults && (
          <RoundResults
            reveals={roundResults.reveals}
            scores={roundResults.scores}
            isHost={false}
            onStartNextRound={() => {}}
          />
        )}

        <div className="game-chat-layout">
          <ChatPanel
            messages={[]}
            onSend={() => {}}
            myPlayer={myPlayer}
            onSendEmote={() => {}}
          />

          <div className="game-view-wrap">
            {isSpotter && (
              <MonsterSpotterView
                roundState={roundState}
                guessResult={guessResult}
                scores={MOCK_SCORES}
                players={MOCK_PLAYERS}
                socket={MOCK_SOCKET}
                flippedPositions={flippedPositions}
                quoteFlipKey={0}
                cardRevealActive={false}
                activeEmotes={{}}
              />
            )}

            {!isSpotter && isSpeaker && (
              <SpeakerView
                roundState={roundState}
                myMonster={myMonster}
                guessResult={guessResult}
                scores={MOCK_SCORES}
                socket={MOCK_SOCKET}
                flippedPositions={flippedPositions}
                quoteFlipKey={0}
                cardRevealActive={false}
                activeEmotes={{}}
              />
            )}

            {!isSpotter && !isSpeaker && !roundResults && (
              <WaitingPlayerView
                roundState={roundState}
                myMonster={myMonster}
                guessResult={guessResult}
                scores={MOCK_SCORES}
                players={MOCK_PLAYERS}
                socket={MOCK_SOCKET}
                quoteFlipKey={0}
                flippedPositions={flippedPositions}
                cardRevealActive={false}
                activeEmotes={{}}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
