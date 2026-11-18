const assert = require('node:assert/strict');

// Pass a fresh Playwright page so these explicit progress marks affect only test data.
async function verifyVideoLibrary(page, base) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '#library');
  const cards = page.locator('#videoGrid .film-card');
  assert.equal(await cards.count(), 6);
  await page.click('#videoMore');
  assert.equal(await cards.count(), 12);
  await page.selectOption('#video-language', 'az');
  await cards.first().locator('a').click();
  await page.waitForSelector('#videoTitle');
  const lesson = page.url();
  const done = page.locator('.film-toolbar [data-mark="done"]');
  assert.equal(await done.getAttribute('aria-pressed'), 'false');
  await done.click();
  await page.click('.film-toolbar [data-mark="favorite"]');
  await page.goto(base + '#profile');
  assert.equal(await page.locator('#profileVideos a').count(), 2);
  await page.goto(lesson);
  await page.reload();
  assert.equal(await done.getAttribute('aria-pressed'), 'true');
  await done.click();
  assert.equal(await done.getAttribute('aria-pressed'), 'false');

  await page.goto(base + '#course/recovery');
  assert.ok(await page.locator('#relatedVideos .film-card').count());
  await page.goto(base + '#course/balance');
  assert.equal(await page.locator('#relatedVideos').count(), 0);

  for (const lang of ['ru', 'az', 'en']) {
    await page.selectOption('#language', lang);
    for (const width of [320, 390, 768, 1366]) {
      await page.setViewportSize({ width, height: 844 });
      for (const url of [base + '#library', lesson]) {
        await page.goto(url);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
    }
  }
  assert.deepEqual(errors, []);
}

module.exports = { verifyVideoLibrary };
