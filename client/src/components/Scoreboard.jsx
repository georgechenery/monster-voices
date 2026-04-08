import { useState, useEffect, useRef } from 'react'
import { AVATARS } from '../data/avatars'
import { EMOTES } from '../data/emotes'
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

  const listRef      = useRef(null)  // the <ul> scroll container
  const floatTimer   = useRef(null)
  const [floatingEmote, setFloatingEmote] = useState(null)
  // floatingEmote: { player, emote, ts, fromAbove, anchorX, anchorY }

  // Synchronous visibility + direction check at the moment an emote fires.
  // getBoundingClientRect() is cheap when called on demand (not in a scroll loop).
  useEffect(() => {
    const emotingIds = Object.keys(activeEmotes)
    if (!emotingIds.length) return

    const list = listRef.current
    if (!list) return

    for (const playerId of emotingIds) {
      const item = list.querySelector(`[data-player-id="${playerId}"]`)
      if (!item) continue

      const listRect = list.getBoundingClientRect()
      const itemRect = item.getBoundingClientRect()

      // Show popup only if >75% of the row is outside the scroll container
      const visibleHeight = Math.max(0,
        Math.min(itemRect.bottom, listRect.bottom) - Math.max(itemRect.top, listRect.top)
      )
      const fractionVisible = itemRect.height > 0 ? visibleHeight / itemRect.height : 0
      if (fractionVisible >= 0.25) continue

      const player = scores.find(p => p.id === playerId)
      const emote  = EMOTES.find(e => e.id === activeEmotes[playerId]?.emoteId)
      if (!player || !emote) continue

      const fromAbove = itemRect.bottom <= listRect.top

      // Anchor popup to the correct edge of the list, centred horizontally
      const anchorX = listRect.left + listRect.width / 2
      const anchorY = fromAbove ? listRect.top : listRect.bottom

      clearTimeout(floatTimer.current)
      setFloatingEmote({ player, emote, ts: Date.now(), fromAbove, anchorX, anchorY })
      floatTimer.current = setTimeout(() => setFloatingEmote(null), 2500)
      break
    }
  }, [activeEmotes]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimeout(floatTimer.current), [])

  return (
    <div className="scoreboard" ref={listRef}>
      <h3 className="scoreboard-title">Scores</h3>
      <ul className="scoreboard-list">
        {sorted.map((player, idx) => {
          const role       = getRole(player.id, roundState)
          const emoteEntry = activeEmotes[player.id]
          const emoteId    = emoteEntry?.emoteId ?? null
          const fireKey    = emoteEntry?.fireKey  ?? null
          const emote      = emoteId ? EMOTES.find(e => e.id === emoteId) : null

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
                <div
                  key={`wrap-${player.id}-${fireKey ?? 'idle'}`}
                  className={['scoreboard-avatar-wrap', emote ? 'emote-active' : ''].filter(Boolean).join(' ')}
                >
                  {player.avatarId === 8 ? (
                    <AvatarA9
                      emoteId={emoteId}
                      className={`scoreboard-avatar av-a9`}
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
                      emoteId={emoteId}
                      className={`scoreboard-avatar av-a4`}
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
                      emoteId={emoteId}
                      className={`scoreboard-avatar av-a1`}
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
                      emoteId={emoteId}
                      className={`scoreboard-avatar av-a2`}
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
                      emoteId={emoteId}
                      className={`scoreboard-avatar av-a3`}
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
                      emoteId={emoteId}
                      className={`scoreboard-avatar av-a5`}
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
                      emoteId={emoteId}
                      className={`scoreboard-avatar av-a6`}
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
                      emoteId={emoteId}
                      className={`scoreboard-avatar av-a8`}
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
                      emoteId={emoteId}
                      className={`scoreboard-avatar av-a10`}
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
                      emoteId={emoteId}
                      className={`scoreboard-avatar av-a11`}
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
                  {emote && (
                    <span key={`${player.id}-${fireKey}`} className="emote-bubble">
                      {emote.emoji}
                    </span>
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

      {floatingEmote && (
        <div
          key={`float-${floatingEmote.player.id}-${floatingEmote.ts}`}
          className={`scoreboard-float-popup ${floatingEmote.fromAbove ? 'popup-from-above' : 'popup-from-below'}`}
          style={{
            position: 'fixed',
            left: floatingEmote.anchorX,
            // pin to whichever edge the player scrolled past
            ...(floatingEmote.fromAbove
              ? { top:    floatingEmote.anchorY }
              : { bottom: window.innerHeight - floatingEmote.anchorY + 21 }),
          }}
        >
          <div className="scoreboard-avatar-wrap emote-active">
            <img
              src={AVATARS[floatingEmote.player.avatarId]}
              alt=""
              className={`scoreboard-avatar av-a${floatingEmote.player.avatarId + 1}`}
            />
            <span className="emote-bubble">{floatingEmote.emote.emoji}</span>
          </div>
          <span className="scoreboard-float-name">{floatingEmote.player.name}</span>
        </div>
      )}
    </div>
  )
}
