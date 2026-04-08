import { useState, useEffect, useRef } from 'react'
import { MONSTERS } from '../data/monsters'
import cardBack from '../assets/monsters/card-back.png'
import { useWebRTC } from '../hooks/useWebRTC'
import Scoreboard from './Scoreboard'
import QuoteCard from './QuoteCard'
import HelpOverlay from './HelpOverlay'
import mvLogo from '../assets/brand/mv-logo.png'
import { playSound, playDealSounds, preloadSounds, playDrumroll, stopDrumroll } from '../utils/sounds'
import { setGameplayMuted } from '../utils/music'

const MIC_ERRORS = {
  needs_https: "You need a secure connection (https://). Change the URL and accept the browser warning.",
  not_supported: "Your browser doesn't support microphone access. Try Chrome or Safari.",
  denied: "Microphone permission was denied. Allow mic access in your browser settings, then refresh.",
  error: "Couldn't access microphone. Check no other app is using it, then try again.",
}

const BAR_COUNT = 50
const MAX_BAR_H = 36 // px

function buildDisplayBars(history) {
  const pad = Math.max(0, BAR_COUNT - history.length)
  return Array(pad).fill(0).concat(history).slice(-BAR_COUNT)
}

export default function SpeakerView({ roundState, myMonster, guessResult, scores, socket, flippedPositions = [], quoteFlipKey = 0, cardRevealActive = false, activeEmotes = {} }) {
  const { quote, phase, shuffledMonsters } = roundState

  // 'ready' | 'waiting' | 'speaking' | 'review' | 'done'
  const [stage, setStage] = useState('ready')
  const [micError, setMicError] = useState(null)
  const [peekRequests, setPeekRequests] = useState([])
  const [showHelp, setShowHelp] = useState(false)
  const [revealPending, setRevealPending] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [capturedBars, setCapturedBars] = useState([])
  const [showTurnAlert, setShowTurnAlert] = useState(true)
  const [countdown, setCountdown] = useState(null)
  const capturedBlobRef = useRef(null)
  const turnAlertTimerRef = useRef(null)
  const speakerTimerRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  const stageRef = useRef(stage)

  const quoteRef = useRef(null)
  const monsterRef = useRef(null)
  const micRef = useRef(null)

  const {
    startMic, stopForReview, stopMicOnly, uploadBlob, stopMicAndUpload,
    micLevel, waveformHistory,
  } = useWebRTC(socket, true, false, null)

  // Preload sounds when component mounts
  useEffect(() => { preloadSounds() }, [])

  useEffect(() => {
    if (cardRevealActive) playDealSounds()
  }, [cardRevealActive])

  // Reset for second chance or new round
  useEffect(() => {
    setGameplayMuted(false) // ensure music plays at start of each turn
    stopMicOnly()
    setStage('ready')
    setMicError(null)
    capturedBlobRef.current = null
    setCapturedBars([])
    playSound('your_turn')
    // Show turn alert on first load and on second-chance
    clearTimeout(turnAlertTimerRef.current)
    setShowTurnAlert(true)
    turnAlertTimerRef.current = setTimeout(() => setShowTurnAlert(false), 3000)
    return () => clearTimeout(turnAlertTimerRef.current)
  }, [quoteFlipKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!guessResult) {
      setRevealPending(false)
      setShowResult(false)
      return
    }
    setRevealPending(true)
    playDrumroll(800)
    setShowResult(false)
    const revealTimer = setTimeout(() => {
      setRevealPending(false)
      setShowResult(true)
      setGameplayMuted(false)
      playSound(guessResult.correct ? 'correct' : 'wrong')
    }, 800)
    const clearTimer = setTimeout(() => {
      setShowResult(false)
    }, 800 + 2800)
    return () => {
      clearTimeout(revealTimer)
      clearTimeout(clearTimer)
      stopDrumroll()
    }
  }, [guessResult])

  useEffect(() => {
    function onPeekRequest({ requesterId, requesterName }) {
      setPeekRequests(prev => {
        if (prev.find(r => r.requesterId === requesterId)) return prev
        return [...prev, { requesterId, requesterName }]
      })
    }
    socket.on('peek_request', onPeekRequest)
    return () => socket.off('peek_request', onPeekRequest)
  }, [socket])

  const handlePeekResponse = (requesterId, granted) => {
    socket.emit('peek_response', { requesterId, granted })
    setPeekRequests(prev => prev.filter(r => r.requesterId !== requesterId))
  }

  const handleReady = async () => {
    setGameplayMuted(true)
    setMicError(null)
    setStage('waiting') // show "Get Ready..." immediately while mic initialises
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
    // Snapshot the waveform before teardown
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

  // Keep stageRef current so timer callbacks can read latest stage
  useEffect(() => { stageRef.current = stage }, [stage])

  // Cancel turn timer when player hits Ready to Speak or self-submits
  useEffect(() => {
    if (stage === 'waiting' || stage === 'speaking' || stage === 'review' || stage === 'done') {
      clearTimeout(speakerTimerRef.current)
      clearInterval(countdownIntervalRef.current)
      setCountdown(null)
    }
  }, [stage])

  // Speaker timeout: starts from beginning of turn, 25s then 10s countdown
  useEffect(() => {
    clearTimeout(speakerTimerRef.current)
    clearInterval(countdownIntervalRef.current)
    setCountdown(null)
    speakerTimerRef.current = setTimeout(() => {
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
          if (secs <= 5 && stageRef.current !== 'speaking') {
            playSound('tick', 0, 0.5)
          }
        }
      }, 1000)
    }, 25000)
    return () => {
      clearTimeout(speakerTimerRef.current)
      clearInterval(countdownIntervalRef.current)
    }
  }, [quoteFlipKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const isHttps = window.isSecureContext
  const micGrantedBefore = localStorage.getItem('mic-granted') === 'true'

  const displayBars = buildDisplayBars(waveformHistory)

  const alertActive = showTurnAlert && stage === 'ready'

  return (
    <div className={`waiting-layout${alertActive ? ' turn-active' : ''}`}>

      {/* Header */}
      <div className="waiting-header">
        <div className="speaker-instruction-block">
          <h2 className="speaker-instruction-title">Your Turn to Speak!</h2>
          {phase === 'second_chance' && <div className="second-chance-badge">Second Chance Round</div>}
          <p className="speaker-instruction-sub">Read the Words of Wisdom in your monster's voice</p>
        </div>
        <button className="btn-help" onClick={() => setShowHelp(true)}>?</button>
      </div>

      {/* Peek request modal */}
      {peekRequests.length > 0 && (
        <div className="peek-modal-backdrop">
          <div className="peek-modal">
            <div className="peek-modal-title">Peek Request!</div>
            {peekRequests.map(({ requesterId, requesterName }) => (
              <div key={requesterId} className="peek-modal-item">
                <p className="peek-modal-name"><strong>{requesterName}</strong> wants to see your monster</p>
                <div className="peek-request-btns">
                  <button className="btn btn-peek-yes" onClick={() => handlePeekResponse(requesterId, true)}>Yes, show them</button>
                  <button className="btn btn-peek-no" onClick={() => handlePeekResponse(requesterId, false)}>No</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="waiting-body">
        {/* Monster grid */}
        <div className="waiting-grid-col">
          <div className="monster-grid monster-grid-fill">
            {Array.from({ length: 9 }, (_, position) => {
              const monsterIndex = shuffledMonsters[position]
              const isMine = myMonster && myMonster.position === position
              const isFlipped = flippedPositions.includes(position)
              const showReveal = cardRevealActive && !isFlipped
              const isGuessedPending = revealPending && guessResult && guessResult.guessedPosition === position
              const isSecondChance = phase === 'second_chance'
              const showCorrect = showResult && guessResult && guessResult.position === position && (guessResult.correct || isSecondChance)
              const showWrong = showResult && guessResult && guessResult.guessedPosition === position && !guessResult.correct
              return (
                <div key={position} className={`monster-card-flipper${isMine ? ' monster-card-flipper-mine' : ''}`} ref={isMine ? monsterRef : null}>
                  <div
                    className={`monster-card-inner ${isFlipped ? 'is-flipped' : ''} ${showReveal ? 'card-reveal-anim' : ''}`}
                    style={showReveal ? { animationDelay: `${position * 225}ms` } : {}}
                  >
                    <div className={[
                      'monster-card monster-card-face monster-card-front',
                      isMine && !isGuessedPending && !showCorrect && !showWrong ? 'monster-card-mine' : '',
                      !isMine && !isGuessedPending && !showCorrect && !showWrong ? 'monster-card-other' : '',
                      isGuessedPending ? 'monster-card-guess-pending' : '',
                      showCorrect ? 'monster-card-correct' : '',
                      showWrong ? 'monster-card-wrong' : '',
                    ].filter(Boolean).join(' ')}>
                      <img src={MONSTERS[monsterIndex]} alt={`Monster ${monsterIndex + 1}`} className="monster-img" />
                      <div className="monster-position-label"></div>
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
            <div className="mic-action-section" ref={micRef}>
              {!isHttps && (
                <div className="mic-error">
                  ⚠️ You're on http:// — change to <strong>https://</strong> and accept the security warning.
                </div>
              )}
              {micError && <div className="mic-error">{MIC_ERRORS[micError] || MIC_ERRORS.error}</div>}

              {/* READY */}
              {stage === 'ready' && (
                <>
                  {/* Inline turn alert — sits directly above the button so ↓ always points at it */}
                  {alertActive && (
                    <div className="turn-popup">
                      <div className="turn-popup-title">Your Turn to Speak!</div>
                      <div className="turn-popup-sub">Read the Words of Wisdom card in your monster's voice</div>
                      <div className="turn-popup-arrow">↓</div>
                    </div>
                  )}
                  {isHttps && !micError && (
                    <p className="ready-hint">
                      {micGrantedBefore
                        ? 'Ready? Tap to start recording.'
                        : 'Tap below — your browser will ask for microphone permission.'}
                    </p>
                  )}
                  <button
                    className="btn btn-ready btn-ready-pulse"
                    onClick={handleReady}
                    disabled={!isHttps}
                  >
                    I'm Ready to Speak
                  </button>
                  <div className="connection-status">
                    {isHttps ? 'Secure connection ✓' : 'Not secure — mic disabled'}
                  </div>
                </>
              )}

              {/* WAITING — mic initialising */}
              {stage === 'waiting' && (
                <div className="mic-waiting">
                  <div className="mic-waiting-dots">
                    <span /><span /><span />
                  </div>
                  <p className="mic-waiting-label">Get Ready...</p>
                </div>
              )}

              {/* SPEAKING — scrolling waveform */}
              {stage === 'speaking' && (
                <div className="mic-recording-card">
                  <div className="mic-recording-header">
                    <span className="rec-indicator">●</span>
                    <span className="rec-label">Recording</span>
                    <span className="rec-level-hint">
                      {micLevel > 20 ? 'Voice detected' : 'Speak now…'}
                    </span>
                  </div>
                  <div className="mic-waveform">
                    {displayBars.map((amp, i) => (
                      <div
                        key={i}
                        className="waveform-bar"
                        style={{ height: `${Math.max(3, Math.round(amp * MAX_BAR_H))}px` }}
                      />
                    ))}
                  </div>
                  <button className="btn btn-stop-rec" onClick={handleStopForReview}>
                    Stop Recording
                  </button>
                </div>
              )}

              {/* REVIEW — submit or retry */}
              {stage === 'review' && (
                <div className="mic-recording-card mic-review-card">
                  <p className="review-label">Happy with that?</p>
                  <div className="mic-waveform mic-waveform-static">
                    {capturedBars.map((amp, i) => (
                      <div
                        key={i}
                        className="waveform-bar"
                        style={{ height: `${Math.max(3, Math.round(amp * MAX_BAR_H))}px` }}
                      />
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
                <div className="done-message">
                  Uploading your voice… the Monster Spotter is listening!
                </div>
              )}

              {countdown !== null && (
                <div className="timeout-countdown">Auto-submitting in {countdown}s</div>
              )}

              {showResult && guessResult?.wagerOutcomes?.length > 0 && (
                <div className="wager-outcomes">
                  {guessResult.wagerOutcomes.map((w, i) => (
                    <span key={i} className={`wager-outcome-chip ${w.delta > 0 ? 'wager-outcome-win' : 'wager-outcome-lose'}`}>
                      {w.playerName} wagered {w.delta > 0 ? '+1' : '−1'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: logo + quote + scoreboard */}
        <div className="waiting-right-col">
          <div className="game-sidebar-logo-wrap">
            <img src={mvLogo} alt="Monster Voices" className="game-sidebar-logo" />
          </div>
          <p className="read-in-voice-label">Read this in your monster's voice:</p>
          <div ref={quoteRef}><QuoteCard quote={quote} flipKey={quoteFlipKey} /></div>
          <Scoreboard scores={scores} roundState={roundState} activeEmotes={activeEmotes} />
        </div>
      </div>

      {showHelp && (
        <HelpOverlay
          targets={[
            { ref: quoteRef, label: 'Words of Wisdom', desc: 'Read this quote out loud in your monster\'s voice — be dramatic and convincing!' },
            { ref: monsterRef, label: 'Your Monster', desc: 'The card with the gold border is your secret identity. Don\'t give it away!' },
            { ref: micRef, label: 'Mic Controls', desc: 'Tap "I\'m Ready to Speak" to start. When done, stop the recording and submit — or record again if you made a mistake.' },
          ]}
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  )
}
