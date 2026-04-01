import { useState, useEffect, useRef } from 'react'
import { MONSTERS } from '../data/monsters'
import cardBack from '../assets/monsters/card-back.png'
import { useWebRTC } from '../hooks/useWebRTC'
import QuoteCard from './QuoteCard'
import mvLogo from '../assets/brand/mv-logo.png'

export default function GauntletSpotterView({ gauntletState, myPlayer, players, quoteFlipKey, socket }) {
  const { shuffledMonsters, quote, phase, solvedPositions, strikes, votes, playerColors, lastResult, pigId, monstersLeft } = gauntletState

  const [showTieBreak, setShowTieBreak] = useState(false)

  const {
    liveAudioRef, replayAudioRef,
    audioUnlocked, audioBlocked, unlockAudio,
    replayUrl, handleReplay
  } = useWebRTC(socket, false, true, pigId)

  const myColor = playerColors[myPlayer.id]
  const myVote = votes[myPlayer.id]

  // Spotters in vote count
  const spotterIds = players.filter(p => p.id !== pigId).map(p => p.id)
  const totalSpotters = spotterIds.length
  const votedCount = spotterIds.filter(id => votes[id] !== undefined).length

  // Show tie-break flash briefly when lastResult has tieBreak
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

  // Get voter colors for a given position
  const votersAtPosition = (position) =>
    spotterIds
      .filter(id => votes[id] === position)
      .map(id => playerColors[id])

  const pigPlayer = players.find(p => p.id === pigId)
  const solvedCount = solvedPositions.length

  return (
    <div className="waiting-layout">
      {/* Header */}
      <div className="waiting-header">
        <div className="role-badge role-badge-spotter">You are the Monster Spotter</div>
        <GauntletStrikeBar strikes={strikes} />

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
            {Array.from({ length: 9 }, (_, position) => {
              const monsterIndex = shuffledMonsters[position]
              const isSolved = solvedPositions.includes(position)
              const isClickable = phase === 'voting' && !isSolved
              const isMyVote = myVote === position
              const voterColors = votersAtPosition(position)

              // Result states
              const showCorrect = lastResult && lastResult.correct && lastResult.position === position
              const showWrong = lastResult && !lastResult.correct && lastResult.guessedPosition === position
              const isTied = showTieBreak && lastResult && lastResult.tiedPositions && lastResult.tiedPositions.includes(position)

              return (
                <div key={position} className={`monster-card-flipper${isClickable ? ' monster-card-flipper-clickable' : ''}`}>
                  <div className={`monster-card-inner ${isSolved ? 'is-flipped' : ''}`}>
                    <div
                      className={[
                        'monster-card monster-card-face monster-card-front',
                        isClickable ? 'monster-card-clickable' : '',
                        showCorrect ? 'monster-card-correct' : '',
                        showWrong ? 'monster-card-wrong' : '',
                        isTied ? 'monster-card-tie-flash' : '',
                        !isClickable && !isSolved && phase === 'speaking' ? 'monster-card-disabled' : '',
                      ].filter(Boolean).join(' ')}
                      style={isMyVote && !showCorrect && !showWrong ? { outline: `3px solid ${myColor}`, outlineOffset: '2px' } : {}}
                      onClick={() => handleVote(position)}
                    >
                      <img src={MONSTERS[monsterIndex]} alt={`Monster ${monsterIndex + 1}`} className="monster-img" />

                      {/* Vote dots — one colored dot per voter */}
                      {voterColors.length > 0 && (
                        <div className="vote-dots">
                          {voterColors.map((color, i) => (
                            <span key={i} className="vote-dot" style={{ background: color }} />
                          ))}
                        </div>
                      )}

                      {isTied && (
                        <div className="tie-break-label">Tie!</div>
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

          {/* Controls below grid */}
          <div className="waiting-controls">
            <div className="gauntlet-status-banner">
              {phase === 'speaking' && (
                <span className="status-speaking">
                  <strong>{pigPlayer ? pigPlayer.name : 'PIG'}</strong> is speaking... listen carefully!
                </span>
              )}
              {phase === 'voting' && (
                <span className="status-active">
                  Vote! Tap the monster you think it is. ({votedCount}/{totalSpotters} voted)
                </span>
              )}
              {phase === 'result' && lastResult && (
                <span className={lastResult.correct ? 'status-correct' : 'status-wrong'}>
                  {lastResult.tieBreak ? 'Tie broken randomly! ' : ''}
                  {lastResult.correct ? 'Correct!' : `Wrong — ${5 - strikes} strikes left.`}
                </span>
              )}
            </div>

            {/* My vote indicator */}
            {phase === 'voting' && myVote !== undefined && (
              <div className="my-vote-label" style={{ borderColor: myColor, color: myColor }}>
                Your vote: Monster #{myVote + 1}
              </div>
            )}

            {/* Player vote legend */}
            {(phase === 'voting' || phase === 'result') && (
              <div className="vote-legend">
                {spotterIds.map(id => {
                  const player = players.find(p => p.id === id)
                  const color = playerColors[id]
                  const voted = votes[id] !== undefined
                  return (
                    <div key={id} className="vote-legend-item">
                      <span className="vote-legend-dot" style={{ background: color }} />
                      <span className="vote-legend-name">{player ? player.name : '?'}</span>
                      {voted ? (
                        <span className="vote-legend-status voted">voted</span>
                      ) : (
                        <span className="vote-legend-status waiting">...</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {replayUrl && (
              <button className="btn btn-replay" onClick={handleReplay}>
                Listen Again
              </button>
            )}
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

      <audio ref={liveAudioRef} autoPlay playsInline style={{ display: 'none' }} />
      <audio ref={replayAudioRef} style={{ display: 'none' }} />
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
