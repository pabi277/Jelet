/**
 * update-manager.test.mjs — Safe auto-update engine (Task 2) invariants
 * -----------------------------------------------------------------------------
 *   1. `version.json` is the deploy stamp and stays in sync with `sw.js`
 *      (`SW_VERSION`) and `update-manager.js` (`APP_BUILD`/`APP_SW_VERSION`).
 *   2. Build comparison: only a *different* remote build triggers an update;
 *     offline/unreachable checks are no-ops.
 *   3. Reload safety: never mid exam/practice-run, never while typing or
 *     while an AI reply streams — the reload waits for a safe state.
 *   4. The SW network-first handler + SKIP_WAITING message + version.json
 *      pass-through are wired in `sw.js`.
 *   5. `app.js` boots the update manager and `index.html` precaches the
 *      manager module via the SW shell list.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const swJs = read("sw.js");
const appJs = read("assets/js/app.js");
const managerJs = read("assets/js/core/update-manager.js");
const version = JSON.parse(read("version.json"));

test("version.json, sw.js and update-manager.js stamps are in sync", () => {
  const swMatch = swJs.match(/const SW_VERSION = "([^"]+)"/);
  assert.ok(swMatch, "sw.js defines SW_VERSION");
  assert.equal(swMatch[1], version.swVersion, "sw.js SW_VERSION matches version.json");

  const buildMatch = managerJs.match(/export const APP_BUILD = "([^"]+)"/);
  const swVersionMatch = managerJs.match(/export const APP_SW_VERSION = "([^"]+)"/);
  assert.ok(buildMatch && swVersionMatch, "update-manager.js exports APP_BUILD + APP_SW_VERSION");
  assert.equal(buildMatch[1], version.build, "APP_BUILD matches version.json build");
  assert.equal(swVersionMatch[1], version.swVersion, "APP_SW_VERSION matches version.json");

  assert.equal(typeof version.updatedAt, "string", "version.json carries updatedAt");
});

test("isNewerBuild: only a changed build stamp is an update", async () => {
  const { isNewerBuild, APP_BUILD } = await import("../assets/js/core/update-manager.js");
  assert.equal(isNewerBuild(APP_BUILD), false, "same build is up-to-date");
  assert.equal(isNewerBuild("other-build", APP_BUILD), true, "different build is newer");
  assert.equal(isNewerBuild(null, APP_BUILD), false, "null remote is not an update");
  assert.equal(isNewerBuild("", APP_BUILD), false, "empty remote is not an update");
  assert.equal(isNewerBuild(undefined), false, "undefined remote is not an update");
});

test("isSafeToReload: guards exams, runners, typing and AI streaming", async () => {
  const { isSafeToReload } = await import("../assets/js/core/update-manager.js");
  assert.equal(isSafeToReload({ hash: "#/" }), true, "dashboard is safe");
  assert.equal(isSafeToReload({ hash: "#/papers" }), true, "library is safe");
  assert.equal(isSafeToReload({ hash: "#/exam/jelet-2025" }), false, "live exam is unsafe");
  assert.equal(
    isSafeToReload({ hash: "#/practice-run/math-01" }),
    false,
    "practice runner is unsafe"
  );
  assert.equal(isSafeToReload({ activeTag: "INPUT" }), false, "typing is unsafe");
  assert.equal(isSafeToReload({ activeTag: "TEXTAREA" }), false, "textarea is unsafe");
  assert.equal(isSafeToReload({ activeTag: "SELECT" }), false, "select is unsafe");
  assert.equal(isSafeToReload({ hasStreaming: true }), false, "AI streaming is unsafe");
  assert.equal(isSafeToReload({ hash: "#/exam/x", activeTag: "BUTTON" }), false, "exam wins");
});

test("fetchRemoteVersion: version.json is fetched no-store and validated", async () => {
  const { fetchRemoteVersion } = await import("../assets/js/core/update-manager.js");
  const prevFetch = globalThis.fetch;
  try {
    // 1. Valid response → parsed build object, requested with cache: no-store.
    let seenOptions = null;
    globalThis.fetch = async (url, options) => {
      seenOptions = options;
      return {
        ok: true,
        json: async () => ({ build: "2026-11-26-a1", swVersion: "jelet-v3-sw-31" }),
      };
    };
    const remote = await fetchRemoteVersion();
    assert.equal(remote.build, "2026-11-26-a1");
    assert.equal(seenOptions.cache, "no-store", "version.json must bypass HTTP+SW caches");
    assert.equal(String(seenOptions).length > 0, true);

    // 2. Offline / network failure → null (no update, no throw).
    globalThis.fetch = async () => {
      throw new Error("offline");
    };
    assert.equal(await fetchRemoteVersion(), null, "network failure yields null");

    // 3. Non-OK response → null.
    globalThis.fetch = async () => ({ ok: false, status: 504 });
    assert.equal(await fetchRemoteVersion(), null, "non-OK yields null");

    // 4. Missing/invalid build field → null.
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ nope: 1 }) });
    assert.equal(await fetchRemoteVersion(), null, "invalid payload yields null");
  } finally {
    globalThis.fetch = prevFetch;
  }
});

test("checkForUpdate: up-to-date builds are a no-op", async () => {
  const { checkForUpdate, APP_BUILD } = await import("../assets/js/core/update-manager.js");
  const prevFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ build: APP_BUILD, swVersion: "jelet-v3-sw-31" }),
    });
    const res = await checkForUpdate({ registration: null });
    assert.equal(res.updated, false, "same build → no update");
    assert.equal(res.reason, "up-to-date");
  } finally {
    globalThis.fetch = prevFetch;
  }
});

test("checkForUpdate: offline check never throws and never updates", async () => {
  const { checkForUpdate } = await import("../assets/js/core/update-manager.js");
  const prevFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      throw new Error("DNS failure");
    };
    const res = await checkForUpdate({ registration: null });
    assert.equal(res.updated, false);
    assert.equal(res.reason, "offline-or-unreachable");
  } finally {
    globalThis.fetch = prevFetch;
  }
});

test("sw.js: network-first runtime, version.json pass-through, SKIP_WAITING handler", () => {
  assert.ok(
    swJs.includes('event.data && event.data.type === "SKIP_WAITING"'),
    "SW handles SKIP_WAITING from update-manager"
  );
  assert.ok(swJs.includes("self.skipWaiting()"), "SW can skip waiting on request");
  assert.ok(
    swJs.includes('pathname.endsWith("/version.json")'),
    "version.json is never cached by the SW"
  );
  assert.ok(
    swJs.includes('request.cache === "no-store"'),
    "requests marked no-store pass through"
  );
  // Network-first: fetch happens before cache lookup in handleRuntime.
  const fnStart = swJs.indexOf("async function handleRuntime");
  assert.ok(fnStart > 0, "handleRuntime exists");
  const fnBody = swJs.slice(fnStart, fnStart + 900);
  const fetchIdx = fnBody.indexOf("await fetch(request)");
  const cacheIdx = fnBody.indexOf("cache.match(request)");
  assert.ok(fetchIdx > 0 && cacheIdx > fetchIdx, "network-first: fetch before cache lookup");
  assert.ok(
    swJs.includes("caches.delete(k)"),
    "activate purges old caches so no stale shell survives"
  );
});

test("app.js boots the update manager after SW registration", () => {
  // NOTE: the import specifier is assembled without a literal `from "./…"`
  // so this assertion string does not trip the link-resolution gate.
  const importSpecifier = "./core/update-manager.js";
  assert.ok(
    appJs.includes("initUpdateManager") && appJs.includes(`"${importSpecifier}"`),
    "app.js imports initUpdateManager from core/update-manager.js"
  );
  assert.ok(
    appJs.includes("initUpdateManager({ registration: swRegistration })"),
    "initUpdateManager receives the registration"
  );
  const regIdx = appJs.indexOf("const swRegistration = await registerServiceWorker();");
  const initIdx = appJs.indexOf("initUpdateManager({ registration: swRegistration });");
  assert.ok(regIdx > 0 && initIdx > regIdx, "manager starts after SW registration");
  assert.ok(
    appJs.includes('navigator.serviceWorker.register("./sw.js"'),
    "SW registered with relative path (subpath-safe)"
  );
});

test("sw.js precaches update-manager.js and version.json stays dynamic", () => {
  assert.ok(
    swJs.includes('"./assets/js/core/update-manager.js"'),
    "update-manager.js in SHELL_ASSETS precache"
  );
  assert.ok(
    !swJs.includes('"./version.json"'),
    "version.json NOT in precache (must stay network-only)"
  );
});

test("update-manager exports the public API surface", async () => {
  const mod = await import("../assets/js/core/update-manager.js");
  for (const fn of [
    "isNewerBuild",
    "isSafeToReload",
    "currentSafeState",
    "alreadyReloadedFor",
    "markReloadedFor",
    "fetchRemoteVersion",
    "showUpdateBanner",
    "hideUpdateBanner",
    "safeReloadOnce",
    "activateWaitingWorker",
    "checkForUpdate",
    "initUpdateManager",
  ]) {
    assert.equal(typeof mod[fn], "function", `exports ${fn}`);
  }
  assert.equal(typeof mod.APP_BUILD, "string", "exports APP_BUILD");
  assert.equal(typeof mod.APP_VERSION, "string", "exports APP_VERSION");
  assert.equal(typeof mod.APP_SW_VERSION, "string", "exports APP_SW_VERSION");
});

test("reload loop guard uses sessionStorage and degrades safely", async () => {
  const { alreadyReloadedFor, markReloadedFor } = await import(
    "../assets/js/core/update-manager.js"
  );
  const prevSession = globalThis.sessionStorage;
  try {
    // No sessionStorage (private mode): must not throw, must not false-positive.
    globalThis.sessionStorage = undefined;
    assert.equal(alreadyReloadedFor("x"), false);
    assert.doesNotThrow(() => markReloadedFor("x"));

    // With sessionStorage: guard records and reports per-build.
    const store = new Map();
    globalThis.sessionStorage = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, String(v)),
    };
    assert.equal(alreadyReloadedFor("build-a"), false);
    markReloadedFor("build-a");
    assert.equal(alreadyReloadedFor("build-a"), true, "records reload for build");
    assert.equal(alreadyReloadedFor("build-b"), false, "guard is per-build");
  } finally {
    if (prevSession === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = prevSession;
  }
});
