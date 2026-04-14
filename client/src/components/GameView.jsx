import { useState, useEffect } from 'react'
import socket from '../socket'
import MonsterSpotterView from './MonsterSpotterView'
import SpeakerView from './SpeakerView'
import WaitingPlayerView from './WaitingPlayerView'
import RoundResults from './RoundResults'
import DevNumberCardFan from './DevNumberCardFan'
import QuoteCard from './QuoteCard'

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
}) {
  // Sequential wager announcement state
  const [announcementIdx, setAnnouncementIdx] = useState(-1)

  // Start cycling through wager outcomes after the drumroll (900ms), one per 1100ms
  useEffect(() => {
    if (!guessResult?.wagerOutcomes?.length) {
      setAnnouncementIdx(-1)
      return
    }
    const t = setTimeout(() => setAnnouncementIdx(0), 1800)
    return () => clearTimeout(t)
  }, [guessResult])

  useEffect(() => {
    if (announcementIdx < 0) return
    const outcomes = guessResult?.wagerOutcomes ?? []
    if (announcementIdx >= outcomes.length) {
      setAnnouncementIdx(-1)
      return
    }
    const t = setTimeout(() => setAnnouncementIdx(i => i + 1), 1100)
    return () => clearTimeout(t)
  }, [announcementIdx, guessResult])

  if (!myPlayer || !roundState.spotterId) return (
    <div className="loading-screen">
      <div className="loading-spinner">👾</div>
      <p>Loading game...</p>
    </div>
  )

  const isSpotter   = !isMidgameWatcher && myPlayer.id === roundState.spotterId
  const isSpeaker   = !isMidgameWatcher && myPlayer.id === roundState.currentSpeakerId
  const spotterName = isSpotter ? 'you' : (players.find(p => p.id === roundState.spotterId)?.name ?? '…')

  const currentAnnouncement = announcementIdx >= 0 ? guessResult?.wagerOutcomes?.[announcementIdx] : null

  return (
    <div className="game-container">
      {currentAnnouncement && (
        <div className={`wager-announcement wager-announcement-${currentAnnouncement.delta > 0 ? 'win' : 'lose'}`}>
          <span className="wager-announcement-name">{currentAnnouncement.playerName}</span>
          {currentAnnouncement.delta > 0 ? ' wagered correctly' : ' wagered incorrectly'}
          <span className="wager-announcement-delta">
            {currentAnnouncement.delta > 0 ? ' +1 point' : ' −1 point'}
          </span>
        </div>
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
