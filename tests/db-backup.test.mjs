/**
 * db-backup.test.mjs — Phase 01 gate: DB & backup unit tests
 * ---------------------------------------------------------------------------
 * Runs with the zero-dependency Node test runner:
 *   node --test tests/db-backup.test.mjs
 * Verifies the pure backup logic (canonicalize, sha256, envelope build/verify,
 * deterministic merge) that backs the IndexedDB backup Export/Import.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  canonicalize,
  sha256Hex,
  buildEnvelope,
  verifyEnvelope,
  mergeBackup,
  BACKUP_VERSION,
} from "../assets/js/db/backup.js";

/* ------------------------------------------------------------------ *
 * canonicalize
 * ------------------------------------------------------------------ */
test("canonicalize: stable output regardless of object key order", () => {
  const a = canonicalize({ b: 2, a: 1, c: { z: 1, y: 2 } });
  const b = canonicalize({ c: { y: 2, z: 1 }, a: 1, b: 2 });
  assert.equal(a, b);
});

test("canonicalize: arrays keep order, nested objects sort keys", () => {
  const out = canonicalize({ items: [{ b: 2, a: 1 }] });
  assert.equal(out, '{"items":[{"a":1,"b":2}]}');
});

/* ------------------------------------------------------------------ *
 * sha256Hex
 * ------------------------------------------------------------------ */
test("sha256Hex: matches the SHA-256 test vector for 'abc'", async () => {
  const digest = await sha256Hex("abc");
  assert.equal(digest, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("sha256Hex: returns 64 lowercase hex chars", async () => {
  const digest = await sha256Hex("jelet");
  assert.match(digest, /^[0-9a-f]{64}$/);
});

/* ------------------------------------------------------------------ *
 * Envelope build / verify
 * ------------------------------------------------------------------ */
test("buildEnvelope: produces a verifiable, versioned envelope", async () => {
  const stores = { meta: [{ key: "app", theme: "light" }], attempts: [] };
  const env = await buildEnvelope(stores, { appVersion: "phase-01" });
  assert.equal(env.envelopeVersion, BACKUP_VERSION);
  assert.equal(env.appVersion, "phase-01");
  assert.ok(env.sha256Checksum);
  assert.equal(await verifyEnvelope(env), true);
});

test("verifyEnvelope: rejects a tampered payload", async () => {
  const env = await buildEnvelope({ meta: [{ key: "app", theme: "light" }] });
  env.stores.meta[0].theme = "dark"; // tamper after signing
  assert.equal(await verifyEnvelope(env), false);
});

test("verifyEnvelope: rejects malformed / unversioned envelopes", async () => {
  assert.equal(await verifyEnvelope(null), false);
  assert.equal(await verifyEnvelope({ envelopeVersion: 999, stores: {} }), false);
  assert.equal(await verifyEnvelope({ envelopeVersion: BACKUP_VERSION }), false);
});

/* ------------------------------------------------------------------ *
 * Deterministic merge
 * ------------------------------------------------------------------ */
test("mergeBackup: unions attempts, keeping the newer submittedAt on conflict", () => {
  const current = {
    attempts: [{ attemptId: "a1", submittedAt: "2026-01-01T00:00:00Z" }],
    meta: [{ key: "app", updatedAt: "2026-01-01T00:00:00Z" }],
  };
  const incoming = {
    attempts: [
      { attemptId: "a1", submittedAt: "2026-02-01T00:00:00Z" }, // newer
      { attemptId: "a2", submittedAt: "2026-02-02T00:00:00Z" }, // new
    ],
    meta: [{ key: "app", updatedAt: "2025-12-01T00:00:00Z" }], // older
  };
  const merged = mergeBackup(current, incoming);
  assert.equal(merged.attempts.length, 2);
  const a1 = merged.attempts.find((a) => a.attemptId === "a1");
  assert.equal(a1.submittedAt, "2026-02-01T00:00:00Z");
  // meta keeps the newer (current) record
  assert.equal(merged.meta[0].updatedAt, "2026-01-01T00:00:00Z");
});

test("mergeBackup: keeps newer unitProgress / questionStats by updatedAt", () => {
  const current = {
    unitProgress: [{ unitId: "M01", status: "revised", updatedAt: "2026-01-01T00:00:00Z" }],
    questionStats: [{ questionId: "q1", leitnerBox: 2, updatedAt: "2026-01-01T00:00:00Z" }],
  };
  const incoming = {
    unitProgress: [{ unitId: "M01", status: "studying", updatedAt: "2025-01-01T00:00:00Z" }],
    questionStats: [{ questionId: "q1", leitnerBox: 3, updatedAt: "2026-03-01T00:00:00Z" }],
  };
  const merged = mergeBackup(current, incoming);
  assert.equal(merged.unitProgress[0].status, "revised"); // current is newer
  assert.equal(merged.questionStats[0].leitnerBox, 3); // incoming is newer
});

test("mergeBackup: handles empty / missing inputs gracefully", () => {
  const merged = mergeBackup(undefined, undefined);
  assert.ok(Array.isArray(merged.attempts));
  assert.equal(merged.attempts.length, 0);
});

/* ------------------------------------------------------------------ *
 * Spec-faithful IDBRequest unwrap regression test
 * (Catches raw IDBRequest returns from getAll() / get() where .filter fails)
 * ------------------------------------------------------------------ */
test("indexeddb getAll() & get() unwrap IDBRequest.result and power computeHubSnapshot()", async () => {
  const fs = await import("node:fs");
  const storesData = new Map();

  class FakeIDBRequest {
    constructor(value) {
      // Intentionally NOT an Array — mirrors real browser IDBRequest
      this.result = value;
      this.error = null;
      this.onsuccess = null;
      this.onerror = null;
      queueMicrotask(() => {
        if (this.onsuccess) this.onsuccess({ target: this });
      });
    }
  }

  globalThis.BroadcastChannel = class {
    postMessage() {}
    close() {}
  };

  globalThis.indexedDB = {
    open(_name, _version) {
      const openReq = {
        result: null,
        error: null,
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
      };
      const fakeDb = {
        objectStoreNames: {
          contains: (s) => storesData.has(s),
        },
        createObjectStore(s, { keyPath }) {
          const map = new Map();
          map.__keyPath = keyPath;
          storesData.set(s, map);
          return { createIndex() {} };
        },
        transaction(storeOrStores, _mode) {
          const tx = {
            oncomplete: null,
            onerror: null,
            onabort: null,
            objectStore(name) {
              const map = storesData.get(name);
              return {
                getAll: () => new FakeIDBRequest([...map.values()]),
                get: (k) => new FakeIDBRequest(map.get(k)),
                put: (val) => {
                  map.set(val[map.__keyPath], val);
                  return new FakeIDBRequest(val[map.__keyPath]);
                },
                delete: (k) => {
                  map.delete(k);
                  return new FakeIDBRequest(undefined);
                },
                clear: () => {
                  map.clear();
                  return new FakeIDBRequest(undefined);
                },
              };
            },
          };
          queueMicrotask(() => {
            if (tx.oncomplete) tx.oncomplete();
          });
          return tx;
        },
        close() {},
      };
      openReq.result = fakeDb;
      queueMicrotask(() => {
        if (openReq.onupgradeneeded) openReq.onupgradeneeded({ oldVersion: 0 });
        if (openReq.onsuccess) openReq.onsuccess({ target: openReq });
      });
      return openReq;
    },
  };

  const db = await import("../assets/js/db/indexeddb.js");
  const { exportBackup } = await import("../assets/js/db/backup.js");
  const {
    computeHubSnapshot,
    createSession,
    getSession,
    submitSessionToAttempt,
  } = await import("../assets/js/core/stats.js");

  const manifest = JSON.parse(fs.readFileSync("./_data/manifest.json", "utf8"));
  const paper2025 = JSON.parse(fs.readFileSync("./_data/papers/2025.json", "utf8"));

  // 1. Fresh empty DB: getAll() must return an Array (not FakeIDBRequest)
  const emptySessions = await db.getAll("sessions");
  assert.equal(Array.isArray(emptySessions), true);
  assert.equal(emptySessions.length, 0);

  const freshSnap = await computeHubSnapshot(manifest);
  assert.equal(freshSnap.streakDays, 0);
  assert.equal(freshSnap.officialPyqsPracticed, 0);
  assert.equal(freshSnap.mockBestTwelfths, null);
  assert.equal(freshSnap.activeSession, null);

  // 2. Create session -> get(sessionId) -> submitSessionToAttempt -> exportBackup
  const qSlice = paper2025.questions.slice(0, 3);
  const created = await createSession({
    kind: "drill",
    mode: "independent",
    title: "Regression Drill",
    questions: qSlice,
  });
  const loaded = await getSession(created.sessionId);
  assert.equal(loaded.sessionId, created.sessionId);
  assert.equal(loaded.title, "Regression Drill");

  loaded.responses[qSlice[0].id] = [...qSlice[0].key.correct];
  const attempt = await submitSessionToAttempt({ session: loaded, questions: qSlice });
  assert.equal(attempt.totalTwelfths, 12);

  const afterSnap = await computeHubSnapshot(manifest);
  assert.equal(afterSnap.streakDays, 1);
  assert.equal(afterSnap.officialPyqsPracticed, 1);

  const backupEnv = await exportBackup();
  assert.equal(await verifyEnvelope(backupEnv), true);
  assert.equal(backupEnv.stores.attempts.length, 1);
});

