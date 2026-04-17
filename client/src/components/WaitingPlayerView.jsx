import { useState, useEffect, useRef } from 'react'
import { MONSTERS } from '../data/monsters'
import { GRID_LAYOUTS } from '../data/gridLayouts'
import cardBack from '../assets/monsters/card-back.png'
import { useWebRTC } from '../hooks/useWebRTC'
import ChatPanel from './ChatPanel'
import Scoreboard from './Scoreboard'
import HelpOverlay from './HelpOverlay'
import mvLogo from '../assets/brand/mv-logo.png'
import { playSound, playDealSounds, preloadSounds, playDrumroll, stopDrumroll } from '../utils/sounds'
import { setGameplayMuted } from '../utils/music'

export default function WaitingPlayerView({ roundState, myMonster, guessResult, scores, players, socket, quoteFlipKey = 0, flippedPositions = [], cardRevealActive = false, activeEmotes = {}, isMidgameWatcher = false, myPlayerId, chatMessages = [], onSendChat, onSendEmote, myPlayer }) {
  const { quote, currentSpeakerId, speakerName, waitingForGuess, phase, shuffledMonsters, speakerStatuses = {}, speakingOrder = [], spotterId } = roundState
  const spotterName = players.find(p => p.id === spotterId)?.name ?? '…'
  const myStatus   = speakerStatuses[myPlayerId]
  const myIdx      = speakingOrder.indexOf(myPlayerId)
  const curIdx     = speakingOrder.indexOf(currentSpeakerId)
  const turnsAway  = myIdx >= 0 && curIdx >= 0 ? myIdx - curIdx : -1

  let turnsText = null
  if (!isMidgameWatcher) {
    if (myStatus === 'encore' && phase !== 'second_chance') {
      turnsText = "You'll get a second chance in the Redemption round!"
    } else if (myStatus !== 'guessed' && myStatus !== 'guessed_second' && myStatus !== 'not_guessed') {
      if (turnsAway > 0) turnsText = `You're up in ${turnsAway} turn${turnsAway !== 1 ? 's' : ''}!`
    }
  }

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
  const [showReturnedBar, setShowReturnedBar] = useState(false)

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
    // Reset wager state when the current speaker changes — prevents holdover
    setWagerState('idle')
    setWagerPosition(null)
    setWagerResult(null)
  }, [currentSpeakerId])

  useEffect(() => {
    setGameplayMuted(false) // new round/second chance starts with music playing
    setWagerState('idle')
    setWagerPosition(null)
    setWagerResult(null)
  }, [quoteFlipKey])

  // Show the "returned" bar for delta=0 wagers for 3 seconds
  useEffect(() => {
    if (wagerResult !== 0 || !guessResult) return
    setShowReturnedBar(true)
    const t = setTimeout(() => setShowReturnedBar(false), 3000)
    return () => clearTimeout(t)
  }, [wagerResult, guessResult])

  // Mute music as soon as the speaker's audio arrives (waitingForGuess = true)
  useEffect(() => {
    if (waitingForGuess) setGameplayMuted(true)
  }, [waitingForGuess])

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
    playDrumroll(800)
    setShowResult(false)
    const revealTimer = setTimeout(() => {
      setRevealPending(false)
      setShowResult(true)
      setGameplayMuted(false)
      playSound(guessResult.correct ? 'correct' : 'wrong')
    }, 800)
    const numOutcomes = guessResult.wagerOutcomes?.length ?? 0
    const clearDelay = Math.max(800 + 2800, 800 + 1800 + numOutcomes * 1100 + 600)
    const clearTimer = setTimeout(() => {
      setShowResult(false)
    }, clearDelay)
    return () => {
      clearTimeout(revealTimer)
      clearTimeout(clearTimer)
      stopDrumroll()
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
        {isMidgameWatcher
          ? <div className="role-badge role-badge-watcher">Watching — You join next round</div>
          : (
            <div className="speaker-instruction-block">
              <h2 className="speaker-instruction-title">{speakerName} is Speaking</h2>
              <p className="speaker-instruction-sub">
                {speakerName} is reading the <span className="amber-text">Words of Wisdom</span> as their monster — can <strong>{spotterName}</strong> guess who they are?
                {turnsText && <> {turnsText}</>}
              </p>
            </div>
          )
        }
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
                {(GRID_LAYOUTS[shuffledMonsters.length] ?? GRID_LAYOUTS[9]).reduce((rows, cols, rowIdx) => {
                  const startPos = rows.nextPos
                  rows.nextPos += cols
                  rows.elements.push(
                    <div key={rowIdx} className={`monster-grid-row monster-grid-row-${cols}`}>
                      {Array.from({ length: cols }, (_, i) => {
                        const position = startPos + i
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
                  )
                  return rows
                }, { elements: [], nextPos: 0 }).elements}
              </div>
            </>
          )}

          {/* Controls below grid */}
          <div className="waiting-controls waiting-controls-audience">
            <div className="speaker-status-banner">
              {waitingForGuess ? (
                <span className="status-guessing">The Monster Spotter is making their guess...</span>
              ) : (
                <span className="status-speaking">
                  <strong>{speakerName || 'Someone'}</strong> is speaking — listen carefully!
                </span>
              )}
            </div>

            <div className="peek-wager-row">
              <div className="action-duo-row">
                <div className="action-duo">
                  {/* Peek slot */}
                  <div className="peek-section" ref={peekRef}>
                    {peekState === 'idle' && (
                      <button
                        className={`btn-duo-action${!waitingForGuess ? ' btn-duo-action-disabled' : ''}`}
                        onClick={waitingForGuess ? handleAskPeek : undefined}
                      >
                        Ask to Peek
                      </button>
                    )}
                    {peekState === 'pending' && (
                      <div className="peek-status peek-status-pending">
                        Waiting for {speakerName}...
                      </div>
                    )}
                    {peekState === 'denied' && (
                      <div className="peek-status peek-status-denied">
                        {speakerName} said no!
                      </div>
                    )}
                  </div>

                  <div className="action-duo-divider" />

                  {/* Wager slot */}
                  <div className="wager-section">
                    {wagerState === 'idle' && (
                      <button
                        className={`btn-duo-action${(!waitingForGuess || hasPeeked) ? ' btn-duo-action-disabled' : ''}`}
                        onClick={waitingForGuess && !hasPeeked ? () => setWagerState('picking') : undefined}
                      >
                        Place Wager
                      </button>
                    )}
                    {wagerState === 'picking' && (
                      <div className="wager-picking-row">
                        <span className="wager-picking-prompt">Pick a monster to wager on</span>
                        <button className="btn btn-wager-cancel" onClick={() => setWagerState('idle')}>Cancel</button>
                      </div>
                    )}
                    {wagerState === 'placed' && wagerPosition !== null && (
                      <div className="wager-placed">
                        <span>Wager placed ✓</span>
                        <button className="btn-wager-change" onClick={() => setWagerState('picking')}>
                          Change
                        </button>
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
                    {showResult && wagerResult !== null && wagerResult !== 0 && (
                      <div className={`wager-result-mini ${wagerResult > 0 ? 'result-correct' : 'result-wrong'}`}>
                        {wagerResult > 0 ? 'Your wager: +1 point!' : 'Your wager: −1 point'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Wager help button sits outside the duo, to its right */}
                <button className="btn-wager-help" onClick={() => setShowWagerHelp(p => !p)}>?</button>
              </div>{/* end action-duo-row */}

              {/* Unified availability note — applies to both buttons */}
              {!waitingForGuess && peekState === 'idle' && (
                <p className="action-duo-note">Available after <strong>{speakerName}</strong> has spoken</p>
              )}
              {hasPeeked && wagerState === 'idle' && waitingForGuess && (
                <p className="action-duo-note">Place Wager not available — you peeked</p>
              )}

              {replayUrl && (
                <button className="btn btn-replay btn-replay-sm" onClick={handleReplay}>
                  Listen Again
                </button>
              )}
            </div>{/* end peek-wager-row */}

            {!replayUrl && waitingForGuess && (
              <p className="timeout-no-audio">The speaker ran out of time and didn't record a voice — the Monster Spotter is still taking a guess!</p>
            )}

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

      </div>

      <div className="waiting-right-col">
        <div className="game-sidebar-logo-wrap">
          <img src={mvLogo} alt="Monster Voices" className="game-sidebar-logo" />
        </div>
        <ChatPanel messages={chatMessages} onSend={onSendChat} myPlayer={myPlayer} onSendEmote={onSendEmote} />
        <Scoreboard scores={scores} roundState={roundState} activeEmotes={activeEmotes} />
      </div>

      <audio ref={liveAudioRef} autoPlay playsInline style={{ display: 'none' }} />
      <audio ref={replayAudioRef} style={{ display: 'none' }} />

      {showHelp && (
        <HelpOverlay
          targets={[
            { ref: monsterRef, label: 'Your Monster', desc: 'The card with the gold border is your secret monster — remember which one it is!' },
            { ref: peekRef, label: 'Ask to Peek', desc: 'After the speaker finishes, you can request to see their monster identity.' },
          ]}
          onClose={() => setShowHelp(false)}
        />
      )}

      {showReturnedBar && (
        <div className="wager-returned-bar">
          You wagered on the same monster as the Monster Spotter — no points gained or lost
        </div>
      )}
    </div>
  )
}
