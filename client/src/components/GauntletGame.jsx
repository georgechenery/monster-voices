import { useState, useEffect, useRef } from 'react'
import PigView from './PigView'
import GauntletSpotterView from './GauntletSpotterView'
import QuoteCard from './QuoteCard'
import { playSound } from '../utils/sounds'

export default function GauntletGame({ myPlayer, players, gauntletState, myMonster, quoteFlipKey, socket, chatMessages = [], onSendChat, activeEmotes = {}, onSendEmote, onReplayStart, onReplayEnd }) {
  const [resultFlash, setResultFlash] = useState(null)
  const prevPhaseRef = useRef(null)

  useEffect(() => {
    const phase = gauntletState?.phase
    const lastResult = gauntletState?.lastResult

    if (phase === 'result' && prevPhaseRef.current !== 'result' && lastResult) {
      prevPhaseRef.current = 'result'
      const { correct } = lastResult
      const monstersLeft = (gauntletState.totalMonsters ?? 9) - gauntletState.solvedPositions.length
      const strikesLeft = 5 - gauntletState.strikes

      playSound(correct ? 'correct' : 'wrong')

      const message = correct
        ? `Correct Guess! ${monstersLeft} more monster${monstersLeft !== 1 ? 's' : ''} to go`
        : `Incorrect Guess! ${strikesLeft} strike${strikesLeft !== 1 ? 's' : ''} remaining`

      setResultFlash({ correct, message })
      const t = setTimeout(() => setResultFlash(null), 2800)
      return () => clearTimeout(t)
    } else {
      prevPhaseRef.current = phase
    }
  }, [gauntletState?.phase, gauntletState?.lastResult]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!myPlayer || !gauntletState) return (
    <div className="loading-screen">
      <div className="loading-spinner">👾</div>
      <p>Loading game...</p>
    </div>
  )

  const isPig = myPlayer.id === gauntletState.pigId

  return (
    <div className="game-container">
      <div className="game-chat-layout game-chat-layout-rtg">
        <div className="game-left-col">
          <div className={isPig ? 'quote-card-amber-wrap' : ''}>
            <QuoteCard quote={gauntletState.quote} flipKey={quoteFlipKey} />
          </div>
          <div className="game-left-fan-wrap gauntlet-fan-wrap">
            <GauntletSidePanel
              strikes={gauntletState.strikes}
              solvedCount={gauntletState.solvedPositions.length}
              totalMonsters={gauntletState.totalMonsters ?? 9}
            />
          </div>
        </div>

        <div className="game-view-wrap">
          {isPig ? (
            <PigView
              gauntletState={gauntletState}
              myMonster={myMonster}
              quoteFlipKey={quoteFlipKey}
              socket={socket}
              chatMessages={chatMessages}
              onSendChat={onSendChat}
              onSendEmote={onSendEmote}
              myPlayer={myPlayer}
            />
          ) : (
            <GauntletSpotterView
              gauntletState={gauntletState}
              myPlayer={myPlayer}
              players={players}
              quoteFlipKey={quoteFlipKey}
              socket={socket}
              chatMessages={chatMessages}
              onSendChat={onSendChat}
              onSendEmote={onSendEmote}
              onReplayStart={onReplayStart}
              onReplayEnd={onReplayEnd}
            />
          )}
        </div>
      </div>

      {resultFlash && (
        <div className={`gauntlet-result-overlay${resultFlash.correct ? ' gauntlet-result-correct' : ' gauntlet-result-wrong'}`}>
          <div className="gauntlet-result-text">{resultFlash.message}</div>
        </div>
      )}
    </div>
  )
}

function GauntletSidePanel({ strikes, solvedCount, totalMonsters }) {
  return (
    <div className="gauntlet-side-panel">
      <div className="gauntlet-side-section">
        <div className="gauntlet-side-label">Strikes</div>
        <div className="gauntlet-strike-bar">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={`strike-token ${i < strikes ? 'strike-token-active' : ''}`}>✕</div>
          ))}
        </div>
      </div>
      <div className="gauntlet-side-section">
        <div className="gauntlet-side-label">Monsters Found</div>
        <div className="gauntlet-progress-count">
          {solvedCount} <span>/ {totalMonsters}</span>
        </div>
      </div>
    </div>
  )
}
