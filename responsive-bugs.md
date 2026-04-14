# Responsive Design QA — Monster Voices
_Tested: 2026-04-13 | Tool: Playwright 1.59.1 / Chromium_

---

## Main Menu

### 375px — no issues found
Logo, subtitle, and all three buttons render cleanly. Background illustration fills the space correctly. No overflow or clipping.

### 390px — no issues found
Virtually identical to 375px. Clean layout throughout.

### 768px — no issues found
The larger viewport allows the full monster illustration to breathe nicely. Buttons are well-proportioned and centred.

### 1024px — no issues found
Layout is clean and functional. All elements visible and correctly aligned.

### 1440px — minor issue (see Issue #1 below)

---

## Sandbox

### 375px — critical issues (see Issues #2, #3)
### 390px — critical issues (see Issues #2, #3)
### 768px — major issue (see Issue #4)
### 1024px — major issue (see Issue #4)
### 1440px — no issues found
Full three-column layout (player info / monster grid / chat + scores) renders correctly and looks polished.

---

## Issues

---

**Issue #1**
- Breakpoint: 1440px
- Screen: Main Menu
- Problem: "Create Room", "Join Room", and "How to Play" buttons are very narrow (roughly 280–300px wide) and appear visually thin against the full 1440px-wide background. They feel undersized relative to the canvas and could be easy to miss on a large monitor.
- Suggested fix: Add a `min-width` (e.g. `min-width: 340px`) or a percentage width (e.g. `width: clamp(260px, 25%, 400px)`) to the lobby button group, or cap the content column width at a comfortable maximum and centre it.

---

**Issue #2**
- Breakpoint: 375px, 390px
- Screen: Sandbox
- Problem: Horizontal overflow — the right-side panel (which displays the player's role description and game instructions) is clipped by the viewport. Partial text is visible on the right edge and the panel extends off-screen, forcing the user to scroll horizontally (or simply missing the content entirely).
- Suggested fix: The sandbox layout appears to use a fixed-width multi-column arrangement. Wrap it in a responsive container: use `overflow-x: hidden` on the root and switch the column layout to `flex-direction: column` (or a single-column grid) below ~600px so each panel stacks vertically instead of sitting side-by-side.

---

**Issue #3**
- Breakpoint: 375px, 390px
- Screen: Sandbox
- Problem: Related to Issue #2 — because the layout overflows horizontally, the "Words of Wisdom" card and the scoreboard/control strip overlap or crowd each other in the visible area. The bottom control bar (round counter, player list, phase dropdown) is partially obscured.
- Suggested fix: Same root cause as Issue #2. A stacked single-column layout at mobile widths would resolve both issues simultaneously.

---

**Issue #4**
- Breakpoint: 768px, 1024px
- Screen: Sandbox
- Problem: The centre panel — the 3×3 monster image grid that players use to make their guess — is not visible in the viewport at tablet or laptop widths. At 1440px the layout is a clear three-column design (player info | monster grid | chat/scores); at 768px and 1024px the grid column is either pushed below the fold or collapsed entirely, leaving only the left info panel and a partial right panel visible above the fold. The core game action is hidden.
- Suggested fix: At widths below ~1280px, consider a two-step responsive layout:
  - **768px–1023px**: Stack the role/info panel above the monster grid (full width), and move chat/scores to a collapsible drawer or below the grid.
  - **1024px–1279px**: Try a two-column layout — monster grid on the left (taking ~60% width), combined info+chat sidebar on the right — before switching to the full three-column design at 1280px+.

---
