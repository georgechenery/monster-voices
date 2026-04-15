import monsterBanner from '../assets/brand/monster-banner.jpg'
import mvLogo from '../assets/brand/mv-logo.png'

export default function GameOver({ finalResult }) {
  if (!finalResult) return null

  if (finalResult.mode === 'gauntlet') {
    return <GauntletOver result={finalResult} />
  }

  return <ClassicOver result={finalResult} />
}

function ClassicOver({ result }) {
  const { winner, finalScores } = result

  const funMessages = [
    "The monsters have spoken!",
    "A truly monstrous performance!",
    "The creature feature champion!",
    "Supreme ruler of the monster realm!",
    "The beastly best of them all!"
  ]
  const message = funMessages[Math.floor(Math.random() * funMessages.length)]

  return (
    <div className="game-over-container">
      <div className="lobby-bg lobby-bg-game" style={{ backgroundImage: `url(${monsterBanner})` }} />
      <div className="game-over-card">
        <div className="game-over-logo-wrap">
          <img src={mvLogo} alt="Monster Voices" className="game-over-logo" />
        </div>
        <h1 className="game-over-title">Mega Monster!</h1>

        <div className="winner-display">
          <div className="winner-crown">👑</div>
          <div className="winner-name">{winner.name}</div>
          <div className="winner-score">{winner.score} points</div>
          <div className="winner-message">{message}</div>
        </div>

        <div className="final-scoreboard">
          <h3>Final Standings</h3>
          {finalScores.map((player, idx) => (
            <div
              key={player.id}
              className={`final-score-row ${idx === 0 ? 'final-score-winner' : ''}`}
            >
              <span className="final-rank">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
              </span>
              <span className="final-name">{player.name}</span>
              <span className="final-points">{player.score} pts</span>
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary btn-large"
          onClick={() => window.location.reload()}
        >
          Play Again!
        </button>
      </div>
    </div>
  )
}

function GauntletOver({ result }) {
  const { outcome, strikes, isPerfect, solvedCount, totalMonsters = 9 } = result
  const isWin = outcome === 'win'

  return (
    <div className="game-over-container">
      <div className="lobby-bg lobby-bg-game" style={{ backgroundImage: `url(${monsterBanner})` }} />
      <div className="game-over-card">
        <div className="game-over-logo-wrap">
          <img src={mvLogo} alt="Monster Voices" className="game-over-logo" />
        </div>

        {isPerfect ? (
          <>
            <h1 className="game-over-title">Perfect Gauntlet!</h1>
            <div className="gauntlet-over-message gauntlet-over-perfect">
              <div className="gauntlet-over-icon">LEGENDARY</div>
              <p>All {totalMonsters} monsters guessed with zero strikes.</p>
              <p>A performance for the ages.</p>
            </div>
          </>
        ) : isWin ? (
          <>
            <h1 className="game-over-title">Gauntlet Complete!</h1>
            <div className="gauntlet-over-message gauntlet-over-win">
              <p>All {totalMonsters} monsters guessed!</p>
            </div>
          </>
        ) : (
          <>
            <h1 className="game-over-title">Gauntlet Failed!</h1>
            <div className="gauntlet-over-message gauntlet-over-lose">
              <p>5 strikes accumulated.</p>
              <p>{solvedCount} of {totalMonsters} monsters found.</p>
            </div>
          </>
        )}

        <div className="gauntlet-over-stats">
          <div className="gauntlet-over-stat">
            <span className="gauntlet-over-stat-val">{solvedCount}/{totalMonsters}</span>
            <span className="gauntlet-over-stat-label">Monsters Found</span>
          </div>
          <div className="gauntlet-over-stat">
            <span className="gauntlet-over-stat-val">{strikes}/5</span>
            <span className="gauntlet-over-stat-label">Strikes</span>
          </div>
        </div>

        <button
          className="btn btn-primary btn-large"
          onClick={() => window.location.reload()}
        >
          Play Again!
        </button>
      </div>
    </div>
  )
}
