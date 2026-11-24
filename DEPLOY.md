# Deploying JELET Study Hub (v3)

The app is a **zero-build, 100% static PWA** — no bundler, no backend, no
server-side rendering. Any static file host works. Serve the repository root
as-is.

## Quick start (local preview)

```bash
# From the repository root — zero mandatory build step
python3 -m http.server 8000
# open http://localhost:8000/
```

The app is phone-first and works identically on desktop. All assets are
referenced with **relative paths** (`./assets/...`, `./_data/...`), so it
runs from the repository root or any subpath.

## Static hosts

### GitHub Pages

1. Push the repository (branch or `main`).
2. Repository settings → **Pages** → Source: *Deploy from a branch* →
   branch `main` (or your branch), folder *`/ (root)*.
3. The site is served at `https://<user>.github.io/<repo>/`.

> **Subpath note:** the router uses **hash routing** (`#/learn`, `#/papers/2025`,
> …), so deep links work from any subpath with zero configuration — e.g.
> `https://<user>.github.io/<repo>/#/exam/sess-…` resolves correctly. Do **not**
> change asset links to root-absolute (`/assets/...`) — the app intentionally
> uses relative `./assets/...` paths everywhere (enforced by
> `scripts/check_tokens_and_links.mjs`).

### Netlify

- **Build command:** *(none)*
- **Publish directory:** repository root (`.`)

### Vercel

- **Framework preset:** *Other* (static)
- **Build command:** *(none)*
- **Output directory:** repository root (`.`)

### Any other static host (Cloudflare Pages, AWS S3, nginx, Termux, …)

Upload the repository root contents. No build step, no environment variables,
no server configuration required.

## Installable PWA

The app ships an installable manifest (`manifest.webmanifest`) and an offline
Service Worker (`sw.js`):

- **Install prompt:** use Chrome/Edge on desktop or Android. The manifest
  declares `display: standalone`, brand `theme_color`/`background_color`
  (`#0F6E66`), and 192×192 / 512×512 icons (`assets/icons/pwa-192.png`,
  `assets/icons/pwa-512.png`).
- **Offline support:** on first load (while online) the Service Worker
  precaches the app shell and the full verified corpus (`_data/` papers,
  solutions, 42 units, 109 SVG figures, vendored KaTeX). After that the app
  loads and studies fully offline.
- **Offline pack opt-in:** *You & AI → Offline Corpus Pack* pre-warms the
  cache explicitly if you want it before first visit.

### Notes for hosts

- **Service Workers require `https://`** (or `localhost`). Plain `http://`
  on a non-localhost origin will not register the SW; the app still works
  online, just without offline caching.
- The SW registration in `assets/js/app.js` is intentionally silent: on
  origins without SW support (or non-http schemes) it no-ops without errors.
- Do not rename or move `sw.js` or `manifest.webmanifest` — `tests/pwa.test.mjs`
  gates their location and contents.

## Optional encrypted cloud sync (Phase 09)

Sync is **opt-in and off by default**. With sync unconfigured the app is
exactly as before: 100% local-first, zero network calls. When enabled, the
client serializes study state, encrypts it **on-device**, and talks to any
provider that can store one JSON document behind a two-call REST contract.

### What syncs — and what NEVER syncs

| Included (study state) | Excluded (never leaves the device) |
|---|---|
| `sessions`, `attempts`, `questionStats`, `unitProgress`, `bookmarksNotes`, profile/settings (`meta` app record), deletion tombstones | **BYOK AI API keys** (`jelet_ai_vault_v1` isolated vault), sync config/outbox (device-local) |

The AI vault lives in `localStorage`, never in IndexedDB, and
`sanitizeForSync()` additionally strips any `apiKey` field as defense-in-depth
(`tests/sync.test.mjs` proves the guarantee).

### Encryption model (honest, standard Web Crypto)

- **KDF:** PBKDF2 → SHA-256, 250 000 iterations, random 16-byte salt
- **Cipher:** AES-GCM-256, random 12-byte IV, header bound as AAD
- **Passphrase:** entered by the user, held in tab memory only — **never**
  stored in IndexedDB, localStorage, the sync config, or any export
- This is the standard browser crypto stack used honestly — **not** "military
  grade". A weak passphrase can be brute-forced offline, so pick a long one.

Encrypted envelope (all binary fields base64):

```json
{
  "v": 1,
  "kdf": "PBKDF2",
  "hash": "SHA-256",
  "enc": "AES-GCM",
  "iterations": 250000,
  "salt": "…",
  "iv": "…",
  "ciphertext": "…"
}
```

### REST contract (provider-agnostic)

Base URL is user-provided in **You & AI → Encrypted Cloud Sync** (e.g.
`https://api.example.com/jelet`). The client appends `/sync`.

**Pull — `GET {base}/sync`**

```
200 { "ok": true, "payload": <envelope> }     ← remote data exists
200 { "ok": true, "payload": null }           ← no remote data yet (recommended)
404                                           ← also accepted as "no data yet"
```

**Push — `PUT {base}/sync`** with `Content-Type: application/json`

```json
{ "payload": <envelope>, "updatedAt": "2026-11-24T12:00:00.000Z" }
```

Response: `200 { "ok": true }` (any 2xx works; non-2xx surfaces as a kept
outbox + "sync pending", never a silent failure).

Minimal serverless example (any provider works — this is a single-document
KV blob):

```js
// Cloudflare Worker / Deno / Node — stores ONE JSON blob per user
let blob = null; // or KV/Secrets/S3 object of your choice
export default {
  async fetch(req) {
    const url = new URL(req.url);
    if (!url.pathname.endsWith("/sync")) return new Response("not found", { status: 404 });
    if (req.method === "GET")
      return json({ ok: true, payload: blob });
    if (req.method === "PUT") {
      blob = (await req.json()).payload;
      return json({ ok: true });
    }
    return new Response("method not allowed", { status: 405 });
  },
};
const json = (o) => new Response(JSON.stringify(o), {
  headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
});
```

> The endpoint stores **opaque ciphertext only** — the server can never read
> study data. Add your own auth (bearer token in the URL path, signed URLs,
> etc.) if the endpoint is shared; the client sends no credentials itself.

### Merge semantics

On every sync the client pulls the remote envelope, decrypts it, and merges
**last-write-wins per record** (record ID + timestamp; same timestamp keeps
the local record). Deletions propagate through a synced tombstone map so stale
remote copies never resurrect. Every merge writes a merge log and reports
"merged N records" in the You-hub status card.

### Offline behaviour

While sync is enabled, local mutations queue in a coalesced outbox. The
outbox flushes on reconnect (`online` event), after a short debounce, and via
the manual **Sync now** button. A failed flush keeps the queue and shows a
clear "sync pending" state with the last error.

## Hash-routing & subpath safety

- All navigation is hash-based (`#/`, `#/learn`, `#/practice`,
  `#/papers/:id`, `#/exam/:id`, `#/results/:id`, `#/you`, `#/formulas`).
  There is **no server-side route configuration** to maintain.
- Unknown/deep-linked hashes are normalized to `#/` (Today) client-side, so
  stale links never render a blank screen.
- Every fetch, link, and Service Worker cache path is relative, so the same
  build works at `http://localhost:8000/`, `/Jelet/`, and
  `https://<user>.github.io/<repo>/`.

## CI gates before shipping

Run all of these from the repository root (all must exit 0):

```bash
node tests/db-backup.test.mjs
node tests/scoring.test.mjs
node tests/ai-vault.test.mjs
node tests/app-integrity.test.mjs
node tests/pwa.test.mjs
node scripts/check_tokens_and_links.mjs
python3 scripts/verify_corpus.py
python3 scripts/verify_solutions_sympy.py
```

## Data updates

The verified corpus lives in `_data/` (papers, solutions, units, figures,
manifest). It is frozen by the Phase 03 gates — never edit
`_data/papers/*.json`, `_data/solutions/*.solutions.json`,
`scripts/_build/*`, or `scripts/verify_*` without re-running the full
verification pipeline and recording evidence under `docs/phases/`.
