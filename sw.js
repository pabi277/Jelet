/**
 * sw.js — JELET Study Hub (v3) · Offline Service Worker
 * ---------------------------------------------------------------------------
 * Installable, offline-capable PWA caching:
 *   - Precaches the app shell (index.html, CSS, JS modules, icons, KaTeX,
 *     manifest) on install so the UI loads with zero network.
 *   - Best-effort precache of the verified `_data/` corpus (manifest, papers,
 *     solutions, 42 units, and every referenced SVG figure) so the full
 *     study brain is available offline after one online install.
 *   - Runtime network-first for same-origin GETs (shell, corpus, figures,
 *     fonts): online users ALWAYS get the fresh deploy — never the old
 *     cache — while offline users transparently fall back to the cached
 *     shell/corpus. Every successful network response refreshes the cache.
 *   - Navigations are network-first with a cached shell fallback.
 *   - `version.json` is network-only (never cached) so update checks can
 *     never see a stale build stamp.
 *   - Cross-origin requests (BYOK AI providers, YouTube facade) and all
 *     non-GET requests pass straight through — never cached, never blocked.
 *
 * Update & data-safety contract (see `assets/js/core/update-manager.js`):
 *   - A new deploy bumps `SW_VERSION` (via `scripts/bump_version.mjs`).
 *     The new worker precaches fresh assets, purges ALL old caches on
 *     activate, and claims clients. Open tabs receive `controllerchange`
 *     and safely reload to the new shell.
 *   - This worker NEVER touches IndexedDB (`jelet_hub_v1`), localStorage
 *     (AI vault), or sessionStorage — only Cache Storage. Reloading to a
 *     new version therefore cannot lose study data.
 *   - The page tells this worker to activate early via a `SKIP_WAITING`
 *     message (see the `message` listener below).
 *
 * All cache paths are relative (`./assets/...`, `./_data/...`) so the SW
 * works identically on a subpath deploy (e.g. `/Jelet/`) per AGENTS.md §3.5.
 */

const SW_VERSION = "jelet-v3-sw-31";
const SHELL_CACHE = `jelet-shell-${SW_VERSION}`;
const RUNTIME_CACHE = `jelet-runtime-${SW_VERSION}`;

/** Static app-shell assets (deterministic, committed files). */
const SHELL_ASSETS = [
  "./index.html",
  "./manifest.webmanifest",
  "./assets/css/tokens.css",
  "./assets/css/shell.css",
  "./assets/css/components.css",
  "./assets/vendor/katex/katex.mjs",
  "./assets/vendor/katex/katex.css",
  "./assets/icons/icons.svg",
  "./assets/icons/pwa-192.png",
  "./assets/icons/pwa-512.png",
  "./assets/js/app.js",
  "./assets/js/core/math.js",
  "./assets/js/core/studypack-search.js",
  "./assets/js/core/scoring.js",
  "./assets/js/core/data-loader.js",
  "./assets/js/core/stats.js",
  "./assets/js/core/charts.js",
  "./assets/js/core/share-result.js",
  "./assets/js/core/benchmark.js",
  "./assets/js/core/study-groups.js",
  "./assets/js/views/study-buddies.js",
  "./assets/js/views/benchmark.js",
  "./assets/js/views/share-result.js",
  "./assets/js/core/ui.js",
  "./assets/js/core/update-manager.js",
  "./assets/js/core/ai-vault.js",
  "./assets/js/core/ai-governor.js",
  "./assets/js/core/ai-governor-runtime.js",
  "./assets/js/core/tutor-context.js",
  "./assets/js/db/indexeddb.js",
  "./assets/js/db/backup.js",
  "./assets/js/db/sync.js",
  "./assets/js/db/sync-crypto.js",
  "./assets/js/db/ai-history.js",
  "./assets/js/views/today.js",
  "./assets/js/views/learn.js",
  "./assets/js/views/practice.js",
  "./assets/js/views/papers.js",
  "./assets/js/views/exam.js",
  "./assets/js/views/results.js",
  "./assets/js/views/you.js",
  "./assets/js/views/ai-tutor.js",
];

/**
 * Discover corpus URLs from the verified manifest (papers, solutions,
 * units) plus every SVG figure referenced by paper questions.
 * Best-effort: any individual failure is skipped, never fatal.
 */
async function collectCorpusUrls() {
  const urls = new Set();
  try {
    const manifestRes = await fetch("./_data/manifest.json", { cache: "no-store" });
    if (!manifestRes.ok) return urls;
    const manifest = await manifestRes.json();
    urls.add("./_data/manifest.json");

    for (const p of manifest.papers || []) {
      if (p.dataFile) urls.add(p.dataFile);
      if (p.solutionsFile) urls.add(p.solutionsFile);
    }
    for (const u of manifest.units || []) {
      urls.add(`./_data/units/${u.unitId}.json`);
    }
    for (const pid of manifest.papers || []) {
      try {
        const res = await fetch(pid.dataFile, { cache: "no-store" });
        if (!res.ok) continue;
        const paper = await res.json();
        for (const q of paper.questions || []) {
          if (q.stemFigure?.src) urls.add(q.stemFigure.src);
          for (const o of q.options || []) {
            if (o.figure?.src) urls.add(o.figure.src);
          }
        }
      } catch {
        /* skip unreadable paper */
      }
    }
  } catch {
    /* manifest unavailable during install — runtime caching still covers it */
  }
  return urls;
}

async function precacheShell(cache) {
  const ok = [];
  const failed = [];
  for (const url of SHELL_ASSETS) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        await cache.put(url, res.clone());
        ok.push(url);
      } else {
        failed.push(url);
      }
    } catch {
      failed.push(url);
    }
  }
  return { ok, failed };
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      const shell = await precacheShell(cache);

      // Best-effort corpus precache (never blocks install on failure).
      const corpusUrls = await collectCorpusUrls();
      const corpusOk = [];
      for (const url of corpusUrls) {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok) {
            await cache.put(url, res.clone());
            corpusOk.push(url);
          }
        } catch {
          /* skip — runtime caching will pick it up on first visit */
        }
      }

      // Mirror the corpus into the runtime cache too so SWR serves it
      // instantly without a network round-trip on first offline visit.
      const runtime = await caches.open(RUNTIME_CACHE);
      for (const url of [...shell.ok, ...corpusOk]) {
        try {
          const cached = await cache.match(url);
          if (cached) await runtime.put(url, cached);
        } catch {
          /* ignore */
        }
      }

      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Purge EVERY old cache (previous SW versions) so no tab can keep
      // relying on stale shell/corpus after an update. Only the current
      // version's two caches survive. IndexedDB / localStorage are never
      // touched here — study data is untouched by design.
      const keep = new Set([SHELL_CACHE, RUNTIME_CACHE]);
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !keep.has(k))
          .map((k) => caches.delete(k).catch(() => {}))
      );
      await self.clients.claim();
    })()
  );
});

// The page (update-manager.js) asks a waiting worker to activate early so
// open tabs move to the new version without waiting for all tabs to close.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/**
 * Network-first for cacheable same-origin GETs: online = always fresh
 * (never the old cache), offline = cached shell/corpus fallback. Every
 * successful network response refreshes the runtime cache for next time.
 */
async function handleRuntime(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      cache.put(request, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const shellCached = await caches.match(request, { cacheName: SHELL_CACHE });
    if (shellCached) return shellCached;
    return new Response("Offline and not cached.", {
      status: 504,
      statusText: "Offline",
      headers: { "Content-Type": "text/plain" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Pass-through: non-GET (AI POSTs, form submits) and cross-origin
  // requests (BYOK providers, YouTube facade) are never cached or blocked.
  if (request.method !== "GET" || request.cache === "no-store") return;

  let origin = null;
  let pathname = "";
  try {
    const url = new URL(request.url);
    origin = url.origin;
    pathname = url.pathname || "";
  } catch {
    return;
  }
  if (origin !== self.location.origin) return;

  // version.json is network-only: update checks must never see a stale
  // build stamp from either cache.
  if (pathname.endsWith("/version.json")) return;

  // Navigations: network-first, fall back to the cached app shell.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          const cache = await caches.open(SHELL_CACHE);
          try {
            cache.put(request, res.clone());
          } catch {
            /* ignore cache write errors */
          }
          return res;
        } catch {
          const shell = await caches.match("./index.html", {
            cacheName: SHELL_CACHE,
          });
          if (shell) return shell;
          return new Response(
            "JELET Study Hub is offline. Reconnect and reload.",
            {
              status: 503,
              statusText: "Offline",
              headers: { "Content-Type": "text/plain" },
            }
          );
        }
      })()
    );
    return;
  }

  event.respondWith(handleRuntime(request));
});
