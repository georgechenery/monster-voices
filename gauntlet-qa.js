/**
 * Gauntlet / Party Mode — Responsive QA
 *
 * Simulates a 2-player gauntlet game:
 *   Context A (host "Alpha") creates the room, switches to Run the Gauntlet, starts
 *   Context B (player "Bravo") joins — becomes the Spotter
 * Captures screenshots of:
 *   - WaitingRoom (classic mode)  → wr-classic-[width]px.png
 *   - WaitingRoom (gauntlet mode) → wr-gauntlet-[width]px.png
 *   - PigView (the Speaker)       → gauntlet-pig-[width]px.png
 *   - GauntletSpotterView         → gauntlet-spotter-[width]px.png
 */

const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE_URL = 'https://192.168.0.13:5173/'
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots')
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })

const VIEWPORTS = [
  { width: 375,  height: 812,  label: '375px'  },
  { width: 390,  height: 844,  label: '390px'  },
  { width: 768,  height: 1024, label: '768px'  },
  { width: 1024, height: 768,  label: '1024px' },
  { width: 1440, height: 900,  label: '1440px' },
]

async function goto(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(800)
}

async function shot(page, filename) {
  const p = path.join(SCREENSHOTS_DIR, filename)
  await page.screenshot({ path: p, fullPage: false })
  console.log(`    📸 ${filename}`)
}

;(async () => {
  const browser = await chromium.launch({ headless: true })

  for (const vp of VIEWPORTS) {
    console.log(`\n${'='.repeat(55)}`)
    console.log(`  Viewport: ${vp.label}  (${vp.width}×${vp.height})`)
    console.log(`${'='.repeat(55)}`)

    // ── Context A: Host (the Pig / Speaker) ────────────────────────
    const ctxA = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, ignoreHTTPSErrors: true })
    const pageA = await ctxA.newPage()
    await goto(pageA, BASE_URL)

    // Navigate to Create Room form
    await pageA.locator('.btn-lobby-primary').first().click()
    await pageA.waitForTimeout(300)

    // Enter host name
    await pageA.locator('.lobby-input').fill('Alpha')
    await pageA.locator('button[type="submit"].btn-lobby-primary').click()

    // Wait for WaitingRoom
    await pageA.waitForSelector('.wr-code-value', { timeout: 10000 })
    await pageA.waitForTimeout(600)

    const roomCode = await pageA.locator('.wr-code-value').textContent()
    console.log(`  Room code: ${roomCode}`)

    // Screenshot: WaitingRoom classic (solo)
    await shot(pageA, `wr-classic-${vp.label}.png`)

    // ── Context B: Joiner (Spotter) ─────────────────────────────────
    const ctxB = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, ignoreHTTPSErrors: true })
    const pageB = await ctxB.newPage()
    await goto(pageB, BASE_URL)

    // Navigate to Join Room form (second button on the main menu)
    await pageB.locator('.btn-lobby-secondary').first().click()
    await pageB.waitForTimeout(300)

    // Enter room code + name
    await pageB.locator('.lobby-input-code').fill(roomCode.trim())
    await pageB.locator('.lobby-input:not(.lobby-input-code)').fill('Bravo')
    await pageB.locator('button[type="submit"].btn-lobby-primary').click()

    // Wait for WaitingRoom on both sides
    await pageB.waitForSelector('.wr-code-value', { timeout: 10000 })
    await pageA.waitForTimeout(500)

    // ── Switch to Gauntlet mode (host only) ─────────────────────────
    const gauntletModeBtn = pageA.locator('.wr-mode-btn', { hasText: 'Run the Gauntlet' })
    await gauntletModeBtn.click()
    await pageA.waitForTimeout(600)

    // Screenshot: WaitingRoom gauntlet mode (both perspectives)
    await shot(pageA, `wr-gauntlet-host-${vp.label}.png`)
    await shot(pageB, `wr-gauntlet-guest-${vp.label}.png`)

    // ── Start the game ───────────────────────────────────────────────
    const startBtn = pageA.locator('.wr-controls .btn-lobby-primary')
    const isDisabled = await startBtn.getAttribute('disabled')
    if (isDisabled !== null) {
      console.log(`  ⚠️  Start button disabled — checking why...`)
      const hint = await pageA.locator('.wr-hint').allInnerTexts()
      console.log(`     Hints: ${JSON.stringify(hint)}`)
    } else {
      await startBtn.click()

      // Wait for game to start on both pages
      try {
        await Promise.all([
          pageA.waitForSelector('.game-chat-layout-rtg', { timeout: 10000 }),
          pageB.waitForSelector('.game-chat-layout-rtg', { timeout: 10000 }),
        ])
        await pageA.waitForTimeout(1000)

        // Screenshots of actual game views
        await shot(pageA, `gauntlet-pig-${vp.label}.png`)
        await shot(pageB, `gauntlet-spotter-${vp.label}.png`)
      } catch (err) {
        console.log(`  ⚠️  Game did not start within timeout: ${err.message}`)
        await shot(pageA, `gauntlet-pig-${vp.label}-FAILED.png`)
        await shot(pageB, `gauntlet-spotter-${vp.label}-FAILED.png`)
      }
    }

    await ctxA.close()
    await ctxB.close()
  }

  await browser.close()
  console.log('\n✅  All gauntlet screenshots captured.')
})()
