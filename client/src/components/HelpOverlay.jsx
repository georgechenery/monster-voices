import { useEffect, useState } from 'react'

const CALLOUT_H = 90   // estimated callout height in px
const MARGIN = 14      // min distance from screen edge
const GAP = 16         // gap between callout edge and target element
const ARROW_OFFSET = 16 // stop line this many px before target centre

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

function computeLayout(rect, cw) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  // Room on each side after subtracting callout size + gap
  const spaceL = rect.left - MARGIN - cw - GAP
  const spaceR = vw - rect.right - MARGIN - cw - GAP
  const spaceA = rect.top - MARGIN - CALLOUT_H - GAP
  const spaceB = vh - rect.bottom - MARGIN - CALLOUT_H - GAP

  const best = Math.max(spaceL, spaceR, spaceA, spaceB)

  let left, top

  if (best === spaceL) {
    left = rect.left - cw - GAP
    top = clamp(cy - CALLOUT_H / 2, MARGIN, vh - CALLOUT_H - MARGIN)
  } else if (best === spaceR) {
    left = rect.right + GAP
    top = clamp(cy - CALLOUT_H / 2, MARGIN, vh - CALLOUT_H - MARGIN)
  } else if (best === spaceA) {
    left = clamp(cx - cw / 2, MARGIN, vw - cw - MARGIN)
    top = rect.top - CALLOUT_H - GAP
  } else {
    left = clamp(cx - cw / 2, MARGIN, vw - cw - MARGIN)
    top = rect.bottom + GAP
  }

  // Clamp final position into viewport
  left = clamp(left, MARGIN, vw - cw - MARGIN)
  top = clamp(top, MARGIN, vh - CALLOUT_H - MARGIN)

  // Recompute lineStart from the (possibly clamped) callout position
  let lineStart
  if (best === spaceL) {
    lineStart = { x: left + cw, y: top + CALLOUT_H / 2 }
  } else if (best === spaceR) {
    lineStart = { x: left, y: top + CALLOUT_H / 2 }
  } else if (best === spaceA) {
    lineStart = { x: left + cw / 2, y: top + CALLOUT_H }
  } else {
    lineStart = { x: left + cw / 2, y: top }
  }

  // Stop arrow before target centre so head lands at element edge
  const dx = cx - lineStart.x
  const dy = cy - lineStart.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const lineEnd = dist > ARROW_OFFSET
    ? { x: cx - (dx / dist) * ARROW_OFFSET, y: cy - (dy / dist) * ARROW_OFFSET }
    : { x: cx, y: cy }

  return { left, top, width: cw, lineStart, lineEnd }
}

export default function HelpOverlay({ targets, onClose }) {
  const [callouts, setCallouts] = useState([])

  useEffect(() => {
    const cw = window.innerWidth <= 768 ? 160 : 200
    const result = targets
      .map(t => {
        if (!t.ref?.current) return null
        const rect = t.ref.current.getBoundingClientRect()
        const layout = computeLayout(rect, cw)
        return { ...layout, label: t.label, desc: t.desc }
      })
      .filter(Boolean)
    setCallouts(result)
  }, [])

  return (
    <div className="help-overlay" onClick={onClose}>
      <button
        className="help-close-btn"
        onClick={e => { e.stopPropagation(); onClose() }}
      >✕</button>

      {/* SVG arrow lines */}
      <svg style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', overflow: 'visible'
      }}>
        <defs>
          <marker id="help-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.9)" />
          </marker>
        </defs>
        {callouts.map((c, i) => (
          <line
            key={i}
            x1={c.lineStart.x} y1={c.lineStart.y}
            x2={c.lineEnd.x} y2={c.lineEnd.y}
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="2.5"
            strokeDasharray="8 5"
            markerEnd="url(#help-arrow)"
          />
        ))}
      </svg>

      {/* Callout boxes */}
      {callouts.map((c, i) => (
        <div
          key={i}
          className="help-callout"
          style={{ left: c.left, top: c.top, width: c.width }}
          onClick={e => e.stopPropagation()}
        >
          <div className="help-callout-name">{c.label}</div>
          <div className="help-callout-desc">{c.desc}</div>
        </div>
      ))}

      <span className="help-tap-hint">Tap anywhere to close</span>
    </div>
  )
}
