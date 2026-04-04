import socket from '../socket'
import MonsterSpotterView from './MonsterSpotterView'
import SpeakerView from './SpeakerView'
import WaitingPlayerView from './WaitingPlayerView'
import RoundResults from './RoundResults'
import ChatPanel from './ChatPanel'
import monsterBanner from '../assets/brand/monster-banner.jpg'

export default function GameView({
  myPlayer,
  players,
  roundState,
  myMonster,
  guessResult,
  roundResults,
  scores,
  isHost,
  onStartNextRound,
  flippedPositions = [],
  quoteFlipKey = 0,
  cardRevealActive = false,
  chatMessages = [],
  onSendChat,
}) {
  if (!myPlayer || !roundState.spotterId) return (
    <div className="loading-screen">
      <div className="loading-spinner">👾</div>
      <p>Loading game...</p>
    </div>
  )

  const isSpotter = myPlayer.id === roundState.spotterId
  const isSpeaker = myPlayer.id === roundState.currentSpeakerId

  return (
    <div className="game-container">
      <div className="lobby-bg lobby-bg-game" style={{ backgroundImage: `url(${monsterBanner})` }} />
      {roundResults && (
        <RoundResults
          reveals={roundResults.reveals}
          scores={roundResults.scores}
          isHost={isHost}
          onStartNextRound={onStartNextRound}
        />
      )}

      <div className="game-chat-layout">
        <ChatPanel messages={chatMessages} onSend={onSendChat} myPlayer={myPlayer} />

        <div className="game-view-wrap">
          {isSpotter && (
            <MonsterSpotterView
              roundState={roundState}
              guessResult={guessResult}
              scores={scores}
              players={players}
              socket={socket}
              flippedPositions={flippedPositions}
              quoteFlipKey={quoteFlipKey}
              cardRevealActive={cardRevealActive}
            />
          )}

          {!isSpotter && isSpeaker && (
            <SpeakerView
              roundState={roundState}
              myMonster={myMonster}
              guessResult={guessResult}
              scores={scores}
              socket={socket}
              flippedPositions={flippedPositions}
              quoteFlipKey={quoteFlipKey}
              cardRevealActive={cardRevealActive}
            />
          )}

          {!isSpotter && !isSpeaker && (
            <WaitingPlayerView
              roundState={roundState}
              myMonster={myMonster}
              guessResult={guessResult}
              scores={scores}
              players={players}
              socket={socket}
              quoteFlipKey={quoteFlipKey}
              flippedPositions={flippedPositions}
              cardRevealActive={cardRevealActive}
            />
          )}
        </div>
      </div>
    </div>
  )
}
