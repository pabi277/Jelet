#!/usr/bin/env node
/** Phase 13 browser gate. All populated content is intercepted synthetic data;
 * no pilot prose or fake owner approval is written into the corpus.
 */
import assert from 'node:assert/strict';
import { startServer, resolveBrowser } from './check_responsive.mjs';

const info = await resolveBrowser();
if (!info.available) throw new Error(`Browser gate requires Chromium: ${info.reason}`);
const server = await startServer("/Jelet/");
const base = `http://127.0.0.1:${server.address().port}/Jelet/`;
const browser = await info.launch({});
const keeper = await browser.newPage();
const pack = {
  conceptPrimer: [1, 2].map((i) => ({ prdId: `M01-PRD0${i}`, heading: `Synthetic primer ${i}`, proseLatex: 'Fixture eigenbridge $A^T$.' })),
  memoryHooks: ['Synthetic memory hook $a+b=b+a$.'], commonMistakes: ['Synthetic common mistake.'],
  examChecklist: ['Synthetic exam checklist.'],
  furtherReading: [{ book: '<Synthetic title>', author: 'Fixture author', chapters: '1', note: 'Synthetic pointer only.' }],
  provenance: { draftedBy: 'AI-assisted draft', reviewedBy: 'Test fixture only', reviewedAt: '2026-11-25' },
};
const searchText = 'checklist concept primer memory common eigenbridge exam mistake hook';
let checks = 0;
try {
  for (const [width, height] of [[360, 800], [1440, 900]]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setViewport({ width, height });
    await page.setBypassServiceWorker(true);
    await page.goto(base + '#/learn/M01?tab=study', { waitUntil: 'networkidle0' });
    assert.match(await page.$eval('#lessonBodySlot', (e) => e.textContent), /being authored/);
    const labels = await page.$$eval('#lessonTabsRow button', (els) => els.map((e) => e.textContent));
    assert.deepEqual(labels.slice(0, 2), ['Workbook', 'Study Pack']);
    checks += 2;
    await page.setRequestInterception(true);
    let packRequests = 0;
    let delayed = false;
    page.on('request', async (r) => {
      if (r.url().endsWith('studypack-index.json')) return r.respond({ contentType: 'application/json', body: JSON.stringify({ M01: searchText }) });
      if (r.url().endsWith('M01.studyPack.json')) {
        packRequests++;
        if (delayed) await new Promise((resolve) => setTimeout(resolve, 600));
        return r.respond({ contentType: 'application/json', body: JSON.stringify(pack) });
      }
      return r.continue();
    });
    // A fresh explorer must search all pack text without fetching the pack.
    await page.goto(base + '#/learn', { waitUntil: 'networkidle0' });
    await page.reload({ waitUntil: 'networkidle0' });
    for (const term of ['memory hook', 'common mistake', 'exam checklist', 'eigenbridge']) {
      await page.$eval('#learnSearchInput', (e, term) => {
        e.value = term; e.dispatchEvent(new Event('input', { bubbles: true }));
      }, term);
      await page.waitForFunction(() => document.querySelectorAll('.unit-list-row').length === 1);
      assert.equal(await page.$eval('.unit-list-row .unit-code-chip', (e) => e.textContent), 'M01');
      checks++;
    }
    assert.equal(packRequests, 0); checks++;
    await page.goto(base + '#/learn/M01?tab=study', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#studyReportBtn');
    const text = await page.$eval('#lessonBodySlot', (e) => e.textContent);
    let previous = -1;
    for (const heading of ['Concept Primer', 'Memory Hooks', 'Common Mistakes', 'Exam Checklist', 'Further Reading', 'reviewed by Test fixture only']) {
      const at = text.indexOf(heading); assert.ok(at > previous); previous = at;
    }
    assert.ok(await page.$('#lessonBodySlot .katex'));
    assert.equal(await page.$('#lessonBodySlot synthetic'), null);
    await page.click('#studyReportBtn');
    await page.waitForFunction(() => document.body.textContent.includes('Nothing was sent.'));
    checks += 4;
    // Neutralize the root clipping guard, and test actual 200% text size.
    await page.addStyleTag({ content: 'html,body {overflow-x:visible!important} :root {font-size:200%!important}' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    assert.ok(await page.$('#lessonBodySlot .exam-trap'));
    checks += 2;
    // Delayed study response must not overwrite a later Formulas selection.
    delayed = true;
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-tab="formulas"]');
    await page.click('[data-tab="formulas"]');
    await new Promise((r) => setTimeout(r, 800));
    assert.equal(await page.$('#studyReportBtn'), null);
    checks++;
    assert.deepEqual(errors, []); checks++;
    await page.close();
  }
  // Real service worker: empty-state shell and a runtime-cached synthetic pack
  // remain available offline on a subpath deployment.
  const page = await browser.newPage();
  await page.goto(base + '#/learn/M01?tab=study', { waitUntil: 'networkidle0' });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.setOfflineMode(true);
  await page.reload({ waitUntil: 'networkidle0' });
  assert.match(await page.$eval('#lessonBodySlot', (e) => e.textContent), /being authored/); checks++;
  await page.evaluate(async (pack) => {
    const names = await caches.keys();
    const cache = await caches.open(names.find((n) => n.startsWith('jelet-runtime-')));
    await cache.put('./_data/units/studypack-index.json', Response.json({ M01: 'synthetic' }));
    await cache.put('./_data/units/M01.studyPack.json', Response.json(pack));
  }, pack);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#studyReportBtn'); checks++;
  await page.close();
  console.log(`✓ Study Pack browser gate: ${checks} checks passed (mobile/desktop, synthetic search/content, 200% text, dark, race, offline subpath).`);
} finally {
  await keeper.close().catch(() => {});
  await browser.close();
  server.close();
}
