#!/usr/bin/env node
/**
 * check_responsive.mjs — JELET Study Hub (v3) · Phase 06 responsive regression gate
 * -----------------------------------------------------------------------------------
 * Headless-browser check that EVERY canonical route renders with ZERO horizontal
 * overflow and ZERO console errors at phone-first widths (360 / 390 / 414 px)
 * plus a 1440×900 desktop pass, per the Phase 06 brief:
 *
 *   assert document.documentElement.scrollWidth <= document.documentElement.clientWidth (+1px)
 *
 * Routes audited: #/ · #/learn · #/practice · #/papers · #/you ·
 *                 #/learn/P02 · #/papers/jelet-2025 · #/formulas
 *
 * Browser resolution order (first available wins):
 *   1. `$JELET_CHROMIUM_PATH` — explicit Chromium/Chrome executable.
 *   2. `@sparticuz/chromium`  — self-contained sandbox/Lambda Chromium shipped
 *      inside node_modules (resolved from the repo or `$JELET_PW_ROOT`), with
 *      its bundled NSS/NSPR shared libraries extracted for `LD_LIBRARY_PATH`.
 *   3. Well-known system Chromium/Chrome locations + `command -v` lookup.
 *
 * If no browser binary can be found the script prints a SKIP notice and exits 0
 * so browserless environments (e.g. minimal CI runners) do not break the gate
 * suite — but any *rendered* horizontal overflow or console error exits 1.
 *
 * Zero-repo-dependency: this script never modifies the app; the repo keeps its
 * "zero mandatory bundler" law (the optional tooling lives outside `package.json`).
 */

import http from "node:http";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

/* ------------------------------------------------------------------ *
 * Config
 * ------------------------------------------------------------------ */
const ROUTES = [
  { name: "Today", hash: "#/" },
  { name: "Learn explorer", hash: "#/learn" },
  { name: "Practice arena", hash: "#/practice" },
  { name: "Papers library", hash: "#/papers" },
  { name: "You & AI", hash: "#/you" },
  { name: "Unit lesson P02", hash: "#/learn/P02" },
  { name: "Unit formulas P02", hash: "#/learn/P02?tab=formulas" },
  { name: "Unit videos P02", hash: "#/learn/P02?tab=videos" },
  { name: "Paper reader 2025", hash: "#/papers/jelet-2025" },
  { name: "Formula sheet", hash: "#/formulas" },
];

const VIEWPORTS = [
  { label: "360", width: 360, height: 800, mobile: true },
  { label: "390", width: 390, height: 844, mobile: true },
  { label: "414", width: 414, height: 896, mobile: true },
  { label: "1440 desktop", width: 1440, height: 900, mobile: false },
];

const SETTLE_MS = 500; // let KaTeX render + async fetches finish
const TOLERANCE_PX = 1; // subpixel rounding headroom

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
};

/* ------------------------------------------------------------------ *
 * Static file server (relative-path app; serves repo root)
 * ------------------------------------------------------------------ */
function startServer() {
  return new Promise((resolveServe) => {
    const server = http.createServer(async (req, res) => {
      try {
        let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
        if (urlPath === "/favicon.ico") {
          res.writeHead(204).end();
          return;
        }
        if (urlPath.endsWith("/")) urlPath += "index.html";
        const filePath = path.join(ROOT, path.normalize(urlPath).replace(/^([.][.][/\\])+/, ""));
        if (!filePath.startsWith(ROOT)) {
          res.writeHead(403).end();
          return;
        }
        const data = await readFile(filePath);
        res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
        res.end(data);
      } catch {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
      }
    });
    server.listen(0, "127.0.0.1", () => resolveServe(server));
  });
}

/* ------------------------------------------------------------------ *
 * Optional-dependency resolver (puppeteer-core / @sparticuz/chromium)
 * ------------------------------------------------------------------ */
function resolveOptionalPkg(pkgName) {
  const roots = [ROOT, process.env.JELET_PW_ROOT, "/tmp/pwtool"].filter(Boolean);
  for (const root of roots) {
    try {
      const resolved = require.resolve(pkgName, { paths: [root] });
      return { entry: resolved, root };
    } catch {
      /* try next root */
    }
  }
  return null;
}

/** Extract @sparticuz/chromium's bundled NSS/NSPR libs for LD_LIBRARY_PATH. */
function extractSparticuzLibs(pkgRoot) {
  const libDir = fs.mkdtempSync(path.join(os.tmpdir(), "jelet-chromium-libs-"));
  fs.mkdirSync(path.join(libDir, "lib"), { recursive: true });
  const binDir = path.join(pkgRoot, "bin");
  for (const tarName of ["al2.tar.br", "al2023.tar.br"]) {
    const tarBr = path.join(binDir, tarName);
    if (!fs.existsSync(tarBr)) continue;
    const plain = zlib.brotliDecompressSync(fs.readFileSync(tarBr));
    const tarPath = path.join(libDir, tarName.replace(/\.br$/, ""));
    fs.writeFileSync(tarPath, plain);
    try {
      execSync(`tar -xf "${tarPath}" -C "${libDir}"`);
    } catch {
      /* some environments lack tar libs variants — non-fatal */
    }
    fs.unlinkSync(tarPath);
  }
  return libDir;
}

function findSystemChromium() {
  const candidates = [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/opt/google/chrome/chrome",
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  try {
    const which = execSync("command -v chromium chromium-browser google-chrome 2>/dev/null | head -1", {
      encoding: "utf8",
    }).trim();
    if (which) return which;
  } catch {
    /* none found */
  }
  return null;
}

async function resolveBrowser() {
  const puppeteer = resolveOptionalPkg("puppeteer-core");
  if (!puppeteer) {
    return { available: false, reason: "puppeteer-core not installed (tooling dependency)" };
  }
  const puppeteerMod = await import(pathToFileURL(puppeteer.entry).href);

  // 1. Explicit executable override
  if (process.env.JELET_CHROMIUM_PATH && fs.existsSync(process.env.JELET_CHROMIUM_PATH)) {
    return {
      available: true,
      launch: (extraEnv) =>
        puppeteerMod.launch({
          executablePath: process.env.JELET_CHROMIUM_PATH,
          headless: "shell",
          args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
          env: { ...process.env, ...extraEnv },
        }),
      label: `env override: ${process.env.JELET_CHROMIUM_PATH}`,
    };
  }

  // 2. Sandbox/Lambda Chromium shipped inside node_modules (self-contained)
  const sparticuz = resolveOptionalPkg("@sparticuz/chromium");
  if (sparticuz) {
    try {
      const pkgJsonPath = require.resolve("@sparticuz/chromium/package.json", { paths: [sparticuz.root] });
      const pkgRoot = path.dirname(pkgJsonPath);
      const sparticuzMod = await import(pathToFileURL(sparticuz.entry).href);
      const chromium = sparticuzMod.default || sparticuzMod;
      const execPath = await chromium.executablePath();
      const libDir = extractSparticuzLibs(pkgRoot);
      return {
        available: true,
        launch: (extraEnv) =>
          puppeteerMod.launch({
            executablePath: execPath,
            headless: "shell",
            args: [...(chromium.args || []), "--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
            env: {
              ...process.env,
              ...extraEnv,
              LD_LIBRARY_PATH: [path.join(libDir, "lib"), process.env.LD_LIBRARY_PATH].filter(Boolean).join(":"),
            },
          }),
        label: "@sparticuz/chromium (bundled)",
      };
    } catch (err) {
      /* fall through to system lookup */
      console.log(`  (note) @sparticuz/chromium found but launch prep failed: ${err.message}`);
    }
  }

  // 3. System Chromium/Chrome
  const sys = findSystemChromium();
  if (sys) {
    return {
      available: true,
      launch: (extraEnv) =>
        puppeteerMod.launch({
          executablePath: sys,
          headless: "shell",
          args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
          env: { ...process.env, ...extraEnv },
        }),
      label: `system browser: ${sys}`,
    };
  }

  return { available: false, reason: "no Chromium/Chrome binary available" };
}

/* ------------------------------------------------------------------ *
 * Main audit
 * ------------------------------------------------------------------ */
async function main() {
  const browserInfo = await resolveBrowser();
  if (!browserInfo.available) {
    console.log("⚠ check_responsive SKIPPED — " + browserInfo.reason);
    console.log("  Install tooling (e.g. `npm i puppeteer-core @sparticuz/chromium`) or set $JELET_CHROMIUM_PATH.");
    return 0;
  }

  const server = await startServer();
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}/`;
  console.log(`✓ Serving repo at ${base}`);
  console.log(`✓ Browser: ${browserInfo.label}`);

  const browser = await browserInfo.launch({});
  // Headless Chromium exits when its LAST page closes — keep one spare
  // "about:blank" page open for the whole audit so page cycling is safe.
  const keeper = await browser.newPage();

  const failures = [];
  const results = [];

  try {
    for (const vp of VIEWPORTS) {
      for (const route of ROUTES) {
        const page = await browser.newPage();
        await page.setViewport({
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: 1,
          isMobile: vp.mobile,
          hasTouch: vp.mobile,
        });

        const consoleErrors = [];
        const httpErrors = [];
        page.on("console", (msg) => {
          if (msg.type() === "error") consoleErrors.push(msg.text());
        });
        page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
        page.on("response", (res) => {
          const status = res.status();
          const url = res.url();
          if (status >= 400 && url.startsWith(base)) {
            httpErrors.push(`HTTP ${status} ${url.slice(base.length)}`);
          }
        });

        let metrics = null;
        let navError = null;
        try {
          await page.goto(base + route.hash, { waitUntil: "networkidle0", timeout: 30000 });
          // Neutralize the document-level `overflow-x: clip` guard while
          // measuring, so genuinely overflowing content is DETECTED rather
          // than silently clipped. Root-cause fixes are what this gate tests.
          await page.addStyleTag({
            content: "html, body { overflow-x: visible !important; }",
          });
          await new Promise((r) => setTimeout(r, SETTLE_MS));
          metrics = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            innerWidth: window.innerWidth,
            bodyScrollWidth: document.body ? document.body.scrollWidth : 0,
          }));
        } catch (err) {
          navError = err.message;
        }

        const overflow = metrics ? metrics.scrollWidth - metrics.clientWidth : null;
        const ok = !navError && metrics !== null && overflow <= TOLERANCE_PX && consoleErrors.length === 0 && httpErrors.length === 0;

        results.push({ vp: vp.label, route: route.hash, ok, overflow, consoleErrors, httpErrors, navError });
        if (!ok) {
          failures.push(
            `  ✗ [${vp.label}] ${route.hash}\n` +
              (navError ? `      navigation: ${navError}\n` : "") +
              (metrics && overflow > TOLERANCE_PX
                ? `      horizontal overflow: scrollWidth ${metrics.scrollWidth} > clientWidth ${metrics.clientWidth} (innerWidth ${metrics.innerWidth}, body ${metrics.bodyScrollWidth})\n`
                : "") +
              (consoleErrors.length ? `      console errors:\n        - ${consoleErrors.join("\n        - ")}\n` : "") +
              (httpErrors.length ? `      HTTP failures:\n        - ${httpErrors.join("\n        - ")}\n` : "")
          );
        }
        await page.close();
      }
    }

    // Phase 06 Interactive 360px & AMOLED Dark Mode Checks
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      const consoleErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

      const shotDir = process.env.JELET_SAVE_SHOTS || "";

      // 1. Free-text target college + Custom AI model reveal & persistence on #/you
      await page.goto(base + "#/you", { waitUntil: "networkidle0", timeout: 30000 });
      await page.addStyleTag({ content: "html, body { overflow-x: visible !important; }" });
      await page.waitForSelector("#profTargetInput");
      await page.$eval("#profTargetInput", (el) => {
        el.value = "Kalyani Govt. Engg. College CSE (2027)";
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await page.select("#aiModelModeSelect", "custom");
      const customVisible = await page.$eval("#aiCustomModelWrap", (el) => !el.hidden);
      await page.$eval("#aiCustomModelInput", (el) => {
        el.value = "gemini-2.5-pro";
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await new Promise((r) => setTimeout(r, 250));
      const youOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      if (shotDir) await page.screenshot({ path: path.join(shotDir, "shot-you-360.png") });

      await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
      await page.waitForSelector("#profTargetInput");
      const savedCollege = await page.$eval("#profTargetInput", (el) => el.value);
      const savedModel = await page.$eval("#aiCustomModelInput", (el) => el.value);
      const okYou =
        customVisible &&
        youOverflow <= TOLERANCE_PX &&
        savedCollege === "Kalyani Govt. Engg. College CSE (2027)" &&
        savedModel === "gemini-2.5-pro" &&
        consoleErrors.length === 0;
      results.push({ vp: "360 interactive", route: "#/you (college + custom model)", ok: okYou });
      if (!okYou) {
        failures.push(
          `  ✗ [360 interactive] #/you: customVisible=${customVisible}, overflow=${youOverflow}, savedCollege="${savedCollege}", savedModel="${savedModel}", errors=${consoleErrors.join("; ")}`
        );
      }

      // Switch to AMOLED Dark Mode
      await page.click("#youDarkSwitchBtn");
      await new Promise((r) => setTimeout(r, 150));

      // 2. Per-unit Formulas tab + Videos click-to-load facade in AMOLED Dark Mode at 360px
      await page.goto(base + "#/learn/P02?tab=formulas", { waitUntil: "networkidle0", timeout: 30000 });
      await page.addStyleTag({ content: "html, body { overflow-x: visible !important; }" });
      await new Promise((r) => setTimeout(r, SETTLE_MS));
      const p02Metrics = await page.evaluate(() => ({
        cards: document.querySelectorAll(".unit-formula-sheet .lesson-formula-card").length,
        katexErrors: document.querySelectorAll(".katex-error").length,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }));
      if (shotDir) await page.screenshot({ path: path.join(shotDir, "shot-p02-formulas-dark-360.png") });

      await page.click('button[data-tab="videos"]');
      await new Promise((r) => setTimeout(r, 250));
      const videoMetrics = await page.evaluate(() => ({
        facades: document.querySelectorAll(".js-mount-yt").length,
        preloadedIframes: document.querySelectorAll("iframe").length,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }));
      if (shotDir) await page.screenshot({ path: path.join(shotDir, "shot-p02-videos-dark-360.png") });

      const okP02 =
        p02Metrics.cards >= 3 &&
        p02Metrics.katexErrors === 0 &&
        p02Metrics.overflow <= TOLERANCE_PX &&
        videoMetrics.facades >= 1 &&
        videoMetrics.preloadedIframes === 0 &&
        videoMetrics.overflow <= TOLERANCE_PX &&
        consoleErrors.length === 0;
      results.push({ vp: "360 AMOLED", route: "#/learn/P02 (formulas + videos)", ok: okP02 });
      if (!okP02) {
        failures.push(
          `  ✗ [360 AMOLED] #/learn/P02: formulas=${JSON.stringify(p02Metrics)}, videos=${JSON.stringify(videoMetrics)}, errors=${consoleErrors.join("; ")}`
        );
      }

      // 3. Paper Reader grouped action bar at 360px in AMOLED Dark Mode
      await page.goto(base + "#/papers/jelet-2025", { waitUntil: "networkidle0", timeout: 30000 });
      await page.addStyleTag({ content: "html, body { overflow-x: visible !important; }" });
      await new Promise((r) => setTimeout(r, SETTLE_MS));
      const readerMetrics = await page.evaluate(() => {
        const bar = document.querySelector(".reader-action-bar");
        const items = bar ? Array.from(bar.querySelectorAll(".reader-action-bar__item")).map((n) => n.textContent.trim()) : [];
        return {
          hasBar: Boolean(bar),
          items,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      if (shotDir) await page.screenshot({ path: path.join(shotDir, "shot-reader-dark-360.png") });
      const okReader =
        readerMetrics.hasBar &&
        readerMetrics.items.length === 3 &&
        readerMetrics.items[0].includes("Read & Keys") &&
        readerMetrics.items[1].includes("Print OMR") &&
        readerMetrics.items[2].includes("Start 2h Mock") &&
        readerMetrics.overflow <= TOLERANCE_PX &&
        consoleErrors.length === 0;
      results.push({ vp: "360 AMOLED", route: "#/papers/jelet-2025 (action bar)", ok: okReader });
      if (!okReader) {
        failures.push(
          `  ✗ [360 AMOLED] #/papers/jelet-2025: reader=${JSON.stringify(readerMetrics)}, errors=${consoleErrors.join("; ")}`
        );
      }

      await page.close();
    }
  } finally {
    await keeper.close().catch(() => {});
    await browser.close();
    server.close();
  }

  const total = results.length;
  const passed = results.filter((r) => r.ok).length;
  console.log("\nResponsive audit — " + passed + "/" + total + " route×viewport checks passed");
  if (failures.length) {
    console.error("✗ check_responsive FAILED — horizontal overflow / console errors found:\n" + failures.join("\n"));
    return 1;
  }
  console.log("✓ check_responsive PASSED — zero horizontal scroll & zero console errors on all routes (360/390/414 + 1440).");
  return 0;
}

process.exit(await main());
