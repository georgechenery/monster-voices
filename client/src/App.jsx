import { useState, useEffect, useRef } from 'react'
import socket from './socket'
import { playTrack, setDucked, setMusicMuted } from './utils/music'
import { setSfxMuted } from './utils/sounds'
import Lobby from './components/Lobby'
import EmotePreview from './components/EmotePreview'
import Sandbox from './components/Sandbox'
import WaitingRoom from './components/WaitingRoom'
import GameView from './components/GameView'
import VoicePanel from './components/VoicePanel'
import GauntletGame from './components/GauntletGame'
import GameOver from './components/GameOver'
import { MONSTERS } from './data/monsters'
import cardBack from './assets/monsters/card-back.png'

function preloadImages(srcs) {
  srcs.forEach(src => { const img = new Image(); img.src = src })
}

// Play three short click tones (voice-chat attention getter before recording plays)
function playClickCountdown() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const freqs = [660, 660, 880] // two low clicks then a high one
    freqs.forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.4
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.35, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
      osc.start(t)
      osc.stop(t + 0.15)
    })
    setTimeout(() => ctx.close(), 2000)
  } catch (_) {}
}

export default function App() {
  const [view, setView] = useState('lobby') // 'lobby' | 'waiting' | 'game' | 'game_over'
  const [roomCode, setRoomCode] = useState('')
  const [myPlayer, setMyPlayer] = useState(null)
  const [players, setPlayers] = useState([])
  const [isHost, setIsHost] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Game mode
  const [gameMode, setGameMode] = useState('classic') // 'classic' | 'gauntlet'
  const [selectedPigId, setSelectedPigId] = useState(null)

  // Classic game state
  const [myMonster, setMyMonster] = useState(null) // { position, monsterIndex }
  const [roundState, setRoundState] = useState({
    spotterId: null,
    shuffledMonsters: [],
    quote: '',
    currentSpeakerId: null,
    speakerName: '',
    waitingForGuess: false,
    phase: 'speaking',
    speakingOrder: [],
    speakerIsRecording: false,
    speakerStatuses: {},
    roundNumber: 1,
    totalRounds: 1,
  })
  const [guessResult, setGuessResult] = useState(null)
  const [roundResults, setRoundResults] = useState(null)
  const [finalResult, setFinalResult] = useState(null)
  const [scores, setScores] = useState([])
  const [flippedPositions, setFlippedPositions] = useState([])
  const [quoteFlipKey, setQuoteFlipKey] = useState(0)
  const [cardRevealActive, setCardRevealActive] = useState(false)

  // Mid-game watcher: joined a game already in progress, watches until next round
  const [isMidgameWatcher, setIsMidgameWatcher] = useState(false)

  // Gauntlet state
  const [gauntletState, setGauntletState] = useState(null)

  // Voice chat
  const [voiceChat, setVoiceChat]   = useState(false)
  const [voiceMuted, setVoiceMuted] = useState(false)

  // Chat
  const [chatMessages, setChatMessages] = useState([])

  // Round counter — resets on new room join/create, increments each game_started
  const roundCountRef = useRef(0)

  // Emotes — map of playerId → emoteId for currently-animating players
  const [activeEmotes, setActiveEmotes] = useState({})

  // Audio controls — persisted across sessions
  const [musicMuted, setMusicMutedState] = useState(() => localStorage.getItem('music-muted') === 'true')
  const [sfxMuted,   setSfxMutedState]   = useState(() => localStorage.getItem('sfx-muted')   === 'true')

  const toggleMusic = () => setMusicMutedState(m => {
    const next = !m
    localStorage.setItem('music-muted', next)
    setMusicMuted(next)
    return next
  })
  const toggleSfx = () => setSfxMutedState(m => {
    const next = !m
    localStorage.setItem('sfx-muted', next)
    setSfxMuted(next)
    return next
  })

  // Sync initial mute states into modules on mount
  useEffect(() => {
    setMusicMuted(musicMuted)
    setSfxMuted(sfxMuted)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Music track selection: theme during active gameplay, menus everywhere else
  useEffect(() => {
    const inActiveGame = view === 'game' && roundResults === null
    playTrack(inActiveGame ? 'theme' : 'menus')
  }, [view, roundResults])

  // Duck music while speaker is broadcasting voice
  useEffect(() => {
    setDucked(roundState.speakerIsRecording)
  }, [roundState.speakerIsRecording])

  // Preload card-back once on mount (always used)
  useEffect(() => {
    preloadImages([cardBack])
  }, [])

  useEffect(() => {
    socket.on('room_created', ({ roomCode: code, player, players: ps, voiceChat: vc }) => {
      roundCountRef.current = 0
      setRoomCode(code)
      setMyPlayer(player)
      setPlayers(ps)
      setIsHost(true)
      setView('waiting')
      setErrorMsg('')
      setGameMode('classic')
      setSelectedPigId(player.id) // default PIG = host
      setVoiceChat(vc ?? false)
    })

    socket.on('room_joined', ({ roomCode: code, player, players: ps, mode, pendingPigId, voiceChat: vc }) => {
      roundCountRef.current = 0
      setRoomCode(code)
      setMyPlayer(player)
      setPlayers(ps)
      setIsHost(false)
      setView('waiting')
      setErrorMsg('')
      setGameMode(mode || 'classic')
      setSelectedPigId(pendingPigId || null)
      setVoiceChat(vc ?? false)
    })

    socket.on('player_joined', ({ players: ps }) => {
      setPlayers(ps)
    })

    socket.on('room_updated', ({ players: ps }) => {
      setPlayers(ps)
    })

    socket.on('avatar_updated', ({ playerId, avatarId }) => {
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, avatarId } : p))
      if (playerId === socket.id) {
        setMyPlayer(prev => prev ? { ...prev, avatarId } : prev)
      }
    })

    socket.on('player_left', ({ players: ps, newHostId }) => {
      setPlayers(ps)
      if (newHostId === socket.id) {
        setIsHost(true)
        setMyPlayer(prev => prev ? { ...prev, isHost: true } : prev)
      }
    })

    socket.on('error', ({ message }) => {
      setErrorMsg(message)
    })

    // Host changed mode in waiting room
    socket.on('mode_updated', ({ mode, pigId }) => {
      setGameMode(mode)
      setSelectedPigId(pigId)
    })

    // ---- Classic game events ----
    socket.on('emote', ({ playerId, emoteId }) => {
      const fireKey = Date.now()
      setActiveEmotes(prev => ({ ...prev, [playerId]: { emoteId, fireKey } }))
      setTimeout(() => {
        setActiveEmotes(prev => {
          const next = { ...prev }
          if (next[playerId]?.fireKey === fireKey) delete next[playerId]
          return next
        })
      }, 2500)
    })

    socket.on('chat_message', (msg) => {
      setChatMessages(prev => [...prev, msg])
    })

    socket.on('joined_midgame', ({ roomCode: code, player, players: ps, scores: sc, roundState: rs }) => {
      setRoomCode(code)
      setMyPlayer(player)
      setPlayers(ps)
      setIsHost(false)
      setErrorMsg('')
      setGameMode('classic')
      setIsMidgameWatcher(true)
      setScores(sc)
      if (rs) {
        preloadImages((rs.shuffledMonsters || []).map(i => MONSTERS[i]))
        setRoundState(prev => ({
          ...prev,
          spotterId: rs.spotterId,
          shuffledMonsters: rs.shuffledMonsters || [],
          currentSpeakerId: rs.currentSpeakerId,
          speakingOrder: rs.speakingOrder || [],
          phase: rs.phase || 'speaking',
        }))
      }
      setView('game')
    })

    socket.on('notification', ({ message }) => {
      setChatMessages(prev => [...prev, { system: true, text: message, ts: Date.now() }])
    })

    socket.on('voice_mode_updated', ({ voiceChat: vc }) => {
      setVoiceChat(vc)
    })

    socket.on('voice_mute_all', () => {
      setVoiceMuted(true)
      playClickCountdown()
    })

    // After recording plays, unmute voice chat (fallback: 10s after mute)
    // speaker_changed / second_chance_started also unmute, whichever fires first.
    const handleAudioReadyForVoice = () => setTimeout(() => setVoiceMuted(false), 10000)
    socket.on('audio_ready', handleAudioReadyForVoice)

    socket.on('game_started', ({ spotterId, shuffledMonsters, quote, speakingOrder, players: ps, voiceChat: vc }) => {
      if (vc !== undefined) setVoiceChat(vc)
      preloadImages(shuffledMonsters.map(i => MONSTERS[i]))
      roundCountRef.current += 1
      const roundNum = roundCountRef.current
      // Only clear chat at the very start of a new game (round 1)
      if (roundNum === 1) setChatMessages([])
      setGameMode('classic')
      setIsMidgameWatcher(false)
      setPlayers(ps)
      setScores(ps.map(p => ({ id: p.id, name: p.name, score: p.score, avatarId: p.avatarId })))
      setMyMonster(null)
      setGuessResult(null)
      setRoundResults(null)
      setFlippedPositions([])
      setTimeout(() => setCardRevealActive(true), 100)
      setTimeout(() => setCardRevealActive(false), 100 + 8 * 225 + 450)
      setTimeout(() => setQuoteFlipKey(k => k + 1), 1500)

      const firstSpeaker = ps.find(p => p.id === speakingOrder[0])
      setRoundState({
        spotterId,
        shuffledMonsters,
        quote,
        currentSpeakerId: speakingOrder[0],
        speakerName: firstSpeaker ? firstSpeaker.name : '',
        waitingForGuess: false,
        phase: 'speaking',
        speakingOrder,
        speakerIsRecording: false,
        speakerStatuses: {},
        roundNumber: roundNum,
        totalRounds: ps.length,
      })
      setView('game')
    })

    socket.on('your_monster', ({ position, monsterIndex }) => {
      setMyMonster({ position, monsterIndex })
    })

    socket.on('your_turn', ({ quote }) => {
      setVoiceMuted(false) // speaker's local mic unmuted (voice chat doesn't include speaker anyway)
      setRoundState(prev => ({
        ...prev,
        quote,
        currentSpeakerId: socket.id,
        waitingForGuess: false
      }))
    })

    socket.on('speaker_changed', ({ currentSpeakerId, speakerName }) => {
      setVoiceMuted(false)
      setRoundState(prev => ({
        ...prev,
        currentSpeakerId,
        speakerName,
        waitingForGuess: false,
        speakerIsRecording: false,
        phase: 'speaking',
      }))
      setGuessResult(null)
    })

    socket.on('speaker_recording', () => {
      setRoundState(prev => ({ ...prev, speakerIsRecording: true }))
    })

    socket.on('waiting_for_guess', () => {
      setRoundState(prev => ({ ...prev, waitingForGuess: true, speakerIsRecording: false, phase: 'guessing' }))
    })

    socket.on('guess_result', ({ correct, speakerId, speakerName, position, monsterIndex, guessedPosition, points, scores: newScores, isSecondChance, wagerOutcomes = [] }) => {
      setGuessResult({ correct, speakerId, speakerName, position, monsterIndex, guessedPosition, points, isSecondChance, wagerOutcomes })
      setScores(newScores)
      setRoundState(prev => {
        const status = correct ? (isSecondChance ? 'guessed_second' : 'guessed') : isSecondChance ? 'not_guessed' : 'encore'
        const phase = correct ? 'correct' : 'wrong'
        return { ...prev, phase, speakerStatuses: { ...prev.speakerStatuses, [speakerId]: status } }
      })
      if (correct || isSecondChance) {
        setTimeout(() => {
          setFlippedPositions(prev => prev.includes(position) ? prev : [...prev, position])
        }, 800)
      }
    })

    socket.on('second_chance_started', ({ quote, secondChancePlayers }) => {
      setVoiceMuted(false)
      setGuessResult(null)
      setQuoteFlipKey(k => k + 1)
      setRoundState(prev => ({
        ...prev,
        quote,
        phase: 'second_chance',
        waitingForGuess: false,
        speakerIsRecording: false
      }))
    })

    socket.on('round_ended', ({ reveals, scores: newScores }) => {
      setRoundResults({ reveals, scores: newScores })
      setScores(newScores)
    })

    socket.on('game_over', ({ winner, finalScores }) => {
      setFinalResult({ mode: 'classic', winner, finalScores })
      setView('game_over')
    })

    // ---- Gauntlet game events ----
    socket.on('gauntlet_started', ({ pigId, shuffledMonsters, quote, playerColors, players: ps, strikes, solvedPositions }) => {
      preloadImages(shuffledMonsters.map(i => MONSTERS[i]))
      setChatMessages([])
      setGameMode('gauntlet')
      setPlayers(ps)
      setMyMonster(null)
      setQuoteFlipKey(0)
      setGauntletState({
        pigId,
        shuffledMonsters,
        quote,
        playerColors,
        strikes,
        solvedPositions,
        phase: 'speaking',
        votes: {},
        lastResult: null,
        monstersLeft: 9,
      })
      setView('game')
    })

    socket.on('gauntlet_voting_open', () => {
      setGauntletState(prev => prev ? { ...prev, phase: 'voting', votes: {} } : prev)
    })

    socket.on('gauntlet_vote_update', ({ votes }) => {
      setGauntletState(prev => prev ? { ...prev, votes } : prev)
    })

    socket.on('gauntlet_result', ({ correct, position, monsterIndex, guessedPosition, strikes, solvedPositions, tieBreak, tiedPositions }) => {
      setGauntletState(prev => prev ? {
        ...prev,
        phase: 'result',
        strikes,
        solvedPositions,
        lastResult: { correct, position, monsterIndex, guessedPosition, tieBreak, tiedPositions },
      } : prev)
    })

    socket.on('gauntlet_next_monster', ({ quote, monstersLeft }) => {
      setMyMonster(null) // PIG gets new your_monster event privately
      setQuoteFlipKey(k => k + 1)
      setGauntletState(prev => prev ? {
        ...prev,
        phase: 'speaking',
        quote,
        votes: {},
        lastResult: null,
        monstersLeft,
      } : prev)
    })

    socket.on('gauntlet_retry', ({ newQuote, strikes, monstersLeft }) => {
      setQuoteFlipKey(k => k + 1)
      setGauntletState(prev => prev ? {
        ...prev,
        phase: 'speaking',
        quote: newQuote,
        votes: {},
        strikes,
        lastResult: null,
        monstersLeft,
      } : prev)
    })

    socket.on('gauntlet_finished', ({ outcome, strikes, isPerfect, solvedCount }) => {
      setFinalResult({ mode: 'gauntlet', outcome, strikes, isPerfect, solvedCount })
      setView('game_over')
    })

    return () => {
      socket.off('voice_mode_updated')
      socket.off('voice_mute_all')
      socket.off('audio_ready', handleAudioReadyForVoice)
      socket.off('emote')
      socket.off('chat_message')
      socket.off('room_created')
      socket.off('room_joined')
      socket.off('joined_midgame')
      socket.off('notification')
      socket.off('player_joined')
      socket.off('room_updated')
      socket.off('player_left')
      socket.off('error')
      socket.off('mode_updated')
      socket.off('game_started')
      socket.off('your_monster')
      socket.off('your_turn')
      socket.off('speaker_changed')
      socket.off('waiting_for_guess')
      socket.off('guess_result')
      socket.off('second_chance_started')
      socket.off('round_ended')
      socket.off('game_over')
      socket.off('gauntlet_started')
      socket.off('gauntlet_voting_open')
      socket.off('gauntlet_vote_update')
      socket.off('gauntlet_result')
      socket.off('gauntlet_next_monster')
      socket.off('gauntlet_retry')
      socket.off('gauntlet_finished')
    }
  }, [])

  const handleCreateRoom = (playerName) => {
    setErrorMsg('')
    socket.emit('create_room', { playerName })
  }

  const handleJoinRoom = (roomCode, playerName) => {
    setErrorMsg('')
    socket.emit('join_room', { roomCode, playerName })
  }

  const handleSetVoiceChat = (enabled) => {
    setVoiceChat(enabled)
    socket.emit('set_voice_mode', { voiceChat: enabled })
  }

  const handleSetMode = (mode, pigId) => {
    setGameMode(mode)
    setSelectedPigId(pigId)
    socket.emit('set_mode', { mode, pigId })
  }

  const handleStartGame = (mode, pigId) => {
    socket.emit('start_game', { mode, pigId })
  }

  const handleSelectAvatar = (avatarId) => {
    socket.emit('select_avatar', { avatarId })
  }

  const handleSendChat = (text) => {
    socket.emit('chat_message', { text })
  }

  const handleSendEmote = (emoteId) => {
    socket.emit('emote', { emoteId })
  }

  const handleStartNextRound = () => {
    setRoundResults(null)
    socket.emit('start_next_round')
  }

  let content = null
  if (view === 'sandbox') {
    content = <Sandbox onClose={() => setView('lobby')} />
  } else if (view === 'dev-emotes') {
    content = <EmotePreview onClose={() => setView('lobby')} />
  } else if (view === 'lobby') {
    content = (
      <Lobby
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        errorMsg={errorMsg}
        onDevEmotes={() => setView('dev-emotes')}
        onSandbox={() => setView('sandbox')}
      />
    )
  } else if (view === 'waiting') {
    content = (
      <WaitingRoom
        roomCode={roomCode}
        players={players}
        myPlayer={myPlayer}
        isHost={isHost}
        gameMode={gameMode}
        selectedPigId={selectedPigId}
        onSetMode={handleSetMode}
        onStartGame={handleStartGame}
        onSelectAvatar={handleSelectAvatar}
        errorMsg={errorMsg}
        voiceChat={voiceChat}
        onSetVoiceChat={handleSetVoiceChat}
      />
    )
  } else if (view === 'game') {
    if (gameMode === 'gauntlet' && gauntletState) {
      content = (
        <GauntletGame
          myPlayer={myPlayer}
          players={players}
          gauntletState={gauntletState}
          myMonster={myMonster}
          quoteFlipKey={quoteFlipKey}
          socket={socket}
          chatMessages={chatMessages}
          onSendChat={handleSendChat}
          activeEmotes={activeEmotes}
          onSendEmote={handleSendEmote}
        />
      )
    } else {
      content = (
        <GameView
          myPlayer={myPlayer}
          players={players}
          roundState={roundState}
          myMonster={myMonster}
          guessResult={guessResult}
          roundResults={roundResults}
          scores={scores}
          isHost={isHost}
          isMidgameWatcher={isMidgameWatcher}
          onStartNextRound={handleStartNextRound}
          socket={socket}
          flippedPositions={flippedPositions}
          quoteFlipKey={quoteFlipKey}
          cardRevealActive={cardRevealActive}
          chatMessages={chatMessages}
          onSendChat={handleSendChat}
          activeEmotes={activeEmotes}
          onSendEmote={handleSendEmote}
        />
      )
    }
  } else if (view === 'game_over') {
    content = <GameOver finalResult={finalResult} />
  }

  return (
    <>
      {content}
      <div className="audio-controls">
        {voiceChat && <VoicePanel isMuted={voiceMuted} />}
        <button
          className={`audio-btn${musicMuted ? ' audio-btn-muted' : ''}`}
          onClick={toggleMusic}
          title={musicMuted ? 'Unmute music' : 'Mute music'}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M9 3v12.5a3.5 3.5 0 1 1-2-3.17V7l8-2v6.5a3.5 3.5 0 1 1-2-3.17V3L9 3z"/>
            {musicMuted && <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>}
          </svg>
        </button>
        <button
          className={`audio-btn${sfxMuted ? ' audio-btn-muted' : ''}`}
          onClick={toggleSfx}
          title={sfxMuted ? 'Unmute sounds' : 'Mute sounds'}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            {sfxMuted ? (
              <>
                <path d="M13 3L7 8H3v8h4l6 5V3z" opacity="0.5"/>
                <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </>
            ) : (
              <>
                <path d="M13 3L7 8H3v8h4l6 5V3z"/>
                <path d="M17.5 7.5a7 7 0 0 1 0 9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M20 5a11 11 0 0 1 0 14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </>
            )}
          </svg>
        </button>
      </div>
    </>
  )
}
