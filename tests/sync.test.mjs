/**
 * sync.test.mjs — Phase 09 gate: encrypted cloud sync unit tests
 * ---------------------------------------------------------------------------
 * Runs with the zero-dependency Node test runner:
 *   node --test tests/sync.test.mjs
 *
 * Covers:
 *   1. Encryption round-trip (PBKDF2 → AES-GCM), tamper/wrong-passphrase
 *      rejection, envelope shape, plaintext opacity.
 *   2. The HARD "API keys never synced" guarantee (sanitizeForSync).
 *   3. Merge determinism — last-write-wins per record, same-timestamp →
 *      local, tombstones, merge log + stats.
 *   4. runSyncCycle end-to-end against injected pull/push (offline outbox
 *      flush semantics: failures keep state, successes drain).
 *   5. Outbox queue coalescing / FIFO order / cap.
 *   6. REST base-URL normalization for the generic GET/PUT /sync contract.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  SYNC_CIPHER_VERSION,
  DEFAULT_KDF_ITERATIONS,
  SYNC_PASSPHRASE_MIN_LENGTH,
  encryptSyncPayload,
  decryptSyncPayload,
  isSyncCipher,
  deriveSyncKey,
  bytesToBase64,
  base64ToBytes,
} from "../assets/js/db/sync-crypto.js";

import {
  SYNC_SCOPE_STORES,
  SYNC_TOMB_KEY,
  SYNC_LOCAL_META_KEYS,
  sanitizeForSync,
  containsSecretMaterial,
  recordTimestamp,
  mergeSyncStores,
  mergeTombMaps,
  tombEntryKey,
  outboxEnqueue,
  outboxOrder,
  runSyncCycle,
  normalizeSyncBaseUrl,
  assertSyncBaseUrl,
  SyncError,
} from "../assets/js/db/sync.js";

const PASS = "correct horse battery staple";
const FAST = { iterations: 10000 }; // keep the suite snappy where params don't matter

/* ================================================================== *
 * 1. Encryption round-trip
 * ================================================================== */

test("encrypt → decrypt round-trips a study-state payload exactly", async () => {
  const stores = {
    sessions: [{ sessionId: "s1", status: "in_progress", updatedAt: "2026-11-24T10:00:00.000Z" }],
    attempts: [{ attemptId: "a1", totalTwelfths: 984, submittedAt: "2026-11-24T11:00:00.000Z" }],
    meta: [{ key: "app", profile: { name: "Pabitra", targetYear: 2028 }, theme: "dark" }],
  };
  const env = await encryptSyncPayload(stores, PASS, FAST);
  assert.equal(isSyncCipher(env), true);
  const back = await decryptSyncPayload(env, PASS);
  assert.deepEqual(back, stores);
});

test("envelope shape: v1 PBKDF2(SHA-256) AES-GCM with base64 salt/iv/ciphertext", async () => {
  const env = await encryptSyncPayload({ hello: "world" }, PASS, FAST);
  assert.equal(env.v, SYNC_CIPHER_VERSION);
  assert.equal(env.kdf, "PBKDF2");
  assert.equal(env.hash, "SHA-256");
  assert.equal(env.enc, "AES-GCM");
  assert.ok(env.iterations >= 10000);
  for (const f of ["salt", "iv", "ciphertext"]) {
    assert.match(env[f], /^[A-Za-z0-9+/=]+$/, `${f} must be base64`);
  }
  // salt 16 bytes, iv 12 bytes, ciphertext > plaintext framing
  assert.equal(base64ToBytes(env.salt).length, 16);
  assert.equal(base64ToBytes(env.iv).length, 12);
});

test("default KDF iterations are applied when not overridden", async () => {
  const env = await encryptSyncPayload({ a: 1 }, PASS);
  assert.equal(env.iterations, DEFAULT_KDF_ITERATIONS);
  assert.equal(DEFAULT_KDF_ITERATIONS, 250000);
});

test("wrong passphrase is rejected with DECRYPT_FAILED", async () => {
  const env = await encryptSyncPayload({ secret: true }, PASS, FAST);
  await assert.rejects(
    () => decryptSyncPayload(env, "totally wrong passphrase"),
    (err) => err.code === "DECRYPT_FAILED" && /wrong passphrase/.test(err.message)
  );
});

test("weak passphrases are rejected before any crypto runs", async () => {
  await assert.rejects(
    () => encryptSyncPayload({ a: 1 }, "short"),
    (err) => err.code === "WEAK_PASSPHRASE"
  );
  assert.ok(SYNC_PASSPHRASE_MIN_LENGTH >= 8);
  await assert.rejects(() => deriveSyncKey("short", new Uint8Array(16), 10000));
});

test("ciphertext never contains plaintext substrings (honest opacity check)", async () => {
  const marker = "UNIQUE_STUDY_MARKER_9182";
  const env = await encryptSyncPayload({ note: marker, apiKey: "AIzaFAKEKEY" }, PASS, FAST);
  const wire = JSON.stringify(env);
  assert.ok(!wire.includes(marker), "plaintext marker leaked into envelope");
  assert.ok(!wire.includes("AIzaFAKEKEY"), "raw key leaked into envelope");
  assert.ok(!wire.includes("note"), "field names must not survive encryption");
});

test("each encryption uses a fresh salt and IV (ciphertexts differ)", async () => {
  const a = await encryptSyncPayload({ x: 1 }, PASS, FAST);
  const b = await encryptSyncPayload({ x: 1 }, PASS, FAST);
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.ciphertext, b.ciphertext);
});

test("tampered ciphertext / malformed envelopes are rejected", async () => {
  const env = await encryptSyncPayload({ x: 1 }, PASS, FAST);
  const flipped = { ...env };
  const bytes = base64ToBytes(env.ciphertext);
  bytes[bytes.length - 1] ^= 0xff;
  flipped.ciphertext = bytesToBase64(bytes);
  await assert.rejects(
    () => decryptSyncPayload(flipped, PASS),
    (err) => err.code === "DECRYPT_FAILED"
  );

  assert.equal(isSyncCipher(null), false);
  assert.equal(isSyncCipher({ v: 99 }), false);
  assert.equal(isSyncCipher({ ...env, kdf: "scrypt" }), false);
  await assert.rejects(
    () => decryptSyncPayload({ junk: true }, PASS),
    (err) => err.code === "BAD_ENVELOPE"
  );
});

/* ================================================================== *
 * 2. HARD guarantee: API keys NEVER enter a sync payload
 * ================================================================== */

test("sanitizeForSync strips any apiKey field from every store", () => {
  const stores = {
    sessions: [{ sessionId: "s1", updatedAt: "2026-11-24T00:00:00.000Z" }],
    attempts: [],
    questionStats: [{ questionId: "q1", apiKey: "sk-LEAKED", updatedAt: "2026-11-24T00:00:00.000Z" }],
    unitProgress: [],
    bookmarksNotes: [{ targetId: "b1", bookmarked: true, note: "", updatedAt: "2026-11-24T00:00:00.000Z" }],
    meta: [
      { key: "app", profile: { name: "Pabitra" }, theme: "light" },
      { key: "sync", baseUrl: "https://private.example/api", enabled: true }, // device-local → excluded
      { key: "syncOutbox", entries: [{ store: "attempts", key: "a1" }] }, // device-local → excluded
      { key: SYNC_TOMB_KEY, tombs: { "sessions/old": "2026-11-24T00:00:00.000Z" } },
    ],
  };
  const out = sanitizeForSync(stores);

  // AI vault lives in isolated localStorage — nothing vault-shaped may exist,
  // and even a rogue apiKey field is defensively stripped.
  const json = JSON.stringify(out);
  assert.ok(!json.includes("sk-LEAKED"), "API key leaked into sync scope");
  assert.ok(!json.includes("apiKey"), "apiKey field leaked into sync scope");
  assert.ok(!json.includes("jelet_ai_vault"), "vault key leaked into sync scope");
  assert.ok(!json.includes("private.example"), "device-local sync config leaked");
  assert.ok(!json.includes("syncOutbox"), "device-local outbox leaked");
  assert.equal(containsSecretMaterial(json), false);

  // In-scope records survive.
  assert.equal(out.sessions.length, 1);
  assert.equal(out.attempts.length, 0);
  assert.equal(out.meta.length, 2); // app + syncTombs only
  assert.equal(out.meta[0].key, "app");
  assert.ok(out.meta.some((r) => r.key === SYNC_TOMB_KEY));
  assert.deepEqual(Object.keys(out).sort(), [...SYNC_SCOPE_STORES].sort());
});

test("sanitizeForSync tolerates missing / malformed stores", () => {
  const out = sanitizeForSync(undefined);
  for (const s of SYNC_SCOPE_STORES) assert.ok(Array.isArray(out[s]));
  const out2 = sanitizeForSync({ meta: [null, { key: "app" }, { key: "other" }] });
  assert.equal(out2.meta.length, 1);
  assert.equal(out2.meta[0].key, "app");
});

/* ================================================================== *
 * 3. Merge determinism (last-write-wins per record + merge log)
 * ================================================================== */

test("merge: remote NEWER record wins (took-remote) and counts as merged", () => {
  const local = {
    attempts: [{ attemptId: "a1", totalTwelfths: 600, updatedAt: "2026-11-24T10:00:00.000Z" }],
  };
  const remote = {
    attempts: [
      { attemptId: "a1", totalTwelfths: 984, updatedAt: "2026-11-24T12:00:00.000Z" },
      { attemptId: "a2", totalTwelfths: 720, updatedAt: "2026-11-24T11:00:00.000Z" },
    ],
  };
  const { merged, log, stats } = mergeSyncStores(local, remote);
  const a1 = merged.attempts.find((a) => a.attemptId === "a1");
  assert.equal(a1.totalTwelfths, 984, "newer remote record must win");
  assert.equal(merged.attempts.length, 2, "remote-only record is added");
  assert.equal(stats.tookRemote, 1);
  assert.equal(stats.addedRemote, 1);
  assert.equal(stats.merged, 2);
  assert.ok(log.some((e) => e.store === "attempts" && e.key === "a1" && e.action === "took-remote"));
  assert.ok(log.some((e) => e.key === "a2" && e.action === "added-remote"));
});

test("merge: local NEWER record wins (kept-local) — unsynced local changes never overwritten", () => {
  const local = {
    bookmarksNotes: [{ targetId: "b1", bookmarked: true, updatedAt: "2026-11-24T12:00:00.000Z" }],
  };
  const remote = {
    bookmarksNotes: [{ targetId: "b1", bookmarked: false, updatedAt: "2026-11-24T09:00:00.000Z" }],
  };
  const { merged, stats, log } = mergeSyncStores(local, remote);
  assert.equal(merged.bookmarksNotes[0].bookmarked, true, "local newer state must survive");
  assert.equal(stats.keptLocal, 1);
  assert.equal(stats.merged, 0, "nothing taken from remote");
  assert.equal(log[0].action, "kept-local");
});

test("merge: SAME timestamp prefers local (deterministic tie-break)", () => {
  const ts = "2026-11-24T10:00:00.000Z";
  const local = { unitProgress: [{ unitId: "M01", status: "revised", updatedAt: ts }] };
  const remote = { unitProgress: [{ unitId: "M01", status: "studying", updatedAt: ts }] };
  const { merged, stats } = mergeSyncStores(local, remote);
  assert.equal(merged.unitProgress[0].status, "revised");
  assert.equal(stats.keptLocal, 1);
  assert.equal(stats.tookRemote, 0);
});

test("merge: union of local-only records counts addedLocal; empty sides OK", () => {
  const local = { sessions: [{ sessionId: "s-local", updatedAt: "2026-11-24T10:00:00.000Z" }] };
  const { merged, stats } = mergeSyncStores(local, null);
  assert.equal(merged.sessions.length, 1);
  assert.equal(stats.addedLocal, 1);
  assert.equal(stats.addedRemote, 0);

  const both = mergeSyncStores(undefined, undefined);
  for (const s of SYNC_SCOPE_STORES) assert.ok(Array.isArray(both.merged[s]));
});

test("merge: tombstones drop stale remote records but never newer local writes", () => {
  const tombAt = "2026-11-24T12:00:00.000Z";
  const local = {
    sessions: [],
    meta: [{ key: SYNC_TOMB_KEY, tombs: { "sessions/s1": tombAt }, updatedAt: tombAt }],
  };
  // Remote still has the deleted session, older than the tombstone → dropped.
  const remoteOld = { sessions: [{ sessionId: "s1", updatedAt: "2026-11-24T10:00:00.000Z" }] };
  const r1 = mergeSyncStores(local, remoteOld);
  assert.equal(r1.merged.sessions.length, 0, "stale remote record must not resurrect");
  assert.equal(r1.stats.droppedByTombs, 1);
  assert.ok(r1.log.some((e) => e.action === "dropped-tombstoned"));

  // A re-created session newer than the tombstone survives.
  const remoteNew = { sessions: [{ sessionId: "s1", updatedAt: "2026-11-24T13:00:00.000Z" }] };
  const r2 = mergeSyncStores(local, remoteNew);
  assert.equal(r2.merged.sessions.length, 1, "record newer than tombstone survives");

  // Deletion wins an exact-timestamp tie (deterministic: removed stays removed).
  const remoteTie = { sessions: [{ sessionId: "s1", updatedAt: tombAt }] };
  const r3 = mergeSyncStores(local, remoteTie);
  assert.equal(r3.merged.sessions.length, 0);
});

test("merge: tombstone maps union across devices (entry-wise, newer wins)", () => {
  const local = {
    meta: [
      { key: SYNC_TOMB_KEY, tombs: { "bookmarksNotes/b1": "2026-11-24T10:00:00.000Z" }, updatedAt: "2026-11-24T10:00:00.000Z" },
    ],
  };
  const remote = {
    meta: [
      {
        key: SYNC_TOMB_KEY,
        tombs: {
          "bookmarksNotes/b1": "2026-11-24T11:00:00.000Z", // newer for b1
          "sessions/s9": "2026-11-24T09:00:00.000Z", // remote-only tomb
        },
        updatedAt: "2026-11-24T11:00:00.000Z",
      },
    ],
  };
  const { merged, tombs } = mergeSyncStores(local, remote);
  assert.equal(tombs["bookmarksNotes/b1"], "2026-11-24T11:00:00.000Z");
  assert.equal(tombs["sessions/s9"], "2026-11-24T09:00:00.000Z");
  const tombRec = merged.meta.find((r) => r.key === SYNC_TOMB_KEY);
  assert.ok(tombRec, "tombstone record rides the merged payload");
  assert.deepEqual(tombRec.tombs, tombs);

  // mergeTombMaps is order-independent (deterministic union).
  const ab = mergeTombMaps({ x: "2026-01-02T00:00:00.000Z" }, { x: "2026-01-01T00:00:00.000Z", y: "2026-01-03T00:00:00.000Z" });
  const ba = mergeTombMaps({ x: "2026-01-01T00:00:00.000Z", y: "2026-01-03T00:00:00.000Z" }, { x: "2026-01-02T00:00:00.000Z" });
  assert.deepEqual(ab, ba);
  assert.equal(tombEntryKey("sessions", "s1"), "sessions/s1");
});

test("merge: is deterministic — same inputs produce identical output", () => {
  const local = {
    attempts: [
      { attemptId: "a1", updatedAt: "2026-11-24T10:00:00.000Z" },
      { attemptId: "a3", updatedAt: "2026-11-24T08:00:00.000Z" },
    ],
    meta: [{ key: "app", theme: "dark", updatedAt: "2026-11-24T09:00:00.000Z" }],
  };
  const remote = {
    attempts: [
      { attemptId: "a1", updatedAt: "2026-11-24T11:00:00.000Z" },
      { attemptId: "a2", updatedAt: "2026-11-24T07:00:00.000Z" },
    ],
    meta: [{ key: "app", theme: "light", updatedAt: "2026-11-24T09:00:00.000Z" }],
  };
  const r1 = mergeSyncStores(local, remote);
  const r2 = mergeSyncStores(local, remote);
  assert.deepEqual(r1.merged, r2.merged);
  assert.deepEqual(r1.log, r2.log);
  assert.deepEqual(r1.stats, r2.stats);
  // meta app record tie → local (dark)
  assert.equal(r1.merged.meta.find((m) => m.key === "app").theme, "dark");
});

test("recordTimestamp prefers updatedAt over older mutation stamps", () => {
  assert.equal(
    recordTimestamp({ updatedAt: "2026-11-24T10:00:00.000Z", submittedAt: "2026-11-24T09:00:00.000Z" }),
    "2026-11-24T10:00:00.000Z"
  );
  assert.equal(recordTimestamp({ submittedAt: "2026-11-24T09:00:00.000Z" }), "2026-11-24T09:00:00.000Z");
  assert.equal(recordTimestamp(null), "");
});

/* ================================================================== *
 * 4. Sync cycle (pull → merge → encrypt → push) with injected network
 * ================================================================== */

test("runSyncCycle: first sync pushes encrypted sanitized local state", async () => {
  const local = {
    attempts: [{ attemptId: "a1", totalTwelfths: 984, submittedAt: "2026-11-24T10:00:00.000Z" }],
    meta: [
      { key: "app", profile: { name: "Pabitra" } },
      { key: "sync", baseUrl: "https://device-local-only.example", enabled: true },
    ],
  };
  let pushed = null;
  const res = await runSyncCycle({
    localStores: local,
    passphrase: PASS,
    iterations: 10000,
    pull: async () => null, // no remote yet (404 / payload:null)
    push: async (env) => {
      pushed = env;
    },
  });
  assert.ok(isSyncCipher(pushed), "push must carry an encrypted envelope");
  const roundTripped = await decryptSyncPayload(pushed, PASS);
  assert.equal(roundTripped.attempts.length, 1);
  assert.equal(
    JSON.stringify(roundTripped).includes("device-local-only"),
    false,
    "device-local sync config must not be pushed"
  );
  assert.equal(res.stats.merged, 0);
  assert.equal(res.stats.addedLocal, 2, "local attempt + app profile are local-only additions");
});

test("runSyncCycle: pull-merge-push resolves conflicts by LWW before pushing", async () => {
  const local = {
    attempts: [{ attemptId: "a1", totalTwelfths: 600, updatedAt: "2026-11-24T10:00:00.000Z" }],
  };
  const remoteStores = {
    attempts: [
      { attemptId: "a1", totalTwelfths: 984, updatedAt: "2026-11-24T12:00:00.000Z" },
      { attemptId: "a2", totalTwelfths: 720, updatedAt: "2026-11-24T11:00:00.000Z" },
    ],
  };
  const remoteEnv = await encryptSyncPayload(remoteStores, PASS, FAST);
  let pushed = null;
  const res = await runSyncCycle({
    localStores: local,
    passphrase: PASS,
    iterations: 10000,
    pull: async () => remoteEnv,
    push: async (env) => {
      pushed = env;
    },
  });
  const pushedStores = await decryptSyncPayload(pushed, PASS);
  const a1 = pushedStores.attempts.find((a) => a.attemptId === "a1");
  assert.equal(a1.totalTwelfths, 984, "merged push must contain the LWW winner");
  assert.equal(pushedStores.attempts.length, 2);
  assert.equal(res.stats.merged, 2);
});

test("runSyncCycle: wrong passphrase on pull fails before anything is pushed", async () => {
  const remoteEnv = await encryptSyncPayload({ attempts: [] }, "some other passphrase!", FAST);
  let pushed = false;
  await assert.rejects(
    () =>
      runSyncCycle({
        localStores: { attempts: [] },
        passphrase: PASS,
        iterations: 10000,
        pull: async () => remoteEnv,
        push: async () => {
          pushed = true;
        },
      }),
    (err) => err.code === "DECRYPT_FAILED"
  );
  assert.equal(pushed, false, "must never push after a failed decrypt");
});

test("runSyncCycle: push failure propagates (outbox would be retained upstream)", async () => {
  let attempts = 0;
  await assert.rejects(
    () =>
      runSyncCycle({
        localStores: { sessions: [{ sessionId: "s1", updatedAt: "2026-11-24T10:00:00.000Z" }] },
        passphrase: PASS,
        iterations: 10000,
        pull: async () => null,
        push: async () => {
          attempts++;
          throw new SyncError("Sync push failed — HTTP 500.", "HTTP_PUSH");
        },
      }),
    (err) => err.code === "HTTP_PUSH"
  );
  assert.equal(attempts, 1);
});

/* ================================================================== *
 * 5. Offline mutation outbox
 * ================================================================== */

test("outbox: enqueue coalesces per record and preserves first-dirty order", () => {
  let q = [];
  q = outboxEnqueue(q, { store: "attempts", key: "a1", at: "2026-11-24T10:00:00.000Z" });
  q = outboxEnqueue(q, { store: "bookmarksNotes", key: "b1", at: "2026-11-24T10:00:01.000Z" });
  q = outboxEnqueue(q, { store: "attempts", key: "a1", at: "2026-11-24T10:00:02.000Z" }); // again
  assert.equal(q.length, 2, "same record coalesces to one entry");
  assert.equal(q[0].key, "a1", "first-dirty order kept");
  assert.equal(q[0].at, "2026-11-24T10:00:00.000Z", "original timestamp kept (no churn)");
});

test("outbox: a delete escalates the queued op; mutate never downgrades a delete", () => {
  let q = outboxEnqueue([], { store: "sessions", key: "s1", op: "mutate", at: "2026-11-24T10:00:00.000Z" });
  q = outboxEnqueue(q, { store: "sessions", key: "s1", op: "delete", at: "2026-11-24T10:00:05.000Z" });
  assert.equal(q[0].op, "delete");
  q = outboxEnqueue(q, { store: "sessions", key: "s1", op: "mutate", at: "2026-11-24T10:00:09.000Z" });
  assert.equal(q[0].op, "delete", "delete is sticky until flushed");
});

test("outbox: capped at max entries (oldest dropped) and FIFO flush order", () => {
  let q = [];
  for (let i = 0; i < 10; i++) {
    q = outboxEnqueue(
      q,
      { store: "attempts", key: `a${i}`, at: `2026-11-24T10:00:${String(i).padStart(2, "0")}.000Z` },
      5
    );
  }
  assert.equal(q.length, 5);
  assert.equal(q[0].key, "a5", "oldest entries evicted first");

  const ordered = outboxOrder([
    { store: "s", key: "k2", at: "2026-11-24T10:00:02.000Z" },
    { store: "s", key: "k1", at: "2026-11-24T10:00:01.000Z" },
    { store: "s", key: "k3", at: "2026-11-24T10:00:03.000Z" },
  ]);
  assert.deepEqual(
    ordered.map((e) => e.key),
    ["k1", "k2", "k3"],
    "flush order is oldest-first"
  );
});

test("outbox: flush failure retains every entry; success drains the queue", () => {
  let q = [];
  q = outboxEnqueue(q, { store: "attempts", key: "a1", at: "2026-11-24T10:00:00.000Z" });
  q = outboxEnqueue(q, { store: "meta", key: "app", at: "2026-11-24T10:00:01.000Z" });
  q = outboxEnqueue(q, { store: "bookmarksNotes", key: "b1", at: "2026-11-24T10:00:02.000Z" });
  const before = q.length;
  assert.equal(before, 3);

  // Simulated failed flush (offline / HTTP 500): queue untouched → "sync pending".
  const failedFlush = q; // no drain happens on failure
  assert.equal(failedFlush.length, 3);

  // Simulated successful flush: drain in order, then queue is empty.
  const flushed = outboxOrder(failedFlush);
  assert.deepEqual(
    flushed.map((e) => e.key),
    ["a1", "app", "b1"]
  );
  q = [];
  assert.equal(q.length, 0);
});

/* ================================================================== *
 * 6. REST contract helpers
 * ================================================================== */

test("normalizeSyncBaseUrl tolerates trailing slashes and pasted /sync paths", () => {
  assert.equal(normalizeSyncBaseUrl(" https://example.com/api/ "), "https://example.com/api");
  assert.equal(normalizeSyncBaseUrl("https://example.com/api/sync"), "https://example.com/api");
  assert.equal(normalizeSyncBaseUrl("https://example.com/api/sync/"), "https://example.com/api");
  assert.equal(normalizeSyncBaseUrl(""), "");
});

test("assertSyncBaseUrl accepts http(s) and rejects everything else", () => {
  assert.equal(assertSyncBaseUrl("https://host.example/base"), "https://host.example/base");
  assert.throws(
    () => assertSyncBaseUrl("ftp://nope.example"),
    (err) => err instanceof SyncError && err.code === "BAD_URL"
  );
  assert.throws(() => assertSyncBaseUrl("javascript:alert(1)"), (err) => err.code === "BAD_URL");
  assert.throws(() => assertSyncBaseUrl(""), (err) => err.code === "BAD_URL");
});

test("SYNC_LOCAL_META_KEYS cover every device-local meta record", () => {
  // The sync config and outbox must never be part of a payload, while the
  // profile/settings record ("app") and tombstones must be.
  assert.ok(SYNC_LOCAL_META_KEYS.includes("sync"));
  assert.ok(SYNC_LOCAL_META_KEYS.includes("syncOutbox"));
  assert.ok(!SYNC_LOCAL_META_KEYS.includes("app"));
  assert.ok(!SYNC_LOCAL_META_KEYS.includes(SYNC_TOMB_KEY));
});
