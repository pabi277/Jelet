/**
 * backup.js — JELET Study Hub (v3) · Signed Study Backup Envelope
 * ---------------------------------------------------------------------------
 * Backup envelope `jelet-study-backup-v1.json`:
 *   { envelopeVersion, exportedAt, appVersion, sha256Checksum, stores }
 *
 * The BYOK AI key NEVER enters a backup: it lives in isolated
 * `jelet_ai_vault_v1` local storage, not in `jelet_hub_v1`.
 *
 * Pure helpers (canonicalize / sha256Hex / buildEnvelope / verifyEnvelope /
 * mergeBackup) are framework-free and unit-tested in Node (tests/db-backup.test.mjs).
 */

import * as db from "./indexeddb.js";

export const BACKUP_VERSION = 1;
export const BACKUP_APP = "jelet-study-hub";

/* ------------------------------------------------------------------ *
 * Pure helpers (no IndexedDB — safe to unit-test in Node)
 * ------------------------------------------------------------------ */

/** Stable JSON stringify: object keys sorted, deterministic for hashing. */
export function canonicalize(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalize).join(",") + "]";
  }
  const keys = Object.keys(value).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + canonicalize(value[k]))
      .join(",") +
    "}"
  );
}

/** SHA-256 hex digest of a string via Web Crypto (available in Node 22 + browsers). */
export async function sha256Hex(str) {
  const data = new TextEncoder().encode(str);
  const buf = await globalThis.crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Build a signed backup envelope from a stores object. */
export async function buildEnvelope(stores, { appVersion = "0.0.0", exportedAt } = {}) {
  const payload = canonicalize(stores);
  const envelope = {
    envelopeVersion: BACKUP_VERSION,
    exportedAt: exportedAt || new Date().toISOString(),
    appVersion,
    stores,
  };
  envelope.sha256Checksum = await sha256Hex(payload);
  return envelope;
}

/** Verify an envelope's checksum matches its canonical payload. */
export async function verifyEnvelope(envelope) {
  if (!envelope || envelope.envelopeVersion !== BACKUP_VERSION || !envelope.stores) {
    return false;
  }
  const expected = await sha256Hex(canonicalize(envelope.stores));
  return expected === envelope.sha256Checksum;
}

/**
 * Deterministic merge of a current stores object with an imported one.
 * - attempts: union by attemptId, keep newer submittedAt on conflict
 * - questionStats: keep newer updatedAt
 * - unitProgress / bookmarksNotes: keep newer updatedAt
 * - meta: keep newer exportedAt/updatedAt
 * - sessions: union, keep newer updatedAt
 */
export function mergeBackup(current, incoming) {
  const cur = current || {};
  const inc = incoming || {};
  const merged = {};
  for (const store of db.STORES) {
    const a = cur[store] || [];
    const b = inc[store] || [];
    const map = new Map();
    for (const rec of a) map.set(rec[keyOf(store)], rec);
    for (const rec of b) {
      const k = rec[keyOf(store)];
      const existing = map.get(k);
      if (!existing || isNewer(rec, existing)) map.set(k, rec);
    }
    merged[store] = [...map.values()];
  }
  return merged;
}

function keyOf(store) {
  return db.STORE_SCHEMA[store].keyPath;
}

function isNewer(rec, other) {
  const t = rec.updatedAt || rec.submittedAt || rec.exportedAt || 0;
  const o = other.updatedAt || other.submittedAt || other.exportedAt || 0;
  return t > o;
}

/* ------------------------------------------------------------------ *
 * Browser integration (uses IndexedDB)
 * ------------------------------------------------------------------ */

/** Collect all stores from the DB and return a signed envelope. */
export async function exportBackup() {
  const stores = await db.collectStores();
  return buildEnvelope(stores, { appVersion: "phase-01" });
}

/**
 * Import an envelope.
 * @param {object} envelope  verified backup envelope
 * @param {"merge"|"replace"} mode  merge = deterministic union; replace = full swap
 */
export async function importBackup(envelope, mode = "merge") {
  if (!(await verifyEnvelope(envelope))) {
    throw new Error("Backup checksum mismatch — refusing import.");
  }
  if (mode === "replace") {
    await db.replaceStores(envelope.stores);
    return { mode: "replace" };
  }
  const current = await db.collectStores();
  const merged = mergeBackup(current, envelope.stores);
  await db.replaceStores(merged);
  return { mode: "merge" };
}

/** Trigger a client-side download of a signed backup JSON file. */
export function downloadBackup(envelope) {
  const blob = new Blob([JSON.stringify(envelope, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "jelet-study-backup-v1.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
