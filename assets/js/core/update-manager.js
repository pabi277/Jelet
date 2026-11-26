/**
 * update-manager.js — JELET Study Hub (v3) · Safe auto-update & cache freshness
 * ---------------------------------------------------------------------------
 * When the project is updated and redeployed, every open browser must pick up
 * the new version automatically — without any data loss and without relying
 * on the old cache.
 *
 * How it works (zero-build, relative-path safe, local-first):
 *   1. `version.json` (repo root) is the single source of truth for the
 *      deployed build. It is ALWAYS fetched with `cache: "no-store"` so the
 *      HTTP cache and the Service Worker cache can never serve a stale copy.
 *   2. On load, on `online`, on tab-visible and on a 30-minute interval the
 *      manager fetches `version.json` and compares its `build` to the
 *      embedded `APP_BUILD`. A mismatch means a newer deploy is live.
 *   3. The manager asks the Service Worker registration to `update()` and,
 *      when a new worker is waiting, posts `SKIP_WAITING`. The new worker
 *      precaches fresh shell assets (no-store fetches), purges old caches on
 *      activate, and claims the clients.
 *   4. When the new worker takes control (`controllerchange`), the manager
 *      performs a SAFE reload: it waits until the tab is in a safe state
 *      (not mid-exam, not mid-practice-run, not typing, not streaming an AI
 *      reply) and then reloads exactly once per build.
 *
 * Data-loss guarantee:
 *   - Study state lives in IndexedDB (`jelet_hub_v1`) and the BYOK AI vault
 *     in isolated local storage. Neither is ever touched by this manager or
 *     by the Service Worker — only Cache Storage (precached shell/corpus) is
 *     purged and rebuilt. A reload therefore cannot lose attempts, sessions,
 *     bookmarks, notes, or keys.
 *   - Live exam / practice sessions persist to IndexedDB every few seconds
 *     (see `views/exam.js`), so even a deferred reload mid-session resumes
 *     cleanly. The manager still defers while those routes are active and
 *     applies the update on the next safe navigation.
 *   - Reload loops are impossible: `sessionStorage` records the build this
 *     tab already reloaded for, and reload only happens after a real
 *     `controllerchange` (new worker in control), never on a failed fetch.
 *
 * Freshness guarantee (no old-cache reliance):
 *   - `sw.js` serves same-origin GETs network-first with a cache fallback
 *     (online = always fresh, offline = cached shell). `version.json` is
 *     network-only and never cached.
 *   - Deploy headers (`_headers` / `vercel.json` / `netlify.toml`) mark
 *     `index.html`, `sw.js` and `version.json` as `must-revalidate` so the
 *     browser always revalidates them. See DEPLOY.md § "Updates & cache".
 *
 * All paths are relative (`./version.json`, `./sw.js`) so the app works
 * identically on localhost, Termux, and any `/<repo>/` subpath deploy.
 */

export const APP_VERSION = "3.0.0";
export const APP_BUILD = "2026-11-26-a1";
export const APP_SW_VERSION = "jelet-v3-sw-31";

const RELOAD_GUARD_KEY = "jelet_last_reload_build";
const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const SAFE_POLL_MS = 5000;
const MAX_SAFE_WAIT_MS = 5 * 60 * 1000; // give up waiting after 5 min, reload anyway on next safe tick

/**
 * True when the remote build is newer than the embedded build.
 * Pure helper (tested in `tests/update-manager.test.mjs`).
 */
export function isNewerBuild(remoteBuild, localBuild = APP_BUILD) {
  if (!remoteBuild || !localBuild) return false;
  return String(remoteBuild) !== String(localBuild);
}

/**
 * True when it is safe to reload this tab right now.
 * Unsafe while: an exam / practice runner is active, the user is typing in
 * a form field, or an AI reply is streaming. Pure DOM/route check (tested).
 */
export function isSafeToReload({ hash = "", activeTag = "", hasStreaming = false } = {}) {
  if (hasStreaming) return false;
  const h = String(hash || "");
  if (h.startsWith("#/exam/") || h.startsWith("#/practice-run/")) return false;
  const tag = String(activeTag || "").toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return false;
  return true;
}

/** Current safe-state snapshot for this tab (used by the poll loop). */
export function currentSafeState() {
  let hash = "";
  let activeTag = "";
  let hasStreaming = false;
  try {
    hash = typeof location !== "undefined" ? location.hash || "" : "";
  } catch { /* ignore */ }
  try {
    const active = typeof document !== "undefined" ? document.activeElement : null;
    activeTag = active && active.tagName ? active.tagName : "";
  } catch { /* ignore */ }
  try {
    hasStreaming = typeof document !== "undefined"
      ? Boolean(document.querySelector(".ai-msg--streaming"))
      : false;
  } catch { /* ignore */ }
  return { hash, activeTag, hasStreaming };
}

/** True when this tab already reloaded for `build` (loop guard). */
export function alreadyReloadedFor(build) {
  try {
    return sessionStorage.getItem(RELOAD_GUARD_KEY) === String(build);
  } catch {
    return false;
  }
}

/** Record that this tab reloaded for `build`. */
export function markReloadedFor(build) {
  try {
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(build));
  } catch { /* sessionStorage may be unavailable — reload still works, guard degrades */ }
}

/** Fetch the deployed `version.json` (never cached). Returns null offline. */
export async function fetchRemoteVersion() {
  try {
    const res = await fetch("./version.json", { cache: "no-store" });
    if (!res || !res.ok) return null;
    const data = await res.json();
    if (!data || typeof data.build !== "string" || !data.build) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Show (or reuse) the non-blocking update banner. Returns the banner node.
 * The banner is informational: auto-reload happens when safe regardless of
 * whether the user taps "Reload now". "Later" hides it for this check cycle.
 */
export function showUpdateBanner(remoteBuild) {
  if (typeof document === "undefined") return null;
  let banner = document.getElementById("updateBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "updateBanner";
    banner.className = "update-banner";
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    document.body.appendChild(banner);
  }
  banner.hidden = false;
  banner.innerHTML = "";
  const text = document.createElement("span");
  text.className = "update-banner__text";
  text.textContent = `JELET Hub updated (build ${remoteBuild}) — reloading to the new version. Your study data is safe.`;
  const reloadBtn = document.createElement("button");
  reloadBtn.type = "button";
  reloadBtn.className = "btn btn--primary btn--sm";
  reloadBtn.textContent = "Reload now";
  reloadBtn.addEventListener("click", () => {
    markReloadedFor(remoteBuild);
    location.reload();
  });
  const laterBtn = document.createElement("button");
  laterBtn.type = "button";
  laterBtn.className = "btn btn--ghost btn--sm";
  laterBtn.textContent = "Later";
  laterBtn.addEventListener("click", () => {
    banner.hidden = true;
  });
  banner.appendChild(text);
  banner.appendChild(reloadBtn);
  banner.appendChild(laterBtn);
  return banner;
}

/** Hide the update banner (used after a successful reload cycle). */
export function hideUpdateBanner() {
  try {
    const banner = document.getElementById("updateBanner");
    if (banner) banner.hidden = true;
  } catch { /* ignore */ }
}

/**
 * Wait until the tab is safe to reload, then reload once.
 * Polls every `SAFE_POLL_MS`; after `MAX_SAFE_WAIT_MS` it reloads anyway
 * (IndexedDB state is already persisted, so this cannot lose data) — except
 * it never reloads mid-exam/practice-run: in that case it keeps waiting
 * until the user leaves the runner (the banner stays visible meanwhile).
 */
export function safeReloadOnce(remoteBuild, { pollMs = SAFE_POLL_MS, maxWaitMs = MAX_SAFE_WAIT_MS } = {}) {
  if (alreadyReloadedFor(remoteBuild)) return;
  const startedAt = Date.now();
  const tryReload = () => {
    if (alreadyReloadedFor(remoteBuild)) return;
    const state = currentSafeState();
    const inRunner = String(state.hash || "").startsWith("#/exam/") ||
      String(state.hash || "").startsWith("#/practice-run/");
    if (isSafeToReload(state)) {
      markReloadedFor(remoteBuild);
      hideUpdateBanner();
      location.reload();
      return;
    }
    // Never interrupt a live runner — keep waiting past the max-wait cap.
    if (!inRunner && Date.now() - startedAt > maxWaitMs) {
      markReloadedFor(remoteBuild);
      hideUpdateBanner();
      location.reload();
      return;
    }
    setTimeout(tryReload, pollMs);
  };
  // Small initial delay so the banner is visible before the reload.
  setTimeout(tryReload, 1200);
}

/**
 * Ask the waiting Service Worker (if any) to activate now.
 * Returns true when a waiting worker was told to skip waiting.
 */
export async function activateWaitingWorker(registration) {
  try {
    if (!registration) return false;
    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * One update check: fetch `version.json`, compare builds, and if newer,
 * trigger the SW update + banner + safe reload. Never throws.
 */
export async function checkForUpdate({ registration = null } = {}) {
  const remote = await fetchRemoteVersion();
  if (!remote) return { updated: false, reason: "offline-or-unreachable" };
  if (!isNewerBuild(remote.build)) return { updated: false, reason: "up-to-date", build: remote.build };

  // Newer deploy is live. Show the banner immediately (even if the SW
  // update below needs a moment), then drive the SW to the new version.
  showUpdateBanner(remote.build);

  try {
    let reg = registration;
    if (!reg && "serviceWorker" in navigator) {
      reg = await navigator.serviceWorker.getRegistration("./");
    }
    if (reg) {
      await reg.update().catch(() => {});
      if (await activateWaitingWorker(reg)) {
        // `controllerchange` (wired in initUpdateManager) will safe-reload.
        return { updated: true, build: remote.build, via: "waiting-worker" };
      }
      // No waiting worker yet (still installing): watch for it.
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) {
            activateWaitingWorker(reg);
          }
        });
      });
      return { updated: true, build: remote.build, via: "updatefound-watch" };
    }
  } catch { /* SW unavailable — banner still offers a manual reload */ }

  // No SW (e.g. plain http preview): a plain reload picks up fresh assets
  // because navigations are network-first. Still go through safeReloadOnce.
  safeReloadOnce(remote.build);
  return { updated: true, build: remote.build, via: "no-sw-reload" };
}

/**
 * Wire the update manager: version checks on load / online / visible /
 * interval, plus `controllerchange` → safe reload. Call once from `app.js`
 * after SW registration. Never throws; never blocks the app.
 */
export function initUpdateManager({ registration = null } = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (initUpdateManager._started) return;
  initUpdateManager._started = true;

  let pendingBuild = null;

  const onControllerChange = () => {
    if (pendingBuild) {
      safeReloadOnce(pendingBuild);
      pendingBuild = null;
      return;
    }
    // A new worker took control without a pending version check (e.g. the
    // browser updated the SW in the background). Reload once to the fresh
    // shell — safe because IndexedDB state is untouched by the SW.
    void fetchRemoteVersion().then((remote) => {
      if (remote && isNewerBuild(remote.build)) {
        showUpdateBanner(remote.build);
        safeReloadOnce(remote.build);
      }
    }).catch(() => {});
  };

  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    }
  } catch { /* ignore */ }

  const runCheck = () => {
    void checkForUpdate({ registration })
      .then((res) => {
        if (res && res.updated && res.build) pendingBuild = res.build;
      })
      .catch(() => {});
  };

  // Initial check shortly after first paint (do not block the app shell).
  setTimeout(runCheck, 1500);

  window.addEventListener("online", runCheck);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") runCheck();
  });
  setInterval(runCheck, CHECK_INTERVAL_MS);
}
