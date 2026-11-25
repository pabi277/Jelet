/**
 * sync.js — JELET Study Hub (v3) · Optional Encrypted Cloud Sync (Phase 09)
 * ---------------------------------------------------------------------------
 * LOCAL-FIRST REMAINS THE DEFAULT: with sync off (or unconfigured) the app
 * behaves exactly as before — zero network calls, zero queueing.
 *
 * REST contract (provider-agnostic, documented in DEPLOY.md):
 *   GET  {baseUrl}/sync  → 200 { ok: true, payload: <envelope|null> } | 404 (no remote yet)
 *   PUT  {baseUrl}/sync  ← 200 { ok: true }   body: { payload: <envelope>, updatedAt }
 *
 * Encryption: every payload is encrypted client-side (sync-crypto.js —
 * PBKDF2-SHA-256 → AES-GCM-256) with a user passphrase that is NEVER stored.
 *
 * Sync scope: study state only — sessions, attempts, questionStats,
 * unitProgress, bookmarksNotes and the profile/settings meta record.
 * The BYOK AI vault (`jelet_ai_vault_v1` localStorage) never enters IndexedDB
 * and therefore can NEVER enter a sync payload — `sanitizeForSync()` also
 * defensively strips any `apiKey` field (tests/sync.test.mjs proves it).
 *
 * Merge: deterministic last-write-wins PER RECORD, keyed by record ID +
 * timestamp (`updatedAt || submittedAt || createdAt || ...`). Same timestamp
 * → local wins. Deletions propagate through a synced tombstone map so removed
 * records never resurrect from a stale remote copy. Every merge produces a
 * merge log + stats ("merged N records").
 *
 * Offline outbox: while sync is enabled, local mutations are queued in a
 * coalesced outbox (meta store, local-only). A failed flush keeps the queue
 * and surfaces "sync pending"; the `online` event and the manual Sync-now
 * button retry it.
 *
 * Pure helpers (sanitize / merge / outbox / runSyncCycle) are framework-free
 * and unit-tested in Node (tests/sync.test.mjs).
 */

import * as db from "./indexeddb.js";
import {
  DEFAULT_KDF_ITERATIONS,
  SYNC_PASSPHRASE_MIN_LENGTH,
  encryptSyncPayload,
  decryptSyncPayload,
  isSyncCipher,
} from "./sync-crypto.js";

/* ------------------------------------------------------------------ *
 * Constants
 * ------------------------------------------------------------------ */

export const SYNC_ENDPOINT_PATH = "sync";
export const SYNC_PAYLOAD_VERSION = 1;

/** Stores included in a sync payload (study state only). */
export const SYNC_SCOPE_STORES = [
  "sessions",
  "attempts",
  "questionStats",
  "unitProgress",
  "bookmarksNotes",
  "meta",
];

/** meta records that are in scope: profile/settings + the tombstone map. */
export const SYNC_META_APP_KEY = "app";
export const SYNC_TOMB_KEY = "syncTombs";

/** meta records that are device-local and NEVER synced. */
export const SYNC_LOCAL_META_KEYS = ["sync", "syncOutbox", "aiHistory"];

export const OUTBOX_MAX_ENTRIES = 200;
export const MERGE_LOG_MAX_ENTRIES = 40;
export const TOMB_MAX_ENTRIES = 500;

export const SYNC_OFF_HINT = "Sync is off — your data stays on this device.";

/** Typed error so the UI can show honest, specific guidance. */
export class SyncError extends Error {
  constructor(message, code = "SYNC_ERROR") {
    super(message);
    this.name = "SyncError";
    this.code = code;
  }
}

/* ------------------------------------------------------------------ *
 * Pure helpers (no IndexedDB / no network — Node-testable)
 * ------------------------------------------------------------------ */

function keyPathOf(store) {
  return db.STORE_SCHEMA[store]?.keyPath || "id";
}

/** LWW timestamp for a record: newest of the well-known mutation stamps. */
export function recordTimestamp(rec) {
  if (!rec || typeof rec !== "object") return "";
  return String(
    rec.updatedAt ||
      rec.submittedAt ||
      rec.createdAt ||
      rec.lastTickAt ||
      rec.lastVisitedAt ||
      rec.exportedAt ||
      ""
  );
}

/** Defensive secret strip — API keys must NEVER ride a sync payload. */
function stripSecrets(rec) {
  if (!rec || typeof rec !== "object") return rec;
  if (Object.prototype.hasOwnProperty.call(rec, "apiKey")) {
    const { apiKey: _dropped, ...rest } = rec;
    return rest;
  }
  return rec;
}

/**
 * Project a raw `collectStores()` object down to the sync scope:
 *   - only SYNC_SCOPE_STORES
 *   - meta → only the app profile/settings record + the tombstone map
 *   - any `apiKey` field stripped (defense-in-depth; the AI vault lives in
 *     isolated localStorage and never reaches IndexedDB in the first place)
 */
export function sanitizeForSync(stores) {
  const out = {};
  for (const store of SYNC_SCOPE_STORES) {
    out[store] = [];
  }
  for (const store of SYNC_SCOPE_STORES) {
    const rows = Array.isArray(stores?.[store]) ? stores[store] : [];
    if (store === "meta") {
      out.meta = rows
        .filter((r) => r && (r.key === SYNC_META_APP_KEY || r.key === SYNC_TOMB_KEY))
        .map(stripSecrets);
      continue;
    }
    out[store] = rows.filter(Boolean).map(stripSecrets);
  }
  return out;
}

/** True when a payload/JSON blob contains an API key or vault material. */
export function containsSecretMaterial(jsonText) {
  return (
    typeof jsonText === "string" &&
    (jsonText.includes("apiKey") ||
      jsonText.includes("jelet_ai_vault") ||
      jsonText.includes('"apiKey"'))
  );
}

export function tombEntryKey(store, key) {
  return `${store}/${key}`;
}

/** Union two tombstone maps — newer deletedAt wins per entry. */
export function mergeTombMaps(a = {}, b = {}) {
  const out = { ...(a || {}) };
  for (const [k, ts] of Object.entries(b || {})) {
    if (!out[k] || String(ts) > String(out[k])) out[k] = String(ts);
  }
  return out;
}

function tombsOf(stores) {
  const rec = (stores?.meta || []).find((r) => r && r.key === SYNC_TOMB_KEY);
  return rec && rec.tombs && typeof rec.tombs === "object" ? rec.tombs : {};
}

/**
 * Deterministic last-write-wins merge of local + remote (both raw or both
 * sanitized — sanitizeForSync is applied internally).
 *
 * Rules:
 *   - union of records keyed by the store's keyPath
 *   - conflict → newer recordTimestamp wins; SAME timestamp → LOCAL wins
 *   - tombstones: a deletion whose deletedAt >= record timestamp drops the
 *     remote record (deletion wins ties — a removed record must not resurrect)
 *   - `syncTombs` maps merge entry-wise (union, newer per entry)
 *   - merge log records every decision; stats.merged = tookRemote + addedRemote
 *     (records where remote contributed state)
 */
export function mergeSyncStores(local, remote) {
  const loc = sanitizeForSync(local);
  const rem = sanitizeForSync(remote || {});
  const tombs = mergeTombMaps(tombsOf(loc), tombsOf(rem));

  const merged = {};
  const log = [];
  const stats = {
    compared: 0,
    tookRemote: 0,
    keptLocal: 0,
    addedRemote: 0,
    addedLocal: 0,
    droppedByTombs: 0,
    merged: 0,
  };

  const isTombstoned = (store, key, rec) => {
    const t = tombs[tombEntryKey(store, key)];
    return Boolean(t) && String(t) >= recordTimestamp(rec);
  };

  for (const store of SYNC_SCOPE_STORES) {
    const kp = keyPathOf(store);
    const localRows = (loc[store] || []).filter(
      (r) => !(store === "meta" && r.key === SYNC_TOMB_KEY)
    );
    const remoteRows = (rem[store] || []).filter(
      (r) => !(store === "meta" && r.key === SYNC_TOMB_KEY)
    );

    const map = new Map();
    for (const rec of localRows) map.set(rec[kp], rec);
    const localKeys = new Set(map.keys());
    const remoteKeys = new Set(remoteRows.map((r) => r[kp]));

    for (const rec of remoteRows) {
      const k = rec[kp];
      const existing = map.get(k);
      if (!existing) {
        if (isTombstoned(store, k, rec)) {
          stats.droppedByTombs += 1;
          log.push({ store, key: k, action: "dropped-tombstoned" });
          continue;
        }
        map.set(k, rec);
        stats.addedRemote += 1;
        stats.merged += 1;
        log.push({ store, key: k, action: "added-remote" });
        continue;
      }
      stats.compared += 1;
      const localTs = recordTimestamp(existing);
      const remoteTs = recordTimestamp(rec);
      if (remoteTs > localTs) {
        map.set(k, rec);
        stats.tookRemote += 1;
        stats.merged += 1;
        log.push({ store, key: k, action: "took-remote", localTs, remoteTs });
      } else {
        // remote older OR same timestamp → deterministic local preference
        stats.keptLocal += 1;
        log.push({ store, key: k, action: "kept-local", localTs, remoteTs });
      }
    }

    for (const k of localKeys) {
      if (!remoteKeys.has(k)) stats.addedLocal += 1;
    }

    merged[store] = [...map.values()];
  }

  // Tombstone map rides along as a synced meta record (union already computed).
  const existingLocalTomb = (loc.meta || []).find((r) => r.key === SYNC_TOMB_KEY);
  const existingRemoteTomb = (rem.meta || []).find((r) => r.key === SYNC_TOMB_KEY);
  if (existingLocalTomb || existingRemoteTomb || Object.keys(tombs).length) {
    const updatedAt = [
      existingLocalTomb?.updatedAt,
      existingRemoteTomb?.updatedAt,
      ...Object.values(tombs),
    ]
      .filter(Boolean)
      .sort()
      .pop();
    merged.meta.push({
      key: SYNC_TOMB_KEY,
      tombs,
      updatedAt: updatedAt || new Date().toISOString(),
    });
  }

  return { merged, log, stats, tombs };
}

/* ------------------------------------------------------------------ *
 * Pure outbox helpers
 * ------------------------------------------------------------------ */

/**
 * Coalesced FIFO queue: one entry per (store, key) — repeated mutations of
 * the same record update the entry in place (keeping first-dirty order),
 * capped at `max` oldest entries. Returns a NEW array.
 */
export function outboxEnqueue(
  entries,
  { store, key, op = "mutate", at = new Date().toISOString() },
  max = OUTBOX_MAX_ENTRIES
) {
  const list = Array.isArray(entries) ? entries.slice() : [];
  const idx = list.findIndex((e) => e && e.store === store && e.key === key);
  if (idx >= 0) {
    // Coalesce: keep first-dirty order and timestamp; only a delete escalates
    // the op. Never churn the record — repeated identical enqueues must be
    // no-ops so notify→enqueue→write loops terminate.
    const prev = list[idx];
    list[idx] =
      prev.op === "delete" || op !== "delete"
        ? prev
        : { ...prev, op };
    return list;
  }
  list.push({ store, key, op, at });
  if (list.length > max) list.splice(0, list.length - max);
  return list;
}

/** Oldest-first flush order (stable; whole-snapshot push drains in order). */
export function outboxOrder(entries) {
  return (Array.isArray(entries) ? entries.slice() : []).sort((a, b) =>
    String(a.at || "").localeCompare(String(b.at || ""))
  );
}

/* ------------------------------------------------------------------ *
 * Sync cycle — pull → merge → encrypt → push (network injected)
 * ------------------------------------------------------------------ */

/**
 * One full sync round-trip against injected `pull` / `push` callbacks.
 * Kept network-free at the edges so Node tests can drive it end-to-end.
 *
 *   pull()      → encrypted envelope | null (no remote data yet)
 *   push(env)   → resolves on HTTP 2xx, throws otherwise
 */
export async function runSyncCycle({
  localStores,
  passphrase,
  pull,
  push,
  iterations = DEFAULT_KDF_ITERATIONS,
}) {
  if (typeof pull !== "function" || typeof push !== "function") {
    throw new SyncError("Sync cycle requires pull() and push() callbacks.", "BAD_CYCLE");
  }
  const remoteEnv = await pull();
  let remoteStores = null;
  if (remoteEnv) {
    if (!isSyncCipher(remoteEnv)) {
      throw new SyncError(
        "Remote sync payload is not a recognized encrypted envelope.",
        "BAD_ENVELOPE"
      );
    }
    remoteStores = await decryptSyncPayload(remoteEnv, passphrase);
  }
  const { merged, log, stats, tombs } = mergeSyncStores(localStores, remoteStores);
  const envelope = await encryptSyncPayload(merged, passphrase, { iterations });
  await push(envelope);
  return { merged, log, stats, tombs, envelope };
}

/* ------------------------------------------------------------------ *
 * Device-local state (IndexedDB meta records — never synced)
 * ------------------------------------------------------------------ */

export async function getSyncConfig() {
  const rec = await db.get("meta", "sync");
  if (!rec) {
    return {
      key: "sync",
      enabled: false,
      baseUrl: "",
      kdfIterations: DEFAULT_KDF_ITERATIONS,
      lastSyncedAt: null,
      lastError: null,
      mergeLog: [],
      mergeStats: null,
      updatedAt: null,
    };
  }
  return {
    kdfIterations: DEFAULT_KDF_ITERATIONS,
    mergeLog: [],
    mergeStats: null,
    ...rec,
    key: "sync",
  };
}

export async function setSyncConfig(patch) {
  const cur = await getSyncConfig();
  const next = {
    ...cur,
    ...patch,
    key: "sync",
    updatedAt: new Date().toISOString(),
  };
  await db.put("meta", next);
  return next;
}

/**
 * Passphrase handling: held ONLY in a module variable (this tab's memory).
 * Never persisted to IndexedDB / localStorage / any export.
 */
let _sessionPassphrase = null;

export function setSessionPassphrase(passphrase) {
  const pass = typeof passphrase === "string" ? passphrase : "";
  _sessionPassphrase = pass.length >= SYNC_PASSPHRASE_MIN_LENGTH ? pass : null;
  return Boolean(_sessionPassphrase);
}

export function getSessionPassphrase() {
  return _sessionPassphrase;
}

export function clearSessionPassphrase() {
  _sessionPassphrase = null;
}

export function hasSessionPassphrase() {
  return Boolean(_sessionPassphrase);
}

/** Accept a pasted base URL; tolerate a trailing `/sync` or slash. */
export function normalizeSyncBaseUrl(raw) {
  let url = String(raw || "").trim();
  if (!url) return "";
  url = url.replace(/\/+$/, "");
  if (url.toLowerCase().endsWith(`/${SYNC_ENDPOINT_PATH}`)) {
    url = url.slice(0, -(SYNC_ENDPOINT_PATH.length + 1));
  }
  return url;
}

export function assertSyncBaseUrl(raw) {
  const url = normalizeSyncBaseUrl(raw);
  if (!/^https?:\/\/[^/\s]+/i.test(url)) {
    throw new SyncError(
      "Enter a valid sync endpoint base URL (https://… or http://…).",
      "BAD_URL"
    );
  }
  return url;
}

async function readOutbox() {
  const rec = await db.get("meta", "syncOutbox");
  return Array.isArray(rec?.entries) ? rec.entries : [];
}

async function writeOutbox(entries) {
  await db.put("meta", {
    key: "syncOutbox",
    entries,
    updatedAt: new Date().toISOString(),
  });
}

export async function getPendingCount() {
  return (await readOutbox()).length;
}

/** Record a local deletion so stale remote copies cannot resurrect it. */
export async function registerTombstone(store, key, at = new Date().toISOString()) {
  try {
    const rec = await db.get("meta", SYNC_TOMB_KEY);
    const tombs = { ...(rec?.tombs || {}) };
    const tk = tombEntryKey(store, key);
    if (!tombs[tk] || String(at) >= String(tombs[tk])) tombs[tk] = String(at);
    const keys = Object.keys(tombs);
    if (keys.length > TOMB_MAX_ENTRIES) {
      keys
        .sort((a, b) => String(tombs[a]).localeCompare(String(tombs[b])))
        .slice(0, keys.length - TOMB_MAX_ENTRIES)
        .forEach((k) => delete tombs[k]);
    }
    await db.put("meta", {
      key: SYNC_TOMB_KEY,
      tombs,
      updatedAt: at,
    });
  } catch {
    /* tombstone is best-effort — never break the original delete */
  }
}

/* ------------------------------------------------------------------ *
 * Network edge (generic JSON REST contract)
 * ------------------------------------------------------------------ */

function endpointOf(baseUrl) {
  return `${normalizeSyncBaseUrl(baseUrl)}/${SYNC_ENDPOINT_PATH}`;
}

/** GET {base}/sync → envelope | null (404 / empty = no remote data yet). */
export async function pullRemote(baseUrl) {
  let res;
  try {
    res = await fetch(endpointOf(baseUrl), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new SyncError(
      "Could not reach the sync endpoint — check your connection (sync pending).",
      "OFFLINE"
    );
  }
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new SyncError(`Sync pull failed — HTTP ${res.status}.`, "HTTP_PULL");
  }
  const body = await res.json().catch(() => null);
  if (!body || typeof body !== "object") {
    throw new SyncError("Sync endpoint returned an invalid JSON body.", "BAD_BODY");
  }
  if (body.payload == null) return null;
  if (!isSyncCipher(body.payload)) {
    throw new SyncError(
      "Remote sync payload is not a recognized encrypted envelope.",
      "BAD_ENVELOPE"
    );
  }
  return body.payload;
}

/** PUT {base}/sync with { payload, updatedAt }. */
export async function pushRemote(baseUrl, payload) {
  let res;
  try {
    res = await fetch(endpointOf(baseUrl), {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ payload, updatedAt: new Date().toISOString() }),
    });
  } catch {
    throw new SyncError(
      "Could not reach the sync endpoint — your changes stay queued (sync pending).",
      "OFFLINE"
    );
  }
  if (!res.ok) {
    throw new SyncError(`Sync push failed — HTTP ${res.status}.`, "HTTP_PUSH");
  }
  return true;
}

/* ------------------------------------------------------------------ *
 * Orchestration
 * ------------------------------------------------------------------ */

let _syncing = false;
let _flushTimer = null;

async function applyMergedStores(merged) {
  for (const store of SYNC_SCOPE_STORES) {
    const rows = merged[store];
    if (Array.isArray(rows) && rows.length) {
      // quiet: sibling tabs reconcile via the explicit `sync-applied` notice —
      // they must not treat merge writes as brand-new local mutations.
      await db.bulkPut(store, rows, { quiet: true });
    }
  }
}

/**
 * Run a full sync now: pull → LWW merge → write merged locally → push →
 * clear outbox → record status + merge log → broadcast `sync-applied` so
 * sibling tabs reconcile.
 */
export async function syncNow({ passphrase } = {}) {
  const cfg = await getSyncConfig();
  if (!cfg.enabled) {
    throw new SyncError(SYNC_OFF_HINT, "DISABLED");
  }

  _syncing = true;
  try {
    const baseUrl = assertSyncBaseUrl(cfg.baseUrl);
    const pass = passphrase || _sessionPassphrase;
    if (!pass || String(pass).length < SYNC_PASSPHRASE_MIN_LENGTH) {
      throw new SyncError(
        `Enter your sync passphrase (min ${SYNC_PASSPHRASE_MIN_LENGTH} characters) — it is used ephemerally and never stored.`,
        "LOCKED"
      );
    }
    const localStores = await db.collectStores();
    const { merged, log, stats, envelope } = await runSyncCycle({
      localStores,
      passphrase: pass,
      iterations: cfg.kdfIterations || DEFAULT_KDF_ITERATIONS,
      pull: () => pullRemote(baseUrl),
      push: (env) => pushRemote(baseUrl, env),
    });

    await applyMergedStores(merged);
    await writeOutbox([]);

    const now = new Date().toISOString();
    await setSyncConfig({
      lastSyncedAt: now,
      lastError: null,
      mergeLog: log.slice(-MERGE_LOG_MAX_ENTRIES),
      mergeStats: stats,
    });

    db.broadcast({ store: "all", type: "sync-applied", at: now, stats });
    return { stats, log, merged, at: now, envelope };
  } catch (err) {
    const message =
      err instanceof SyncError
        ? err.message
        : `Sync failed — ${err?.message || "unknown error"}. Your changes stay queued (sync pending).`;
    const code = err instanceof SyncError ? err.code : "UNKNOWN";
    await setSyncConfig({ lastError: message }).catch(() => {});
    if (err instanceof SyncError) throw err;
    throw new SyncError(message, code);
  } finally {
    _syncing = false;
  }
}

/** Debounced auto-flush after local mutations (enabled + online only). */
export function scheduleFlush(delayMs = 3000) {
  if (typeof setTimeout !== "function") return;
  if (_flushTimer) clearTimeout(_flushTimer);
  _flushTimer = setTimeout(() => {
    _flushTimer = null;
    if (!isOnline()) return;
    getSyncConfig()
      .then((c) =>
        c.enabled && hasSessionPassphrase() ? syncNow().catch(() => {}) : null
      )
      .catch(() => {});
  }, delayMs);
}

export function isOnline() {
  if (typeof navigator === "undefined" || !navigator || navigator.onLine === undefined) {
    return true; // environments without connectivity info: assume online
  }
  return navigator.onLine !== false;
}

/** Snapshot for the You-hub status card. */
export async function getSyncStatus() {
  const cfg = await getSyncConfig();
  const pending = (await readOutbox()).length;
  const configured = Boolean(cfg.baseUrl);
  return {
    enabled: Boolean(cfg.enabled),
    configured,
    baseUrl: cfg.baseUrl || "",
    online: isOnline(),
    pending,
    lastSyncedAt: cfg.lastSyncedAt || null,
    lastError: cfg.lastError || null,
    locked: Boolean(cfg.enabled) && !hasSessionPassphrase(),
    unlocked: hasSessionPassphrase(),
    mergeLog: Array.isArray(cfg.mergeLog) ? cfg.mergeLog : [],
    mergeStats: cfg.mergeStats || null,
    kdfIterations: cfg.kdfIterations || DEFAULT_KDF_ITERATIONS,
    passphraseMinLength: SYNC_PASSPHRASE_MIN_LENGTH,
    scope: SYNC_SCOPE_STORES,
    hint: cfg.enabled ? null : SYNC_OFF_HINT,
  };
}

/** Opt-in: validate URL + passphrase, generate config, keep pass in memory. */
export async function enableSync({ baseUrl, passphrase } = {}) {
  const url = assertSyncBaseUrl(baseUrl);
  const pass = String(passphrase || "");
  if (pass.length < SYNC_PASSPHRASE_MIN_LENGTH) {
    throw new SyncError(
      `Sync passphrase must be at least ${SYNC_PASSPHRASE_MIN_LENGTH} characters. Without a passphrase, sync cannot be enabled.`,
      "WEAK_PASSPHRASE"
    );
  }
  setSessionPassphrase(pass);
  return setSyncConfig({
    enabled: true,
    baseUrl: url,
    lastError: null,
  });
}

/** Opt-out: local-only again. Keeps endpoint config; clears session key. */
export async function disableSync() {
  const cfg = await setSyncConfig({ enabled: false, lastError: null });
  clearSessionPassphrase();
  await writeOutbox([]);
  db.broadcast({ store: "all", type: "sync-applied", at: new Date().toISOString() });
  return cfg;
}

/* ------------------------------------------------------------------ *
 * Engine — outbox enqueue, tombstones, reconnect flush
 * ------------------------------------------------------------------ */

let _engineStarted = false;

async function enqueueMarker(payload) {
  const store = payload?.store;
  if (!store || !SYNC_SCOPE_STORES.includes(store)) return;
  const rawKeys = Array.isArray(payload.keys) && payload.keys.length
    ? payload.keys
    : [payload.key ?? "*"];
  // Device-local meta records (sync config / outbox / tombstones) never ride
  // the outbox — tombstones travel with the payload map itself.
  const keys = (store === "meta"
    ? rawKeys.filter(
        (k) => k && !SYNC_LOCAL_META_KEYS.includes(k) && k !== SYNC_TOMB_KEY
      )
    : rawKeys
  ).map((k) => k ?? "*");
  if (!keys.length) return;
  try {
    const cfg = await db.get("meta", "sync");
    if (!cfg?.enabled || _syncing) return;
    const rec = await db.get("meta", "syncOutbox");
    let entries = Array.isArray(rec?.entries) ? rec.entries : [];
    let changed = false;
    for (const key of keys) {
      const before = JSON.stringify(entries);
      entries = outboxEnqueue(entries, {
        store,
        key,
        op: payload.op === "delete" ? "delete" : "mutate",
      });
      if (JSON.stringify(entries) !== before) changed = true;
    }
    if (!changed) return; // identical queue → no write → no notify loop
    await writeOutbox(entries);
    if (isOnline()) scheduleFlush();
  } catch {
    /* queueing is best-effort — local data is already safe in IndexedDB */
  }
}

function handleEngineEvent(payload) {
  if (!payload) return;
  if (payload.op === "delete" && payload.key && payload.key !== "*") {
    // Keep deletions syncable even while offline (config record must exist —
    // a device that never configured sync writes nothing extra at all).
    db.get("meta", "sync")
      .then((cfg) => (cfg ? registerTombstone(payload.store, payload.key) : null))
      .catch(() => {});
  }
  if (payload.type !== "mutate") return;
  enqueueMarker(payload);
}

/**
 * Start the sync engine (idempotent): listens for local/cross-tab mutations
 * to queue outbox entries, and flushes on reconnect (`online`).
 * Returns a stop() function (used by tests / teardown).
 */
export function initSyncEngine() {
  if (_engineStarted) return () => {};
  if (typeof window === "undefined" || !window || typeof window.addEventListener !== "function") {
    return () => {};
  }
  _engineStarted = true;
  const unsub = db.onSync(handleEngineEvent);
  const onOnline = () => {
    // Reconnect: flush the outbox (only when unlocked — a locked session
    // waits for the user to re-enter the passphrase via Sync now).
    getSyncConfig()
      .then((c) =>
        c.enabled && hasSessionPassphrase() ? syncNow().catch(() => {}) : null
      )
      .catch(() => {});
  };
  window.addEventListener("online", onOnline);
  return () => {
    unsub();
    window.removeEventListener("online", onOnline);
    if (_flushTimer) clearTimeout(_flushTimer);
    _engineStarted = false;
  };
}
