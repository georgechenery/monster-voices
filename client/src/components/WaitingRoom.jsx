import { useState } from 'react'
import mvLogo from '../assets/brand/mv-logo.png'
import monsterBanner from '../assets/brand/monster-banner.jpg'
import shuffleupigusLogo from '../assets/brand/shuffleupigus-transparent.png'
import { AVATARS, SELECTABLE_AVATARS } from '../data/avatars'
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

const BOB_DURATIONS = [2.1, 2.6, 1.9, 2.4, 2.8, 2.2, 2.5, 1.8, 2.7, 2.3, 2.0]
const BOB_DELAYS    = [-0.4, -1.2, -0.8, -1.7, -0.2, -1.4, -0.6, -1.9, -0.1, -1.1, -0.9]

const AVATAR_COMPONENTS = {
  0: AvatarA1, 1: AvatarA2, 2: AvatarA3, 3: AvatarA4,
  4: AvatarA5, 5: AvatarA6, 7: AvatarA8, 8: AvatarA9,
  9: AvatarA10, 10: AvatarA11,
}

function AvatarBubble({ avatarId, size, border, shadow, bobIndex }) {
  const id = avatarId ?? 0
  const Component = AVATAR_COMPONENTS[id]
  // SVG slightly overflows the circle (same ratio as scoreboard: ~65px svg in 64px wrap)
  const svgSize = Math.round(size * 1.05)
  const avatarStyle = {
    width: svgSize,
    height: svgSize,
    animationName: 'avatar-bob',
    animationDuration: `${BOB_DURATIONS[bobIndex % BOB_DURATIONS.length]}s`,
    animationDelay: `${BOB_DELAYS[bobIndex % BOB_DELAYS.length]}s`,
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
  }
  return (
    <div
      className="scoreboard-avatar-wrap"
      style={{
        width: size, height: size,
        border: border,
        ...(shadow ? { boxShadow: '5px 5px 0 rgba(0,0,0,0.2)' } : {}),
      }}
    >
      {Component
        ? <Component style={avatarStyle} emoteId={null} />
        : <img src={AVATARS[id]} alt="" style={{ ...avatarStyle, objectFit: 'cover' }} />
      }
    </div>
  )
}

export default function WaitingRoom({ roomCode, players, myPlayer, isHost, gameMode, selectedPigId, onSetMode, onStartGame, onSelectAvatar, errorMsg }) {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  const isGauntlet = gameMode === 'gauntlet'
  const minPlayers = isGauntlet ? 2 : 3
  const canStart = players.length >= minPlayers

  const handleModeSwitch = (mode) => {
    if (!isHost) return
    const pigId = mode === 'gauntlet' ? (myPlayer ? myPlayer.id : players[0]?.id) : null
    onSetMode(mode, pigId)
  }

  const handlePigSelect = (playerId) => {
    if (!isHost) return
    onSetMode('gauntlet', playerId)
  }

  const handleStart = () => {
    onStartGame(gameMode, selectedPigId)
  }

  const handlePickAvatar = (idx) => {
    onSelectAvatar(idx)
    setShowAvatarPicker(false)
  }

  const selectedPig = players.find(p => p.id === selectedPigId)
  const myAvatarId = myPlayer?.avatarId ?? 0

  return (
    <div className="lobby-screen">
      <div className="lobby-bg" style={{ backgroundImage: `url(${monsterBanner})` }} />

      <div className="wr-content">
        <div className="wr-logo-wrap">
          <img src={mvLogo} alt="Monster Voices" className="wr-logo" />
        </div>

        {/* Room code */}
        <div className="wr-code-block">
          <p className="wr-code-label">Room Code</p>
          <div className="wr-code-value">{roomCode}</div>
          <p className="wr-code-hint">Share this with your friends!</p>
        </div>

        {/* Avatar display + change button */}
        <div className="wr-avatar-section">
          <div className="wr-my-avatar-wrap">
            <AvatarBubble avatarId={myAvatarId} size={110} border="4px solid #000" shadow bobIndex={0} />
            <button className="btn-lobby wr-change-avatar-btn" onClick={() => setShowAvatarPicker(true)}>
              Change Avatar
            </button>
          </div>
        </div>

        {/* Avatar picker modal */}
        {showAvatarPicker && (
          <div className="wr-avatar-modal-backdrop" onClick={() => setShowAvatarPicker(false)}>
            <div className="wr-avatar-modal" onClick={e => e.stopPropagation()}>
              <div className="wr-avatar-modal-header">
                <span className="wr-avatar-modal-title">Choose your avatar</span>
                <button className="wr-avatar-modal-close" onClick={() => setShowAvatarPicker(false)}>✕</button>
              </div>
              <div className="wr-avatar-grid">
                {SELECTABLE_AVATARS.map(({ url, id }) => {
                  const isMine = myAvatarId === id
                  const takenBy = players.find(p => p.id !== myPlayer?.id && p.avatarId === id)
                  return (
                    <button
                      key={id}
                      className={`wr-avatar-opt${isMine ? ' wr-avatar-selected' : ''}${takenBy ? ' wr-avatar-taken' : ''}`}
                      onClick={() => !takenBy && handlePickAvatar(id)}
                      disabled={!!takenBy}
                      aria-label={`Avatar ${id + 1}${takenBy ? ` — taken by ${takenBy.name}` : ''}`}
                    >
                      <img src={url} alt="" />
                      {takenBy && <span className="wr-avatar-taken-label">{takenBy.name}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}


        {/* Game mode selector */}
        <div className="wr-mode-section">
          {isHost ? (
            <div className="wr-mode-toggle">
              <button
                className={`wr-mode-btn ${!isGauntlet ? 'wr-mode-btn-active' : ''}`}
                onClick={() => handleModeSwitch('classic')}
              >
                Classic
              </button>
              <button
                className={`wr-mode-btn ${isGauntlet ? 'wr-mode-btn-active' : ''}`}
                onClick={() => handleModeSwitch('gauntlet')}
              >
                Run the Gauntlet
              </button>
            </div>
          ) : (
            <div className="wr-mode-display">
              {isGauntlet ? 'Run the Gauntlet' : 'Classic Mode'}
            </div>
          )}

          {isGauntlet && (
            <div className="wr-pig-section">
              <p className="wr-pig-label">Who is PIG? (the voice actor)</p>
              <div className="wr-pig-list">
                {players.map(player => (
                  <button
                    key={player.id}
                    className={`wr-pig-btn ${selectedPigId === player.id ? 'wr-pig-btn-selected' : ''}`}
                    onClick={() => handlePigSelect(player.id)}
                    disabled={!isHost}
                  >
                    {player.name}
                    {player.isHost && <span className="wr-pig-host-tag"> (host)</span>}
                  </button>
                ))}
              </div>
              {selectedPig && (
                <p className="wr-pig-chosen">
                  {selectedPig.name} will portray all 9 monsters
                </p>
              )}
            </div>
          )}
        </div>

        {/* Player list */}
        <div className="wr-players">
          <p className="wr-players-label">Players ({players.length}/10)</p>
          <div className="wr-player-list">
            {players.map((player, idx) => (
              <div key={player.id} className="wr-player">
                <AvatarBubble avatarId={player.avatarId} size={52} border="2px solid #000" bobIndex={idx} />
                <span className="wr-player-name">{player.name}</span>
                {player.isHost && <span className="wr-host-badge">Host</span>}
                {isGauntlet && selectedPigId === player.id && (
                  <span className="wr-pig-badge">PIG</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        {isHost ? (
          <div className="wr-controls">
            {!canStart && (
              <p className="wr-hint">
                Need at least {minPlayers} players to start ({players.length}/{minPlayers})
              </p>
            )}
            {isGauntlet && !selectedPigId && (
              <p className="wr-hint">Select who will be PIG above</p>
            )}
            <button
              className="btn-lobby btn-lobby-primary"
              onClick={handleStart}
              disabled={!canStart || (isGauntlet && !selectedPigId)}
            >
              {isGauntlet ? 'Run the Gauntlet!' : 'Start Game!'}
            </button>
          </div>
        ) : (
          <p className="wr-waiting">Waiting for the host to start...</p>
        )}

        {errorMsg && <div className="lobby-error">{errorMsg}</div>}

        <img src={shuffleupigusLogo} alt="Shuffleupigus Games" className="lobby-publisher" />
      </div>
    </div>
  )
}
