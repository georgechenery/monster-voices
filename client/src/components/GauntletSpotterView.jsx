import { useState, useEffect } from 'react'
import { MONSTERS } from '../data/monsters'
import cardBack from '../assets/monsters/card-back.png'
import { useWebRTC } from '../hooks/useWebRTC'
import { GRID_LAYOUTS } from '../data/gridLayouts'
import ChatPanel from './ChatPanel'
import QuoteCard from './QuoteCard'
import mvLogo from '../assets/brand/mv-logo.png'

export default function GauntletSpotterView({ gauntletState, myPlayer, players, quoteFlipKey, socket, chatMessages = [], onSendChat, onSendEmote, onReplayStart, onReplayEnd }) {
  const { shuffledMonsters, phase, solvedPositions, strikes, votes, playerColors, lastResult, pigId, totalMonsters } = gauntletState

  const [showTieBreak, setShowTieBreak] = useState(false)

  const {
    liveAudioRef, replayAudioRef,
    audioUnlocked, audioBlocked, unlockAudio,
    replayUrl, handleReplay
  } = useWebRTC(socket, false, true, pigId)

  const myVote = votes[myPlayer.id]
  const spotterIds = players.filter(p => p.id !== pigId).map(p => p.id)
  const totalSpotters = spotterIds.length
  const votedCount = spotterIds.filter(id => votes[id] !== undefined).length

  useEffect(() => {
    if (lastResult && lastResult.tieBreak) {
      setShowTieBreak(true)
      const t = setTimeout(() => setShowTieBreak(false), 1200)
      return () => clearTimeout(t)
    }
  }, [lastResult])

  const handleVote = (position) => {
    if (phase !== 'voting') return
    if (solvedPositions.includes(position)) return
    socket.emit('gauntlet_vote', { position })
  }

  const votersAtPosition = (position) =>
    spotterIds
      .filter(id => votes[id] === position)
      .map(id => playerColors[id])

  const speakerPlayer = players.find(p => p.id === pigId)
  const numMonsters = shuffledMonsters.length

  return (
    <div className="waiting-layout">
      {/* Header */}
      <div className="waiting-header">
        <div className="speaker-instruction-block">
          <h2 className="speaker-instruction-title">You are a Monster Spotter</h2>
          <p className="speaker-instruction-sub">The Speaker reads the <span className="amber-text">Words of Wisdom</span> as each monster — listen carefully, then vote for the one you think they are!</p>
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
      </div>

      <div className="waiting-body">
        {/* Monster grid */}
        <div className="waiting-grid-col">
          <div className="monster-grid monster-grid-fill">
            {(GRID_LAYOUTS[numMonsters] ?? GRID_LAYOUTS[9]).reduce((rows, cols, rowIdx) => {
              const startPos = rows.nextPos
              rows.nextPos += cols
              rows.elements.push(
                <div key={rowIdx} className={`monster-grid-row monster-grid-row-${cols}`}>
                  {Array.from({ length: cols }, (_, i) => {
                    const position = startPos + i
                    const monsterIndex = shuffledMonsters[position]
                    const isSolved = solvedPositions.includes(position)
                    const isClickable = phase === 'voting' && !isSolved
                    const isMyVote = myVote === position
                    const voterColors = votersAtPosition(position)

                    const showCorrect = lastResult && lastResult.correct && lastResult.position === position
                    const showWrong = lastResult && !lastResult.correct && lastResult.guessedPosition === position
                    const isTied = showTieBreak && lastResult?.tiedPositions?.includes(position)

                    return (
                      <div key={position} className={`monster-card-flipper${isClickable ? ' monster-card-flipper-clickable' : ''}`}>
                        <div className={`monster-card-inner ${isSolved ? 'is-flipped' : ''}`}>
                          <div
                            className={[
                              'monster-card monster-card-face monster-card-front',
                              isClickable ? 'monster-card-clickable' : '',
                              isMyVote && !showCorrect && !showWrong ? 'monster-card-selected' : '',
                              showCorrect ? 'monster-card-correct' : '',
                              showWrong ? 'monster-card-wrong' : '',
                              isTied ? 'monster-card-tie-flash' : '',
                              !isClickable && !isSolved && phase === 'speaking' ? 'monster-card-disabled' : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => handleVote(position)}
                          >
                            <img src={MONSTERS[monsterIndex]} alt={`Monster ${monsterIndex + 1}`} className="monster-img" />
                            {voterColors.length > 0 && (
                              <div className="vote-dots">
                                {voterColors.map((color, idx) => (
                                  <span key={idx} className="vote-dot" style={{ background: color }} />
                                ))}
                              </div>
                            )}
                            {isTied && <div className="tie-break-label">Tie!</div>}
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

          {/* Controls */}
          <div className="waiting-controls waiting-controls-spotter-rtg">
            <div className="rtg-mobile-wow">
              <QuoteCard quote={gauntletState.quote} flipKey={quoteFlipKey} />
            </div>
            <div className="spotter-controls-inner">
            {/* Status / Listen Again row */}
            <div className="status-banner">
              {phase === 'speaking' && (
                <span className="status-waiting">
                  <strong>{speakerPlayer?.name ?? 'The Speaker'}</strong> is speaking — listen carefully!
                </span>
              )}
              {phase === 'voting' && (
                <div className="status-active-row">
                  <span className="status-active">
                    Vote! Tap the monster you think it is. ({votedCount}/{totalSpotters} voted)
                  </span>
                  {replayUrl && (
                    <button className="btn btn-replay btn-replay-sm" onClick={() => {
                      onReplayStart?.()
                      handleReplay()
                      if (replayAudioRef.current) {
                        replayAudioRef.current.onended = () => onReplayEnd?.()
                      }
                    }}>Listen Again</button>
                  )}
                </div>
              )}
              {phase === 'result' && lastResult && (
                <span className={lastResult.correct ? 'status-correct' : 'status-wrong'}>
                  {lastResult.tieBreak ? 'Tie broken randomly! ' : ''}
                  {lastResult.correct ? 'Correct!' : `Wrong — ${5 - strikes} strikes left.`}
                </span>
              )}
            </div>

            {/* Vote legend */}
            {(phase === 'voting' || phase === 'result') && (
              <div className="vote-legend">
                {spotterIds.map(id => {
                  const player = players.find(p => p.id === id)
                  const color = playerColors[id]
                  const voted = votes[id] !== undefined
                  return (
                    <div key={id} className="vote-legend-item">
                      <span className="vote-legend-dot" style={{ background: color }} />
                      <span className="vote-legend-name">{player?.name ?? '?'}</span>
                      {voted
                        ? <span className="vote-legend-status voted">voted</span>
                        : <span className="vote-legend-status waiting">...</span>
                      }
                    </div>
                  )
                })}
              </div>
            )}

            {!replayUrl && phase === 'voting' && (
              <p className="timeout-no-audio">No recording yet — you can still vote!</p>
            )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="waiting-right-col">
          <div className="game-sidebar-logo-wrap">
            <img src={mvLogo} alt="Monster Voices" className="game-sidebar-logo" />
          </div>
          <ChatPanel messages={chatMessages} onSend={onSendChat} myPlayer={myPlayer} onSendEmote={onSendEmote} />
        </div>
      </div>

      <audio ref={liveAudioRef} autoPlay playsInline style={{ display: 'none' }} />
      <audio ref={replayAudioRef} style={{ display: 'none' }} />
    </div>
  )
}
