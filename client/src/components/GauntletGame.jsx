import monsterBanner from '../assets/brand/monster-banner.jpg'
import PigView from './PigView'
import GauntletSpotterView from './GauntletSpotterView'
import ChatPanel from './ChatPanel'

export default function GauntletGame({ myPlayer, players, gauntletState, myMonster, quoteFlipKey, socket, chatMessages = [], onSendChat, activeEmotes = {}, onSendEmote }) {
  if (!myPlayer || !gauntletState) return (
    <div className="loading-screen">
      <div className="loading-spinner">👾</div>
      <p>Loading game...</p>
    </div>
  )

  const isPig = myPlayer.id === gauntletState.pigId

  return (
    <div className="game-container">
      <div className="lobby-bg lobby-bg-game" style={{ backgroundImage: `url(${monsterBanner})` }} />
      <div className="game-chat-layout">
        <ChatPanel messages={chatMessages} onSend={onSendChat} myPlayer={myPlayer} onSendEmote={onSendEmote} />
        <div className="game-view-wrap">
          {isPig ? (
            <PigView
              gauntletState={gauntletState}
              myMonster={myMonster}
              quoteFlipKey={quoteFlipKey}
              socket={socket}
            />
          ) : (
            <GauntletSpotterView
              gauntletState={gauntletState}
              myPlayer={myPlayer}
              players={players}
              quoteFlipKey={quoteFlipKey}
              socket={socket}
            />
          )}
        </div>
      </div>
    </div>
  )
}
