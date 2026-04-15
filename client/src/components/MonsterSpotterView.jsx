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

export default function MonsterSpotterView({ roundState, guessResult, scores, players, socket, flippedPositions = [], quoteFlipKey = 0, cardRevealActive = false, activeEmotes = {}, chatMessages = [], onSendChat, onSendEmote, myPlayer }) {
  const { shuffledMonsters, quote, waitingForGuess, phase, currentSpeakerId, speakerName } = roundState
  const [clickedPosition, setClickedPosition] = useState(null)
  const [revealPending, setRevealPending] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [countdown, setCountdown] = useState(null)

  const gridRef = useRef(null)
  const statusRef = useRef(null)
  const spotterTimerRef = useRef(null)
  const countdownIntervalRef = useRef(null)

  const {
    liveAudioRef, replayAudioRef,
    audioUnlocked, audioBlocked, unlockAudio,
    replayUrl, handleReplay
  } = useWebRTC(socket, false, true, currentSpeakerId)

  // Preload sounds when component mounts
  useEffect(() => { preloadSounds() }, [])

  useEffect(() => {
    if (cardRevealActive) playDealSounds()
  }, [cardRevealActive])

  // Reset clicked position when speaker changes or on second chance
  useEffect(() => {
    setGameplayMuted(false) // new round/second chance starts with music playing
    setClickedPosition(null)
  }, [currentSpeakerId, quoteFlipKey])

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
      setClickedPosition(null)
    }, clearDelay)
    return () => {
      clearTimeout(revealTimer)
      clearTimeout(clearTimer)
      stopDrumroll()
    }
  }, [guessResult])

  // Spotter timeout: 30s after waitingForGuess, then 10s countdown, then skip
  useEffect(() => {
    if (!waitingForGuess || clickedPosition !== null) {
      clearTimeout(spotterTimerRef.current)
      clearInterval(countdownIntervalRef.current)
      setCountdown(null)
      return
    }
    spotterTimerRef.current = setTimeout(() => {
      let secs = 10
      setCountdown(secs)
      countdownIntervalRef.current = setInterval(() => {
        secs -= 1
        if (secs <= 0) {
          clearInterval(countdownIntervalRef.current)
          setCountdown(null)
          socket.emit('skip_guess')
        } else {
          setCountdown(secs)
          if (secs <= 5) playSound('tick', 0, 0.5)
        }
      }, 1000)
    }, 25000)
    return () => {
      clearTimeout(spotterTimerRef.current)
      clearInterval(countdownIntervalRef.current)
    }
  }, [waitingForGuess, clickedPosition]) // eslint-disable-line react-hooks/exhaustive-deps

  // Mute music as soon as the speaker's audio arrives (waitingForGuess = true)
  useEffect(() => {
    if (waitingForGuess) setGameplayMuted(true)
  }, [waitingForGuess])

  const handleGuess = (position) => {
    if (!waitingForGuess || clickedPosition !== null) return
    setClickedPosition(position)
    playSound('pick')
    socket.emit('make_guess', { position })
  }

  return (
    <div className="waiting-layout">
      {/* Header */}
      <div className="waiting-header">
        <div className="speaker-instruction-block">
          <h2 className="speaker-instruction-title">You are the Monster Spotter</h2>
          <p className="speaker-instruction-sub">Each player is secretly a monster — listen as they take turns reading the <span className="amber-text">Words of Wisdom</span> in their monster's voice, then tap the one you think they are!</p>
        </div>
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

      <div className="waiting-body">
        {/* Monster grid — fills all available height */}
        <div className="waiting-grid-col">
          <div className="monster-grid monster-grid-fill" ref={gridRef}>
            {(GRID_LAYOUTS[shuffledMonsters.length] ?? GRID_LAYOUTS[9]).reduce((rows, cols, rowIdx) => {
              const startPos = rows.nextPos
              rows.nextPos += cols
              rows.elements.push(
                <div key={rowIdx} className={`monster-grid-row monster-grid-row-${cols}`}>
                  {Array.from({ length: cols }, (_, i) => {
                    const position = startPos + i
                    const monsterIndex = shuffledMonsters[position]
                    const isFlipped = flippedPositions.includes(position)
                    const isClickable = !isFlipped && waitingForGuess && clickedPosition === null
                    const isSelected = clickedPosition === position && !revealPending && !showResult
                    const isGuessedPending = revealPending && clickedPosition === position
                    const isSecondChance = phase === 'second_chance'
                    const wasCorrect = guessResult && guessResult.position === position
                    const wasGuessed = guessResult && guessResult.guessedPosition === position
                    const showCorrect = showResult && wasCorrect && (guessResult.correct || isSecondChance)
                    const showWrong = showResult && wasGuessed && !guessResult.correct
                    const showReveal = cardRevealActive && !isFlipped
                    return (
                      <div key={position} className={`monster-card-flipper${isClickable ? ' monster-card-flipper-clickable' : ''}`}>
                        <div
                          className={`monster-card-inner ${isFlipped ? 'is-flipped' : ''} ${showReveal ? 'card-reveal-anim' : ''}`}
                          style={showReveal ? { animationDelay: `${position * 225}ms` } : {}}
                        >
                          <div
                            className={[
                              'monster-card monster-card-face monster-card-front',
                              isClickable ? 'monster-card-clickable' : '',
                              isSelected ? 'monster-card-selected' : '',
                              isGuessedPending ? 'monster-card-guess-pending' : '',
                              showCorrect ? 'monster-card-correct' : '',
                              showWrong ? 'monster-card-wrong' : '',
                              !isFlipped && !waitingForGuess && clickedPosition === null && !revealPending && !showResult ? 'monster-card-disabled' : ''
                            ].filter(Boolean).join(' ')}
                            onClick={() => handleGuess(position)}
                          >
                            <img src={MONSTERS[monsterIndex]} alt={`Monster ${monsterIndex + 1}`} className="monster-img" />
                            <div className="monster-position-label">#{position + 1}</div>
                          </div>
                          <div className="monster-card monster-card-face monster-card-back">
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

          <div className="waiting-controls waiting-controls-spotter">
            <div className="status-banner" ref={statusRef}>
              {waitingForGuess ? (
                <div className="status-active-row">
                  <span className="status-active">Which monster is <strong>{speakerName}</strong>? Tap to guess!</span>
                  {replayUrl && (
                    <button className="btn btn-replay btn-replay-sm" onClick={handleReplay}>Listen Again</button>
                  )}
                </div>
              ) : (
                <span className="status-waiting"><strong>{speakerName}</strong> is speaking — listen carefully!</span>
              )}
            </div>
            {countdown !== null && (
              <div className="timeout-countdown">Time's up in {countdown}s — guess now!</div>
            )}
            {!replayUrl && waitingForGuess && (
              <p className="timeout-no-audio">The speaker ran out of time and didn't record a voice — but you can still take a guess!</p>
            )}
            {showResult && guessResult && (
              <div className={`guess-result-overlay ${guessResult.correct ? 'result-correct' : 'result-wrong'}`}>
                {guessResult.correct ? (
                  <>
                    <div className="result-title">Correct!</div>
                    <div className="result-detail">+{guessResult.points} points each!</div>
                  </>
                ) : (
                  <>
                    <div className="result-title">Wrong Monster!</div>
                    <div className="result-detail">
                      {phase === 'second_chance'
                        ? `It was actually monster #${guessResult.position + 1}`
                        : "They'll get one more chance — 1 point if you get it next time!"}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Right column spans header + body via CSS grid on waiting-layout */}
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
            { ref: gridRef, label: 'Make Your Guess', desc: 'When it\'s time, tap the monster card you think the speaker is playing as.' },
            { ref: statusRef, label: 'Status', desc: 'Shows when to listen and when to guess. Wait for your cue!' },
          ]}
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  )
}
