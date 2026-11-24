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
