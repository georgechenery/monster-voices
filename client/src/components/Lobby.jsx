import { useState } from 'react'
import mvLogo from '../assets/brand/mv-logo.png'
import monsterBanner from '../assets/brand/monster-banner.jpg'
import shuffleupigusLogo from '../assets/brand/shuffleupigus-transparent.png'
import HowToPlay from './HowToPlay'

export default function Lobby({ onCreateRoom, onJoinRoom, errorMsg, onDevEmotes, onDevGame, onDevGame3, onDevGame5, onDevSean }) {
  const [mode, setMode] = useState(null) // null | 'create' | 'join'
  const [showDevMenu, setShowDevMenu] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [showHowToPlay, setShowHowToPlay] = useState(false)

  const handleCreate = (e) => {
    e.preventDefault()
    if (playerName.trim()) onCreateRoom(playerName.trim())
  }

  const handleJoin = (e) => {
    e.preventDefault()
    if (playerName.trim() && roomCode.trim()) onJoinRoom(roomCode.trim(), playerName.trim())
  }

  return (
    <div className="lobby-screen">
      {/* Monster banner — scrolls horizontally behind everything */}
      <div className="lobby-bg" style={{ backgroundImage: `url(${monsterBanner})` }} />

      <div className="lobby-content">
        <div className="lobby-logo-wrap">
          <img src={mvLogo} alt="Monster Voices" className="lobby-logo" />
        </div>

        {!mode && (
          <>
            <p className="lobby-tagline">What kind of monster are you?</p>
            <div className="lobby-main-buttons">
              <button className="btn-lobby btn-lobby-primary" onClick={() => setMode('create')}>
                Create Room
              </button>
              <button className="btn-lobby btn-lobby-secondary" onClick={() => setMode('join')}>
                Join Room
              </button>
              <button className="btn-lobby btn-lobby-howto" onClick={() => setShowHowToPlay(true)}>
                How to Play
              </button>
            </div>
          </>
        )}

        {mode === 'create' && (
          <form className="lobby-form" onSubmit={handleCreate}>
            <h2 className="lobby-form-title">Create a Room</h2>
            <label className="lobby-label">Your Name</label>
            <input
              className="lobby-input"
              type="text"
              placeholder="Enter your name..."
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <button className="btn-lobby btn-lobby-primary" type="submit" disabled={!playerName.trim()}>
              Create Room
            </button>
            <button className="btn-lobby btn-lobby-ghost" type="button" onClick={() => setMode(null)}>
              ← Back
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form className="lobby-form" onSubmit={handleJoin}>
            <h2 className="lobby-form-title">Join a Room</h2>
            <label className="lobby-label">Room Code</label>
            <input
              className="lobby-input lobby-input-code"
              type="text"
              placeholder="e.g. WXYZ"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              maxLength={4}
              autoFocus
            />
            <label className="lobby-label">Your Name</label>
            <input
              className="lobby-input"
              type="text"
              placeholder="Enter your name..."
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              maxLength={20}
            />
            <button
              className="btn-lobby btn-lobby-primary"
              type="submit"
              disabled={!playerName.trim() || !roomCode.trim()}
            >
              Join Room
            </button>
            <button className="btn-lobby btn-lobby-ghost" type="button" onClick={() => setMode(null)}>
              ← Back
            </button>
          </form>
        )}

        {errorMsg && (
          <div className="lobby-error">
            {errorMsg}
          </div>
        )}

        <img src={shuffleupigusLogo} alt="Shuffleupigus Games" className="lobby-publisher" />
      </div>

      {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}

      {onDevEmotes && (
        <div className="btn-lobby-dev-group">
          <button className="btn-lobby-dev" onClick={() => setShowDevMenu(m => !m)}>DEV</button>
          {showDevMenu && (
            <div className="btn-lobby-dev-popup">
              <button className="btn-lobby-dev-option" onClick={() => { setShowDevMenu(false); onDevEmotes() }}>Emote Preview</button>
              <button className="btn-lobby-dev-option" onClick={() => { setShowDevMenu(false); onDevSean() }}>Sean's Edit</button>
              <button className="btn-lobby-dev-option" onClick={() => { setShowDevMenu(false); onDevGame3() }}>Sandbox · 3 players</button>
              <button className="btn-lobby-dev-option" onClick={() => { setShowDevMenu(false); onDevGame5() }}>Sandbox · 5 players</button>
              <button className="btn-lobby-dev-option" onClick={() => { setShowDevMenu(false); onDevGame() }}>Sandbox · 10 players</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
