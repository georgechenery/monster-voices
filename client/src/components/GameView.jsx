import socket from '../socket'
import MonsterSpotterView from './MonsterSpotterView'
import SpeakerView from './SpeakerView'
import WaitingPlayerView from './WaitingPlayerView'
import RoundResults from './RoundResults'
import ChatPanel from './ChatPanel'
import VoicePanel from './VoicePanel'
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
  isMidgameWatcher = false,
  onStartNextRound,
  flippedPositions = [],
  quoteFlipKey = 0,
  cardRevealActive = false,
  chatMessages = [],
  onSendChat,
  activeEmotes = {},
  onSendEmote,
  voiceChat = false,
  voiceMuted = false,
}) {
  if (!myPlayer || !roundState.spotterId) return (
    <div className="loading-screen">
      <div className="loading-spinner">👾</div>
      <p>Loading game...</p>
    </div>
  )

  const isSpotter = !isMidgameWatcher && myPlayer.id === roundState.spotterId
  const isSpeaker = !isMidgameWatcher && myPlayer.id === roundState.currentSpeakerId

  // Only mute the speaker's mic when they're actually recording, not their whole turn
  const myVoiceMuted = voiceMuted || (isSpeaker && roundState.speakerIsRecording)

  return (
    <div className="game-container">
      <div className="lobby-bg lobby-bg-game" style={{ backgroundImage: `url(${monsterBanner})` }} />
      {voiceChat && (
        <VoicePanel isMuted={myVoiceMuted} />
      )}
      {roundResults && (
        <RoundResults
          reveals={roundResults.reveals}
          scores={roundResults.scores}
          isHost={isHost}
          onStartNextRound={onStartNextRound}
        />
      )}

      <div className="game-chat-layout">
        <ChatPanel
          messages={chatMessages}
          onSend={onSendChat}
          myPlayer={myPlayer}
          onSendEmote={onSendEmote}
        />

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
              activeEmotes={activeEmotes}
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
              activeEmotes={activeEmotes}
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
              activeEmotes={activeEmotes}
              isMidgameWatcher={isMidgameWatcher}
            />
          )}
        </div>
      </div>
    </div>
  )
}
