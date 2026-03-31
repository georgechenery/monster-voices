export default function Scoreboard({ scores }) {
  if (!scores || scores.length === 0) return null

  const sorted = [...scores].sort((a, b) => b.score - a.score)

  return (
    <div className="scoreboard">
      <h3 className="scoreboard-title">Scores</h3>
      <ul className="scoreboard-list">
        {sorted.map((player, idx) => (
          <li key={player.id} className={`scoreboard-item ${idx === 0 ? 'scoreboard-leader' : ''}`}>
            <span className="scoreboard-rank">#{idx + 1}</span>
            <span className="scoreboard-name">{player.name}</span>
            <span className="scoreboard-score">{player.score}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
