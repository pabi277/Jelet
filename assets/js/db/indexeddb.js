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

let _db = null;
let _channel = null;
const _listeners = new Set();

/** Open (and upgrade if needed) the database. Returns a Promise<IDBDatabase>. */
export function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          const { keyPath, indexes } = STORE_SCHEMA[store];
          const os = db.createObjectStore(store, { keyPath });
          for (const idx of indexes) os.createIndex(idx, idx);
        }
      }
      // Ensure a default meta record exists on first creation.
      if (event.oldVersion < 1 && !db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };
    req.onsuccess = (event) => {
      _db = req.result;
      _db.onversionchange = () => { _db.close(); _db = null; };
      _channel = new BroadcastChannel(SYNC_CHANNEL);
      _channel.onmessage = (ev) => notify(ev.data);
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Broadcast a mutation hint to sibling tabs and local listeners. */
function notify(payload) {
  for (const fn of _listeners) {
    try { fn(payload); } catch (_) { /* listener errors must not break sync */ }
  }
}

/** Subscribe to cross-tab + local mutation notices. Returns an unsubscribe fn. */
export function onSync(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

/** Run a read/write transaction over a single store. */
async function withStore(store, mode, fn) {
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
        const msg = { store, type: "mutate" };
        notify(msg);
        try { _channel?.postMessage(msg); } catch (_) { /* ignore */ }
      }
      resolve(result && result.__req ? result.__req.result : result);
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
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
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction("meta", "readonly").objectStore("meta").get("app");
    req.onsuccess = () => resolve(req.result || { ...DEFAULT_META });
    req.onerror = () => reject(req.error);
  });
}

export async function setMeta(patch) {
  const current = await getMeta();
  const next = { ...current, ...patch };
  await withStore("meta", "readwrite", (os) => os.put(next));
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
  await withStore(store, "readwrite", (os) => os.put(value));
}
export async function bulkPut(store, values) {
  await withStore(store, "readwrite", (os) => {
    for (const v of values) os.put(v);
  });
}
export async function deleteRecord(store, key) {
  await withStore(store, "readwrite", (os) => os.delete(key));
}

/** Collect every store's records into a plain object (for backup export). */
export async function collectStores() {
  const out = {};
  for (const store of STORES) out[store] = await getAll(store);
  return out;
}

/** Replace every store's records from a backup object (for import). */
export async function replaceStores(stores) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, "readwrite");
    for (const store of STORES) {
      const os = tx.objectStore(store);
      os.clear();
      for (const rec of stores[store] || []) os.put(rec);
    }
    tx.oncomplete = () => {
      notify({ store: "all", type: "replace" });
      resolve(true);
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Human-friendly test hook: true when IndexedDB is available in this env. */
export function isSupported() {
  return typeof indexedDB !== "undefined" && typeof BroadcastChannel !== "undefined";
}
