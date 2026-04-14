import { useRef } from 'react'
import { AVATARS } from '../data/avatars'
import AvatarA9 from './AvatarA9'
import AvatarA4 from './AvatarA4'
import AvatarA1 from './AvatarA1'
import AvatarA2 from './AvatarA2'
import AvatarA3 from './AvatarA3'
import AvatarA5 from './AvatarA5'
import AvatarA6 from './AvatarA6'
import AvatarA8 from './AvatarA8'
import AvatarA10 from './AvatarA10'
import AvatarA11 from './AvatarA11'

// Varied durations + negative delays so no two avatars bob in sync
const BOB_DURATIONS = [2.1, 2.6, 1.9, 2.4, 2.8, 2.2, 2.5, 1.8, 2.7, 2.3, 2.0]
const BOB_DELAYS    = [-0.4, -1.2, -0.8, -1.7, -0.2, -1.4, -0.6, -1.9, -0.1, -1.1, -0.9]

function getRole(playerId, roundState) {
  if (!roundState) return null
  const {
    spotterId, currentSpeakerId, speakingOrder,
    waitingForGuess, speakerIsRecording, speakerStatuses = {}, phase
  } = roundState

  if (playerId === spotterId) {
    return waitingForGuess ? 'guessing' : 'waiting'
  }
  if (playerId === currentSpeakerId) {
    if (waitingForGuess) return 'being_guessed'
    if (speakerIsRecording) return 'speaking'
    return 'thinking'
  }
  if (speakerStatuses[playerId]) return speakerStatuses[playerId]
  if (phase === 'speaking' && speakingOrder) {
    const currentIdx = speakingOrder.indexOf(currentSpeakerId)
    const playerIdx  = speakingOrder.indexOf(playerId)
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

export default function Scoreboard({ scores, roundState, activeEmotes = {} }) {
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
              data-player-id={player.id}
              className={[
                'scoreboard-item',
                idx === 0 ? 'scoreboard-leader' : '',
                role === 'speaking' || role === 'thinking' || role === 'being_guessed' ? 'scoreboard-item-speaking' : '',
                role === 'guessed'  || role === 'not_guessed' || role === 'encore'     ? 'scoreboard-item-done'     : '',
              ].filter(Boolean).join(' ')}
            >
              <span className="scoreboard-rank">#{idx + 1}</span>
              {player.avatarId !== undefined && (
                <div className="scoreboard-avatar-wrap">
                  {player.avatarId === 8 ? (
                    <AvatarA9
                      className="scoreboard-avatar av-a9"
                      style={{
                        animationName: 'avatar-bob',
                        animationDuration: `${BOB_DURATIONS[idx % BOB_DURATIONS.length]}s`,
                        animationDelay: `${BOB_DELAYS[idx % BOB_DELAYS.length]}s`,
                        animationTimingFunction: 'ease-in-out',
                        animationIterationCount: 'infinite',
                        animationDirection: 'alternate',
                      }}
                    />
                  ) : player.avatarId === 3 ? (
                    <AvatarA4
                      className="scoreboard-avatar av-a4"
                      style={{
                        animationName: 'avatar-bob',
                        animationDuration: `${BOB_DURATIONS[idx % BOB_DURATIONS.length]}s`,
                        animationDelay: `${BOB_DELAYS[idx % BOB_DELAYS.length]}s`,
                        animationTimingFunction: 'ease-in-out',
                        animationIterationCount: 'infinite',
                        animationDirection: 'alternate',
                      }}
                    />
                  ) : player.avatarId === 0 ? (
                    <AvatarA1
                      className="scoreboard-avatar av-a1"
                      style={{
                        animationName: 'avatar-bob',
                        animationDuration: `${BOB_DURATIONS[idx % BOB_DURATIONS.length]}s`,
                        animationDelay: `${BOB_DELAYS[idx % BOB_DELAYS.length]}s`,
                        animationTimingFunction: 'ease-in-out',
                        animationIterationCount: 'infinite',
                        animationDirection: 'alternate',
                      }}
                    />
                  ) : player.avatarId === 1 ? (
                    <AvatarA2
                      className="scoreboard-avatar av-a2"
                      style={{
                        animationName: 'avatar-bob',
                        animationDuration: `${BOB_DURATIONS[idx % BOB_DURATIONS.length]}s`,
                        animationDelay: `${BOB_DELAYS[idx % BOB_DELAYS.length]}s`,
                        animationTimingFunction: 'ease-in-out',
                        animationIterationCount: 'infinite',
                        animationDirection: 'alternate',
                      }}
                    />
                  ) : player.avatarId === 2 ? (
                    <AvatarA3
                      className="scoreboard-avatar av-a3"
                      style={{
                        animationName: 'avatar-bob',
                        animationDuration: `${BOB_DURATIONS[idx % BOB_DURATIONS.length]}s`,
                        animationDelay: `${BOB_DELAYS[idx % BOB_DELAYS.length]}s`,
                        animationTimingFunction: 'ease-in-out',
                        animationIterationCount: 'infinite',
                        animationDirection: 'alternate',
                      }}
                    />
                  ) : player.avatarId === 4 ? (
                    <AvatarA5
                      className="scoreboard-avatar av-a5"
                      style={{
                        animationName: 'avatar-bob',
                        animationDuration: `${BOB_DURATIONS[idx % BOB_DURATIONS.length]}s`,
                        animationDelay: `${BOB_DELAYS[idx % BOB_DELAYS.length]}s`,
                        animationTimingFunction: 'ease-in-out',
                        animationIterationCount: 'infinite',
                        animationDirection: 'alternate',
                      }}
                    />
                  ) : player.avatarId === 5 ? (
                    <AvatarA6
                      className="scoreboard-avatar av-a6"
                      style={{
                        animationName: 'avatar-bob',
                        animationDuration: `${BOB_DURATIONS[idx % BOB_DURATIONS.length]}s`,
                        animationDelay: `${BOB_DELAYS[idx % BOB_DELAYS.length]}s`,
                        animationTimingFunction: 'ease-in-out',
                        animationIterationCount: 'infinite',
                        animationDirection: 'alternate',
                      }}
                    />
                  ) : player.avatarId === 7 ? (
                    <AvatarA8
                      className="scoreboard-avatar av-a8"
                      style={{
                        animationName: 'avatar-bob',
                        animationDuration: `${BOB_DURATIONS[idx % BOB_DURATIONS.length]}s`,
                        animationDelay: `${BOB_DELAYS[idx % BOB_DELAYS.length]}s`,
                        animationTimingFunction: 'ease-in-out',
                        animationIterationCount: 'infinite',
                        animationDirection: 'alternate',
                      }}
                    />
                  ) : player.avatarId === 9 ? (
                    <AvatarA10
                      className="scoreboard-avatar av-a10"
                      style={{
                        animationName: 'avatar-bob',
                        animationDuration: `${BOB_DURATIONS[idx % BOB_DURATIONS.length]}s`,
                        animationDelay: `${BOB_DELAYS[idx % BOB_DELAYS.length]}s`,
                        animationTimingFunction: 'ease-in-out',
                        animationIterationCount: 'infinite',
                        animationDirection: 'alternate',
                      }}
                    />
                  ) : player.avatarId === 10 ? (
                    <AvatarA11
                      className="scoreboard-avatar av-a11"
                      style={{
                        animationName: 'avatar-bob',
                        animationDuration: `${BOB_DURATIONS[idx % BOB_DURATIONS.length]}s`,
                        animationDelay: `${BOB_DELAYS[idx % BOB_DELAYS.length]}s`,
                        animationTimingFunction: 'ease-in-out',
                        animationIterationCount: 'infinite',
                        animationDirection: 'alternate',
                      }}
                    />
                  ) : (
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
                  )}
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
