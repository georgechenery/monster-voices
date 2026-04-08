import { useState, useEffect } from 'react'
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

// BOB_DURATIONS/DELAYS from Scoreboard so avatars behave identically
const BOB_DURATIONS = [2.1, 2.6, 1.9, 2.4, 2.8, 2.2, 2.5, 1.8, 2.7, 2.3, 2.0]
const BOB_DELAYS    = [-0.4, -1.2, -0.8, -1.7, -0.2, -1.4, -0.6, -1.9, -0.1, -1.1, -0.9]

export default function EmotePreview({ onClose }) {
  const [fire, setFire] = useState(null) // { emote, key }

  const trigger = (emote) => setFire({ emote, key: Date.now() })

  useEffect(() => {
    if (!fire) return
    const t = setTimeout(() => setFire(null), 2500)
    return () => clearTimeout(t)
  }, [fire])

  return (
    <div className="emote-preview-screen">
      <div className="emote-preview-header">
        <button className="emote-preview-back" onClick={onClose}>← Back</button>
        <h2 className="emote-preview-title">Emote Preview</h2>
        <span className="emote-preview-dev-tag">DEV</span>
      </div>

      <p className="emote-preview-hint">Click an emote to fire it on all avatars</p>

      <div className="emote-preview-buttons">
        {EMOTES.map(emote => (
          <button
            key={emote.id}
            className="emote-preview-btn"
            onClick={() => trigger(emote)}
          >
            <span className="emote-preview-emoji">{emote.emoji}</span>
            <span className="emote-preview-label">{emote.label}</span>
          </button>
        ))}
      </div>

      <div className="emote-preview-grid">
        {AVATARS.map((src, i) => (
          // Key includes fire.key so each remount restarts the CSS animation
          <div key={`${i}-${fire?.key ?? 'idle'}`} className="emote-preview-avatar-slot">
            <div className={[
              'scoreboard-avatar-wrap',
              fire ? 'emote-active' : '',
            ].filter(Boolean).join(' ')}>
              {i === 8 ? (
                <AvatarA9
                  emoteId={fire?.emote.id ?? null}
                  className={`scoreboard-avatar av-a9`}
                  style={{
                    animationName: 'avatar-bob',
                    animationDuration: `${BOB_DURATIONS[i % BOB_DURATIONS.length]}s`,
                    animationDelay: `${BOB_DELAYS[i % BOB_DELAYS.length]}s`,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationDirection: 'alternate',
                  }}
                />
              ) : i === 3 ? (
                <AvatarA4
                  emoteId={fire?.emote.id ?? null}
                  className={`scoreboard-avatar av-a4`}
                  style={{
                    animationName: 'avatar-bob',
                    animationDuration: `${BOB_DURATIONS[i % BOB_DURATIONS.length]}s`,
                    animationDelay: `${BOB_DELAYS[i % BOB_DELAYS.length]}s`,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationDirection: 'alternate',
                  }}
                />
              ) : i === 0 ? (
                <AvatarA1
                  emoteId={fire?.emote.id ?? null}
                  className={`scoreboard-avatar av-a1`}
                  style={{
                    animationName: 'avatar-bob',
                    animationDuration: `${BOB_DURATIONS[i % BOB_DURATIONS.length]}s`,
                    animationDelay: `${BOB_DELAYS[i % BOB_DELAYS.length]}s`,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationDirection: 'alternate',
                  }}
                />
              ) : i === 1 ? (
                <AvatarA2
                  emoteId={fire?.emote.id ?? null}
                  className={`scoreboard-avatar av-a2`}
                  style={{
                    animationName: 'avatar-bob',
                    animationDuration: `${BOB_DURATIONS[i % BOB_DURATIONS.length]}s`,
                    animationDelay: `${BOB_DELAYS[i % BOB_DELAYS.length]}s`,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationDirection: 'alternate',
                  }}
                />
              ) : i === 2 ? (
                <AvatarA3
                  emoteId={fire?.emote.id ?? null}
                  className={`scoreboard-avatar av-a3`}
                  style={{
                    animationName: 'avatar-bob',
                    animationDuration: `${BOB_DURATIONS[i % BOB_DURATIONS.length]}s`,
                    animationDelay: `${BOB_DELAYS[i % BOB_DELAYS.length]}s`,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationDirection: 'alternate',
                  }}
                />
              ) : i === 4 ? (
                <AvatarA5
                  emoteId={fire?.emote.id ?? null}
                  className={`scoreboard-avatar av-a5`}
                  style={{
                    animationName: 'avatar-bob',
                    animationDuration: `${BOB_DURATIONS[i % BOB_DURATIONS.length]}s`,
                    animationDelay: `${BOB_DELAYS[i % BOB_DELAYS.length]}s`,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationDirection: 'alternate',
                  }}
                />
              ) : i === 5 ? (
                <AvatarA6
                  emoteId={fire?.emote.id ?? null}
                  className={`scoreboard-avatar av-a6`}
                  style={{
                    animationName: 'avatar-bob',
                    animationDuration: `${BOB_DURATIONS[i % BOB_DURATIONS.length]}s`,
                    animationDelay: `${BOB_DELAYS[i % BOB_DELAYS.length]}s`,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationDirection: 'alternate',
                  }}
                />
              ) : i === 7 ? (
                <AvatarA8
                  emoteId={fire?.emote.id ?? null}
                  className={`scoreboard-avatar av-a8`}
                  style={{
                    animationName: 'avatar-bob',
                    animationDuration: `${BOB_DURATIONS[i % BOB_DURATIONS.length]}s`,
                    animationDelay: `${BOB_DELAYS[i % BOB_DELAYS.length]}s`,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationDirection: 'alternate',
                  }}
                />
              ) : i === 9 ? (
                <AvatarA10
                  emoteId={fire?.emote.id ?? null}
                  className={`scoreboard-avatar av-a10`}
                  style={{
                    animationName: 'avatar-bob',
                    animationDuration: `${BOB_DURATIONS[i % BOB_DURATIONS.length]}s`,
                    animationDelay: `${BOB_DELAYS[i % BOB_DELAYS.length]}s`,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationDirection: 'alternate',
                  }}
                />
              ) : i === 10 ? (
                <AvatarA11
                  emoteId={fire?.emote.id ?? null}
                  className={`scoreboard-avatar av-a11`}
                  style={{
                    animationName: 'avatar-bob',
                    animationDuration: `${BOB_DURATIONS[i % BOB_DURATIONS.length]}s`,
                    animationDelay: `${BOB_DELAYS[i % BOB_DELAYS.length]}s`,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationDirection: 'alternate',
                  }}
                />
              ) : (
                <img
                  src={src}
                  alt={`Avatar ${i + 1}`}
                  className={`scoreboard-avatar av-a${i + 1}`}
                  style={{
                    animationName: 'avatar-bob',
                    animationDuration: `${BOB_DURATIONS[i % BOB_DURATIONS.length]}s`,
                    animationDelay: `${BOB_DELAYS[i % BOB_DELAYS.length]}s`,
                    animationTimingFunction: 'ease-in-out',
                  }}
                />
              )}
              {fire && (
                <span className="emote-bubble">{fire.emote.emoji}</span>
              )}
            </div>
            <span className="emote-preview-avatar-label">A{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
