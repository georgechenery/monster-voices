import monsterBanner from '../assets/brand/monster-banner.jpg'
import PigView from './PigView'
import GauntletSpotterView from './GauntletSpotterView'

export default function GauntletGame({ myPlayer, players, gauntletState, myMonster, quoteFlipKey, socket }) {
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
  )
}
