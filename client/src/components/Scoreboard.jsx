function getRole(playerId, roundState) {
  if (!roundState) return null
  const {
    spotterId, currentSpeakerId, speakingOrder,
    waitingForGuess, speakerIsRecording, speakerStatuses = {}, phase
  } = roundState

  // Spotter
  if (playerId === spotterId) {
    return waitingForGuess ? 'guessing' : 'waiting'
  }

  // Current speaker — current-turn state overrides any historical status
  if (playerId === currentSpeakerId) {
    if (waitingForGuess) return 'being_guessed'
    if (speakerIsRecording) return 'speaking'
    return 'thinking'
  }

  // Historical outcome for speakers who've already gone
  if (speakerStatuses[playerId]) return speakerStatuses[playerId]

  // Upcoming speakers
  if (phase === 'speaking' && speakingOrder) {
    const currentIdx = speakingOrder.indexOf(currentSpeakerId)
    const playerIdx = speakingOrder.indexOf(playerId)
    if (playerIdx === -1) return null
    if (playerIdx === currentIdx + 1) return 'next'
  }

  return null
}

const ROLE_LABELS = {
  waiting:      'Waiting',
  guessing:     'Guessing',
  thinking:     'Thinking',
  speaking:     'Speaking',
  being_guessed:'Being Guessed',
  next:         'Next',
  guessed:      'Guessed \u2713',
  encore:       'Encore',
  not_guessed:  'Not Guessed \u2717',
}

export default function Scoreboard({ scores, roundState }) {
  if (!scores || scores.length === 0) return null

  const sorted = [...scores].sort((a, b) => b.score - a.score)

  return (
    <div className="scoreboard">
      <h3 className="scoreboard-title">Scores</h3>
      <ul className="scoreboard-list">
        {sorted.map((player, idx) => {
          const role = getRole(player.id, roundState)
          return (
            <li
              key={player.id}
              className={[
                'scoreboard-item',
                idx === 0 ? 'scoreboard-leader' : '',
                role === 'speaking' || role === 'thinking' || role === 'being_guessed' ? 'scoreboard-item-speaking' : '',
                role === 'guessed' || role === 'not_guessed' || role === 'encore' ? 'scoreboard-item-done' : '',
              ].filter(Boolean).join(' ')}
            >
              <span className="scoreboard-rank">#{idx + 1}</span>
              <span className="scoreboard-name">{player.name}</span>
              {role && (
                <span className={`scoreboard-role scoreboard-role-${role.replace('_', '-')}`}>
                  {ROLE_LABELS[role]}
                </span>
              )}
              <span className="scoreboard-score">{player.score}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
