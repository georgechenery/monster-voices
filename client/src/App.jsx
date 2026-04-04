import { useState, useEffect } from 'react'
import socket from './socket'
import Lobby from './components/Lobby'
import WaitingRoom from './components/WaitingRoom'
import GameView from './components/GameView'
import GauntletGame from './components/GauntletGame'
import GameOver from './components/GameOver'
import { MONSTERS } from './data/monsters'
import cardBack from './assets/monsters/card-back.png'

function preloadImages(srcs) {
  srcs.forEach(src => { const img = new Image(); img.src = src })
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
    speakerStatuses: {}
  })
  const [guessResult, setGuessResult] = useState(null)
  const [roundResults, setRoundResults] = useState(null)
  const [finalResult, setFinalResult] = useState(null)
  const [scores, setScores] = useState([])
  const [flippedPositions, setFlippedPositions] = useState([])
  const [quoteFlipKey, setQuoteFlipKey] = useState(0)
  const [cardRevealActive, setCardRevealActive] = useState(false)

  // Gauntlet state
  const [gauntletState, setGauntletState] = useState(null)

  // Chat
  const [chatMessages, setChatMessages] = useState([])

  // Preload card-back once on mount (always used)
  useEffect(() => {
    preloadImages([cardBack])
  }, [])

  useEffect(() => {
    socket.on('room_created', ({ roomCode: code, player, players: ps }) => {
      setRoomCode(code)
      setMyPlayer(player)
      setPlayers(ps)
      setIsHost(true)
      setView('waiting')
      setErrorMsg('')
      setGameMode('classic')
      setSelectedPigId(player.id) // default PIG = host
    })

    socket.on('room_joined', ({ roomCode: code, player, players: ps, mode, pendingPigId }) => {
      setRoomCode(code)
      setMyPlayer(player)
      setPlayers(ps)
      setIsHost(false)
      setView('waiting')
      setErrorMsg('')
      setGameMode(mode || 'classic')
      setSelectedPigId(pendingPigId || null)
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
    socket.on('chat_message', (msg) => {
      setChatMessages(prev => [...prev, msg])
    })

    socket.on('game_started', ({ spotterId, shuffledMonsters, quote, speakingOrder, players: ps }) => {
      preloadImages(shuffledMonsters.map(i => MONSTERS[i]))
      setChatMessages([])
      setGameMode('classic')
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
        speakerStatuses: {}
      })
      setView('game')
    })

    socket.on('your_monster', ({ position, monsterIndex }) => {
      setMyMonster({ position, monsterIndex })
    })

    socket.on('your_turn', ({ quote }) => {
      setRoundState(prev => ({
        ...prev,
        quote,
        currentSpeakerId: socket.id,
        waitingForGuess: false
      }))
    })

    socket.on('speaker_changed', ({ currentSpeakerId, speakerName }) => {
      setRoundState(prev => ({
        ...prev,
        currentSpeakerId,
        speakerName,
        waitingForGuess: false,
        speakerIsRecording: false
      }))
      setGuessResult(null)
    })

    socket.on('speaker_recording', () => {
      setRoundState(prev => ({ ...prev, speakerIsRecording: true }))
    })

    socket.on('waiting_for_guess', () => {
      setRoundState(prev => ({ ...prev, waitingForGuess: true, speakerIsRecording: false }))
    })

    socket.on('guess_result', ({ correct, speakerId, speakerName, position, monsterIndex, guessedPosition, points, scores: newScores, isSecondChance }) => {
      setGuessResult({ correct, speakerId, speakerName, position, monsterIndex, guessedPosition, points, isSecondChance })
      setScores(newScores)
      setRoundState(prev => {
        const status = correct ? 'guessed' : isSecondChance ? 'not_guessed' : 'encore'
        return { ...prev, speakerStatuses: { ...prev.speakerStatuses, [speakerId]: status } }
      })
      if (correct || isSecondChance) {
        setTimeout(() => {
          setFlippedPositions(prev => prev.includes(position) ? prev : [...prev, position])
        }, 800)
      }
    })

    socket.on('second_chance_started', ({ quote, secondChancePlayers }) => {
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
      socket.off('chat_message')
      socket.off('room_created')
      socket.off('room_joined')
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

  const handleStartNextRound = () => {
    setRoundResults(null)
    socket.emit('start_next_round')
  }

  if (view === 'lobby') {
    return (
      <Lobby
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        errorMsg={errorMsg}
      />
    )
  }

  if (view === 'waiting') {
    return (
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
      />
    )
  }

  if (view === 'game') {
    if (gameMode === 'gauntlet' && gauntletState) {
      return (
        <GauntletGame
          myPlayer={myPlayer}
          players={players}
          gauntletState={gauntletState}
          myMonster={myMonster}
          quoteFlipKey={quoteFlipKey}
          socket={socket}
          chatMessages={chatMessages}
          onSendChat={handleSendChat}
        />
      )
    }

    return (
      <GameView
        myPlayer={myPlayer}
        players={players}
        roundState={roundState}
        myMonster={myMonster}
        guessResult={guessResult}
        roundResults={roundResults}
        scores={scores}
        isHost={isHost}
        onStartNextRound={handleStartNextRound}
        socket={socket}
        flippedPositions={flippedPositions}
        quoteFlipKey={quoteFlipKey}
        cardRevealActive={cardRevealActive}
        chatMessages={chatMessages}
        onSendChat={handleSendChat}
      />
    )
  }

  if (view === 'game_over') {
    return <GameOver finalResult={finalResult} />
  }

  return null
}
