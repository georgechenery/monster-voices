import { useState, useEffect, useRef } from 'react'
import { MONSTERS } from '../data/monsters'
import { WIDE_CONTENT_MONSTERS, MEDIUM_CONTENT_MONSTERS } from '../data/wideContentMonsters'
import { GRID_LAYOUTS } from '../data/gridLayouts'
import cardBack from '../assets/monsters/card-back.png'
import { useWebRTC } from '../hooks/useWebRTC'
import ChatPanel from './ChatPanel'
import Scoreboard from './Scoreboard'
import HelpOverlay from './HelpOverlay'
import QuoteCard from './QuoteCard'
import DevNumberCardFan from './DevNumberCardFan'
import mvLogo from '../assets/brand/mv-logo.png'
import { playSound, playDealSounds, preloadSounds, playDrumroll, stopDrumroll } from '../utils/sounds'
import { setGameplayMuted } from '../utils/music'
import { AVATARS } from '../data/avatars'
import AvatarA1 from './AvatarA1'
import AvatarA2 from './AvatarA2'
import AvatarA3 from './AvatarA3'
import AvatarA4 from './AvatarA4'
import AvatarA5 from './AvatarA5'
import AvatarA6 from './AvatarA6'
import AvatarA8 from './AvatarA8'
import AvatarA9 from './AvatarA9'
import AvatarA10 from './AvatarA10'
import AvatarA11 from './AvatarA11'

function renderAvatarComponent(avatarId) {
  const style = { width: '100%', height: '100%' }
  switch (avatarId) {
    case 0:  return <AvatarA1  style={style} />
    case 1:  return <AvatarA2  style={style} />
    case 2:  return <AvatarA3  style={style} />
    case 3:  return <AvatarA4  style={style} />
    case 4:  return <AvatarA5  style={style} />
    case 5:  return <AvatarA6  style={style} />
    case 7:  return <AvatarA8  style={style} />
    case 8:  return <AvatarA9  style={style} />
    case 9:  return <AvatarA10 style={style} />
    case 10: return <AvatarA11 style={style} />
    default: return <img src={AVATARS[avatarId]} alt="" style={style} />
  }
}

export default function MonsterSpotterView({ roundState, guessResult, scores, players, socket, flippedPositions = [], quoteFlipKey = 0, cardRevealActive = false, activeEmotes = {}, chatMessages = [], onSendChat, onSendEmote, myPlayer }) {
  const {
    shuffledMonsters, quote, waitingForGuess, phase, currentSpeakerId, speakerName,
    spotterId, speakingOrder = [], speakerStatuses = {}, roundNumber, totalRounds,
  } = roundState
  const [clickedPosition, setClickedPosition] = useState(null)
  const [revealPending, setRevealPending] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [countdown, setCountdown] = useState(null)

  const gridRef = useRef(null)
  const statusRef = useRef(null)
  const spotterTimerRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  const [turnOrderPhase, setTurnOrderPhase] = useState(null) // null | 'open' | 'closing'
  const turnOrderCloseRef = useRef(null)
  const [chatPhase, setChatPhase] = useState(null) // null | 'open' | 'closing'
  const chatCloseRef = useRef(null)
  const [avatarPulse, setAvatarPulse] = useState(true)
  const [chatUnread, setChatUnread] = useState(false)
  const prevChatLenRef = useRef(chatMessages.length)

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

  // Reset avatar pulse at the start of each new round
  useEffect(() => { setAvatarPulse(true) }, [roundNumber])

  // Track chat unread messages when popout is closed
  useEffect(() => {
    const newCount = chatMessages.length - prevChatLenRef.current
    if (newCount > 0 && chatPhase === null) setChatUnread(true)
    prevChatLenRef.current = chatMessages.length
  }, [chatMessages, chatPhase])

  // Clean up turn-order and chat timers on unmount
  useEffect(() => () => {
    clearTimeout(turnOrderCloseRef.current)
    clearTimeout(chatCloseRef.current)
  }, [])

  const openTurnOrder = () => {
    clearTimeout(turnOrderCloseRef.current)
    setTurnOrderPhase('open')
  }

  const closeTurnOrder = () => {
    setTurnOrderPhase('closing')
    turnOrderCloseRef.current = setTimeout(() => setTurnOrderPhase(null), 260)
  }

  const handleAvatarBtnClick = () => {
    setAvatarPulse(false)
    if (chatPhase === 'open') closeChat()
    if (turnOrderPhase === 'open') closeTurnOrder()
    else if (!turnOrderPhase) openTurnOrder()
  }

  const openChat = () => {
    if (turnOrderPhase === 'open') closeTurnOrder()
    clearTimeout(chatCloseRef.current)
    setChatUnread(false)
    setChatPhase('open')
  }

  const closeChat = () => {
    setChatPhase('closing')
    chatCloseRef.current = setTimeout(() => setChatPhase(null), 260)
  }

  const handleChatBtnClick = () => {
    if (chatPhase === 'open') closeChat()
    else if (!chatPhase) openChat()
  }

  const spotterPlayer = players.find(p => p.id === spotterId)

  const handleGuess = (position) => {
    if (!waitingForGuess || clickedPosition !== null) return
    setClickedPosition(position)
    playSound('pick')
    socket.emit('make_guess', { position })
  }

  return (
    <div className="waiting-layout view-spotter">
      {/* Header */}
      <div className="waiting-header">

        {/* Mobile-only left column: buttons row above WoW card */}
        <div className="msv-mobile-left">
          <div className="msv-mobile-btns">
            <button
              className={`msv-spotter-btn${turnOrderPhase === 'open' ? ' is-open' : ''}`}
              onClick={handleAvatarBtnClick}
              aria-label="Show turn order"
            >
              <div className={`msv-spotter-btn-avatar${avatarPulse ? ' is-pulsing' : ''}`}>
                {renderAvatarComponent(spotterPlayer?.avatarId ?? 0)}
              </div>
            </button>
            <button
              className={`msv-chat-btn${chatPhase === 'open' ? ' is-open' : ''}`}
              onClick={handleChatBtnClick}
              aria-label="Open chat"
            >
              <div className={`msv-chat-btn-icon${chatUnread ? ' is-pulsing' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
            </button>
          </div>
          <div className="msv-wow-wrap">
            <QuoteCard quote={quote} flipKey={quoteFlipKey} />
          </div>
        </div>

        {/* Header text — display:contents on desktop so layout is unchanged */}
        <div className="msv-header-text">
          <div className="msv-header-logo-wrap">
              <img src={mvLogo} alt="Monster Voices" className="msv-header-logo" />
            </div>
          <div className="speaker-instruction-block">
            <h2 className={`speaker-instruction-title${countdown !== null ? ' title-countdown' : ''}`}>
              {countdown !== null ? `Time's up in ${countdown}s — guess now!` : 'You are the Monster Spotter'}
            </h2>
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
      </div>

      {/* Turn order popout — position:fixed, mobile only via CSS */}
      {turnOrderPhase && (
        <div
          className={`msv-turn-order-overlay${turnOrderPhase === 'closing' ? ' is-closing' : ''}`}
          onClick={() => { if (turnOrderPhase === 'open') closeTurnOrder() }}
        >
          <div
            className="msv-turn-order-panel"
            onClick={e => e.stopPropagation()}
          >
            <div className="msv-turn-order-fan-wrap">
              <DevNumberCardFan
                players={players}
                spotterId={spotterId}
                speakingOrder={speakingOrder}
                speakerStatuses={speakerStatuses}
                currentSpeakerId={currentSpeakerId}
                myPlayerId={myPlayer.id}
                phase={phase}
                roundNumber={roundNumber ?? 1}
                totalRounds={totalRounds ?? 1}
                activeEmotes={activeEmotes}
              />
            </div>
            {scores && scores.length > 0 && (
              <div className="msv-scorebug">
                {[...scores].sort((a, b) => b.score - a.score).map(p => (
                  <div key={p.id} className="msv-scorebug-item">
                    <span className="msv-scorebug-name">{p.name}</span>
                    <span className="msv-scorebug-score">{p.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat popout */}
      {chatPhase && (
        <div
          className={`msv-turn-order-overlay${chatPhase === 'closing' ? ' is-closing' : ''}`}
          onClick={() => { if (chatPhase === 'open') closeChat() }}
        >
          <div
            className="msv-chat-popout-panel"
            onClick={e => e.stopPropagation()}
          >
            <ChatPanel messages={chatMessages} onSend={onSendChat} myPlayer={myPlayer} onSendEmote={onSendEmote} popout />
          </div>
        </div>
      )}

      <div className="waiting-body">
        {/* Monster grid — fills all available height */}
        <div className="waiting-grid-col">
          <div className={`monster-grid monster-grid-fill${(GRID_LAYOUTS[shuffledMonsters.length] ?? GRID_LAYOUTS[9]).length <= 2 ? ' monster-grid-2rows' : ''}`} ref={gridRef}>
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
                            <img src={MONSTERS[monsterIndex]} alt={`Monster ${monsterIndex + 1}`} className={`monster-img${WIDE_CONTENT_MONSTERS.has(monsterIndex) ? ' monster-img-wide' : MEDIUM_CONTENT_MONSTERS.has(monsterIndex) ? ' monster-img-medium' : ''}`} />
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
