/**
 * indexeddb.js — JELET Study Hub (v3) · Versioned IndexedDB core (`jelet_hub_v1`)
 * ---------------------------------------------------------------------------
 * Local-first storage: no backend, no cookies. All study state lives here.
 * Object stores (see docs/03 §4.1):
 *   meta          — schema version, profile, theme, roadmap cursor, pomodoro
 *   sessions      — in-progress (unsubmitted) mocks & drills
 *   attempts      — immutable submitted results
 *   questionStats — per-question independent attempts + Leitner state
 *   unitProgress  — unit status + watched video ids
 *   bookmarksNotes— bookmarks + personal notes
 *
 * Multi-tab safety: a BroadcastChannel("jelet_hub_sync") notifies sibling
 * tabs whenever any store mutates, so two open tabs never clobber each other.
 *
 * BYOK AI keys NEVER touch this DB (they live in isolated `jelet_ai_vault_v1`
 * local storage) so backup exports can never leak an API key.
 *
 * PHASES-05 HARDENING:
 *   - `openDB()` never rejects: if IndexedDB is unavailable (private mode,
 *     storage blocked) or the open is blocked by another tab, the module
 *     transparently falls back to an in-memory session so the app keeps
 *     working. Callers can query `isMemoryMode()` / `storageStatus()`.
 *   - `onupgradeneeded` is defensive: stores/indexes are created only when
 *     missing and creation errors degrade to memory mode instead of hanging.
 *   - `QuotaExceededError` on writes sets a quota flag, notifies listeners,
 *     and rejects with a typed `StorageQuotaError` so views can react
 *     (clear toast + re-enable controls) instead of silently corrupting state.
 */

export const DB_NAME = "jelet_hub_v1";
export const DB_VERSION = 1;
export const SYNC_CHANNEL = "jelet_hub_sync";

/** Canonical object-store registry with keyPath + indexes. */
export const STORE_SCHEMA = {
  meta: { keyPath: "key", indexes: [] },
  sessions: { keyPath: "sessionId", indexes: ["status", "updatedAt"] },
  attempts: { keyPath: "attemptId", indexes: ["paperId", "mode", "submittedAt"] },
  questionStats: {
    keyPath: "questionId",
    indexes: ["sourceType", "unitId", "leitnerBox", "nextReviewAt"],
  },
  unitProgress: { keyPath: "unitId", indexes: ["status", "updatedAt"] },
  bookmarksNotes: { keyPath: "targetId", indexes: ["type", "updatedAt"] },
};

export const STORES = Object.keys(STORE_SCHEMA);

/** Typed error surfaced when a write exceeds available storage quota. */
export class StorageQuotaError extends Error {
  constructor(message = "Storage quota exceeded") {
    super(message);
    this.name = "StorageQuotaError";
    this.code = "QUOTA_EXCEEDED";
  }
}

let _db = null;
let _channel = null;
let _storageFallbackAttached = false;
const _listeners = new Set();

/* ------------------------------------------------------------------ *
 * Memory-mode fallback (private mode / blocked storage)
 * ------------------------------------------------------------------ */

let _memoryMode = false;
let _memoryReason = "";
let _quotaExceeded = false;
const _memory = new Map(); // storeName -> Map(key -> record)

function enterMemoryMode(reason) {
  if (_memoryMode) return;
  _memoryMode = true;
  _memoryReason = reason || "IndexedDB unavailable";
  _db = null;
  _channel = null;
  for (const store of STORES) {
    if (!_memory.has(store)) _memory.set(store, new Map());
  }
  notify({ store: "all", type: "memory-mode", reason: _memoryReason });
}

/** True when storage is running on the in-memory fallback. */
export function isMemoryMode() {
  return _memoryMode;
}

/** Human-readable storage status for UI notices. */
export function storageStatus() {
  return {
    mode: _memoryMode ? "memory" : "indexeddb",
    reason: _memoryReason,
    quotaExceeded: _quotaExceeded,
  };
}

/** Minimal object-store adapter over an in-memory Map (same API surface). */
class MemObjectStore {
  constructor(map) {
    this._map = map;
  }
  get(key) {
    return this._map.get(key);
  }
  put(value) {
    const { keyPath } = STORE_SCHEMA[this._name];
    this._map.set(value[keyPath], value);
    return value;
  }
  delete(key) {
    this._map.delete(key);
  }
  getAll() {
    return [...this._map.values()];
  }
  clear() {
    this._map.clear();
  }
}

/* ------------------------------------------------------------------ *
 * Open (and upgrade if needed) the database — never rejects
 * ------------------------------------------------------------------ */

/**
 * Open (and upgrade if needed) the database. Resolves to the IDBDatabase,
 * or to a memory-mode sentinel when IndexedDB is blocked/unavailable.
 * Never rejects: callers always get a usable store layer.
 */
export function openDB() {
  if (_memoryMode) return Promise.resolve(_memorySentinel);
  if (_db) return Promise.resolve(_db);

  if (typeof indexedDB === "undefined") {
    enterMemoryMode("IndexedDB API unavailable in this environment");
    return Promise.resolve(_memorySentinel);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (fn, arg) => {
      if (settled) return;
      settled = true;
      fn(arg);
    };

    let req;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      enterMemoryMode(`IndexedDB open threw: ${err?.message || err}`);
      finish(resolve, _memorySentinel);
      return;
    }

    req.onupgradeneeded = (event) => {
      try {
        const db = req.result;
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store)) {
            const { keyPath, indexes } = STORE_SCHEMA[store];
            const os = db.createObjectStore(store, { keyPath });
            for (const idx of indexes) os.createIndex(idx, idx);
          }
        }
      } catch (err) {
        // Defensive upgrade failure: degrade to memory mode rather than hang.
        enterMemoryMode(`IndexedDB upgrade failed: ${err?.message || err}`);
      }
    };

    req.onsuccess = (event) => {
      if (_memoryMode) {
        finish(resolve, _memorySentinel);
        return;
      }
      _db = req.result;
      _db.onversionchange = () => {
        try {
          _db.close();
        } catch {
          /* ignore */
        }
        _db = null;
      };
      try {
        _channel = new BroadcastChannel(SYNC_CHANNEL);
        _channel.onmessage = (ev) => notify(ev.data);
      } catch {
        _channel = null; // BroadcastChannel unsupported — local listeners still work
      }
      finish(resolve, _db);
    };

    req.onerror = () => {
      // Private mode / storage blocked / quota-zero at open: never crash.
      enterMemoryMode(
        `IndexedDB open failed: ${req.error?.message || req.error || "unknown error"}`
      );
      finish(resolve, _memorySentinel);
    };

    req.onblocked = () => {
      // Another tab holds an older connection. Wait briefly for it to
      // upgrade; if it does not, degrade to memory mode for this tab.
      setTimeout(() => {
        if (_db) {
          finish(resolve, _db);
          return;
        }
        enterMemoryMode("IndexedDB open blocked by another tab");
        finish(resolve, _memorySentinel);
      }, 1500);
    };
  });
}

/** Sentinel resolved by openDB() in memory mode (opaque to callers). */
const _memorySentinel = { __memoryMode: true };

/** Deliver a mutation hint to local listeners only. */
function notify(payload) {
  for (const fn of _listeners) {
    try {
      fn(payload);
    } catch (_) {
      /* listener errors must not break sync */
    }
  }
}

/**
 * `storage`-event fallback (Phase 09): used when BroadcastChannel is
 * unavailable so a sibling tab still learns about local mutations. The ping
 * value embeds a nonce so identical payloads always produce a real change.
 */
function storagePing(payload) {
  try {
    if (typeof localStorage === "undefined" || !localStorage) return;
    localStorage.setItem(
      SYNC_CHANNEL,
      JSON.stringify({ ...payload, __ping: Math.random(), __ts: Date.now() })
    );
  } catch {
    /* storage blocked — local listeners already notified */
  }
}

function attachStorageFallback() {
  if (_storageFallbackAttached) return;
  if (typeof window === "undefined" || !window || typeof window.addEventListener !== "function") {
    return;
  }
  _storageFallbackAttached = true;
  window.addEventListener("storage", (ev) => {
    if (ev.key !== SYNC_CHANNEL || !ev.newValue) return;
    try {
      const data = JSON.parse(ev.newValue);
      if (data && typeof data === "object") notify(data);
    } catch {
      /* ignore malformed pings */
    }
  });
}

/**
 * Broadcast a mutation hint to sibling tabs AND local listeners.
 * Primary channel: BroadcastChannel. Fallback (unsupported/blocked/closed):
 * a `localStorage` ping picked up via the `storage` event in other tabs.
 */
export function broadcast(payload) {
  notify(payload);
  let sent = false;
  if (_channel) {
    try {
      _channel.postMessage(payload);
      sent = true;
    } catch {
      /* channel closed — fall through to storage ping */
    }
  }
  if (!sent) {
    attachStorageFallback();
    storagePing(payload);
  }
}

/** Subscribe to cross-tab + local mutation notices. Returns an unsubscribe fn. */
export function onSync(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

/** True when the error is a quota-exceeded failure. */
function isQuotaError(err) {
  if (!err) return false;
  if (err.name === "QuotaExceededError") return true;
  if (err.code === 22) return true; // Safari/older engines
  return err.name === "StorageQuotaError";
}

/**
 * Run a read/write transaction over a single store.
 * In memory mode this runs synchronously against the in-memory adapter.
 * `extra` fields (e.g. `key`, `keys`, `op`) ride the mutation notice so
 * listeners (sync outbox) know exactly which records changed.
 */
async function withStore(store, mode, fn, extra = {}) {
  if (_memoryMode) {
    const map = _memory.get(store);
    const adapter = new MemObjectStore(map);
    adapter._name = store;
    const result = fn(adapter);
    if (mode !== "readonly") {
      broadcast({ store, type: "mutate", memory: true, ...extra });
    }
    return result && result.__req ? result.__req.result : result;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const os = tx.objectStore(store);
    let result;
    try {
      result = fn(os);
    } catch (err) {
      reject(err);
      return;
    }
    tx.oncomplete = () => {
      if (mode !== "readonly") {
        broadcast({ store, type: "mutate", ...extra });
      }
      resolve(result && result.__req ? result.__req.result : result);
    };
    tx.onerror = () => {
      const err = tx.error;
      if (isQuotaError(err)) {
        _quotaExceeded = true;
        notify({ store, type: "quota-exceeded" });
        reject(new StorageQuotaError(`Storage quota exceeded while writing "${store}"`));
        return;
      }
      reject(err);
    };
    tx.onabort = () => {
      const err = tx.error;
      if (isQuotaError(err)) {
        _quotaExceeded = true;
        notify({ store, type: "quota-exceeded" });
        reject(new StorageQuotaError(`Storage quota exceeded while writing "${store}"`));
        return;
      }
      reject(err);
    };
  });
}

/* ----------------------------------------------------------------- *
 * Meta store helpers (schema version, profile, theme, pomodoro, ...)
 * ----------------------------------------------------------------- */
export const DEFAULT_META = {
  key: "app",
  schemaVersion: DB_VERSION,
  profile: {
    name: "",
    targetYear: 2028,
    category: "General",
    diplomaCgpa: null,
    examDate: "2026-06-13",
  },
  theme: "light",
  roadmapCursor: null,
  pomodoro: { secondsLeft: 1500, running: false, lastStartedAt: null },
};

export async function getMeta() {
  const rec = await get("meta", "app");
  return rec || { ...DEFAULT_META };
}

export async function setMeta(patch) {
  const current = await getMeta();
  const next = { ...current, ...patch };
  await withStore("meta", "readwrite", (os) => os.put(next), { key: next.key || "app" });
  return next;
}

/* ----------------------------------------------------------------- *
 * Generic store helpers
 * ----------------------------------------------------------------- */
export async function getAll(store) {
  return withStore(store, "readonly", (os) => ({ __req: os.getAll() }));
}
export async function get(store, key) {
  return withStore(store, "readonly", (os) => ({ __req: os.get(key) }));
}
export async function put(store, value) {
  const keyPath = STORE_SCHEMA[store]?.keyPath;
  const key = value && keyPath ? value[keyPath] : undefined;
  await withStore(store, "readwrite", (os) => os.put(value), { key });
}
export async function bulkPut(store, values) {
  const keyPath = STORE_SCHEMA[store]?.keyPath;
  const keys = (values || []).map((v) => (v && keyPath ? v[keyPath] : undefined));
  await withStore(
    store,
    "readwrite",
    (os) => {
      for (const v of values) os.put(v);
    },
    { keys }
  );
}
export async function deleteRecord(store, key) {
  await withStore(store, "readwrite", (os) => os.delete(key), { key, op: "delete" });
}

/** Collect every store's records into a plain object (for backup export). */
export async function collectStores() {
  const out = {};
  for (const store of STORES) out[store] = await getAll(store);
  return out;
}

/** Replace every store's records from a backup object (for import). */
export async function replaceStores(stores) {
  if (_memoryMode) {
    for (const store of STORES) {
      const map = _memory.get(store);
      map.clear();
      for (const rec of stores[store] || []) {
        const { keyPath } = STORE_SCHEMA[store];
        if (rec && rec[keyPath] !== undefined) map.set(rec[keyPath], rec);
      }
    }
    broadcast({ store: "all", type: "replace", memory: true });
    return true;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, "readwrite");
    for (const store of STORES) {
      const os = tx.objectStore(store);
      os.clear();
      for (const rec of stores[store] || []) os.put(rec);
    }
    tx.oncomplete = () => {
      broadcast({ store: "all", type: "replace" });
      resolve(true);
    };
    tx.onerror = () => {
      const err = tx.error;
      if (isQuotaError(err)) {
        _quotaExceeded = true;
        notify({ store: "all", type: "quota-exceeded" });
        reject(new StorageQuotaError("Storage quota exceeded during backup import"));
        return;
      }
      reject(err);
    };
    tx.onabort = () => {
      const err = tx.error;
      if (isQuotaError(err)) {
        _quotaExceeded = true;
        notify({ store: "all", type: "quota-exceeded" });
        reject(new StorageQuotaError("Storage quota exceeded during backup import"));
        return;
      }
      reject(err);
    };
  });
}

/** Human-friendly test hook: true when IndexedDB is available in this env. */
export function isSupported() {
  return typeof indexedDB !== "undefined";
}
