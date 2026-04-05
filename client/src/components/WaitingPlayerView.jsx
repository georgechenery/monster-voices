import { useState, useEffect, useRef } from 'react'
import { MONSTERS } from '../data/monsters'
import cardBack from '../assets/monsters/card-back.png'
import { useWebRTC } from '../hooks/useWebRTC'
import Scoreboard from './Scoreboard'
import QuoteCard from './QuoteCard'
import HelpOverlay from './HelpOverlay'
import mvLogo from '../assets/brand/mv-logo.png'
import { playSound, playDealSounds, preloadSounds } from '../utils/sounds'

export default function WaitingPlayerView({ roundState, myMonster, guessResult, scores, players, socket, quoteFlipKey = 0, flippedPositions = [], cardRevealActive = false, activeEmotes = {} }) {
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
  const [hasPeeked, setHasPeeked] = useState(false)
  const [wagerState, setWagerState] = useState('idle') // 'idle' | 'picking' | 'placed'
  const [wagerPosition, setWagerPosition] = useState(null)
  const [wagerResult, setWagerResult] = useState(null)
  const [showWagerHelp, setShowWagerHelp] = useState(false)

  const quoteRef = useRef(null)
  const monsterRef = useRef(null)
  const peekRef = useRef(null)
  const mineRevealTimerRef = useRef(null)

  // Preload sounds when component mounts
  useEffect(() => { preloadSounds() }, [])

  // Show "Your Monster" AFTER all cards have finished flipping (not during the animation)
  // Last card (position 8) starts flipping at 8×225ms delay and takes 450ms → done at 2250ms
  useEffect(() => {
    if (!cardRevealActive) return
    playDealSounds()
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
    setWagerState('idle')
    setWagerPosition(null)
    setWagerResult(null)
  }, [quoteFlipKey])

  // Reset hasPeeked at the start of each new round (round_ended fires, then a new round starts)
  useEffect(() => {
    function onRoundEnded() { setHasPeeked(false) }
    socket.on('round_ended', onRoundEnded)
    return () => socket.off('round_ended', onRoundEnded)
  }, [socket])

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
      playSound(guessResult.correct ? 'correct' : 'wrong')
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
      setHasPeeked(true)
    }
    function onPeekDenied({ speakerName }) {
      setPeekState('denied')
      setTimeout(() => setPeekState('idle'), 3000)
    }
    function onWagerConfirmed({ position }) {
      setWagerState('placed')
      setWagerPosition(position)
    }
    function onWagerResult({ delta }) {
      setWagerResult(delta)
    }
    socket.on('peek_granted', onPeekGranted)
    socket.on('peek_denied', onPeekDenied)
    socket.on('wager_confirmed', onWagerConfirmed)
    socket.on('wager_result', onWagerResult)
    return () => {
      socket.off('peek_granted', onPeekGranted)
      socket.off('peek_denied', onPeekDenied)
      socket.off('wager_confirmed', onWagerConfirmed)
      socket.off('wager_result', onWagerResult)
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

  const handleWager = (position) => {
    if (wagerState !== 'picking') return
    socket.emit('place_wager', { position })
    playSound('wager')
    setWagerState('placed')
    setWagerPosition(position)
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
                    <div
                      key={position}
                      className={`monster-card-flipper${wagerState === 'picking' && !isFlipped ? ' monster-card-flipper-clickable' : ''}`}
                      ref={isMine ? monsterRef : null}
                    >
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
                          wagerState === 'picking' && !isFlipped ? 'monster-card-clickable' : '',
                          wagerState === 'placed' && wagerPosition === position ? 'monster-card-selected' : '',
                        ].filter(Boolean).join(' ')}
                          onClick={() => wagerState === 'picking' && !isFlipped ? handleWager(position) : undefined}
                        >
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

            {/* Wager section */}
            <div className="wager-section">
              {wagerState === 'idle' && (
                <div className="wager-idle-row">
                  <button
                    className={`btn btn-wager${!waitingForGuess || hasPeeked ? ' btn-wager-disabled' : ''}`}
                    onClick={waitingForGuess && !hasPeeked ? () => setWagerState('picking') : undefined}
                  >
                    Wager
                  </button>
                  <button className="btn-wager-help" onClick={() => setShowWagerHelp(p => !p)}>?</button>
                  {hasPeeked && <span className="wager-note">Not available — you peeked</span>}
                  {!waitingForGuess && !hasPeeked && <span className="wager-note">(available after they speak)</span>}
                </div>
              )}
              {wagerState === 'picking' && (
                <div className="wager-picking-row">
                  <span className="wager-picking-prompt">Tap a monster to wager 1 point on it</span>
                  <button className="btn btn-wager-cancel" onClick={() => setWagerState('idle')}>Cancel</button>
                </div>
              )}
              {wagerState === 'placed' && wagerPosition !== null && (
                <div className="wager-placed">
                  Wager placed on Monster #{wagerPosition + 1}
                </div>
              )}
              {showWagerHelp && (
                <div className="wager-help-popup">
                  <strong>How Wagering Works</strong>
                  <ul>
                    <li>Pick right, Spotter picks wrong — win 1 point</li>
                    <li>Pick the same as the Spotter — point returned</li>
                    <li>Pick wrong — lose 1 point</li>
                  </ul>
                  <p className="wager-help-note">Not available if you have peeked this round.</p>
                  <button className="btn-wager-help-close" onClick={() => setShowWagerHelp(false)}>Got it</button>
                </div>
              )}
              {showResult && wagerResult !== null && (
                <div className={`wager-result-mini ${wagerResult > 0 ? 'result-correct' : wagerResult < 0 ? 'result-wrong' : 'result-neutral'}`}>
                  Wager: {wagerResult > 0 ? '+1 point!' : wagerResult < 0 ? '−1 point' : 'point returned'}
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

        {/* Right column: logo (hides first) + quote card + scoreboard */}
        <div className="waiting-right-col">
          <div className="game-sidebar-logo-wrap">
            <img src={mvLogo} alt="Monster Voices" className="game-sidebar-logo" />
          </div>
          <div ref={quoteRef}><QuoteCard quote={quote} flipKey={quoteFlipKey} /></div>
          <Scoreboard scores={scores} roundState={roundState} activeEmotes={activeEmotes} />
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
