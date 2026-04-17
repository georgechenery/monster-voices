/**
 * Right-column comparison QA — three classic views at 1440px
 * Tests MonsterSpotter (spotter), Speaker (speaker), and WaitingPlayer (audience)
 * by using the sandbox DEV controls to switch between them.
 */
const { chromium } = require('playwright')
const path = require('path')
const fs   = require('fs')

const BASE_URL      = 'https://192.168.0.13:5173/'
const SCREENSHOTS   = path.join(__dirname, 'screenshots')
if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true })

// Test at both a wide desktop AND a mid-range "just above 1100px" breakpoint
const VIEWPORTS = [
  { width: 1440, height: 900,  label: '1440px' },
  { width: 1200, height: 800,  label: '1200px' },
]

;(async () => {
  const browser = await chromium.launch({ headless: true })

  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.label} (${vp.width}x${vp.height}) ===`)
    const ctx  = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, ignoreHTTPSErrors: true })
    const page = await ctx.newPage()

    // Go to sandbox
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(800)

    // Open DEV menu and click Game Sandbox
    await page.locator('.btn-lobby-dev').first().click()
    await page.waitForTimeout(400)
    await page.locator('.btn-lobby-dev-option', { hasText: 'Game Sandbox' }).click()
    await page.waitForSelector('.game-container', { timeout: 8000 })
    await page.waitForTimeout(800)

    // ── View 1: Spotter (default, viewAsIdx=0 = Alex ★ = spotter) ──
    // Default is spotter — take screenshot immediately
    await page.screenshot({ path: path.join(SCREENSHOTS, `rc-spotter-${vp.label}.png`) })
    console.log(`  📸 rc-spotter-${vp.label}.png  (MonsterSpotterView)`)

    // ── View 2: Speaker (click "Blake" in the View As row = index 1, who is the first speaker) ──
    const blakeBtn = page.locator('button', { hasText: 'Blake' }).first()
    await blakeBtn.click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(SCREENSHOTS, `rc-speaker-${vp.label}.png`) })
    console.log(`  📸 rc-speaker-${vp.label}.png  (SpeakerView)`)

    // ── View 3: Audience (click "Casey" = index 2, who is NOT the current speaker or spotter) ──
    const caseyBtn = page.locator('button', { hasText: 'Casey' }).first()
    await caseyBtn.click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(SCREENSHOTS, `rc-audience-${vp.label}.png`) })
    console.log(`  📸 rc-audience-${vp.label}.png  (WaitingPlayerView)`)

    // ── Also capture at the "Spotter guessing" phase to get a fuller controls state ──
    // Switch to "Spotter guessing" phase to see the spotter view with all controls active
    const phaseSelect = page.locator('select').last()
    await phaseSelect.selectOption('guessing')
    await page.waitForTimeout(500)
    // Back to spotter view
    const alexBtn = page.locator('button', { hasText: /Alex/ }).first()
    await alexBtn.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(SCREENSHOTS, `rc-spotter-guessing-${vp.label}.png`) })
    console.log(`  📸 rc-spotter-guessing-${vp.label}.png  (Spotter, guessing phase)`)

    await ctx.close()
  }

  await browser.close()
  console.log('\nDone.')
})()
