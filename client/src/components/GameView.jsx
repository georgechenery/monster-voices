import socket from '../socket'
import MonsterSpotterView from './MonsterSpotterView'
import SpeakerView from './SpeakerView'
import WaitingPlayerView from './WaitingPlayerView'
import RoundResults from './RoundResults'
import DevNumberCardFan from './DevNumberCardFan'
import QuoteCard from './QuoteCard'
import VoicePanel from './VoicePanel'

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

  const isSpotter   = !isMidgameWatcher && myPlayer.id === roundState.spotterId
  const isSpeaker   = !isMidgameWatcher && myPlayer.id === roundState.currentSpeakerId
  const spotterName = isSpotter ? 'you' : (players.find(p => p.id === roundState.spotterId)?.name ?? '…')

  // Only mute the speaker's mic when they're actually recording, not their whole turn
  const myVoiceMuted = voiceMuted || (isSpeaker && roundState.speakerIsRecording)

  return (
    <div className="game-container">
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
        <div className="game-left-col">
          <div className={isSpotter ? 'quote-card-amber-wrap' : ''}>
            <QuoteCard quote={roundState.quote} flipKey={quoteFlipKey} />
          </div>
          <div className="game-left-fan-wrap">
            <DevNumberCardFan
              players={players}
              spotterId={roundState.spotterId}
              speakingOrder={roundState.speakingOrder}
              speakerStatuses={roundState.speakerStatuses}
              currentSpeakerId={roundState.currentSpeakerId}
              myPlayerId={myPlayer.id}
              phase={roundState.phase}
              roundNumber={roundState.roundNumber ?? 1}
              totalRounds={roundState.totalRounds ?? 1}
              activeEmotes={activeEmotes}
            />
          </div>
        </div>

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
              chatMessages={chatMessages}
              onSendChat={onSendChat}
              onSendEmote={onSendEmote}
              myPlayer={myPlayer}
            />
          )}

          {!isSpotter && isSpeaker && (
            <SpeakerView
              roundState={roundState}
              myMonster={myMonster}
              guessResult={guessResult}
              scores={scores}
              players={players}
              socket={socket}
              flippedPositions={flippedPositions}
              quoteFlipKey={quoteFlipKey}
              cardRevealActive={cardRevealActive}
              activeEmotes={activeEmotes}
              chatMessages={chatMessages}
              onSendChat={onSendChat}
              onSendEmote={onSendEmote}
              myPlayer={myPlayer}
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
              myPlayerId={myPlayer.id}
              chatMessages={chatMessages}
              onSendChat={onSendChat}
              onSendEmote={onSendEmote}
              myPlayer={myPlayer}
            />
          )}
        </div>
      </div>
    </div>
  )
}
