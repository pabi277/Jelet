# Phase 09 Record — JELET Study Hub v3: Multi-Device Sync & Cross-Tab Consistency

**Date:** 2026-11-24
**Branch:** `arena/074c8c37-jelet`
**Status:** Complete — all 5 incremental slices shipped, verified, and tested (79/79 tests).

---

## 1. Summary of Shipped Slices

### Slice 1 — Encryption + Sync Contract (`57b4585`)
- **`assets/js/db/sync-crypto.js`** (new, pure): honest Web Crypto payload
  encryption — **PBKDF2-SHA-256 (250 000 iterations, random 16-byte salt) →
  AES-GCM-256** (random 12-byte IV, header bound as additional authenticated
  data). Produces a self-describing envelope
  `{ v, kdf, hash, enc, iterations, salt, iv, ciphertext }` (binary fields
  base64). The passphrase is **ephemeral** — module memory only, never written
  to IndexedDB, localStorage, the sync config, or any export. Typed
  `SyncCryptoError` codes (`DECRYPT_FAILED`, `WEAK_PASSPHRASE`, `BAD_ENVELOPE`)
  give the UI honest messages. Explicitly documented as standard browser
  crypto, **not** "military grade".
- **`assets/js/db/sync.js`** (new): provider-agnostic REST client for the
  **`GET/PUT {base}/sync`** JSON contract (404 and `payload: null` both mean
  "no remote data yet"; documented in `DEPLOY.md` with a serverless example).
- **Sync scope sanitizer** `sanitizeForSync()`: only study state
  (`sessions`, `attempts`, `questionStats`, `unitProgress`, `bookmarksNotes`,
  `meta/app` profile+settings, `meta/syncTombs`) enters a payload; the
  device-local sync config/outbox are excluded and any `apiKey` field is
  defensively stripped.
- **`assets/js/db/indexeddb.js`**: `broadcast()` refactor — local notify +
  BroadcastChannel, with a **`localStorage` ping + `storage`-event fallback**
  when BroadcastChannel is unavailable; mutation notices now carry the
  record `key`/`keys` and `op` (`delete`) so listeners know exactly what
  changed; `put`/`bulkPut`/`deleteRecord`/`setMeta`/`replaceStores` all route
  through it (no store misses any notification).
- **`sw.js`**: precaches the two new db modules (required by `tests/pwa.test.mjs`).

### Slice 2 — Merge Logic + Opt-In Toggle + Status UI (`78973e6`)
- **`mergeSyncStores(local, remote)`** (pure): deterministic **last-write-wins
  per record**, keyed by record ID + timestamp
  (`updatedAt || submittedAt || createdAt || …`). Conflict → newer timestamp
  wins; **same timestamp → local wins** (never silently overwrites unsynced
  local changes). Union adds records from either side. Returns
  `{ merged, log, stats, tombs }`.
- **Tombstone map** (`meta/syncTombs`, synced, entry-wise union): deletions
  propagate so a stale remote copy can never resurrect a removed
  session/bookmark/stat; a record newer than its tombstone (re-created) still
  survives; deletion wins exact-timestamp ties. Tombstones register on delete
  events only once the user has configured sync (zero behavior change
  otherwise).
- **Merge log**: every decision (`took-remote`, `kept-local`, `added-remote`,
  `dropped-tombstoned`, …) is stored (capped 40) in the local-only sync config
  and rendered in a collapsible **Merge log** in the You hub; `stats.merged =
  tookRemote + addedRemote` powers the **"merged N records"** notice.
- **You hub sync card** (`assets/js/views/you.js`): explicit opt-in toggle
  (off by default), endpoint base URL + passphrase fields, **Save & Enable**,
  **Sync now**, session **Unlock**, status pill
  (Off / Locked / Pending N / Sync pending / Up to date), status tiles (last
  synced, pending count, connection, session key), last-error line, guidance
  panel (what syncs / **what NEVER syncs — API keys** / encryption model /
  merge semantics), and the off-state copy
  **"Sync is off — your data stays on this device."**
  Enabling requires a ≥8-char passphrase + valid URL with a clear message
  otherwise ("Without a passphrase, sync cannot be enabled").

### Slice 3 — Offline Mutation Outbox (`78973e6`)
- Coalesced outbox (`meta/syncOutbox`, device-local, capped 200): one entry
  per record (`store/key`), first-dirty FIFO order preserved, delete ops are
  sticky, repeated enqueues are no-ops (loop-safe).
- While **enabled**, every scope mutation (attempt, bookmark, profile edit,
  session, stat, unit progress, delete) enqueues; flushes are triggered by the
  **`online` reconnect event**, a 3 s post-mutation debounce (only when online
  **and** unlocked), and the manual **Sync now** button.
- Flush = pull → merge → push of the whole encrypted snapshot (drains the
  queue in order by construction). Failure keeps the outbox, records
  `lastError`, and surfaces **"sync pending"** — never a silent failure.
- `getSyncStatus()` powers the You-hub tiles: last synced timestamp, pending
  count, online/offline, locked/unlocked, last error.

### Slice 4 — Cross-Tab Consistency Hardening (`78973e6`)
- Verified **all six stores** notify on change: every write path
  (`put`, `bulkPut`, `deleteRecord`, `setMeta`, `replaceStores`, memory-mode)
  now goes through `broadcast()` — with record keys attached.
- **`storage`-event fallback**: when BroadcastChannel is unavailable/blocked,
  a nonce-carrying `localStorage` ping (`jelet_hub_sync`) delivers mutations to
  sibling tabs; attached lazily, never in environments without `window`.
- **Reconcile after sync**: `syncNow()` applies the merge with **quiet**
  cross-tab writes (so sibling tabs don't mistake the merge for fresh local
  mutations and start a sync loop), then broadcasts one explicit
  **`sync-applied`** notice; `app.js` debounces a re-render of the current
  view on `sync-applied` and `replace` (backup import) — skipping an active
  exam/practice runner and any focused input field, so tabs never diverge and
  runners are never interrupted.
- Engine lifecycle: `initSyncEngine()` in `app.js` (idempotent) registers the
  outbox listener + reconnect flush in every tab.

### Slice 5 — Tests, Gates & Docs
- **`tests/sync.test.mjs`** (29 new tests): encryption round-trip, envelope
  shape/params, wrong-passphrase & tamper rejection, weak-passphrase guard,
  plaintext opacity (no field names/ciphertext leaks), fresh salt/IV per
  encryption; **"API keys never synced"** (rogue `apiKey` stripped, device-local
  config/outbox excluded, `containsSecretMaterial` clean); merge determinism
  (remote-newer / local-newer / same-timestamp→local, union, tombstone drop /
  re-create survival / tie, tomb map union & order-independence, byte-identical
  repeat merges); `runSyncCycle` end-to-end with injected pull/push (first
  sync, LWW before push, wrong-passphrase never pushes, push failure
  propagates); outbox coalescing / sticky deletes / cap / FIFO / failure
  retains + success drains; base-URL normalization & `http(s)`-only guard.
- `DEPLOY.md`: full sync section (scope table, encryption model, envelope
  shape, REST contract with pull/push shapes, serverless example, merge
  semantics, offline behaviour).

---

## 2. Verification & Gate Results

| Gate / Suite | Command | Result |
|---|---|---|
| Unit & Integrity Suite | `node --test tests/*.test.mjs` | **79 / 79 PASS** (50 prior + 29 new Phase 09 tests in `tests/sync.test.mjs`) |
| Tokens, Relative Paths & Links | `node scripts/check_tokens_and_links.mjs` | **PASS** — 0 raw hex outside `tokens.css`, 0 root-leading paths, 0 broken links (295 files scanned) |
| Corpus Schema & Integrity | `python3 scripts/verify_corpus.py` | **PASS** — 4 papers, 400 PYQs, 42 units, 109 SVGs, 0 control chars |
| SymPy Solution Verification | `python3 scripts/verify_solutions_sympy.py` | **PASS** — 400 validated, 400 SymPy-verified |
| Headless Responsive Audit | `node scripts/check_responsive.mjs` | **43 / 43 PASS** — 0 horizontal overflow & 0 console errors across 360 / 390 / 414 / 1440 |
| Phase 09 Flow Render + Sync E2E | Headless Chromium: `#/`, `#/you`, `#/practice`, `#/papers` + live mock `GET/PUT /sync` endpoint | **PASSED** — all 4 routes render with **0 console errors**; full loop verified: toggle → Save & Enable → initial sync pushes a PBKDF2/AES-GCM envelope to the endpoint (**no `apiKey`/vault/plaintext field names on the wire**); reload → session passphrase forgotten → **Locked** pill → typed passphrase unlocks → Sync now → Up to date; toggle off → "Sync is off — your data stays on this device." |

---

## 3. Preserved Invariants

- **Local-first is the default**: sync is opt-in and off by default; with zero
  sync configured the app makes no network calls and behaves exactly as before
  (queueing, tombstones and engine listeners are inert until configured).
- **API keys NEVER synced or exported** (hard security requirement): the AI
  vault stays in isolated `jelet_ai_vault_v1` localStorage, never enters
  IndexedDB; `sanitizeForSync()` strips any `apiKey` field as defense-in-depth;
  proven by tests and by the live E2E wire check.
- Frozen corpus (`_data/papers/*.json`, `_data/solutions/*.solutions.json`)
  and frozen gates (`scripts/_build/*`, `scripts/verify_*`) untouched
  (**0 diffs** vs `8c8581e`).
- Exact integer `1/12`-mark scoring engine (`assets/js/core/scoring.js`)
  untouched (**0 diffs**).
- No fabricated data: sync status, pending counts, merge stats and "last
  synced" all derive from real local state and real endpoint responses.
- Phone-first, local-first, hash-routing, five global destinations, and
  `var(--fig-*)` token figures all preserved; zero new exam content.
- Zero-build law kept: two new ES modules, no bundler, no package.json, no
  runtime dependencies (headless test tooling installed outside the repo at
  `/tmp/pwtool` per the script's documented resolution roots).
