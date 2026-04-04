import { AVATARS } from '../data/avatars'

// Varied durations + negative delays so no two avatars bob in sync
const BOB_DURATIONS = [2.1, 2.6, 1.9, 2.4, 2.8, 2.2, 2.5, 1.8, 2.7, 2.3, 2.0]
const BOB_DELAYS    = [-0.4, -1.2, -0.8, -1.7, -0.2, -1.4, -0.6, -1.9, -0.1, -1.1, -0.9]

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
              {player.avatarId !== undefined && (
                <div className="scoreboard-avatar-wrap">
                  <img
                    src={AVATARS[player.avatarId]}
                    alt=""
                    className={`scoreboard-avatar av-a${player.avatarId + 1}`}
                    style={{
                      animationName: 'avatar-bob',
                      animationDuration: `${BOB_DURATIONS[idx % BOB_DURATIONS.length]}s`,
                      animationDelay: `${BOB_DELAYS[idx % BOB_DELAYS.length]}s`,
                      animationTimingFunction: 'ease-in-out',
                    }}
                  />
                </div>
              )}
              <div className="scoreboard-nameblock">
                <span className="scoreboard-name">{player.name}</span>
                {role && (
                  <span className={`scoreboard-role scoreboard-role-${role.replace('_', '-')}`}>
                    {ROLE_LABELS[role]}
                  </span>
                )}
              </div>
              <span className="scoreboard-score">{player.score}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
