import { useState, useEffect, useRef } from 'react'
import { MONSTERS } from '../data/monsters'
import cardBack from '../assets/monsters/card-back.png'
import { useWebRTC } from '../hooks/useWebRTC'
import QuoteCard from './QuoteCard'
import mvLogo from '../assets/brand/mv-logo.png'

const MIC_ERRORS = {
  needs_https: "You need a secure connection (https://). Change the URL and accept the browser warning.",
  not_supported: "Your browser doesn't support microphone access. Try Chrome or Safari.",
  denied: "Microphone permission was denied. Allow mic access in your browser settings, then refresh.",
  error: "Couldn't access microphone. Check no other app is using it, then try again.",
}

export default function PigView({ gauntletState, myMonster, quoteFlipKey, socket }) {
  const { shuffledMonsters, quote, phase, solvedPositions, strikes, votes, playerColors, lastResult, monstersLeft } = gauntletState

  const [stage, setStage] = useState('ready') // 'ready' | 'speaking' | 'done'
  const [micError, setMicError] = useState(null)

  const { startMic, stopMicAndUpload, micLevel, micActive } = useWebRTC(socket, true, false, null)

  // Reset mic stage when a new monster / retry arrives
  useEffect(() => {
    if (phase === 'speaking') {
      setStage('ready')
      setMicError(null)
    }
  }, [phase, quoteFlipKey])

  const handleReady = async () => {
    setMicError(null)
    const result = await startMic()
    if (result === true) {
      localStorage.setItem('mic-granted', 'true')
      setStage('speaking')
    } else {
      setMicError(result)
    }
  }

  const handleDone = () => {
    setStage('done')
    stopMicAndUpload()
    socket.emit('done_speaking')
  }

  const isHttps = window.isSecureContext
  const micGrantedBefore = localStorage.getItem('mic-granted') === 'true'
  const numBars = 12
  const bars = Array.from({ length: numBars }, (_, i) => micLevel > (i / numBars) * 100)

  const solvedCount = solvedPositions.length

  return (
    <div className="waiting-layout">
      {/* Header */}
      <div className="waiting-header">
        <div className="role-badge role-badge-pig">You are PIG</div>
        <GauntletStrikeBar strikes={strikes} />
      </div>

      <div className="waiting-body">
        {/* Monster grid */}
        <div className="waiting-grid-col">
          <div className="monster-grid monster-grid-fill">
            {Array.from({ length: 9 }, (_, position) => {
              const monsterIndex = shuffledMonsters[position]
              const isSolved = solvedPositions.includes(position)
              const isMine = myMonster && myMonster.position === position && !isSolved

              // Show votes from spotters on PIG's grid too (for entertainment)
              const votersHere = Object.entries(votes || {})
                .filter(([, pos]) => pos === position)
                .map(([pid]) => playerColors[pid])

              // Result highlighting
              const showCorrect = lastResult && lastResult.correct && lastResult.position === position
              const showWrong = lastResult && !lastResult.correct && lastResult.guessedPosition === position

              return (
                <div key={position} className="monster-card-flipper">
                  <div className={`monster-card-inner ${isSolved ? 'is-flipped' : ''}`}>
                    <div className={[
                      'monster-card monster-card-face monster-card-front',
                      isMine ? 'monster-card-mine' : '',
                      showCorrect ? 'monster-card-correct' : '',
                      showWrong ? 'monster-card-wrong' : '',
                    ].filter(Boolean).join(' ')}>
                      <img src={MONSTERS[monsterIndex]} alt={`Monster ${monsterIndex + 1}`} className="monster-img" />
                      {votersHere.length > 0 && (
                        <div className="vote-dots">
                          {votersHere.map((color, i) => (
                            <span key={i} className="vote-dot" style={{ background: color }} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="monster-card monster-card-face monster-card-back">
                      <img src={cardBack} alt="Card back" className="monster-img" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mic controls */}
          <div className="waiting-controls">
            <div className="mic-action-section">
              {!isHttps && (
                <div className="mic-error">
                  You're on http:// — change to <strong>https://</strong> and accept the security warning.
                </div>
              )}
              {micError && <div className="mic-error">{MIC_ERRORS[micError] || MIC_ERRORS.error}</div>}

              {phase === 'voting' && (
                <div className="done-message">
                  Spotters are voting... watch the grid!
                </div>
              )}

              {phase === 'result' && lastResult && (
                <div className={`done-message ${lastResult.correct ? 'result-correct' : 'result-wrong'}`}>
                  {lastResult.correct ? 'Correct! Next monster incoming...' : `Wrong! ${5 - strikes} strikes remaining.`}
                </div>
              )}

              {phase === 'speaking' && (
                <>
                  {stage === 'speaking' && (
                    <div className="mic-visualizer-inline">
                      <div className="visualizer-bars">
                        {bars.map((active, i) => (
                          <div key={i} className={`viz-bar ${active ? 'viz-bar-active' : ''}`}
                            style={{ height: `${8 + (i % 4) * 6}px` }} />
                        ))}
                      </div>
                      <div className="mic-level-label">
                        {micLevel > 20 ? 'Voice detected!' : 'Speak now...'}
                      </div>
                    </div>
                  )}

                  {stage === 'ready' && isHttps && !micError && (
                    <p className="ready-hint">
                      {micGrantedBefore
                        ? 'Ready? Tap to start recording.'
                        : 'Tap below — your browser will ask for microphone permission.'}
                    </p>
                  )}

                  {stage !== 'done' && (
                    <button
                      className={`btn ${stage === 'speaking' ? 'btn-done' : 'btn-ready'}`}
                      onClick={stage === 'speaking' ? handleDone : handleReady}
                      disabled={!isHttps}
                    >
                      {stage === 'speaking' ? 'Done Speaking' : "I'm Ready to Speak"}
                    </button>
                  )}

                  {stage === 'done' && (
                    <div className="done-message">Uploading... spotters are listening!</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="waiting-right-col">
          <div className="game-sidebar-logo-wrap">
            <img src={mvLogo} alt="Monster Voices" className="game-sidebar-logo" />
          </div>
          <div className="gauntlet-progress">
            <div className="gauntlet-progress-label">Monsters Found</div>
            <div className="gauntlet-progress-count">{solvedCount} <span>/ 9</span></div>
          </div>
          <QuoteCard quote={quote} flipKey={quoteFlipKey} />
        </div>
      </div>
    </div>
  )
}

function GauntletStrikeBar({ strikes }) {
  return (
    <div className="gauntlet-strike-bar">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className={`strike-token ${i < strikes ? 'strike-token-active' : ''}`}>
          ✕
        </div>
      ))}
    </div>
  )
}
