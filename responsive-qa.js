const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://192.168.0.17:5173/';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

const VIEWPORTS = [
  { width: 375,  height: 812,  label: '375px'  },
  { width: 390,  height: 844,  label: '390px'  },
  { width: 768,  height: 1024, label: '768px'  },
  { width: 1024, height: 768,  label: '1024px' },
  { width: 1440, height: 900,  label: '1440px' },
];

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n=== Testing ${vp.label} (${vp.width}x${vp.height}) ===`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    // Step A – main menu screenshot
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const mainPath = path.join(SCREENSHOTS_DIR, `main-${vp.label}.png`);
    await page.screenshot({ path: mainPath, fullPage: false });
    console.log(`  Saved: ${mainPath}`);

    // Step C – open DEV menu then click "Game Sandbox"
    let sandboxPath = path.join(SCREENSHOTS_DIR, `sandbox-${vp.label}.png`);
    try {
      // The sandbox is behind a DEV toggle button
      const devBtn = page.locator('.btn-lobby-dev').first();
      const devFound = await devBtn.count();

      if (devFound > 0) {
        await devBtn.scrollIntoViewIfNeeded();
        await devBtn.click();
        await page.waitForTimeout(500);

        const sandboxBtn = page.locator('.btn-lobby-dev-option', { hasText: 'Game Sandbox' }).first();
        const sbFound = await sandboxBtn.count();
        if (sbFound > 0) {
          await sandboxBtn.click();
          await page.waitForTimeout(1500);
          await page.screenshot({ path: sandboxPath, fullPage: false });
          console.log(`  Saved: ${sandboxPath}`);
        } else {
          const btns = await page.locator('button').allInnerTexts();
          console.log(`  WARNING: Game Sandbox option not found after DEV click. Buttons: ${JSON.stringify(btns)}`);
          await page.screenshot({ path: sandboxPath, fullPage: false });
        }
      } else {
        // Fallback: dump all button texts so we can report what IS there
        const btns = await page.locator('button').allInnerTexts();
        console.log(`  WARNING: DEV button not found. Buttons on page: ${JSON.stringify(btns)}`);
        await page.screenshot({ path: sandboxPath, fullPage: false });
        console.log(`  Saved fallback screenshot: ${sandboxPath}`);
      }
    } catch (err) {
      console.log(`  ERROR clicking Sandbox button: ${err.message}`);
      await page.screenshot({ path: sandboxPath, fullPage: false });
    }

    await context.close();
  }

  await browser.close();
  console.log('\nAll screenshots captured.');
})();
