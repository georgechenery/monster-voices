# Right-Column Layout Bug Report
**Classic game views: MonsterSpotterView vs SpeakerView vs WaitingPlayerView**
*Tested at 1440×900 and 1200×800. Screenshots in `app/screenshots/rc-*.png`.*

---

## Overview

All three classic views use the **same HTML skeleton**:
```
.waiting-layout
  .waiting-header
  .waiting-body
    .waiting-grid-col
      .monster-grid.monster-grid-fill
      .waiting-controls[--modifier]
  .waiting-right-col
    logo · ChatPanel · Scoreboard
```

A `:has(> .waiting-right-col)` CSS block in App.css (~line 6155) detects the sidebar and switches `.waiting-layout` from flex-column to a two-column CSS Grid. It also locks down the controls area to a fixed height so the monster grid can fill the rest of the space and be vertically centered via `margin: auto`.

**MonsterSpotterView is correct** because it uses `.waiting-controls-spotter` which gets an explicit `flex: 0 0 68px` rule inside that block.

**SpeakerView and WaitingPlayerView are broken** for distinct but related reasons:

---

## Bug 1 — CRITICAL · SpeakerView: no height constraint on `.waiting-controls`

### What's happening

SpeakerView renders:
```jsx
<div className="waiting-controls">   // ← no modifier class
  <div className="mic-action-section"> ... </div>
</div>
```

The `:has()` block defines fixed heights for the other two views (App.css ~6185–6196):
```css
/* spotter: 68 px */
.waiting-layout:has(> .waiting-right-col) .waiting-controls-spotter {
  flex: 0 0 68px; max-height: 68px; min-height: 68px; overflow: hidden;
}
/* audience: 140 px */
.waiting-layout:has(> .waiting-right-col) .waiting-controls-audience {
  flex: 0 0 140px; max-height: 140px; min-height: 140px; overflow: visible;
}
/* speaker: ← NO RULE */
```

Compounding this, `.mic-action-section` has an unconditional floor (App.css ~5031):
```css
.mic-action-section { position: relative; min-height: 160px; }
```

### Layout math

`waiting-grid-col` is a flex-column. The monster grid (`flex: none; width: min(100%, calc(100dvh - 17rem)); aspect-ratio: 1`) is fixed in size. Everything below it is the controls area.

| Viewport | Grid size | Available height | Controls floor | Overflow |
|---|---|---|---|---|
| 1440 × 900 | 628 × 628 px | ~798 px | 160 px (ready) / **220+ px (speaking)** | **0 px (ready) / 58+ px (speaking)** |
| 1200 × 800 | 528 × 528 px | ~698 px | 160 px (ready) / **220+ px (speaking)** | **10 px (ready) / 78+ px (speaking)** |

In the **speaking stage** the recording card (waveform bars + "Stop Recording" button) makes the controls grow to ~220–250 px. Because `.waiting-controls` has `flex: 0 1 auto` (default), it's the only item that can flex-shrink. It gets compressed and the "Stop Recording" / "Submit ✓" / "↩ Again" buttons are **clipped off the bottom** of `game-view-wrap { overflow: hidden }`.

Even in the **ready stage** the 160 px floor means there is almost zero free space for `margin: auto` to centre the monster grid:

| View | Controls height | Free space | Centering margin |
|---|---|---|---|
| Spotter | 68 px | 94 px | ±47 px → centred |
| Audience | 140 px | 22 px | ±11 px → barely centred |
| Speaker (ready) | 160 px | 2 px | ±1 px → top-aligned |

The monster grid in SpeakerView is effectively pinned to the top of the area rather than centred like the Spotter's grid. This is the "inconsistent sizing" the user sees.

### Fix

**Option A (minimal change):** Add a `waiting-controls-speaker` modifier class in SpeakerView.jsx, then add a rule to the `:has()` block. Compute the tallest state (speaking card ≈ 220 px) and cap at that:

*SpeakerView.jsx, line 295:*
```jsx
// Before:
<div className="waiting-controls">
// After:
<div className="waiting-controls waiting-controls-speaker">
```

*App.css — add after line 6196:*
```css
.waiting-layout:has(> .waiting-right-col) .waiting-controls-speaker {
  flex: 0 0 auto;
  max-height: 220px;
  overflow: hidden;
}
```

**Option B (recommended):** Reduce `.mic-action-section { min-height }` from 160 px to a smaller value (e.g. 120 px), then cap the whole controls area at `max-height: 220px` using Option A. This both centres the grid better and ensures buttons are never clipped.

> The `min-height: 160px` was presumably set to reserve visual space for the `turn-popup` (which is `position: absolute` and therefore **out of flow** — it doesn't actually need that reserved layout space). Reducing it to 80–100 px is safe.

---

## Bug 2 — MODERATE · WaitingPlayerView: `.wager-help-popup` clips under `game-view-wrap`

### What's happening

The audience controls are capped at 140 px with `overflow: visible`:
```css
.waiting-layout:has(> .waiting-right-col) .waiting-controls-audience {
  flex: 0 0 140px; max-height: 140px; overflow: visible;
}
```

`overflow: visible` is intentional so the `.wager-help-popup` can appear outside the 140 px boundary. But the popup is a **regular in-flow `<div>`** nested inside `.wager-section > .peek-wager-row > .waiting-controls-audience`. When it's shown, the visual stack is:

```
.waiting-controls-audience  (140 px, overflow: visible)
  .speaker-status-banner    (~30 px)
  .peek-wager-row           (~40 px)
    .wager-section
      .wager-idle-row       (wager button)
      .wager-help-popup     ← in-flow, ~140 px tall when expanded
```

Total height with popup: ~210 px. The popup content overflows below the 140 px line. `game-view-wrap { overflow: hidden }` clips it at the window edge. The "Got it" button and the lower bullet points are invisible and untappable.

### Fix

Make the popup escape its container with `position: absolute`, then add `position: relative` to its nearest sensible ancestor. The cleanest option is to position it relative to `.wager-section`:

*App.css — add/modify:*
```css
.wager-section {
  position: relative;
}
.wager-help-popup {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  width: min(260px, 90vw);
}
```

Remove `overflow: visible` from the `.waiting-controls-audience` `:has()` rule at ~line 6195 (it's no longer needed once the popup is absolutely positioned).

---

## Bug 3 — MINOR · Duplicate `.waiting-right-col` rules leave `overflow: visible` as the effective base value

### What's happening

Two separate `.waiting-right-col` declarations exist in App.css:

| Line | Specificity | `overflow` value |
|---|---|---|
| ~3732 | (0,1,0) | `hidden` |
| ~6231 | (0,1,0) | `visible` ← **later in source order → wins** |
| ~6176 (`:has()` rule) | (0,3,0) | `hidden` ← wins inside the `:has()` context |

In modern browsers the `:has()` rule restores `overflow: hidden` with enough specificity. But the `overflow: visible` at line 6231 is wrong: if `:has()` ever fails to match (browser quirk, SSR/hydration gap), the sidebar becomes `overflow: visible` and chat/scoreboard content can bleed outside the sidebar column.

### Fix

Remove `overflow: visible` from the rule at line ~6231:
```css
/* Line ~6227 – remove overflow: visible */
.waiting-right-col {
  width: clamp(220px, 22vw, 320px);
  flex: 0 0 auto;
  justify-content: flex-start;
  /* overflow: visible; ← DELETE this line */
}
```

---

## Root-cause summary for the Claude coder

| # | View | File | Location | Change |
|---|---|---|---|---|
| 1a | SpeakerView | `SpeakerView.jsx` | Line 295 | Add `waiting-controls-speaker` class to the controls `<div>` |
| 1b | SpeakerView | `App.css` | After line ~6196 | Add `flex: 0 0 auto; max-height: 220px; overflow: hidden` rule for `.waiting-controls-speaker` |
| 1c | Speaker | `App.css` | Line ~5031 | Reduce `mic-action-section { min-height }` from 160 px to ~100 px |
| 2a | WaitingPlayerView | `App.css` | Line ~6195 | Remove `overflow: visible` from `.waiting-controls-audience` |
| 2b | WaitingPlayerView | `App.css` | New rule | Add `position: relative` to `.wager-section` |
| 2c | WaitingPlayerView | `App.css` | `.wager-help-popup` | Add `position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%)` |
| 3 | All | `App.css` | Line ~6231 | Remove `overflow: visible` from the second `.waiting-right-col` block |

---

## Screenshot evidence

| File | View | Problem visible |
|---|---|---|
| `rc-spotter-1440px.png` | Spotter (reference) | Grid centred, controls at 68 px — correct |
| `rc-speaker-1440px.png` | Speaker | Grid top-aligned, turn-popup covers dimmed grid |
| `rc-audience-1440px.png` | Audience | Controls slightly too tall vs spotter |
| `rc-speaker-1200px.png` | Speaker | Grid smaller-looking relative to available space; turn-popup prominent |
| `rc-audience-1200px.png` | Audience | Wager/peek controls area proportionally large vs grid |
| `rc-spotter-guessing-*.png` | Spotter (reference) | Status bar + listen-again button render correctly within 68 px |
