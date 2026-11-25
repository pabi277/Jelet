/**
 * sw.js — JELET Study Hub (v3) · Offline Service Worker
 * ---------------------------------------------------------------------------
 * Installable, offline-capable PWA caching:
 *   - Precaches the app shell (index.html, CSS, JS modules, icons, KaTeX,
 *     manifest) on install so the UI loads with zero network.
 *   - Best-effort precache of the verified `_data/` corpus (manifest, papers,
 *     solutions, 42 units, and every referenced SVG figure) so the full
 *     study brain is available offline after one online install.
 *   - Runtime stale-while-revalidate for same-origin GETs (figures, fonts,
 *     any lazy-loaded corpus file) — first visit caches, later visits are
 *     instant and offline-safe.
 *   - Navigations are network-first with a cached shell fallback.
 *   - Cross-origin requests (BYOK AI providers, YouTube facade) and all
 *     non-GET requests pass straight through — never cached, never blocked.
 *
 * All cache paths are relative (`./assets/...`, `./_data/...`) so the SW
 * works identically on a subpath deploy (e.g. `/Jelet/`) per AGENTS.md §3.5.
 */

const SW_VERSION = "jelet-v3-sw-20";
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
  "./assets/js/core/ai-vault.js",
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

/** Stale-while-revalidate for cacheable same-origin GETs. */
async function handleRuntime(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((res) => {
      if (res && res.ok) {
        cache.put(request, res.clone()).catch(() => {});
      }
      return res;
    })
    .catch(() => null);

  if (cached) {
    return cached;
  }
  const res = await networkFetch;
  if (res) return res;
  return new Response("Offline and not cached.", {
    status: 504,
    statusText: "Offline",
    headers: { "Content-Type": "text/plain" },
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Pass-through: non-GET (AI POSTs, form submits) and cross-origin
  // requests (BYOK providers, YouTube facade) are never cached or blocked.
  if (request.method !== "GET" || request.cache === "no-store") return;

  let origin = null;
  try {
    origin = new URL(request.url).origin;
  } catch {
    return;
  }
  if (origin !== self.location.origin) return;

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
