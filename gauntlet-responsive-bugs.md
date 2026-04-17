# Gauntlet (Run the Gauntlet) — Responsive QA Report
_Tested: 2026-04-14 | Tool: Playwright 1.59.1 / Chromium | 2-player live game_

Screens tested per viewport:
- `wr-classic` — WaitingRoom, Classic mode (host view)
- `wr-gauntlet-host` — WaitingRoom, Run the Gauntlet selected (host)
- `wr-gauntlet-guest` — WaitingRoom, Run the Gauntlet (guest/joiner)
- `gauntlet-pig` — PigView (Speaker, in-game)
- `gauntlet-spotter` — GauntletSpotterView (Spotter, in-game)

---

## Overall status by viewport

| Viewport | WaitingRoom | PigView | SpotterView |
|---|---|---|---|
| 375px iPhone | ✅ OK | ⚠️ Issues #1 #2 #3 | ✅ OK |
| 390px iPhone Pro | ✅ OK | ⚠️ Issues #1 #2 #3 | ✅ OK |
| 768px iPad | ✅ OK | 🔴 Issue #4 | 🔴 Issue #4 |
| 1024px Laptop | ✅ OK | ✅ OK | ✅ OK |
| 1440px Desktop | ✅ OK | ✅ OK | ✅ OK |

---

## Issues

---

**Issue #1**
- Breakpoint: 375px, 390px
- Screen: PigView (Speaker)
- Problem: The "Next Monster!" turn-start instruction panel is very large relative to the screen — at 375px it covers nearly the entire monster grid leaving only the top-left card visible. Only 1 of the 9 monsters is visible above the popup. The panel uses a downward arrow pointing toward the WoW card below, but the arrow itself is partly off-screen on 375px.
- Suggested fix: At `max-width: 750px`, cap the `turn-popup` (or whichever element this is) height so it doesn't dominate the grid. Consider using a smaller announcement style on mobile — e.g. a toast that slides in from the top rather than an overlay on the grid.

---

**Issue #2**
- Breakpoint: 375px
- Screen: PigView (Speaker)
- Problem: The text inside the "Next Monster!" panel is truncated — "Read the Words of Wisdom in your Monster's" is cut off mid-sentence. The text does not wrap to a second line, it just disappears.
- Suggested fix: Add `overflow-wrap: break-word` or `white-space: normal` to the panel text, or reduce the font size within the panel at this breakpoint to allow the full sentence to fit. Alternatively, use a shorter copy string for the mobile panel variant.

---

**Issue #3**
- Breakpoint: 375px, 390px
- Screen: PigView (Speaker)
- Problem: The bottom controls section (WoW card on the left, mic/ready button on the right) is a horizontal split. At 375px the WoW card is very small — only the card frame is visible, the quote text is not legible. The "I'm Ready to Speak" button is fine, but the WoW card feels vestigial at this size and adds clutter without providing useful information.
- Suggested fix: Consider hiding the WoW card from the bottom controls on mobile for the PigView (since the Pig already knows their monster — they just need the mic button). A `display: none` on `.rtg-mobile-wow` inside `.rtg-pig-controls` at `max-width: 750px` would clean this up. Or: scale the WoW card up so if it's shown, it's actually readable, with the button below it in a column instead of a row.

---

**Issue #4** ← Most significant
- Breakpoint: 768px (iPad portrait)
- Screen: PigView AND GauntletSpotterView
- Problem: There is a gap between the RTG mobile breakpoint (`max-width: 750px`) and the waiting-layout stack breakpoint (`max-width: 768px`). At exactly 768px:
  - The `waiting-body` has already gone to `flex-direction: column` (stacked, from the 768px block)
  - But the `game-chat-layout-rtg` has NOT yet collapsed to `flex-direction: column` (that's at 750px)
  - The RTG-specific left column compact strip (56px/80px height) has NOT applied
  - As a result, the `game-left-col` is still in its full grid-column/tablet layout, showing the WoW card at full portrait size alongside the strikes and progress panels
  
  This creates a hybrid layout where the left column shows the WoW card at full height (filling ~30% of the screen width with a tall card) while the game content area has already stacked. The result is visually imbalanced — the WoW card is disproportionately large and the monster grid appears small and squashed in the remaining space.
- Suggested fix: Change the RTG-specific mobile media query from `max-width: 750px` to `max-width: 768px` so both breakpoints fire together. This aligns the outer layout collapse with the inner waiting-body stack, eliminating the intermediate hybrid state. All the RTG-specific rules in the 750px block (compact left strip, rtg-mobile-wow, controls flex-row, etc.) should be consistent at the same width as the general game layout rules.

---

**Issue #5** (Code / CSS quality)
- Breakpoint: `max-width: 750px`
- Screen: N/A (CSS-only)
- Problem: Inside the `@media (max-width: 750px)` block, `.game-chat-layout-rtg .game-left-col` is declared twice. The first declaration sets `height: 56px` (around line 7691) and the second — much later in the same block — sets `height: 80px; padding-right: 128px` (around line 7829). The second rule wins via source order, so the `height: 56px` declaration is dead code. This is confusing when reading/editing the CSS and could cause unintended results if someone edits only one of the two rules.
- Suggested fix: Remove the first `height: 56px` declaration and keep only the single authoritative rule (`height: 80px; padding-right: 128px`) at the bottom of the media block.

---

## What's working well

- **375px & 390px — SpotterView:** All 9 monsters are visible, the compact top strip (strikes + monsters found) is clear, and the status text at the bottom reads cleanly. The mobile RTG layout for spotters is functioning as intended.
- **1024px — Both views:** The 2-column layout (WoW card + strikes left, game content right) works well. Everything is visible and proportional.
- **1440px — Both views:** The full 3-column layout (left panel / monster grid / logo+chat) renders cleanly with good spacing. This is the best-looking viewport.
- **WaitingRoom (all sizes):** The mode toggle (Classic / Run the Gauntlet), pig selector, difficulty picker, and player list all render correctly at every breakpoint. No overflow or clipping issues.
