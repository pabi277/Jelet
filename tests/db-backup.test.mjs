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
