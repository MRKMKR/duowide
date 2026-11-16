// Run with NODE_PATH pointing to a Playwright installation. Uses an existing Chrome.
const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'DuoWide.user.js'), 'utf8');
const fixture = fs.readFileSync(path.join(__dirname, 'backgrounds.html'), 'utf8');
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function bounds(page, selector) {
  return page.locator(selector).evaluateAll(elements => elements.map(e => {
    const r = e.getBoundingClientRect();
    return { left: r.left, right: r.right, width: r.width };
  }));
}

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    for (const mode of ['normal', 'backgrounds']) {
      for (const colorScheme of ['light', 'dark']) {
        const context = await browser.newContext({ viewport: { width: 466, height: 678 }, hasTouch: true,
          colorScheme, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 27_1 like Mac OS X) AppleWebKit/605.1.15 Version/27.1 Mobile/15E148 Safari/604.1' });
        const errors = [];
        await context.addInitScript(() => { window.__duoWideDebug = { strip: { side: 'right', gap: 84, full: 466 }, log: [] }; });
        await context.addInitScript(script.replace('mode: "backgrounds"', `mode: "${mode}"`));
        const page = await context.newPage();
        page.on('pageerror', error => errors.push(error.message));
        await page.route('https://fixture.test/**', route => route.fulfill({ contentType: 'text/html', body: fixture }));
        await page.goto('https://fixture.test/');
        await page.waitForTimeout(1600);
        assert.equal(await page.locator('html').getAttribute('data-duowide'), 'right');
        if (mode === 'backgrounds') {
          for (const r of await bounds(page, 'h1, img, video, input, .carousel, .cta')) assert(r.left >= -1 && r.right <= 383, JSON.stringify(r));
          for (const r of await bounds(page, '.gradient, .picture')) assert.equal(r.right, 466);
          assert(await page.locator('.mobile').isVisible());
          assert(!(await page.locator('.desktop').isVisible()));
        } else {
          assert((await bounds(page, 'h1'))[0].right > 382);
          assert(await page.locator('.desktop').isVisible());
        }
        await page.getByRole('button', { name: 'Menu', exact: true }).click();
        assert(await page.locator('#menu').isVisible());
        await page.evaluate(() => {
          document.querySelector('#dynamic').innerHTML = '<h2>Added content</h2><img alt="Dynamic" style="width:100%" src="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'50\'/>">';
        });
        await page.waitForTimeout(1400);
        if (mode === 'backgrounds') assert((await bounds(page, '#dynamic img'))[0].right <= 383);
        await page.getByRole('link', { name: 'End of page', exact: true }).click();
        await page.waitForTimeout(500);
        assert(page.url().endsWith('#end'));
        assert(await page.evaluate(() => scrollY > 0 && Math.abs(scrollX) < 1));
        await page.getByRole('link', { name: 'Next page', exact: true }).click();
        await page.waitForTimeout(1400);
        assert(page.url().includes('?next'));
        await page.goBack();
        await page.waitForTimeout(1400);
        assert(page.url().endsWith('#end'));
        const before = await page.locator('meta[name=viewport]').getAttribute('content');
        await page.waitForTimeout(1200);
        assert.equal(await page.locator('meta[name=viewport]').getAttribute('content'), before);
        assert.deepEqual(errors, []);
        console.log(`PASS ${mode} ${colorScheme}: layout, menu, dynamic content, scrolling, navigation, stable viewport`);
        await context.close();
      }
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
