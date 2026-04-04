import { MONSTERS } from '../data/monsters'
import { AVATARS } from '../data/avatars'

export default function RoundResults({ reveals, scores, isHost, onStartNextRound }) {
  const sortedScores = [...scores].sort((a, b) => b.score - a.score)

  // Build playerId → avatarId lookup from the scores array
  const avatarById = {}
  scores.forEach(s => { avatarById[s.id] = s.avatarId })

  return (
    <div className="overlay-backdrop">
      <div className="overlay-card round-results-card">
        <h2 className="overlay-title">Round Over!</h2>
        <p className="overlay-subtitle">Here's who was who</p>

        <div className="reveals-grid">
          {reveals.map(reveal => (
            <div
              key={reveal.playerId}
              className={`reveal-item ${reveal.guessed ? 'reveal-guessed' : 'reveal-not-guessed'}`}
            >
              {/* Big monster card — green outline = guessed, red = missed */}
              <div className="reveal-card">
                <img
                  src={MONSTERS[reveal.monsterIndex]}
                  alt={`Monster ${reveal.monsterIndex + 1}`}
                  className="reveal-card-img"
                />
              </div>

              {/* Avatar + player name */}
              <div className="reveal-player-row">
                <img
                  src={AVATARS[avatarById[reveal.playerId] ?? 0]}
                  alt=""
                  className="reveal-player-avatar"
                />
                <span className="reveal-player-name">{reveal.playerName}</span>
              </div>

              <div className={`reveal-status ${reveal.guessed ? 'status-guessed' : 'status-missed'}`}>
                {reveal.guessed ? '✓ Guessed' : '✗ Missed'}
              </div>
            </div>
          ))}
        </div>

        <div className="results-scores">
          <h3>Current Scores</h3>
          <div className="scores-list">
            {sortedScores.map((s, idx) => (
              <div key={s.id} className="score-row">
                <img
                  src={AVATARS[s.avatarId ?? 0]}
                  alt=""
                  className="score-row-avatar"
                />
                <span className="score-rank">#{idx + 1}</span>
                <span className="score-name">{s.name}</span>
                <span className="score-points">{s.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <button className="btn btn-primary btn-large" onClick={onStartNextRound}>
            Next Round →
          </button>
        ) : (
          <div className="waiting-message">
            <p>Waiting for host to start next round...</p>
          </div>
        )}
      </div>
    </div>
  )
}
