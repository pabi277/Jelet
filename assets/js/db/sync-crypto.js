/**
 * sync-crypto.js — JELET Study Hub (v3) · Client-Side Sync Payload Encryption
 * ---------------------------------------------------------------------------
 * Phase 09: optional encrypted cloud sync encrypts every payload BEFORE it
 * leaves the device. Honest, standard Web Crypto only:
 *
 *   key derivation : PBKDF2 → SHA-256 (default 250 000 iterations)
 *   encryption     : AES-GCM 256-bit (random 12-byte IV, random 16-byte salt)
 *
 * The plaintext passphrase is EPHEMERAL: it lives only in a module variable
 * for the current tab session and is never written to IndexedDB, localStorage,
 * the sync config, or any backup/export. The salt travels inside the encrypted
 * envelope header (a salt is not a secret) so a second device that knows the
 * same passphrase can decrypt.
 *
 * This is NOT "military grade" anything — it is the standard browser crypto
 * stack used honestly: an attacker with the ciphertext and no passphrase
 * cannot read it, but a weak passphrase can be brute-forced offline. Pick a
 * long passphrase.
 *
 * Pure helpers — unit-tested in Node (tests/sync.test.mjs).
 */

export const SYNC_CIPHER_VERSION = 1;
export const SYNC_KDF_ALGORITHM = "PBKDF2";
export const SYNC_KDF_HASH = "SHA-256";
export const SYNC_CIPHER_ALGORITHM = "AES-GCM";
export const SYNC_KEY_BITS = 256;
export const DEFAULT_KDF_ITERATIONS = 250000;
export const SYNC_PASSPHRASE_MIN_LENGTH = 8;
export const SYNC_SALT_BYTES = 16;
export const SYNC_IV_BYTES = 12;

/** Typed error for encryption/decryption failures (UI shows `.message`). */
export class SyncCryptoError extends Error {
  constructor(message, code = "CRYPTO_ERROR") {
    super(message);
    this.name = "SyncCryptoError";
    this.code = code;
  }
}

/* ------------------------------------------------------------------ *
 * base64 <-> bytes (no Node Buffer — must work in browsers too)
 * ------------------------------------------------------------------ */

export function bytesToBase64(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < arr.length; i += 0x8000) {
    bin += String.fromCharCode(...arr.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

export function base64ToBytes(b64) {
  let bin;
  try {
    bin = atob(String(b64));
  } catch {
    throw new SyncCryptoError("Sync payload is not valid base64.", "BAD_BASE64");
  }
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function subtle() {
  const c = globalThis.crypto;
  if (!c || !c.subtle) {
    throw new SyncCryptoError(
      "Web Crypto (SubtleCrypto) is unavailable — encrypted sync cannot run in this environment.",
      "NO_SUBTLE"
    );
  }
  return c.subtle;
}

function randomBytes(n) {
  const buf = new Uint8Array(n);
  const g = globalThis.crypto;
  if (!g || typeof g.getRandomValues !== "function") {
    throw new SyncCryptoError("Secure random generator unavailable.", "NO_RANDOM");
  }
  g.getRandomValues(buf);
  return buf;
}

function assertPassphrase(passphrase) {
  const pass = typeof passphrase === "string" ? passphrase : "";
  if (!pass || pass.length < SYNC_PASSPHRASE_MIN_LENGTH) {
    throw new SyncCryptoError(
      `Sync passphrase must be at least ${SYNC_PASSPHRASE_MIN_LENGTH} characters.`,
      "WEAK_PASSPHRASE"
    );
  }
  return pass;
}

/** Header bytes bound as AES-GCM additional authenticated data (tamper-proof header). */
function aadBytes(header) {
  return new TextEncoder().encode(JSON.stringify(header));
}

function headerOf(payload) {
  return {
    v: payload.v,
    kdf: payload.kdf,
    hash: payload.hash,
    enc: payload.enc,
    iterations: payload.iterations,
  };
}

/**
 * Derive an AES-GCM key from a passphrase + salt via PBKDF2-SHA-256.
 * The key is non-extractable and used ephemerally.
 */
export async function deriveSyncKey(passphrase, salt, iterations = DEFAULT_KDF_ITERATIONS) {
  const pass = assertPassphrase(passphrase);
  const iters = Number(iterations) > 0 ? Number(iterations) : DEFAULT_KDF_ITERATIONS;
  const baseKey = await subtle().importKey(
    "raw",
    new TextEncoder().encode(pass),
    SYNC_KDF_ALGORITHM,
    false,
    ["deriveKey"]
  );
  return subtle().deriveKey(
    { name: SYNC_KDF_ALGORITHM, salt, iterations: iters, hash: SYNC_KDF_HASH },
    baseKey,
    { name: SYNC_CIPHER_ALGORITHM, length: SYNC_KEY_BITS },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt any JSON-serializable object into a self-describing envelope:
 *   { v, kdf, hash, enc, iterations, salt, iv, ciphertext }  (binary fields base64)
 */
export async function encryptSyncPayload(obj, passphrase, { iterations = DEFAULT_KDF_ITERATIONS } = {}) {
  const pass = assertPassphrase(passphrase);
  const iters =
    Number.isFinite(Number(iterations)) && Number(iterations) >= 10000
      ? Math.floor(Number(iterations))
      : DEFAULT_KDF_ITERATIONS;
  const salt = randomBytes(SYNC_SALT_BYTES);
  const iv = randomBytes(SYNC_IV_BYTES);
  const key = await deriveSyncKey(pass, salt, iters);
  const header = {
    v: SYNC_CIPHER_VERSION,
    kdf: SYNC_KDF_ALGORITHM,
    hash: SYNC_KDF_HASH,
    enc: SYNC_CIPHER_ALGORITHM,
    iterations: iters,
  };
  let plaintext;
  try {
    plaintext = JSON.stringify(obj);
  } catch {
    throw new SyncCryptoError("Sync payload is not JSON-serializable.", "NOT_SERIALIZABLE");
  }
  if (plaintext === undefined) {
    throw new SyncCryptoError("Sync payload is not JSON-serializable.", "NOT_SERIALIZABLE");
  }
  const ct = await subtle().encrypt(
    { name: SYNC_CIPHER_ALGORITHM, iv, additionalData: aadBytes(header) },
    key,
    new TextEncoder().encode(plaintext)
  );
  return {
    ...header,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ct)),
  };
}

/** Shape check for an encrypted envelope (used before attempting decrypt). */
export function isSyncCipher(payload) {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      payload.v === SYNC_CIPHER_VERSION &&
      payload.kdf === SYNC_KDF_ALGORITHM &&
      payload.enc === SYNC_CIPHER_ALGORITHM &&
      typeof payload.salt === "string" &&
      typeof payload.iv === "string" &&
      typeof payload.ciphertext === "string" &&
      Number(payload.iterations) > 0
  );
}

/**
 * Decrypt an envelope produced by `encryptSyncPayload`.
 * Throws a descriptive SyncCryptoError on wrong passphrase / tampering.
 */
export async function decryptSyncPayload(payload, passphrase) {
  if (!isSyncCipher(payload)) {
    throw new SyncCryptoError(
      "Remote sync payload is not a recognized encrypted envelope.",
      "BAD_ENVELOPE"
    );
  }
  const pass = assertPassphrase(passphrase);
  const header = headerOf(payload);
  const key = await deriveSyncKey(pass, base64ToBytes(payload.salt), payload.iterations);
  let plaintextBytes;
  try {
    plaintextBytes = await subtle().decrypt(
      { name: SYNC_CIPHER_ALGORITHM, iv: base64ToBytes(payload.iv), additionalData: aadBytes(header) },
      key,
      base64ToBytes(payload.ciphertext)
    );
  } catch {
    throw new SyncCryptoError(
      "Decryption failed — wrong passphrase or corrupted sync payload.",
      "DECRYPT_FAILED"
    );
  }
  try {
    return JSON.parse(new TextDecoder().decode(plaintextBytes));
  } catch {
    throw new SyncCryptoError("Decrypted sync payload is not valid JSON.", "BAD_PLAINTEXT");
  }
}
