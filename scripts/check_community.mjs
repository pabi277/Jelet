/** Phase 10 browser regression: real local mock fixture; never deployed/seeded data. */
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import os from "node:os";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";
const require = createRequire(import.meta.url);
const roots = [process.cwd(), process.env.JELET_PW_ROOT, "/tmp/pwtool"].filter(Boolean);
const load = async name => import(pathToFileURL(require.resolve(name, { paths: roots })).href);
const { default: chromium } = await load("@sparticuz/chromium");
const { default: puppeteer } = await load("puppeteer-core");
const mime = { ".mjs": "text/javascript", ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
const submissions = []; // Test-only store, initially empty; accepts actual browser opt-in POSTs.
const benchmarkRequests = [];
const weekStart = () => {
  const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  return d.toISOString().slice(0, 10);
};
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://test");
    if (url.pathname === "/benchmark") {
      benchmarkRequests.push({ method: req.method, cookie: req.headers.cookie, referer: req.headers.referer });
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      if (req.method === "POST") {
        let text = ""; for await (const chunk of req) text += chunk;
        const body = JSON.parse(text);
        assert.deepEqual(Object.keys(body).sort(), ["accuracy", "marks", "paperYear"]);
        submissions.push(body);
        return res.writeHead(201).end(JSON.stringify({ accepted: true, weekStart: weekStart() }));
      }
      const bins = new Map();
      for (const s of submissions) bins.set(Math.round(s.marks * 12), (bins.get(Math.round(s.marks * 12)) || 0) + 1);
      return res.end(JSON.stringify({ version: 1, weekStart: weekStart(), generatedAt: new Date().toISOString(), count: submissions.length, scores: [...bins].map(([twelfths, count]) => ({ twelfths, count })) }));
    }
    if (url.pathname === "/favicon.ico") return res.writeHead(204).end();
    const file = path.resolve("." + (url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname)));
    if (!file.startsWith(process.cwd() + "/")) return res.writeHead(403).end();
    res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
    res.end(await fs.readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, "0.0.0.0", r));
const base = `http://127.0.0.1:${server.address().port}/`;
const libDir = await fs.mkdtemp(path.join(os.tmpdir(), "jelet-community-libs-"));
const chromiumRoot = path.dirname(require.resolve("@sparticuz/chromium/package.json", { paths: roots }));
const archive = path.join(libDir, "libs.tar");
await fs.writeFile(archive, zlib.brotliDecompressSync(await fs.readFile(path.join(chromiumRoot, "bin/al2023.tar.br"))));
execFileSync("tar", ["-xf", archive, "-C", libDir]);
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(), args: chromium.args.filter(arg => arg !== "--single-process"), headless: "shell", env: { ...process.env, LD_LIBRARY_PATH: path.join(libDir, "lib") } });
let checks = 0;
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(base, { waitUntil: "networkidle0" });
  await page.evaluate(async () => {
    const db = await import("./assets/js/db/indexeddb.js");
    const { scoreAttempt } = await import("./assets/js/core/scoring.js");
    const { computeMockAnalytics } = await import("./assets/js/core/stats.js");
    const paper = await (await fetch("./_data/papers/2025.json")).json();
    const questions = paper.questions;
    const attempt = { ...scoreAttempt(questions, {}), attemptId: "browser-test", kind: "mock", mode: "independent", paperId: "jelet-2025", title: "Browser test mock", submittedAt: new Date().toISOString(), elapsedMs: 7200000, questionIds: questions.map(q => q.id) };
    // Real timed-mock analytics (questionTimes captured) — regression fixture for
    // the Results Time Analysis block (formatDurationClock import in results.js).
    attempt.analytics = computeMockAnalytics(attempt, questions, Object.fromEntries(questions.map((q, i) => [q.id, 20000 + i * 1000])));
    await db.put("attempts", attempt);
  });
  for (const width of [360, 1440]) {
    await page.setViewport({ width, height: width === 360 ? 800 : 900 });
    for (const route of ["#/", "#/results", "#/results/browser-test", "#/you", "#/papers"]) {
      await page.goto(base + route, { waitUntil: "networkidle0" });
      await page.waitForSelector("main .card", { timeout: 10000 }).catch(async e => { console.error(route, await page.$eval("main", n => n.textContent), errors); throw e; });
      if (route.includes("browser-test")) {
        assert.match(await page.$eval("#resultsAnalyticsSection", n => n.textContent), /Time Analysis/);
        await page.click("#shareResultBtn");
        await page.waitForSelector("#shareResultPreview svg");
        assert.ok(!(await page.$eval("#shareResultPreview", n => n.textContent)).includes("Time taken"));
        await page.click("#shareFullToggle");
        assert.match(await page.$eval("#shareResultPreview", n => n.textContent), /Time taken/);
        await page.click("#shareFullToggle");
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width} ${route}: overflow`);
      checks++;
    }
  }
  assert.equal(benchmarkRequests.length, 0, "no automatic benchmark traffic");
  { // Benchmark E2E must run, never silently skip.
    await page.goto(base + "#/results/browser-test", { waitUntil: "networkidle0" });
    await page.waitForSelector("#benchmarkUrl");
    assert.match(await page.$eval("#benchmarkStatus", n => n.textContent), /not configured/);
    await page.type("#benchmarkUrl", base);
    await page.click("#benchmarkLoad");
    await page.waitForFunction(() => document.querySelector("#benchmarkStatus").textContent.includes("Save your edited endpoint"));
    assert.equal(benchmarkRequests.length, 0, "unsaved URL cannot silently contact old endpoint");
    await page.click("#benchmarkSave");
    await page.waitForFunction(() => document.querySelector("#benchmarkStatus").textContent.includes("saved locally"));
    assert.equal(benchmarkRequests.length, 0);
    await page.click("#benchmarkLoad");
    await page.waitForFunction(() => document.querySelector("#benchmarkStatus").textContent.includes("No submissions"));
    assert.equal(await page.$eval("#benchmarkSubmit", n => n.disabled), true);
    await page.click("#benchmarkConsent");
    await page.click("#benchmarkSubmit");
    await page.waitForFunction(() => document.querySelector("#benchmarkStatus").textContent.includes("accepted"));
    assert.equal(submissions.length, 1);
    await page.click("#benchmarkLoad");
    await page.waitForFunction(() => document.querySelector("#benchmarkComparison").textContent.includes("1 tied"));
    await page.reload({ waitUntil: "networkidle0" });
    await page.waitForSelector("#benchmarkSubmit");
    await page.click("#benchmarkConsent");
    assert.equal(await page.$eval("#benchmarkSubmit", n => n.disabled), true, "receipt blocks accidental repeat");
    for (const request of benchmarkRequests) { assert.equal(request.cookie, undefined); assert.equal(request.referer, undefined); }
    checks++;
  }
  await page.goto(base + "#/you", { waitUntil: "networkidle0" });
  await page.waitForSelector("#buddyCreateForm");
  await page.$eval("#buddyCreateForm", form => { form.parentElement.open = true; });
  await page.type('[name="groupName"]', 'Browser buddies');
  await page.type('[name="groupTopic"]', 'Optics focus');
  await page.click('#buddyCreateForm button');
  await page.waitForSelector('.js-buddy-edit');
  await page.$eval('.js-buddy-edit', form => { form.parentElement.open = true; });
  await page.type('.js-buddy-edit [name="topics"]', 'Waves\nOptics');
  await page.type('.js-buddy-edit [name="plan"]', 'P02\nM01');
  await page.click('.js-buddy-edit button');
  await page.waitForFunction(() => document.querySelector('#buddyStatus').textContent.includes('Local plan saved'));
  await page.click('.js-buddy-share');
  const inviteUrl = await page.$eval('#buddyInviteLink', n => n.value);
  const recipient = await browser.createBrowserContext();
  const buddy = await recipient.newPage();
  buddy.on('pageerror', e => errors.push(e.message));
  buddy.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await buddy.setViewport({ width: 360, height: 800 });
  await buddy.goto(inviteUrl, { waitUntil: 'networkidle0' });
  await buddy.waitForSelector('#buddyJoin');
  assert.match(await buddy.$eval('#buddyGroups', n => n.textContent), /No groups joined/);
  await buddy.click('#buddyJoin');
  await buddy.waitForSelector('.js-buddy-edit');
  assert.match(await buddy.$eval('#buddyGroups', n => n.textContent), /P02/);
  await buddy.goto(inviteUrl, { waitUntil: 'networkidle0' });
  await buddy.waitForSelector('#buddyJoin');
  await buddy.click('#buddyJoin');
  await buddy.waitForFunction(() => document.querySelector('#buddyStatus').textContent.includes('Already joined'));
  assert.equal((await buddy.$$('.js-buddy-edit')).length, 1);
  await buddy.goto(base + '#/you?invite=invalid!', { waitUntil: 'networkidle0' });
  await buddy.waitForFunction(() => document.querySelector('#buddyStatus')?.textContent.includes('Invalid'));
  checks += 3;
  await recipient.close();
  await page.setViewport({ width: 360, height: 800 });
  for (const route of ['#/', '#/results/browser-test', '#/you', '#/papers']) {
    await page.goto(base + route, { waitUntil: 'networkidle0' });
    await page.waitForSelector('main .card');
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    if (route.includes('browser-test')) await page.click('#shareResultBtn');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `200% text ${route}: overflow`);
    checks++;
  }
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.setOfflineMode(true);
  const priorRequests = benchmarkRequests.length;
  for (const route of ['#/', '#/results/browser-test', '#/you', '#/papers']) {
    await page.goto(base + route, { waitUntil: 'load' });
    await page.waitForSelector('main .card');
    if (route.includes('browser-test')) {
      await page.click('#shareResultBtn');
      await page.waitForSelector('#shareResultPreview svg');
      await page.click('#benchmarkLoad');
      await page.waitForFunction(() => document.querySelector('#benchmarkStatus').textContent.includes('Offline'));
    }
    if (route === '#/you') {
      await page.waitForSelector('.js-buddy-edit');
      const commOpen = await page.$eval('#discloseCommunity', d => d.open);
      if (!commOpen) await page.click('#discloseCommunity > .disclose__summary');
      await page.$eval('.js-buddy-edit', form => { form.parentElement.open = true; form.querySelector('[name="plan"]').value = 'C01'; });
      await page.click('.js-buddy-edit button');
      await page.waitForFunction(() => document.querySelector('#buddyStatus').textContent.includes('Local plan saved'));
      assert.match(await page.$eval('#buddyGroups', n => n.textContent), /C01/);
      checks++;
    }
    checks++;
  }
  assert.equal(benchmarkRequests.length, priorRequests, 'offline actions send nothing');
  assert.deepEqual(errors, [], "console/page errors");
  console.log(`Community browser audit: ${checks} route/viewport checks PASS; zero console errors`);
} finally {
  await browser.close();
  await new Promise(r => server.close(r));
}
