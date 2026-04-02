import { useState, useEffect, useRef } from 'react'
import { MONSTERS } from '../data/monsters'
import cardBack from '../assets/monsters/card-back.png'
import { useWebRTC } from '../hooks/useWebRTC'
import Scoreboard from './Scoreboard'
import QuoteCard from './QuoteCard'
import HelpOverlay from './HelpOverlay'
import mvLogo from '../assets/brand/mv-logo.png'

export default function WaitingPlayerView({ roundState, myMonster, guessResult, scores, players, socket, quoteFlipKey = 0, flippedPositions = [], cardRevealActive = false }) {
  const { quote, currentSpeakerId, speakerName, waitingForGuess, phase, shuffledMonsters } = roundState

  const {
    liveAudioRef, replayAudioRef,
    audioUnlocked, audioBlocked, unlockAudio,
    replayUrl, handleReplay
  } = useWebRTC(socket, false, true, currentSpeakerId)

  const [peekState, setPeekState] = useState('idle')
  const [peekMonster, setPeekMonster] = useState(null) // { monsterIndex, speakerName }
  const [mineRevealVisible, setMineRevealVisible] = useState(false)
  const [revealPending, setRevealPending] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const quoteRef = useRef(null)
  const monsterRef = useRef(null)
  const peekRef = useRef(null)
  const mineRevealTimerRef = useRef(null)

  // Show "Your Monster" AFTER all cards have finished flipping (not during the animation)
  // Last card (position 8) starts flipping at 8×225ms delay and takes 450ms → done at 2250ms
  useEffect(() => {
    if (!cardRevealActive) return
    setMineRevealVisible(false) // hide immediately when a new round animation begins
    mineRevealTimerRef.current = setTimeout(() => {
      setMineRevealVisible(true)
    }, 8 * 225 + 450 + 300) // ~2550ms — fires after cardRevealActive ends, that's intentional
    return () => {} // don't cancel: timer must outlive the cardRevealActive=true window
  }, [cardRevealActive])

  // Clean up on unmount
  useEffect(() => () => {
    if (mineRevealTimerRef.current) clearTimeout(mineRevealTimerRef.current)
  }, [])

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (!mineRevealVisible) return
    const timer = setTimeout(() => setMineRevealVisible(false), 10000)
    return () => clearTimeout(timer)
  }, [mineRevealVisible])

  useEffect(() => {
    setPeekState('idle')
    setPeekMonster(null)
  }, [currentSpeakerId])

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

  useEffect(() => {
    function onPeekGranted({ monsterIndex, speakerName }) {
      setPeekMonster({ monsterIndex, speakerName })
      setPeekState('granted')
    }
    function onPeekDenied({ speakerName }) {
      setPeekState('denied')
      setTimeout(() => setPeekState('idle'), 3000)
    }
    socket.on('peek_granted', onPeekGranted)
    socket.on('peek_denied', onPeekDenied)
    return () => {
      socket.off('peek_granted', onPeekGranted)
      socket.off('peek_denied', onPeekDenied)
    }
  }, [socket])

  const handleAskPeek = () => {
    setPeekState('pending')
    socket.emit('ask_peek')
  }

  const handleDismissPeek = () => {
    setPeekState('idle')
    setPeekMonster(null)
  }

  // Find which grid position the peeked monster is at
  const peekPosition = peekMonster && shuffledMonsters
    ? shuffledMonsters.indexOf(peekMonster.monsterIndex)
    : -1

  return (
    <div className="waiting-layout">
      {/* Top header bar */}
      <div className="waiting-header">
        <div className="role-badge role-badge-waiting">You are the Audience</div>
        {phase === 'second_chance' && <div className="second-chance-badge">Second Chance Round</div>}
        {!audioUnlocked && (
          <button className="btn btn-unlock-audio" onClick={unlockAudio}>
            Tap to Enable Audio
          </button>
        )}
        {audioUnlocked && audioBlocked && (
          <button className="btn btn-unlock-audio btn-unlock-retry" onClick={unlockAudio}>
            Audio blocked — tap to unmute
          </button>
        )}
        <button className="btn-help" onClick={() => setShowHelp(true)}>?</button>
      </div>

      {/* Main content: grid left, right column for quote + scores */}
      <div className="waiting-body">
        {/* Monster grid — fills all available height */}
        <div className="waiting-grid-col">
          {shuffledMonsters && shuffledMonsters.length > 0 && (
            <>
              {mineRevealVisible && myMonster && (
                <div className="peek-active-label">
                  <span>Your Monster</span>
                  <button className="peek-dismiss-btn" onClick={() => setMineRevealVisible(false)}>✕</button>
                </div>
              )}
              {peekState === 'granted' && peekMonster && (
                <div className="peek-active-label">
                  <span>{peekMonster.speakerName}'s Monster</span>
                  <button className="peek-dismiss-btn" onClick={handleDismissPeek}>✕</button>
                </div>
              )}
              <div className="monster-grid monster-grid-fill">
                {Array.from({ length: 9 }, (_, position) => {
                  const monsterIndex = shuffledMonsters[position]
                  const isFlipped = flippedPositions.includes(position)
                  const isMine = myMonster && myMonster.position === position
                  const isDimMode = mineRevealVisible || peekState === 'granted'
                  const isHighlighted = (mineRevealVisible && isMine) || (peekState === 'granted' && position === peekPosition)
                  const isGuessedPending = revealPending && guessResult && guessResult.guessedPosition === position
                  const isSecondChance = phase === 'second_chance'
                  const showCorrect = showResult && guessResult && guessResult.position === position && (guessResult.correct || isSecondChance)
                  const showWrong = showResult && guessResult && guessResult.guessedPosition === position && !guessResult.correct

                  const showReveal = cardRevealActive && !isFlipped
                  return (
                    <div key={position} className="monster-card-flipper" ref={isMine ? monsterRef : null}>
                      <div
                        className={`monster-card-inner ${isFlipped ? 'is-flipped' : ''} ${showReveal ? 'card-reveal-anim' : ''}`}
                        style={showReveal ? { animationDelay: `${position * 225}ms` } : {}}
                      >
                        <div className={[
                          'monster-card monster-card-face monster-card-front',
                          isMine && !isDimMode && !isGuessedPending && !showCorrect && !showWrong ? 'monster-card-mine' : '',
                          isHighlighted && !isGuessedPending ? 'monster-card-peeked' : '',
                          isDimMode && !isHighlighted && !isGuessedPending ? 'monster-card-peek-dim' : '',
                          isGuessedPending ? 'monster-card-guess-pending' : '',
                          showCorrect ? 'monster-card-correct' : '',
                          showWrong ? 'monster-card-wrong' : '',
                        ].filter(Boolean).join(' ')}>
                          <img src={MONSTERS[monsterIndex]} alt={`Monster ${monsterIndex + 1}`} className="monster-img" />
                        </div>
                        <div className={[
                          'monster-card monster-card-face monster-card-back',
                          isDimMode && !isHighlighted ? 'monster-card-peek-dim' : '',
                        ].filter(Boolean).join(' ')}>
                          <img src={cardBack} alt="Card back" className="monster-img" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Controls below grid */}
          <div className="waiting-controls">
            <div className="speaker-status-banner">
              {waitingForGuess ? (
                <span className="status-guessing">The Monster Spotter is making their guess...</span>
              ) : (
                <span className="status-speaking">
                  <strong>{speakerName || 'Someone'}</strong> is speaking — listen carefully!
                </span>
              )}
            </div>

            {replayUrl && (
              <button className="btn btn-replay" onClick={handleReplay}>
                Listen Again
              </button>
            )}

            <div className="peek-section" ref={peekRef}>
              {peekState === 'idle' && (
                <button
                  className={`btn btn-peek ${!waitingForGuess ? 'btn-peek-disabled' : ''}`}
                  onClick={waitingForGuess ? handleAskPeek : undefined}
                >
                  Ask to Peek {!waitingForGuess && <span className="peek-soon">(available after they speak)</span>}
                </button>
              )}
              {peekState === 'pending' && (
                <div className="peek-status peek-status-pending">
                  Waiting for {speakerName} to respond...
                </div>
              )}
              {peekState === 'denied' && (
                <div className="peek-status peek-status-denied">
                  {speakerName} said no!
                </div>
              )}
            </div>

            {showResult && guessResult && (
              <div className={`guess-result-mini ${guessResult.correct ? 'result-correct' : 'result-wrong'}`}>
                {guessResult.correct
                  ? `Correct! ${guessResult.speakerName} was monster #${guessResult.position + 1}`
                  : phase === 'second_chance'
                    ? `Wrong! ${guessResult.speakerName} was actually monster #${guessResult.position + 1}`
                    : `Wrong guess — ${guessResult.speakerName} gets a second chance!`
                }
              </div>
            )}
          </div>
        </div>

        {/* Right column: logo (hides first) + quote card + scoreboard */}
        <div className="waiting-right-col">
          <div className="game-sidebar-logo-wrap">
            <img src={mvLogo} alt="Monster Voices" className="game-sidebar-logo" />
          </div>
          <div ref={quoteRef}><QuoteCard quote={quote} flipKey={quoteFlipKey} /></div>
          <Scoreboard scores={scores} roundState={roundState} />
        </div>
      </div>

      <audio ref={liveAudioRef} autoPlay playsInline style={{ display: 'none' }} />
      <audio ref={replayAudioRef} style={{ display: 'none' }} />

      {showHelp && (
        <HelpOverlay
          targets={[
            { ref: quoteRef, label: 'Words of Wisdom', desc: 'The current speaker is reading this quote in their monster\'s voice.' },
            { ref: monsterRef, label: 'Your Monster', desc: 'The card with the gold border is your secret monster — remember which one it is!' },
            { ref: peekRef, label: 'Ask to Peek', desc: 'After the speaker finishes, you can request to see their monster identity.' },
          ]}
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  )
}
