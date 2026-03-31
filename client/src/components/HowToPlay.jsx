import { useState, useRef } from 'react'
import { MONSTERS } from '../data/monsters'

const STEPS = [
  {
    key: 'setup',
    title: 'Meet the Monsters',
    body: 'Nine monsters are laid out for everyone to see. Each player is secretly assigned one as their identity — except the Monster Spotter, who has to figure out who\'s who.',
  },
  {
    key: 'speak',
    title: 'Speak Up!',
    body: 'When it\'s your turn, read the Words of Wisdom card out loud — in the voice you think your monster would have.',
    hint: 'Stuck? Think about what sets your monster apart from the others — is it big, small, fast, slow, blubbery? Let that shine through!',
  },
  {
    key: 'guess',
    title: 'Make the Call',
    body: 'After each speaker finishes, the Monster Spotter taps the monster they think that player is. Listen carefully — every voice is a clue!',
  },
  {
    key: 'score',
    title: 'How Points Work',
    body: 'Correct first guess? Points for the Spotter and the speaker! Wrong guess? The speaker gets one last chance — worth fewer points. Most points wins the title of Mega Monster!',
  },
  {
    key: 'flow',
    title: 'Round by Round',
    body: 'Every player takes a turn as the Monster Spotter — one round each. At the start of every round, nine brand new monsters are dealt out and everyone gets a fresh secret identity. Most points across all rounds wins!',
  },
]

function GridIllustration({ highlight }) {
  return (
    <div className="htp-grid-mini">
      {MONSTERS.map((src, i) => (
        <div
          key={i}
          className={[
            'htp-mini-card',
            highlight === i ? 'htp-mini-card-highlight' : '',
          ].filter(Boolean).join(' ')}
        >
          <img src={src} alt="" />
        </div>
      ))}
    </div>
  )
}

function SpeakIllustration({ hint }) {
  return (
    <div className="htp-speak-scene">
      <div className="htp-bubble-wrap">
        <div className="htp-speech-bubble">{hint}</div>
      </div>
      <img src={MONSTERS[3]} className="htp-speaker-monster" alt="" />
    </div>
  )
}

function ScoreIllustration() {
  return (
    <div className="htp-score-row">
      <div className="htp-score-item">
        <div className="htp-token htp-token-large">2</div>
        <span className="htp-token-label">First guess!</span>
        <span className="htp-token-sub">Points for both players</span>
      </div>
      <div className="htp-score-divider">or</div>
      <div className="htp-score-item">
        <div className="htp-token htp-token-small">1</div>
        <span className="htp-token-label">Second chance</span>
        <span className="htp-token-sub">One more try, fewer points</span>
      </div>
    </div>
  )
}

function FlowIllustration() {
  const spotterIndex = [0, 2, 5, 7]
  return (
    <div className="htp-flow-scene">
      {spotterIndex.map((monsterIdx, i) => (
        <div key={i} className="htp-flow-round">
          <div className="htp-flow-round-label">Round {i + 1}</div>
          <div className="htp-flow-spotter-wrap">
            <img src={MONSTERS[monsterIdx]} className="htp-flow-spotter-img" alt="" />
            <div className="htp-flow-badge">Spotter</div>
          </div>
          {i < spotterIndex.length - 1 && <div className="htp-flow-arrow">→</div>}
        </div>
      ))}
    </div>
  )
}

export default function HowToPlay({ onClose }) {
  const [step, setStep] = useState(0)
  const touchStartX = useRef(null)

  const goNext = () => { if (step < STEPS.length - 1) setStep(s => s + 1) }
  const goPrev = () => { if (step > 0) setStep(s => s - 1) }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -50) goNext()
    else if (dx > 50) goPrev()
    touchStartX.current = null
  }

  const current = STEPS[step]

  return (
    <div className="htp-overlay" onClick={onClose}>
      <div
        className="htp-card"
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="htp-step-counter">
          {step + 1} / {STEPS.length}
        </div>
        <button className="htp-close" onClick={onClose}>✕</button>

        {/* Illustration */}
        <div className="htp-illustration">
          {current.key === 'setup' && <GridIllustration />}
          {current.key === 'speak' && <SpeakIllustration hint={current.hint} />}
          {current.key === 'guess' && <GridIllustration highlight={4} />}
          {current.key === 'score' && <ScoreIllustration />}
          {current.key === 'flow' && <FlowIllustration />}
        </div>

        {/* Text — key forces fade-in animation on step change */}
        <div className="htp-text" key={step}>
          <h2 className="htp-title">{current.title}</h2>
          <p className="htp-body">{current.body}</p>
        </div>

        {/* Navigation */}
        <div className="htp-nav">
          <button
            className="htp-nav-btn"
            onClick={goPrev}
            disabled={step === 0}
            aria-label="Previous"
          >←</button>

          <div className="htp-dots">
            {STEPS.map((_, i) => (
              <button
                key={i}
                className={`htp-dot ${i === step ? 'htp-dot-active' : ''}`}
                onClick={() => setStep(i)}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>

          {step < STEPS.length - 1 ? (
            <button className="htp-nav-btn" onClick={goNext} aria-label="Next">→</button>
          ) : (
            <button className="htp-nav-btn htp-nav-done" onClick={onClose}>Got it!</button>
          )}
        </div>
      </div>
    </div>
  )
}
