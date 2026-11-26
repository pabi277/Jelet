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
// Newer @sparticuz/chromium releases block the './package.json' subpath in their
// `exports` map — resolve the entry instead and walk up to the package root
// that owns bin/.
const dirHasBin = async (dir) => {
  try { await fs.access(path.join(dir, "bin")); return true; } catch { return false; }
};
let chromiumRoot = path.dirname(require.resolve("@sparticuz/chromium", { paths: roots }));
for (let i = 0; i < 6 && !(await dirHasBin(chromiumRoot)); i++) {
  const parent = path.dirname(chromiumRoot);
  if (parent === chromiumRoot) break;
  chromiumRoot = parent;
}
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
  await page.$eval("#discloseCommunity > .disclose__summary", n => n.scrollIntoView({ block: "center" }));
  await page.click("#discloseCommunity > .disclose__summary");
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
  // 14B draft and incremental typewriter fixture in an isolated offline tutor.
  {
    const ctx = await browser.createBrowserContext();
    const tutor = await ctx.newPage();
    tutor.on('pageerror', e => errors.push(e.message));
    tutor.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await tutor.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
    await tutor.goto(base + '#/', {waitUntil:'networkidle0'});
    await tutor.evaluate(async () => {
      const h = await import('./assets/js/db/ai-history.js');
      let record = h.upsertSession(h.emptyHistory(), {key:'g:Saved math',title:'Matrices practice',context:{origin:'Saved math'},messages:[{role:'user',text:'Eigenvalues'},{role:'assistant',text:'Saved solution'}]});
      record = h.upsertSession(record, {key:'g:Saved circuits',title:'Circuits',context:{origin:'Saved circuits'},messages:[{role:'user',text:'Resistance'},{role:'assistant',text:'Saved circuit solution'}]});
      await h.persistAiHistory(record);
      document.querySelector('#themeToggle').focus();
      (await import('./assets/js/app.js')).openAiTutorContext({origin:'Draft fixture'});
    });
    await tutor.waitForSelector('#aiComposerInput');
    assert.equal(await tutor.$eval('#aiChatThread', n => n.getAttribute('aria-live')), 'polite');
    assert.equal(await tutor.$eval('#aiContextPanel', n => n.hidden), true);
    assert.equal(await tutor.$eval('#aiContextInfoBtn', n => n.getAttribute('aria-expanded')), 'false');
    await tutor.click('#aiContextInfoBtn');
    assert.equal(await tutor.$eval('#aiContextPanel', n => n.hidden), false);
    assert.match(await tutor.$eval('#aiContextPanel', n => n.textContent), /All 42 JELET Syllabus Units.*400 PYQs/s);
    assert.match(await tutor.$eval('#aiContextPanel', n => n.textContent), /From Draft fixture/);
    assert.equal(await tutor.$eval('#aiContextInfoBtn', n => n.getAttribute('aria-expanded')), 'true');
    await tutor.keyboard.press('Escape');
    assert.equal(await tutor.$eval('#aiContextPanel', n => n.hidden), true);
    assert.equal(await tutor.evaluate(()=>document.activeElement.id), 'aiContextInfoBtn');
    assert.equal(await tutor.$eval('#aiSheet', n => n.getAttribute('aria-hidden')), 'false');
    assert.ok(await tutor.evaluate(()=>{
      const a=document.querySelector('#aiSuggestionsToggle').getBoundingClientRect(),b=document.querySelector('#aiChatKeyChoice').getBoundingClientRect(),i=document.querySelector('#aiComposerInput').getBoundingClientRect(),s=document.querySelector('#aiSendBtn').getBoundingClientRect();
      return Math.abs((a.top+a.bottom-b.top-b.bottom)/2)<2 && Math.abs((i.top+i.bottom-s.top-s.bottom)/2)<2 && s.left>=i.right-1 && s.width>=48;
    }), 'suggestions and model share a row; send sits in the input row');
    assert.equal(await tutor.$$eval('.ai-suggestions', nodes => nodes.length), 1, 'exactly one suggestions control');
    assert.ok(await tutor.$eval('#aiComposerInput', n => n.getBoundingClientRect().height >= 48));
    await tutor.type('#aiComposerInput', 'Keep this draft');
    await tutor.evaluate(() => { window.originalShell = document.querySelector('.ai-tutor-wrap'); window.originalThread = document.querySelector('#aiChatThread'); window.originalComposer = document.querySelector('#aiComposerInput'); });
    await tutor.click('#aiSuggestionsToggle');
    await tutor.click('.ai-preset-chip');
    await tutor.waitForSelector('.ai-msg--typing', {timeout:10000});
    assert.ok(await tutor.$eval('#aiChatThread .ai-msg__bubble', n => parseFloat(getComputedStyle(n).fontSize) >= 15));
    assert.equal(await tutor.$eval('#aiComposerInput', n => n.value), 'Keep this draft');
    assert.equal(await tutor.evaluate(() => window.originalShell === document.querySelector('.ai-tutor-wrap') && window.originalThread === document.querySelector('#aiChatThread') && window.originalComposer === document.querySelector('#aiComposerInput')), true, 'shell, thread and composer remain mounted when generation starts');
    assert.equal(await tutor.$eval('.ai-suggestions', n => n.hidden), true);
    await tutor.evaluate(() => { window.draftNode = document.querySelector('#aiComposerInput'); });
    await new Promise(r => setTimeout(r, 200));
    assert.equal(await tutor.evaluate(() => window.draftNode === document.querySelector('#aiComposerInput')), true, 'composer remains mounted across ticks');
    assert.equal(await tutor.$eval('#aiComposerInput', n => n.value), 'Keep this draft');
    await tutor.click('#aiHistoryBtn');
    await tutor.waitForSelector('#aiHistorySearch');
    assert.equal(await tutor.evaluate(() => window.draftNode === document.querySelector('#aiComposerInput')), true, 'drawer must not replace composer');
    await tutor.keyboard.press('Escape');
    await tutor.waitForFunction(() => !document.querySelector('.ai-msg--typing'));
    assert.equal(await tutor.evaluate(() => window.draftNode === document.querySelector('#aiComposerInput')), true, 'finalize must not replace composer');
    assert.equal(await tutor.$eval('#aiComposerInput', n => n.value), 'Keep this draft');
    assert.equal(await tutor.$eval('.ai-suggestions', n => n.hidden), false);
    assert.equal(await tutor.$eval('#aiChipsRow', n => n.hidden), true);
    await tutor.click('#aiSuggestionsToggle');
    await tutor.waitForFunction(() => !document.querySelector('#aiChipsRow').hidden);
    assert.equal(await tutor.$eval('#aiComposerInput', n => n.value), 'Keep this draft');
    assert.equal(await tutor.evaluate(() => window.originalShell === document.querySelector('.ai-tutor-wrap') && window.originalThread === document.querySelector('#aiChatThread')), true, 'suggestion toggles preserve shell and thread');
    assert.equal(await tutor.$('.lang-btn'), null, 'settings are not rendered in the sheet');
    const settings = await ctx.newPage();
    await settings.goto(base + '#/you', {waitUntil:'networkidle0'});
    await settings.select('#aiLanguageSelect', 'Bengali');
    assert.equal(await settings.evaluate(() => JSON.parse(localStorage.getItem('jelet_ai_vault_v1')).preferredLanguage), 'Bengali');
    await settings.close();
    assert.equal(await tutor.$eval('#aiComposerInput', n => n.value), 'Keep this draft');
    await tutor.click('#aiHistoryBtn');
    await tutor.waitForSelector('#aiHistorySearch');
    assert.equal(await tutor.evaluate(() => document.activeElement.id), 'aiHistorySearch');
    assert.equal(await tutor.$eval('#aiHistoryBtn', n => n.getAttribute('aria-expanded')), 'true');
    await tutor.evaluate(() => {
      const root = document.querySelector('.ai-history-drawer');
      const nodes = [...root.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], summary, [tabindex]:not([tabindex="-1"])')].filter(n => n.getClientRects().length && !n.closest('[hidden]'));
      nodes.at(-1).focus(); window.drawerFirst = nodes[0];
    });
    await tutor.keyboard.press('Tab');
    assert.equal(await tutor.evaluate(() => document.activeElement === window.drawerFirst), true, 'drawer traps Tab');
    const drawerWidth = await tutor.$eval('.ai-history-drawer', n => n.getBoundingClientRect().width);
    assert.ok(drawerWidth >= 280 && drawerWidth <= 300, `drawer width ${drawerWidth}`);
    await tutor.type('#aiHistorySearch', 'matrices');
    assert.equal(await tutor.$$eval('.ai-history-row', rows => rows.filter(row => !row.hidden).length), 1);
    await tutor.keyboard.press('Escape');
    assert.equal(await tutor.$eval('#aiHistoryBtn', n => n.getAttribute('aria-expanded')), 'false');
    assert.equal(await tutor.evaluate(() => document.activeElement.id), 'aiHistoryBtn');
    assert.equal(await tutor.$eval('#aiComposerInput', n => n.value), 'Keep this draft');
    await tutor.click('#aiHistoryBtn');
    await tutor.waitForSelector('#aiHistorySearch');
    await tutor.click('.ai-history-scrim', {offset:{x:370,y:300}});
    await tutor.waitForSelector('.ai-history-drawer', {hidden:true});
    await tutor.click('#aiHistoryBtn');
    await tutor.waitForSelector('#aiHistorySearch');
    await tutor.type('#aiHistorySearch', 'matrices');
    await tutor.waitForFunction(() => document.querySelector('.ai-history-drawer')?.getBoundingClientRect().left >= 0);
    await tutor.click('.ai-history-row:not([hidden]) .ai-history-row__main');
    await tutor.waitForFunction(() => document.querySelector('#aiChatThread')?.textContent.includes('Saved solution'));
    assert.equal(await tutor.$$eval('#aiChatThread .ai-msg', rows => rows.length), 2, 'history restore must not seed again');
    await tutor.evaluate(() => Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:async text => { window.copiedAnswer = text; }}}));
    await tutor.click('.ai-copy-reply');
    assert.equal(await tutor.evaluate(() => window.copiedAnswer), 'Saved solution');
    await tutor.click('.ai-regenerate-reply');
    await tutor.waitForFunction(() => document.querySelectorAll('#aiChatThread .ai-msg--user').length === 2);
    assert.equal(await tutor.$$eval('#aiChatThread .ai-msg--user', rows => rows[1].textContent.includes('Eigenvalues')), true);
    await tutor.evaluate(() => {
      const root=document.querySelector('#aiSheet');
      const nodes=[...root.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], summary, [tabindex]:not([tabindex="-1"])')].filter(n=>n.getClientRects().length && !n.closest('[hidden], [inert]'));
      nodes.at(-1).focus(); window.sheetFirst=nodes[0];
    });
    await tutor.keyboard.press('Tab');
    assert.equal(await tutor.evaluate(() => document.activeElement === window.sheetFirst), true, 'sheet traps Tab');
    await tutor.keyboard.press('Escape');
    assert.equal(await tutor.evaluate(() => document.activeElement.id), 'themeToggle');
    // Exercise real touch pointer events, including capture across the grip edge.
    await tutor.evaluate(async () => (await import('./assets/js/app.js')).openAiTutorContext({origin:'Swipe fixture'}));
    await tutor.waitForFunction(() => document.querySelector('#aiSheet').getAttribute('aria-hidden') === 'false');
    const rect = await tutor.$eval('#aiSheet .bottom-sheet__handle', n => { const r=n.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; });
    const cdp = await tutor.createCDPSession();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rect.x,y:rect.y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rect.x,y:rect.y+100}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await tutor.waitForFunction(() => document.querySelector('#aiSheet').getAttribute('aria-hidden') === 'true');
    checks += 10;
    await ctx.close();
  }
  // Tutor state card and drawer layout at each phone width (not just app routes).
  for (const width of [360, 390, 414]) {
    const ctx = await browser.createBrowserContext();
    const phone = await ctx.newPage();
    phone.on('pageerror', e => errors.push(e.message));
    phone.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await phone.setViewport({width,height:844,isMobile:true,hasTouch:true});
    await phone.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await phone.goto(base + '#/', {waitUntil:'networkidle0'});
    await phone.evaluate(async () => {
      localStorage.setItem('jelet_ai_vault_v1', JSON.stringify({provider:'gemini',apiKey:'fixture',acceptedWelcomeVersion:1}));
      const original = window.fetch;
      window.fetch = (url, options) => String(url).startsWith('https://generativelanguage.googleapis.com/')
        ? Promise.resolve(new Response(JSON.stringify({error:{message:'bad key'}}), {status:401,headers:{'Content-Type':'application/json'}}))
        : original(url, options);
      (await import('./assets/js/app.js')).openAiTutorContext({origin:'Viewport fixture'});
    });
    await phone.waitForSelector('#aiComposerInput');
    await phone.type('#aiComposerInput', 'Test card');
    await phone.$eval('#aiComposerForm', n => n.requestSubmit());
    await phone.waitForFunction(() => document.querySelector('#aiRequestState')?.textContent.includes('Key or access rejected'));
    assert.ok(await phone.evaluate(() => {
      const s=document.querySelector('#aiSheet'), c=document.querySelector('#aiRequestState');
      return document.documentElement.scrollWidth <= innerWidth + 1 && s.scrollWidth <= s.clientWidth + 1 && c.scrollWidth <= c.clientWidth + 1;
    }), `tutor card overflow at ${width}`);
    await phone.click('#aiHistoryBtn');
    await phone.waitForSelector('#aiHistorySearch');
    assert.ok(await phone.evaluate(() => {
      const d=document.querySelector('.ai-history-drawer'); const r=d.getBoundingClientRect();
      return r.left >= -1 && r.right <= innerWidth + 1 && d.scrollWidth <= d.clientWidth + 1;
    }), `tutor drawer overflow at ${width}`);
    checks++;
    await ctx.close();
  }
  // A pinned desktop panel survives browsing but never a timed-mock route.
  {
    const ctx = await browser.createBrowserContext();
    const tutor = await ctx.newPage();
    tutor.on('pageerror', e => errors.push(e.message));
    tutor.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await tutor.setViewport({width:1440,height:900});
    await tutor.goto(base + '#/', {waitUntil:'networkidle0'});
    await tutor.evaluate(async () => (await import('./assets/js/app.js')).openAiTutorContext({origin:'Pin fixture'}));
    await tutor.waitForSelector('#aiComposerInput');
    await tutor.waitForFunction(() => document.querySelector('#aiHistoryBtn')?.getBoundingClientRect().width > 0 && document.querySelector('#aiHistoryBtn').getBoundingClientRect().right <= innerWidth);
    await tutor.click('#aiHistoryBtn');
    await tutor.waitForSelector('#aiHistorySearch');
    assert.equal(await tutor.$eval('.ai-history-scrim', n => getComputedStyle(n).display), 'none');
    assert.ok(Math.abs(await tutor.$eval('.ai-history-drawer', n => n.getBoundingClientRect().width) - 360) < 1);
    assert.ok(await tutor.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await tutor.addStyleTag({content:'html { font-size: 200% !important; }'});
    assert.ok(await tutor.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'desktop drawer at 200% text does not overflow');
    assert.ok(await tutor.evaluate(() => document.querySelector('.ai-history-drawer').getBoundingClientRect().right <= innerWidth), 'desktop drawer remains visible at 200% text');
    await tutor.keyboard.press('Escape');
    await tutor.click('#aiPinBtn');
    assert.equal(await tutor.$eval('#aiSheet', n => n.getAttribute('aria-modal')), 'false');
    await tutor.evaluate(() => { location.hash = '#/learn'; });
    await tutor.waitForFunction(() => location.hash === '#/learn' && document.querySelector('main .card'));
    assert.equal(await tutor.$eval('#aiSheet', n => n.getAttribute('aria-hidden')), 'false');
    await tutor.evaluate(() => { location.hash = '#/exam/nonexistent'; });
    await tutor.waitForFunction(() => document.querySelector('main')?.textContent.includes('Exam session not found'));
    assert.equal(await tutor.$eval('#aiSheet', n => n.getAttribute('aria-hidden')), 'true');
    await tutor.evaluate(async () => (await import('./assets/js/app.js')).openAiTutorContext({origin:'Must remain locked'}));
    assert.equal(await tutor.$eval('#aiSheet', n => n.getAttribute('aria-hidden')), 'true');
    checks += 2;
    await ctx.close();
  }
  // 14C: upgrade-safe settings and a pinned draft react without replacing the chat.
  {
    const ctx = await browser.createBrowserContext();
    const settings = await ctx.newPage();
    settings.on('pageerror', e => errors.push(e.message));
    settings.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await settings.setViewport({width:1440,height:900});
    await settings.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await settings.goto(base + '#/', {waitUntil:'networkidle0'});
    await settings.evaluate(async () => {
      localStorage.setItem('jelet_ai_vault_v1', JSON.stringify({provider:'gemini',model:'gemini-2.5-flash',apiKey:'fixture',previewPrompt:true,acceptedWelcomeVersion:1}));
      const db = await import('./assets/js/db/indexeddb.js');
      const {localDay} = await import('./assets/js/core/ai-governor.js');
      await db.put('meta', {key:'aiGovernor',providers:{},ledger:{gemini:{day:localDay(),requests:12,promptTokens:20,outputTokens:7}},lastErrors:{gemini:{kind:'auth',at:Date.now()}}});
      (await import('./assets/js/app.js')).openAiTutorContext({origin:'Settings fixture'});
    });
    await settings.waitForSelector('#aiComposerInput');
    await settings.type('#aiComposerInput','Unsent draft survives');
    await settings.evaluate(() => { window.pinnedThread = document.querySelector('#aiChatThread'); window.pinnedComposer = document.querySelector('#aiComposerInput'); });
    await settings.click('#aiPinBtn');
    await settings.evaluate(() => {location.hash='#/you';});
    await settings.waitForSelector('#aiModelModeSelect');
    await settings.waitForFunction(() => document.querySelector('#aiUsageDashboard')?.textContent.includes('12 / 100'));
    assert.match(await settings.$eval('#aiUsageDashboard', n => n.textContent), /27 tokens/);
    assert.match(await settings.$eval('#aiUsageDashboard', n => n.textContent), /last error: auth/);
    assert.equal(await settings.$eval('#aiDefaultUpgradeNotice', n => n.hidden), false);
    assert.equal(await settings.$eval('#aiModelModeSelect', n => n.value), 'model:gemini-2.5-flash');
    assert.equal(await settings.$eval('#aiPreviewToggleBtn', n => n.getAttribute('aria-checked')), 'true');
    await settings.click('#dismissAiDefaultNotice');
    assert.equal(await settings.$eval('#aiDefaultUpgradeNotice', n => n.hidden), true);
    await settings.select('#aiModelModeSelect','default');
    assert.match(await settings.$eval('.ai-prompt-preview summary', n => n.textContent), /gemini-3.1-flash-lite/);
    assert.equal(await settings.$eval('#aiComposerInput', n => n.value),'Unsent draft survives');
    assert.equal(await settings.evaluate(() => window.pinnedThread === document.querySelector('#aiChatThread') && window.pinnedComposer === document.querySelector('#aiComposerInput')),true);
    await settings.$eval('#aiTemperature', n => {n.value='2'; n.dispatchEvent(new Event('change',{bubbles:true}));});
    await settings.$eval('#aiMaxOutputTokens', n => {n.value='99'; n.dispatchEvent(new Event('change',{bubbles:true}));});
    await settings.select('#aiLanguageSelect','Hinglish');
    const preview = await settings.$eval('#promptJsonPre', n => JSON.parse(n.textContent));
    assert.equal(preview.generationConfig.temperature, 1);
    assert.equal(preview.generationConfig.maxOutputTokens, 256);
    assert.match(preview.system_instruction.parts[0].text, /Preferred Language: Hinglish/);
    await settings.$eval('#aiPreviewToggleBtn', n => n.click());
    assert.equal(await settings.$('.ai-prompt-preview'),null);
    await settings.$eval('#aiPreviewToggleBtn', n => n.click());
    assert.match(await settings.$eval('.ai-prompt-preview summary', n => n.textContent), /gemini-3.1-flash-lite/);
    await settings.select('#aiProviderSelect','nvidia');
    assert.match(await settings.$eval('#aiSheetModeBadge', n => n.textContent), /Offline/);
    await settings.$eval('#aiKeyInput', n => { n.value='nvidia-fixture-key'; });
    await settings.$eval('#saveAiKeyBtn', n => n.click());
    await settings.waitForFunction(() => document.querySelector('#aiSheetModeBadge')?.textContent.includes('NVIDIA'));
    assert.match(await settings.$eval('#aiSheetModeBadge', n => n.textContent), /NVIDIA/);
    assert.match(await settings.$eval('.ai-prompt-preview summary', n => n.textContent), /nemotron/);
    assert.equal(await settings.$eval('#aiComposerInput', n => n.value),'Unsent draft survives');
    checks += 4;
    await ctx.close();
  }
  // Even with a saved key, opening a question seeds the verified offline
  // explanation without a provider request or accidental quota spend.
  {
    const ctx=await browser.createBrowserContext(), p=await ctx.newPage();
    p.on('pageerror',e=>errors.push(e.message));
    await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await p.goto(base+'#/',{waitUntil:'networkidle0'});
    await p.evaluate(async()=>{
      localStorage.setItem('jelet_ai_vault_v1',JSON.stringify({provider:'gemini',apiKey:'fixture',acceptedWelcomeVersion:1}));
      const original=window.fetch; window.providerCount=0;
      window.fetch=(url,options)=>{if(String(url).startsWith('https://generativelanguage.googleapis.com/')){window.providerCount++; throw new Error('unexpected BYOK send');}return original(url,options);};
      const paper=await (await original('./_data/papers/2025.json')).json();
      (await import('./assets/js/app.js')).openAiTutorContext({question:paper.questions[0]});
    });
    await p.waitForFunction(()=>document.querySelector('#aiChatThread')?.textContent.includes('SymPy & WBJEEB Corpus'));
    assert.equal(await p.$eval('#aiContextPanel',n=>n.hidden),true);
    await p.$eval('#aiContextInfoBtn',n=>n.click());
    assert.match(await p.$eval('#aiContextPanel',n=>n.textContent),/Official Key:/);
    assert.equal(await p.evaluate(()=>window.providerCount),0);
    checks++;
    await ctx.close();
  }
  // If atomic shared storage is unavailable, live sends fail closed to corpus.
  {
    const ctx=await browser.createBrowserContext(), p=await ctx.newPage();
    p.on('pageerror',e=>errors.push(e.message));
    await p.evaluateOnNewDocument(()=>Object.defineProperty(window,'indexedDB',{value:undefined,configurable:true}));
    await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await p.goto(base+'#/',{waitUntil:'networkidle0'});
    await p.evaluate(async()=>{
      localStorage.setItem('jelet_ai_vault_v1',JSON.stringify({provider:'gemini',apiKey:'fixture',acceptedWelcomeVersion:1}));
      const original=window.fetch; window.providerCount=0;
      window.fetch=(url,options)=>{if(String(url).startsWith('https://generativelanguage.googleapis.com/')){window.providerCount++;throw new Error('unexpected BYOK send');}return original(url,options);};
      (await import('./assets/js/app.js')).openAiTutorContext({origin:'No storage fixture'});
    });
    await p.waitForSelector('#aiComposerInput');
    await p.type('#aiComposerInput','Question');
    await p.$eval('#aiComposerForm',n=>n.requestSubmit());
    await p.waitForFunction(()=>document.querySelector('#aiRequestState')?.textContent.includes('quota storage is unavailable'));
    assert.equal(await p.evaluate(()=>window.providerCount),0);
    assert.match(await p.$eval('#aiChatThread',n=>n.textContent),/Offline Fallback/);
    checks++;
    await ctx.close();
  }
  // Passphrase protection survives reload, while the decrypted key never enters
  // persistent storage or the study database. The passphrase is a fixture only.
  {
    const ctx = await browser.createBrowserContext();
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await p.goto(base + '#/you', {waitUntil:'networkidle0'});
    await p.type('#aiKeyInput','secret-browser-fixture-key');
    await p.type('#aiKeyPassphrase','browser test passphrase');
    await p.type('#aiKeyPassphraseConfirm','browser test passphrase');
    await p.click('#protectAiKeyBtn');
    await p.waitForFunction(()=>document.querySelector('#aiProtectionStatus')?.textContent.includes('Key encrypted'));
    const stored = await p.evaluate(()=>localStorage.getItem('jelet_ai_vault_v1'));
    assert.ok(!stored.includes('secret-browser-fixture-key') && !stored.includes('browser test passphrase'));
    assert.equal(JSON.parse(stored).keyEnvelope.algorithm,'AES-GCM');
    const dbText = await p.evaluate(async()=>JSON.stringify(await (await import('./assets/js/db/indexeddb.js')).collectStores()));
    assert.ok(!dbText.includes('secret-browser-fixture-key') && !dbText.includes('browser test passphrase'));
    await p.reload({waitUntil:'networkidle0'});
    await p.waitForSelector('#unlockAiKeyBtn');
    assert.match(await p.$eval('#aiProtectionStatus', n=>n.textContent),/locked/);
    await p.type('#aiKeyPassphrase','wrong passphrase');
    await p.click('#unlockAiKeyBtn');
    await p.waitForFunction(()=>document.querySelector('#aiProtectionStatus')?.textContent.includes('Unable to unlock'));
    assert.ok(!(await p.evaluate(async()=> (await import('./assets/js/core/ai-vault.js')).readAiVault().apiKey)));
    await p.$eval('#aiKeyPassphrase',n=>{n.value='';});
    await p.type('#aiKeyPassphrase','browser test passphrase');
    await p.click('#unlockAiKeyBtn');
    await p.waitForFunction(()=>document.querySelector('#aiProtectionStatus')?.textContent.includes('unlocked'));
    assert.equal(await p.evaluate(async()=> (await import('./assets/js/core/ai-vault.js')).readAiVault().apiKey),'secret-browser-fixture-key');
    const sibling = await ctx.newPage();
    await sibling.goto(base + '#/you', {waitUntil:'networkidle0'});
    assert.equal(await sibling.evaluate(async()=> (await import('./assets/js/core/ai-vault.js')).readAiVault().keyLocked),true);
    await sibling.close();
    await p.click('#lockAiKeyBtn');
    assert.equal(await p.evaluate(async()=> (await import('./assets/js/core/ai-vault.js')).readAiVault().keyLocked),true);
    checks += 2;
    await ctx.close();
  }
  // Verify an SSE chunk is visible before the response completes, and Stop
  // retains it with a Continue action without replacing the composer.
  {
    const ctx = await browser.createBrowserContext(), p = await ctx.newPage();
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await p.goto(base + '#/', {waitUntil:'networkidle0'});
    await p.evaluate(async()=>{
      localStorage.setItem('jelet_ai_vault_v1',JSON.stringify({provider:'gemini',apiKey:'fixture',acceptedWelcomeVersion:1,previewPrompt:true}));
      const orig=window.fetch;
      window.fetch=async(url,options)=>{
        if(!String(url).startsWith('https://generativelanguage.googleapis.com/')) return orig(url,options);
        window.streamBody=options.body; window.streamPreview=document.querySelector('#promptJsonPre').textContent; window.streamUrl=String(url);
        const body=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('data: '+JSON.stringify({candidates:[{content:{parts:[{text:'Visible partial answer'}]}}]})+'\n\n'));}});
        return new Response(body,{headers:{'Content-Type':'text/event-stream'}});
      };
      (await import('./assets/js/app.js')).openAiTutorContext({origin:'Streaming fixture'});
    });
    await p.waitForSelector('#aiComposerInput');
    await p.type('#aiComposerInput','Stream question');
    await p.evaluate(()=>{window.streamingComposer=document.querySelector('#aiComposerInput');});
    await p.$eval('#aiComposerForm',n=>n.requestSubmit());
    await p.waitForFunction(()=>document.querySelector('.ai-msg--streaming')?.textContent.includes('Visible partial answer'));
    assert.equal(await p.evaluate(()=>window.streamBody===window.streamPreview),true);
    assert.match(await p.evaluate(()=>window.streamUrl),/:streamGenerateContent/);
    assert.equal(await p.$eval('#aiSendBtn',n=>n.textContent),'Stop');
    assert.equal(await p.evaluate(()=>window.streamingComposer===document.querySelector('#aiComposerInput')),true);
    await p.$eval('#aiComposerForm',n=>n.requestSubmit());
    await p.waitForSelector('.ai-continue-chip');
    assert.equal(await p.$$eval('#aiChatThread .ai-msg--assistant',ns=>ns.filter(n=>n.textContent.includes('Visible partial answer')).length),1);
    checks += 2;
    await ctx.close();
  }
  // Simultaneous cross-tab reservations must serialize in IndexedDB.
  {
    const ctx = await browser.createBrowserContext();
    const a = await ctx.newPage(), b = await ctx.newPage();
    await Promise.all([a.goto(base + '#/', {waitUntil:'networkidle0'}), b.goto(base + '#/', {waitUntil:'networkidle0'})]);
    await a.evaluate(async () => { const db=await import('./assets/js/db/indexeddb.js'); await db.put('meta',{key:'aiGovernor',providers:{},ledger:{}}); });
    await Promise.all([a.evaluate(async()=>{await import('./assets/js/core/ai-governor-runtime.js');}), b.evaluate(async()=>{await import('./assets/js/core/ai-governor-runtime.js');})]);
    const start = Date.now() + 400;
    const reserve = page => page.evaluate(async start => {
      await new Promise(resolve=>setTimeout(resolve, Math.max(0,start-Date.now())));
      return (await import('./assets/js/core/ai-governor-runtime.js')).reserveGovernorSend('gemini', start);
    }, start);
    const verdicts = await Promise.all([reserve(a),reserve(b)]);
    assert.deepEqual(verdicts.map(v=>v.verdict).sort(), ['min-gap','ok']);
    const state = await a.evaluate(async()=> (await import('./assets/js/db/indexeddb.js')).get('meta','aiGovernor'));
    assert.equal(state.providers.gemini.count,1);
    assert.equal(state.ledger.gemini.requests,1);
    checks++;
    await ctx.close();
  }
  // Multiple keys: UI setup, same-provider failover, exact preview and manual mode.
  {
    const ctx = await browser.createBrowserContext(), p = await ctx.newPage();
    p.on('pageerror', e => errors.push(e.message));
    await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
    await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await p.goto(base+'#/you',{waitUntil:'networkidle0'});
    await p.select('#aiProviderSelect','nvidia');
    await p.type('#aiKeyInput','bad-fixture-key'); await p.click('#saveAiKeyBtn');
    await p.waitForFunction(()=>document.querySelectorAll('[data-remove-ai-key]').length===1);
    await p.type('#aiKeyInput','good-fixture-key'); await p.click('#saveAiKeyBtn');
    await p.waitForFunction(()=>document.querySelectorAll('[data-remove-ai-key]').length===2);
    assert.equal(await p.$eval('#aiKeyChoice',n=>n.value),'auto');
    await p.evaluate(async()=>{
      const ai=await import('./assets/js/core/ai-vault.js'); ai.writeAiVault({acceptedWelcomeVersion:1,previewPrompt:true});
      const original=window.fetch; window.multiSends=[];
      window.fetch=(url, options)=>{
        if(String(url).startsWith('https://integrate.api.nvidia.com/')) {
          window.multiSends.push({auth:options.headers.Authorization, body:options.body, preview:document.querySelector('#promptJsonPre')?.textContent});
          if(options.headers.Authorization.endsWith('bad-fixture-key')) return Promise.resolve(new Response('{}',{status:401,headers:{'Content-Type':'application/json'}}));
          return Promise.resolve(new Response(JSON.stringify({choices:[{message:{content:'Multi-key fixture answer'},finish_reason:'stop'}]}),{status:200,headers:{'Content-Type':'application/json'}}));
        }
        return original(url,options);
      };
      (await import('./assets/js/app.js')).openAiTutorContext({origin:'Multi key fixture'});
    });
    await p.waitForSelector('#aiChatKeyChoice');
    assert.equal(await p.$eval('#aiChatKeyChoice',n=>n.options.length),3);
    await p.type('#aiComposerInput','Explain the circuit'); await p.$eval('#aiComposerForm',n=>n.requestSubmit());
    await p.waitForFunction(()=>document.querySelector('#aiChatThread')?.textContent.includes('Multi-key fixture answer'),{timeout:12000});
    const sends=await p.evaluate(()=>window.multiSends);
    assert.deepEqual(sends.map(x=>x.auth),['Bearer bad-fixture-key','Bearer good-fixture-key']);
    assert.ok(sends.every(x=>x.body===x.preview && !x.body.includes('fixture-key')));
    const vault=await p.evaluate(async()=> (await import('./assets/js/core/ai-vault.js')).readAiVault());
    assert.equal(vault.apiKey,'good-fixture-key');
    const first=vault.vaultKeys.find(k=>k.secret==='bad-fixture-key');
    await p.select('#aiChatKeyChoice',first.id);
    assert.equal(await p.evaluate(async()=> (await import('./assets/js/core/ai-vault.js')).readAiVault().keyModes.nvidia),'manual');
    await p.evaluate(async()=>{const db=await import('./assets/js/db/indexeddb.js'); const rec=await db.get('meta','aiGovernor');rec.providers.nvidia.sends=[]; await db.put('meta',rec);});
    await p.type('#aiComposerInput','Manual key'); await p.$eval('#aiComposerForm',n=>n.requestSubmit());
    await p.waitForFunction(()=>document.querySelector('#aiRequestState')?.textContent.includes('rejected authentication or access'),{timeout:12000});
    assert.equal(await p.evaluate(()=>window.multiSends.length),3);
    const database=await p.evaluate(async()=>JSON.stringify(await (await import('./assets/js/db/indexeddb.js')).collectStores()));
    assert.ok(!database.includes('bad-fixture-key') && !database.includes('good-fixture-key'));
    checks += 3; await ctx.close();
  }
  // Connection tests identify the selected key without disclosing credentials.
  {
    const ctx=await browser.createBrowserContext(), p=await ctx.newPage();
    p.on('pageerror', e=>errors.push(e.message));
    await p.goto(base+'#/you',{waitUntil:'networkidle0'});
    await p.evaluate(()=>{
      localStorage.setItem('jelet_ai_vault_v1',JSON.stringify({provider:'nvidia',model:'nvidia/nemotron-3.5-lightning-30b-a3b',
        vaultKeys:[{id:'one',provider:'nvidia',label:'Key 1',secret:'test-key-one'}, {id:'two',provider:'nvidia',label:'Key 2',secret:'test-key-two'}]}));
    });
    await p.reload({waitUntil:'networkidle0'});
    await p.evaluate(()=>{
      const original=window.fetch; window.testSends=[];
      window.fetch=(url,options)=>{
        if(String(url).startsWith('https://integrate.api.nvidia.com/')) {
          window.testSends.push({auth:options.headers.Authorization, body:options.body});
          if(options.headers.Authorization.endsWith('test-key-one')) return Promise.resolve(new Response('{"error":"test-key-one"}',{status:403}));
          return Promise.resolve(new Response(JSON.stringify({choices:[{message:{content:'OK'}}]}),{status:200,headers:{'Content-Type':'application/json'}}));
        }
        return original(url,options);
      };
    });
    await p.click('#testAiConnBtn');
    await p.waitForFunction(()=>document.querySelector('#aiConnDiagnostic')?.textContent.includes('HTTP 403'));
    const err=await p.$eval('#aiConnDiagnostic',n=>n.textContent);
    assert.match(err,/Key 1.*direct browser.*permissions/); assert.ok(!err.includes('test-key-one'));
    await p.select('#aiKeyChoice','two'); await p.click('#testAiConnBtn');
    await p.waitForFunction(()=>document.querySelector('#aiConnDiagnostic')?.textContent.includes('connected to'));
    assert.match(await p.$eval('#aiConnDiagnostic',n=>n.textContent),/Key 2.*zero study data sent/);
    const sends=await p.evaluate(()=>window.testSends);
    assert.deepEqual(sends.map(s=>s.auth),['Bearer test-key-one','Bearer test-key-two']);
    assert.ok(sends.every(s=>JSON.parse(s.body).max_tokens===8 && !s.body.includes('test-key')));
    checks += 2; await ctx.close();
  }
  // Explicit cross-provider consent: never contact Gemini before confirmation.
  {
    const ctx = await browser.createBrowserContext(), p = await ctx.newPage();
    p.on('pageerror', e => errors.push(e.message));
    await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
    await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await p.goto(base+'#/',{waitUntil:'networkidle0'});
    await p.evaluate(async()=>{
      localStorage.setItem('jelet_ai_vault_v1', JSON.stringify({provider:'nvidia',model:'nvidia/nemotron-3.5-lightning-30b-a3b',acceptedWelcomeVersion:1,previewPrompt:true,
        vaultKeys:[{id:'nv',provider:'nvidia',label:'Key 1',secret:'nvidia-fixture'}, {id:'gem',provider:'gemini',label:'Key 1',secret:'gemini-fixture'}]}));
      const original=window.fetch; window.providerSends=[];
      window.fetch=(url,options)=>{
        if(String(url).startsWith('https://integrate.api.nvidia.com/')) {window.providerSends.push({provider:'nvidia',body:options.body}); return Promise.resolve(new Response('{}',{status:401}));}
        if(String(url).startsWith('https://generativelanguage.googleapis.com/')) {
          window.providerSends.push({provider:'gemini',body:options.body,preview:document.querySelector('#promptJsonPre')?.textContent});
          return Promise.resolve(new Response(JSON.stringify({candidates:[{content:{parts:[{text:'Gemini confirmed answer'}]},finishReason:'STOP'}]}),{status:200,headers:{'Content-Type':'application/json'}}));
        }
        return original(url,options);
      };
      (await import('./assets/js/app.js')).openAiTutorContext({origin:'Consent fixture'});
    });
    await p.waitForSelector('#aiComposerInput'); await p.type('#aiComposerInput','Explain Kirchhoff');
    await p.$eval('#aiComposerForm',n=>n.requestSubmit());
    await p.waitForSelector('[data-try-gemini]',{timeout:12000});
    assert.deepEqual(await p.evaluate(()=>window.providerSends.map(x=>x.provider)),['nvidia']);
    await p.$eval('[data-try-gemini]',n=>n.click());
    assert.match(await p.$eval('#aiRequestState',n=>n.textContent),/Google Gemini.*gemini-3.1-flash-lite/s);
    assert.ok(await p.evaluate(()=>{const card=document.querySelector('#aiRequestState').getBoundingClientRect(), button=document.querySelector('[data-confirm-gemini]').getBoundingClientRect(); return button.top >= card.top && button.bottom <= card.bottom && button.bottom <= innerHeight;}), 'Gemini confirmation controls visible on phone');
    const preview=await p.$eval('[data-gemini-preview]',n=>n.textContent);
    assert.ok(preview.includes('Explain Kirchhoff')); assert.ok(!preview.includes('nvidia-fixture') && !preview.includes('gemini-fixture'));
    await p.$eval('[data-cancel-gemini]',n=>n.click());
    assert.deepEqual(await p.evaluate(()=>window.providerSends.map(x=>x.provider)),['nvidia']);
    await p.evaluate(async()=> (await import('./assets/js/core/ai-vault.js')).updateAiKeys({removeId:'gem'}));
    await p.$eval('[data-try-gemini]',n=>n.click());
    assert.match(await p.$eval('#aiRequestState',n=>n.textContent),/Add and unlock a Gemini key/);
    assert.deepEqual(await p.evaluate(()=>window.providerSends.map(x=>x.provider)),['nvidia']);
    await p.evaluate(async()=> (await import('./assets/js/core/ai-vault.js')).updateAiKeys({add:{provider:'gemini',secret:'gemini-fixture'}}));
    await p.$eval('[data-try-gemini]',n=>n.click());
    await p.evaluate(async()=>{const ai=await import('./assets/js/core/ai-vault.js');const k=ai.readAiVault().vaultKeys.find(k=>k.provider==='gemini');await ai.updateAiKeys({removeId:k.id});});
    await p.$eval('[data-confirm-gemini]',n=>n.click());
    assert.match(await p.$eval('#aiRequestState',n=>n.textContent),/Gemini key or agreement changed/);
    assert.deepEqual(await p.evaluate(()=>window.providerSends.map(x=>x.provider)),['nvidia']);
    await p.evaluate(async()=> (await import('./assets/js/core/ai-vault.js')).updateAiKeys({add:{provider:'gemini',secret:'gemini-fixture'}}));
    await p.$eval('[data-try-gemini]',n=>n.click()); await p.$eval('[data-confirm-gemini]',n=>n.click());
    await p.waitForFunction(()=>document.querySelector('#aiChatThread')?.textContent.includes('Gemini confirmed answer'),{timeout:12000});
    const sends=await p.evaluate(()=>window.providerSends);
    assert.deepEqual(sends.map(x=>x.provider),['nvidia','gemini']);
    assert.equal(sends[1].body,preview); assert.equal(sends[1].preview,preview);
    assert.equal(await p.$$eval('#aiChatThread .ai-msg--user', ns=>ns.length),1);
    assert.match(await p.$eval('#aiChatThread',n=>n.textContent),/Google Gemini/);
    assert.equal(await p.evaluate(async()=> (await import('./assets/js/core/ai-vault.js')).readAiVault().provider),'nvidia');
    const ledger=await p.evaluate(async()=> (await import('./assets/js/db/indexeddb.js')).get('meta','aiGovernor'));
    assert.equal(ledger.ledger.nvidia.requests,1); assert.equal(ledger.ledger.gemini.requests,1);
    checks += 3; await ctx.close();
  }
  // Context toggle, centered jump-to-latest arrow, and current Gemini model labels.
  {
    const ctx=await browser.createBrowserContext(), p=await ctx.newPage();
    p.on('pageerror',e=>errors.push(e.message));
    await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
    await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await p.goto(base+'#/you',{waitUntil:'networkidle0'});
    await p.evaluate(()=>localStorage.setItem('jelet_ai_vault_v1',JSON.stringify({provider:'gemini',model:'gemini-2.5-flash',acceptedWelcomeVersion:1,vaultKeys:[{id:'gem-one',provider:'gemini',label:'Key 1',secret:'gem-fixture-one'},{id:'gem-two',provider:'gemini',label:'Key 2',secret:'gem-fixture-two'}]})));
    await p.reload({waitUntil:'networkidle0'});
    assert.match(await p.$eval('#aiKeyChoice',n=>n.textContent),/Key 1 · gemini-2.5-flash/);
    assert.match(await p.$eval('#aiSavedKeys',n=>n.textContent),/Key 2 · gemini-2.5-flash/);
    await p.select('#aiModelModeSelect','default');
    assert.match(await p.$eval('#aiKeyChoice',n=>n.textContent),/Key 1 · gemini-3.1-flash-lite/);
    await p.evaluate(async()=> (await import('./assets/js/app.js')).openAiTutorContext({origin:'Learn Explorer'}));
    await p.waitForSelector('#aiComposerInput');
    assert.match(await p.$eval('#aiChatKeyChoice',n=>n.textContent),/Key 1 · gemini-3.1-flash-lite/);
    await p.click('#aiContextInfoBtn');
    assert.match(await p.$eval('#aiContextPanel',n=>n.textContent),/From Learn Explorer/);
    await p.click('#aiContextInfoBtn');
    await p.evaluate(()=>{const thread=document.querySelector('#aiChatThread');const content=document.createElement('div');content.style.height='2000px';content.style.flexShrink='0';content.id='jump-test-content';thread.append(content);thread.scrollTop=0;thread.dispatchEvent(new Event('scroll'));});
    await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await p.waitForFunction(()=>!document.querySelector('#aiJumpLatest')?.hidden);
    assert.equal(await p.$eval('#aiJumpLatest',n=>n.hidden),false);
    assert.ok(await p.evaluate(()=>{const b=document.querySelector('#aiJumpLatest').getBoundingClientRect(),r=document.querySelector('.ai-thread-region').getBoundingClientRect();return Math.abs((b.left+b.right-r.left-r.right)/2)<1 && b.width>=48 && b.width<r.width/2 && b.left>r.left && b.right<r.right;}));
    await p.click('#aiJumpLatest');
    assert.equal(await p.$eval('#aiJumpLatest',n=>n.hidden),true);
    assert.ok(await p.$eval('#aiChatThread',n=>n.scrollTop+n.clientHeight>=n.scrollHeight-2));
    checks+=3; await ctx.close();
  }
  // NVIDIA browser network failures must not claim the key is invalid.
  {
    const ctx = await browser.createBrowserContext(), p = await ctx.newPage();
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await p.goto(base+'#/you',{waitUntil:'networkidle0'});
    await p.evaluate(()=>{
      localStorage.setItem('jelet_ai_vault_v1',JSON.stringify({provider:'nvidia',model:'nvidia/nemotron-3.5-lightning-30b-a3b',apiKey:'nvapi-fixture-secret',acceptedWelcomeVersion:1}));
      const original=window.fetch; window.nvidiaRequests=0;
      window.fetch=(url, options)=>{if(String(url).startsWith('https://integrate.api.nvidia.com/')){window.nvidiaRequests++;return Promise.reject(new TypeError('Failed to fetch'));} return original(url,options);};
    });
    await p.reload({waitUntil:'networkidle0'});
    await p.evaluate(()=>{
      const original=window.fetch; window.nvidiaRequests=0;
      window.fetch=(url, options)=>{if(String(url).startsWith('https://integrate.api.nvidia.com/')){window.nvidiaRequests++;return Promise.reject(new TypeError('Failed to fetch'));} return original(url,options);};
    });
    assert.equal(await p.$eval('#aiNvidiaBrowserNote',n=>n.hidden),false);
    await p.click('#testAiConnBtn');
    await p.waitForFunction(()=>document.querySelector('#aiConnDiagnostic')?.textContent.includes('CORS'));
    const diagnostic=await p.$eval('#aiConnDiagnostic',n=>n.textContent);
    assert.match(diagnostic,/key was not verified/i);
    assert.ok(!diagnostic.includes('nvapi-fixture-secret'));
    await p.evaluate(async()=> (await import('./assets/js/app.js')).openAiTutorContext({origin:'NVIDIA fixture'}));
    await p.waitForSelector('#aiComposerInput');
    await p.type('#aiComposerInput','Explain this');
    await p.$eval('#aiComposerForm',n=>n.requestSubmit());
    await p.waitForFunction(()=>document.querySelector('#aiRequestState')?.textContent.includes('CORS'));
    assert.match(await p.$eval('#aiRequestState',n=>n.textContent),/key was not verified/i);
    assert.match(await p.$eval('#aiChatThread',n=>n.textContent),/Offline Fallback/);
    checks += 2;
    await ctx.close();
  }
  // 14A live-request governor fixture: never contact a real provider.
  {
    const ctx = await browser.createBrowserContext();
    const tutor = await ctx.newPage();
    tutor.on('pageerror', e => errors.push(e.message));
    tutor.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await tutor.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await tutor.goto(base + '#/', {waitUntil:'networkidle0'});
    await tutor.evaluate(async () => {
      localStorage.setItem('jelet_ai_vault_v1', JSON.stringify({provider:'gemini',model:'gemini-2.5-flash',apiKey:'fixture',acceptedWelcomeVersion:1,previewPrompt:true}));
      const realFetch = window.fetch;
      window.aiTestRequests = [];
      window.aiTestPreviews = [];
      window.fetch = async (url, options) => {
        if (String(url).startsWith('https://generativelanguage.googleapis.com/')) {
          window.aiTestRequests.push(options.body);
          window.aiTestPreviews.push(document.querySelector('#promptJsonPre')?.textContent);
          if (window.aiErrorMode === 'rate') return new Response(JSON.stringify({error:{message:'rate limit'}}), {status:429,headers:{'Retry-After':'70','Content-Type':'application/json'}});
          if (window.aiErrorMode === 'network') throw new TypeError('fixture network failure');
          if (window.aiErrorMode === 'partial') return new Response(JSON.stringify({candidates:[{content:{parts:[{text:'Incomplete live fixture.'}]},finishReason:'MAX_TOKENS'}]}), {status:200,headers:{'Content-Type':'application/json'}});
          if (window.aiErrorMode === 'auth') return new Response(JSON.stringify({error:{message:'bad key'}}), {status:401,headers:{'Content-Type':'application/json'}});
          return new Response(JSON.stringify({candidates:[{content:{parts:[{text:'Fixture answer'}]},finishReason:'STOP'}],usageMetadata:{promptTokenCount:11,candidatesTokenCount:4}}), {status:200, headers:{'Content-Type':'application/json'}});
        }
        return realFetch(url, options);
      };
      const app = await import('./assets/js/app.js');
      app.openAiTutorContext({origin:'Governor fixture'});
    });
    await tutor.waitForSelector('#aiComposerInput');
    assert.equal(await tutor.$eval('.ai-prompt-preview', n => n.hidden), true, 'no phantom preview');
    await tutor.type('#aiComposerInput', 'First question');
    assert.equal(await tutor.$eval('.ai-prompt-preview', n => n.hidden), false);
    await tutor.$eval('#aiComposerForm', n => n.requestSubmit());
    await tutor.waitForFunction(() => document.querySelector('#aiChatThread')?.textContent.includes('Fixture answer'));
    const first = await tutor.evaluate(() => window.aiTestRequests.slice());
    assert.equal(first.length, 1);
    const sibling = await ctx.newPage();
    await sibling.goto(base + '#/', {waitUntil:'networkidle0'});
    const otherVerdict = await sibling.evaluate(async () => (await import('./assets/js/core/ai-governor-runtime.js')).reserveGovernorSend('gemini'));
    assert.ok(['min-gap', 'rpm'].includes(otherVerdict.verdict), 'sibling tab refreshes local window before sending');
    await sibling.close();
    assert.equal(await tutor.evaluate(() => window.aiTestPreviews[0]), first[0], 'visible preview equals sent body');
    const record = await tutor.evaluate(async () => (await import('./assets/js/db/indexeddb.js')).get('meta','aiGovernor'));
    assert.equal(record.providers.gemini.count, 1);
    assert.equal(record.ledger.gemini.promptTokens, 11);
    await tutor.type('#aiComposerInput', 'Second question');
    await tutor.$eval('#aiComposerForm', n => n.requestSubmit());
    await tutor.waitForFunction(() => document.querySelector('#aiRequestState')?.textContent.includes('Free-tier pacing'));
    assert.equal(await tutor.evaluate(() => window.aiTestRequests.length), 1, 'pacing does not fetch');
    assert.equal(await tutor.$eval('#aiComposerInput', n => n.disabled), true);
    assert.equal(await tutor.$eval('#aiChipsRow', n => n.hidden), true);
    await tutor.click('#aiRequestState button');
    await tutor.waitForFunction(() => document.querySelector('#aiRequestState')?.textContent.includes('Offline Corpus selected'));
    await tutor.evaluate(async () => {
      const db=await import('./assets/js/db/indexeddb.js');
      const record=await db.get('meta','aiGovernor');
      record.providers.gemini.count=0; record.providers.gemini.sends=[];
      await db.put('meta',record); window.aiErrorMode='rate';
    });
    await tutor.type('#aiComposerInput', 'Rate limit fixture');
    await tutor.$eval('#aiComposerForm', n => n.requestSubmit());
    await tutor.waitForFunction(() => document.querySelector('#aiRequestState')?.textContent.includes('Retrying in'));
    assert.equal(await tutor.evaluate(() => window.aiTestRequests.length), 2, '429 wait must not retry immediately');
    assert.equal(await tutor.$eval('#aiChipsRow', n => n.hidden), true);
    await tutor.click('#aiRequestState [data-use-offline]');
    await tutor.waitForFunction(() => document.querySelector('#aiRequestState')?.textContent.includes('Offline Corpus selected'));
    await tutor.evaluate(async () => {
      const db=await import('./assets/js/db/indexeddb.js');
      const record=await db.get('meta','aiGovernor');
      record.providers.gemini.count=0; record.providers.gemini.sends=[];
      await db.put('meta',record); window.aiErrorMode='auth';
    });
    await tutor.type('#aiComposerInput', 'Auth fixture');
    await tutor.$eval('#aiComposerForm', n => n.requestSubmit());
    await tutor.waitForFunction(() => document.querySelector('#aiRequestState')?.textContent.includes('Key or access rejected'));
    assert.equal(await tutor.evaluate(() => window.aiTestRequests.length), 3, 'auth errors are not retried');
    // A network error produces an offline answer and a retry action.
    await tutor.evaluate(async () => {
      const db=await import('./assets/js/db/indexeddb.js');
      const record=await db.get('meta','aiGovernor');
      record.providers.gemini.count=0; record.providers.gemini.sends=[];
      await db.put('meta',record); window.aiErrorMode='network';
    });
    await tutor.type('#aiComposerInput', 'Network fixture');
    await tutor.$eval('#aiComposerForm', n => n.requestSubmit());
    await tutor.waitForFunction(() => document.querySelector('#aiRequestState')?.textContent.includes('Could not reach'));
    assert.ok(await tutor.$('#aiRequestState [data-retry]'));
    assert.ok(await tutor.evaluate(() => document.querySelector('#aiChatThread').textContent.includes('Offline Fallback')));

    // Interrupt automatic continuation, then continue the actual partial rather
    // than the offline answer; the new displayed JSON must equal the POST.
    await tutor.evaluate(async () => {
      const db=await import('./assets/js/db/indexeddb.js');
      const record=await db.get('meta','aiGovernor');
      record.providers.gemini.count=0; record.providers.gemini.sends=[];
      await db.put('meta',record); window.aiErrorMode='partial';
    });
    await tutor.type('#aiComposerInput', 'Partial fixture');
    await tutor.$eval('#aiComposerForm', n => n.requestSubmit());
    await tutor.waitForFunction(() => document.querySelector('#aiRequestState')?.textContent.includes('Free-tier pacing'));
    await tutor.click('#aiRequestState [data-use-offline]');
    await tutor.waitForSelector('.ai-continue-chip');
    assert.ok(await tutor.evaluate(() => document.querySelector('#aiChatThread').textContent.includes('Incomplete live fixture.')));
    await tutor.evaluate(async () => {
      const db=await import('./assets/js/db/indexeddb.js');
      const record=await db.get('meta','aiGovernor');
      record.providers.gemini.count=0; record.providers.gemini.sends=[];
      await db.put('meta',record); window.aiErrorMode='success';
    });
    const beforeContinue = await tutor.evaluate(() => window.aiTestRequests.length);
    await tutor.click('.ai-continue-chip');
    await tutor.waitForFunction(n => window.aiTestRequests.length > n, {}, beforeContinue);
    const sentContinue = await tutor.evaluate(() => ({body:window.aiTestRequests.at(-1), preview:window.aiTestPreviews.at(-1)}));
    assert.equal(sentContinue.preview, sentContinue.body, 'manual continuation preview is byte exact');
    assert.ok(sentContinue.body.includes('Incomplete live fixture.'));
    assert.ok(!sentContinue.body.includes('Offline Fallback'), 'continue excludes later offline fallback');
    await tutor.waitForFunction(() => !document.querySelector('.ai-msg--thinking'));
    await tutor.evaluate(async () => {
      const db=await import('./assets/js/db/indexeddb.js');
      const record=await db.get('meta','aiGovernor');
      record.providers.gemini.count=100;
      await db.put('meta',record);
    });
    await tutor.type('#aiComposerInput', 'Third question');
    await tutor.$eval('#aiComposerForm', n => n.requestSubmit());
    await tutor.waitForFunction(() => document.querySelector('#aiRequestState')?.textContent.includes('Free daily quota used up'));
    assert.equal(await tutor.evaluate(() => window.aiTestRequests.length), beforeContinue + 1, 'daily block does not fetch');
    await tutor.click('#aiRequestState [data-ai-settings]');
    await tutor.waitForFunction(() => location.hash === '#/you');
    assert.equal(await tutor.$eval('#aiSheet', n => n.getAttribute('aria-hidden')), 'true');
    checks += 7;
    await ctx.close();
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
