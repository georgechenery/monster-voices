import mvLogo from '../assets/brand/mv-logo.png'
import monsterBanner from '../assets/brand/monster-banner.jpg'
import shuffleupigusLogo from '../assets/brand/shuffleupigus-transparent.png'

export default function WaitingRoom({ roomCode, players, myPlayer, isHost, gameMode, selectedPigId, onSetMode, onStartGame, errorMsg }) {
  const isGauntlet = gameMode === 'gauntlet'
  const minPlayers = isGauntlet ? 2 : 3
  const canStart = players.length >= minPlayers

  const handleModeSwitch = (mode) => {
    if (!isHost) return
    // Default PIG to host when switching to gauntlet
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

  const selectedPig = players.find(p => p.id === selectedPigId)

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

        {/* Game mode selector — host sees toggle, others see current mode */}
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

          {/* PIG selector — gauntlet only */}
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
            {players.map(player => (
              <div key={player.id} className="wr-player">
                <div className="wr-player-token">
                  {player.name.charAt(0).toUpperCase()}
                </div>
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
