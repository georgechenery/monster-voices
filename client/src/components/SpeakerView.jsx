import { useState, useEffect, useRef } from 'react'
import { MONSTERS } from '../data/monsters'
import cardBack from '../assets/monsters/card-back.png'
import { useWebRTC } from '../hooks/useWebRTC'
import Scoreboard from './Scoreboard'
import QuoteCard from './QuoteCard'
import HelpOverlay from './HelpOverlay'
import mvLogo from '../assets/brand/mv-logo.png'

const MIC_ERRORS = {
  needs_https: "You need a secure connection (https://). Change the URL and accept the browser warning.",
  not_supported: "Your browser doesn't support microphone access. Try Chrome or Safari.",
  denied: "Microphone permission was denied. Allow mic access in your browser settings, then refresh.",
  error: "Couldn't access microphone. Check no other app is using it, then try again.",
}

export default function SpeakerView({ roundState, myMonster, guessResult, scores, socket, flippedPositions = [], quoteFlipKey = 0, cardRevealActive = false }) {
  const { quote, phase, shuffledMonsters } = roundState
  const [stage, setStage] = useState('ready') // 'ready' | 'speaking' | 'done'
  const [micError, setMicError] = useState(null)
  const [peekRequests, setPeekRequests] = useState([]) // [{ requesterId, requesterName }]
  const [showHelp, setShowHelp] = useState(false)
  const [revealPending, setRevealPending] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const quoteRef = useRef(null)
  const monsterRef = useRef(null)
  const micRef = useRef(null)

  // Reset for second chance or new round — same player may speak again
  useEffect(() => {
    setStage('ready')
    setMicError(null)
  }, [quoteFlipKey])

  useEffect(() => {
    if (!guessResult) {
      setRevealPending(false)
      setShowResult(false)
      return
    }
    setRevealPending(true)
    setShowResult(false)
    const revealTimer = setTimeout(() => {
      setRevealPending(false)
      setShowResult(true)
    }, 800)
    const clearTimer = setTimeout(() => {
      setShowResult(false)
    }, 800 + 2800)
    return () => {
      clearTimeout(revealTimer)
      clearTimeout(clearTimer)
    }
  }, [guessResult])

  const { startMic, stopMicAndUpload, micLevel, micActive } = useWebRTC(socket, true, false, null)

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

  return (
    <div className="waiting-layout">
      {/* Header */}
      <div className="waiting-header">
        <div className="speaker-instruction-block">
          <h2 className="speaker-instruction-title">Your Turn to Speak!</h2>
          {phase === 'second_chance' && <div className="second-chance-badge">Second Chance Round</div>}
          <p className="speaker-instruction-sub">Read the Words of Wisdom in your monster's voice</p>
        </div>
        <button className="btn-help" onClick={() => setShowHelp(true)}>?</button>
      </div>

      {/* Peek request — full screen overlay, impossible to miss */}
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
        {/* Monster grid — fills all available height */}
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
                <div key={position} className="monster-card-flipper" ref={isMine ? monsterRef : null}>
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

          <div className="waiting-controls">
            <div className="mic-action-section" ref={micRef}>
              {!isHttps && (
                <div className="mic-error">
                  ⚠️ You're on http:// — change to <strong>https://</strong> and accept the security warning.
                </div>
              )}
              {micError && <div className="mic-error">{MIC_ERRORS[micError] || MIC_ERRORS.error}</div>}

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

              {stage === 'ready' && (
                <div className="connection-status">
                  {isHttps ? 'Secure connection ✓' : 'Not secure — mic disabled'}
                </div>
              )}
            </div>

            {stage === 'done' && (
              <div className="done-message">
                Uploading your voice... the Monster Spotter is listening!
              </div>
            )}
          </div>
        </div>

        {/* Right column: logo (hides first) + quote + scoreboard */}
        <div className="waiting-right-col">
          <div className="game-sidebar-logo-wrap">
            <img src={mvLogo} alt="Monster Voices" className="game-sidebar-logo" />
          </div>
          <p className="read-in-voice-label">Read this in your monster's voice:</p>
          <div ref={quoteRef}><QuoteCard quote={quote} flipKey={quoteFlipKey} /></div>
          <Scoreboard scores={scores} />
        </div>
      </div>

      {showHelp && (
        <HelpOverlay
          targets={[
            { ref: quoteRef, label: 'Words of Wisdom', desc: 'Read this quote out loud in your monster\'s voice — be dramatic and convincing!' },
            { ref: monsterRef, label: 'Your Monster', desc: 'The card with the gold border is your secret identity. Don\'t give it away!' },
            { ref: micRef, label: 'Mic Button', desc: 'Tap "I\'m Ready to Speak" to start recording. Tap "Done Speaking" when finished.' },
          ]}
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  )
}
