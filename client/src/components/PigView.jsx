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

const BAR_COUNT = 50
const MAX_BAR_H = 36

function buildDisplayBars(history) {
  const pad = Math.max(0, BAR_COUNT - history.length)
  return Array(pad).fill(0).concat(history).slice(-BAR_COUNT)
}

export default function PigView({ gauntletState, myMonster, quoteFlipKey, socket }) {
  const { shuffledMonsters, quote, phase, solvedPositions, strikes, votes, playerColors, lastResult, monstersLeft } = gauntletState

  // 'ready' | 'waiting' | 'speaking' | 'review' | 'done'
  const [stage, setStage] = useState('ready')
  const [micError, setMicError] = useState(null)
  const [capturedBars, setCapturedBars] = useState([])
  const [showTurnAlert, setShowTurnAlert] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const capturedBlobRef = useRef(null)
  const turnAlertTimerRef = useRef(null)
  const pigTimerRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  const stageRef = useRef(stage)

  const { startMic, stopForReview, stopMicOnly, uploadBlob, stopMicAndUpload, micLevel, waveformHistory } = useWebRTC(socket, true, false, null)

  // Reset when a new monster or retry arrives
  useEffect(() => {
    if (phase === 'speaking') {
      stopMicOnly()
      setStage('ready')
      setMicError(null)
      capturedBlobRef.current = null
      setCapturedBars([])
      clearTimeout(turnAlertTimerRef.current)
      setShowTurnAlert(true)
      turnAlertTimerRef.current = setTimeout(() => setShowTurnAlert(false), 3000)
    }
    return () => clearTimeout(turnAlertTimerRef.current)
  }, [phase, quoteFlipKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep stageRef current so timer callbacks can read latest stage
  useEffect(() => { stageRef.current = stage }, [stage])

  // Cancel turn timer when player self-submits
  useEffect(() => {
    if (stage === 'review' || stage === 'done') {
      clearTimeout(pigTimerRef.current)
      clearInterval(countdownIntervalRef.current)
      setCountdown(null)
    }
  }, [stage])

  // Speaker timeout: starts from beginning of turn, 25s then 10s countdown
  useEffect(() => {
    if (phase !== 'speaking') return
    clearTimeout(pigTimerRef.current)
    clearInterval(countdownIntervalRef.current)
    setCountdown(null)
    pigTimerRef.current = setTimeout(() => {
      let secs = 10
      setCountdown(secs)
      countdownIntervalRef.current = setInterval(() => {
        secs -= 1
        if (secs <= 0) {
          clearInterval(countdownIntervalRef.current)
          setCountdown(null)
          const currentStage = stageRef.current
          if (currentStage === 'speaking') {
            stopMicAndUpload()
          } else if (currentStage === 'waiting') {
            stopMicOnly()
          }
          if (currentStage !== 'review' && currentStage !== 'done') {
            socket.emit('done_speaking')
            setStage('done')
          }
        } else {
          setCountdown(secs)
        }
      }, 1000)
    }, 25000)
    return () => {
      clearTimeout(pigTimerRef.current)
      clearInterval(countdownIntervalRef.current)
    }
  }, [phase, quoteFlipKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReady = async () => {
    setMicError(null)
    setStage('waiting')
    const result = await startMic()
    if (result === true) {
      localStorage.setItem('mic-granted', 'true')
      setStage('speaking')
      socket.emit('speaker_recording')
    } else {
      setStage('ready')
      setMicError(result)
    }
  }

  const handleStopForReview = async () => {
    const bars = buildDisplayBars(waveformHistory)
    setCapturedBars(bars)
    setStage('review')
    capturedBlobRef.current = await stopForReview()
  }

  const handleSubmit = () => {
    setStage('done')
    if (capturedBlobRef.current) uploadBlob(capturedBlobRef.current)
    socket.emit('done_speaking')
  }

  const handleRetry = () => {
    stopMicOnly()
    capturedBlobRef.current = null
    setCapturedBars([])
    setMicError(null)
    setStage('ready')
  }

  const isHttps = window.isSecureContext
  const micGrantedBefore = localStorage.getItem('mic-granted') === 'true'
  const displayBars = buildDisplayBars(waveformHistory)
  const solvedCount = solvedPositions.length

  const alertActive = showTurnAlert && stage === 'ready'

  return (
    <div className={`waiting-layout${alertActive ? ' turn-active' : ''}`}>

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
                <div key={position} className={`monster-card-flipper${isMine ? ' monster-card-flipper-mine' : ''}`}>
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
                <div className="done-message">Spotters are voting... watch the grid!</div>
              )}

              {phase === 'result' && lastResult && (
                <div className={`done-message ${lastResult.correct ? 'result-correct' : 'result-wrong'}`}>
                  {lastResult.correct ? 'Correct! Next monster incoming...' : `Wrong! ${5 - strikes} strikes remaining.`}
                </div>
              )}

              {phase === 'speaking' && (
                <>
                  {/* READY */}
                  {stage === 'ready' && (
                    <>
                      {alertActive && (
                        <div className="turn-popup">
                          <div className="turn-popup-title">Your Turn to Speak!</div>
                          <div className="turn-popup-sub">Read the Words of Wisdom card in your monster's voice</div>
                          <div className="turn-popup-arrow">↓</div>
                        </div>
                      )}
                      {isHttps && !micError && (
                        <p className="ready-hint">
                          {micGrantedBefore ? 'Ready? Tap to start recording.' : 'Tap below — your browser will ask for microphone permission.'}
                        </p>
                      )}
                      <button className="btn btn-ready btn-ready-pulse" onClick={handleReady} disabled={!isHttps}>
                        I'm Ready to Speak
                      </button>
                    </>
                  )}

                  {/* WAITING */}
                  {stage === 'waiting' && (
                    <div className="mic-waiting">
                      <div className="mic-waiting-dots"><span /><span /><span /></div>
                      <p className="mic-waiting-label">Get Ready...</p>
                    </div>
                  )}

                  {/* SPEAKING */}
                  {stage === 'speaking' && (
                    <div className="mic-recording-card">
                      <div className="mic-recording-header">
                        <span className="rec-indicator">●</span>
                        <span className="rec-label">Recording</span>
                        <span className="rec-level-hint">{micLevel > 20 ? 'Voice detected' : 'Speak now…'}</span>
                      </div>
                      <div className="mic-waveform">
                        {displayBars.map((amp, i) => (
                          <div key={i} className="waveform-bar"
                            style={{ height: `${Math.max(3, Math.round(amp * MAX_BAR_H))}px` }} />
                        ))}
                      </div>
                      <button className="btn btn-stop-rec" onClick={handleStopForReview}>Stop Recording</button>
                    </div>
                  )}

                  {/* REVIEW */}
                  {stage === 'review' && (
                    <div className="mic-recording-card mic-review-card">
                      <p className="review-label">Happy with that?</p>
                      <div className="mic-waveform mic-waveform-static">
                        {capturedBars.map((amp, i) => (
                          <div key={i} className="waveform-bar"
                            style={{ height: `${Math.max(3, Math.round(amp * MAX_BAR_H))}px` }} />
                        ))}
                      </div>
                      <div className="review-actions">
                        <button className="btn btn-retry-rec" onClick={handleRetry}>↩ Again</button>
                        <button className="btn btn-submit-rec" onClick={handleSubmit}>Submit ✓</button>
                      </div>
                    </div>
                  )}

                  {/* DONE */}
                  {stage === 'done' && (
                    <div className="done-message">Uploading... spotters are listening!</div>
                  )}
                </>
              )}

              {countdown !== null && (
                <div className="timeout-countdown">Auto-submitting in {countdown}s</div>
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
