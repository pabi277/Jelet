/** Runtime adapter: local-only quota state and governed live request execution. */
import * as db from '../db/indexeddb.js';
import { canSendNow, recordSend, recordUsage, localDay, nextRetryMs, RETRY_WINDOW_MS } from './ai-governor.js';
import { sendBuiltAiRequest, AiProviderError } from './ai-vault.js';

const KEY = 'aiGovernor';
let memory = { key: KEY, providers: {}, ledger: {} };
let writes = Promise.resolve();
let memoryDirty = false;

async function load() {
  try {
    await db.openDB();
    if (db.isMemoryMode()) return memory;
    const record = await db.get('meta', KEY);
    if (!memoryDirty && record && typeof record === 'object') memory = record;
  } catch { /* memory-only when storage is unavailable */ }
  return memory;
}
async function save(record, op) {
  memory = { ...record, key: KEY };
  try {
    if (db.isMemoryMode()) {
      if (op === 'send') db.broadcast({ store: 'meta', key: KEY, op: 'send' });
      return;
    }
    await db.put('meta', memory);
    memoryDirty = false;
    if (op === 'send') db.broadcast({ store: 'meta', key: KEY, op: 'send' });
  } catch { memoryDirty = true; /* keep same-tab memory when storage is full */ }
}
// All governor read/modify/write operations share a single IndexedDB
// transaction, so competing tabs cannot reserve the same quota slot or lose
// ledger updates. Browsers fail closed if shared storage is unavailable.
async function atomicMutation(fn) {
  const database = await db.openDB();
  // Separate tabs cannot coordinate a memory-only counter. In a browser,
  // fail closed and let the tutor offer Offline Corpus instead of exceeding
  // the free-tier policy silently. Node tests can still exercise memory mode.
  if (db.isMemoryMode() && typeof window !== 'undefined') throw new GovernorError('storage', 'Local quota storage unavailable.');
  if (!db.isMemoryMode() && !memoryDirty) {
    return new Promise((resolve, reject) => {
      let result, next, op;
      let tx;
      try {
        tx = database.transaction('meta', 'readwrite');
        const store = tx.objectStore('meta');
        const request = store.get(KEY);
        request.onsuccess = () => {
          try {
            const current = request.result || { key: KEY, providers: {}, ledger: {} };
            ({ value: result, next, op } = fn(current));
            if (next) store.put({ ...next, key: KEY });
          } catch (error) { reject(error); tx.abort(); }
        };
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => {
          if (next) {
            memory = { ...next, key: KEY };
            db.broadcast({ store: 'meta', key: KEY, type: 'mutate', ...(op ? { op } : {}) });
          }
          resolve(result);
        };
        tx.onerror = () => reject(tx.error || new Error('Governor transaction failed'));
        tx.onabort = () => reject(tx.error || new Error('Governor transaction aborted'));
      } catch (error) { reject(error); }
    });
  }
  const current = await load();
  const { value, next, op } = fn(current);
  if (next) await save(next, op);
  return value;
}
function mutate(fn) {
  const action = writes.then(async () => {
    try { return await atomicMutation(fn); }
    catch (error) {
      if (typeof window !== 'undefined') throw new GovernorError('storage', 'Local quota storage unavailable.');
      // Preserve same-tab accounting if storage breaks; do not write a stale
      // snapshot over other tabs when persistence later recovers.
      memoryDirty = true;
      const { value, next, op } = fn(memory);
      if (next) { memory = { ...next, key: KEY }; db.broadcast({ store: 'meta', key: KEY, type: 'mutate', ...(op ? { op } : {}) }); }
      return value;
    }
  });
  writes = action.catch(() => {});
  return action;
}
export function reserveGovernorSend(provider, now = Date.now()) {
  return mutate(current => {
    const verdict = canSendNow(provider, now, current);
    if (!['ok', 'daily-warn'].includes(verdict.verdict)) return { value: verdict };
    const next = recordSend(provider, now, current);
    next.ledger = recordUsage(current.ledger, { provider, day: localDay(now), requests: 1 });
    return { value: verdict, next, op: 'send' };
  });
}
export function storeGovernorUsage(provider, usage, now = Date.now()) {
  if (!usage) return Promise.resolve();
  return mutate(current => ({ next: { ...current, ledger: recordUsage(current.ledger,
    { provider, day: localDay(now), promptTokens: usage.promptTokens, outputTokens: usage.outputTokens }) } }));
}
export function storeGovernorError(provider, kind, now = Date.now()) {
  return mutate(current => ({ next: { ...current, lastErrors: { ...(current.lastErrors || {}),
    [provider]: { kind, at: now } } } }));
}
export async function loadGovernor() { await writes; return load(); }

export class GovernorError extends Error {
  constructor(kind, message, extra = {}) { super(message); this.name = 'GovernorError'; this.kind = kind; Object.assign(this, extra); }
}
function abortError(partialText = '') { const error = new DOMException('Generation stopped.', 'AbortError'); error.partialText = partialText; return error; }
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const done = () => { signal?.removeEventListener('abort', cancelled); resolve(); };
    const id = setTimeout(done, ms);
    const cancelled = () => { clearTimeout(id); signal?.removeEventListener('abort', cancelled); reject(abortError()); };
    signal?.addEventListener('abort', cancelled, { once: true });
  });
}

/**
 * Gate every attempted POST, including retries and continuation. The 70-second
 * deadline begins on the first pacing/recovery wait or truncation, not on an
 * otherwise successful initial response. No secrets or prompts enter the ledger.
 * Injected dependencies make timing and fetch-count assertions deterministic.
 */
export async function sendGovernedAiRequest({ request, buildContinuation, signal, onState = () => {}, onRequest = () => {}, onChunk = () => {}, onKeyFailure = () => null,
  reserve = reserveGovernorSend, saveUsage = storeGovernorUsage, saveError = storeGovernorError,
  send = sendBuiltAiRequest, now = Date.now, wait = sleep, random = Math.random } = {}) {
  let req = request, recoveryStart = null, attempts = 0, combined = '', usage = null, latency = 0;
  const begin = () => { if (recoveryStart === null) recoveryStart = now(); };
  const remaining = () => recoveryStart === null ? Infinity : Math.max(0, recoveryStart + RETRY_WINDOW_MS - now());
  const waitFor = async (ms, kind) => {
    begin();
    const expires = ms >= remaining();
    const end = now() + Math.min(ms, remaining());
    while (now() < end) {
      if (signal?.aborted) throw abortError(combined);
      onState({ kind, retryInMs: Math.max(0, end - now()), remainingMs: remaining() });
      try { await wait(Math.min(1000, end - now()), signal); }
      catch (error) { if (error?.name === 'AbortError') throw abortError(combined); throw error; }
      if (remaining() <= 0) throw new GovernorError('window-expired', 'Recovery window expired.', { partialText: combined });
    }
    if (expires) throw new GovernorError('window-expired', 'Recovery window expired.', { partialText: combined });
  };
  for (;;) {
    if (signal?.aborted) throw abortError(combined);
    if (remaining() <= 0) throw new GovernorError('window-expired', 'Recovery window expired.', { partialText: combined });
    let verdict;
    try { verdict = await reserve(req.provider, now()); }
    catch (error) { if (combined) error.partialText = combined; throw error; }
    if (verdict.verdict === 'daily-block') throw new GovernorError('daily-quota', 'Free daily budget used up.', { partialText: combined });
    if (verdict.verdict === 'min-gap' || verdict.verdict === 'rpm') {
      await waitFor(verdict.retryInMs, 'pacing');
      continue;
    }
    if (verdict.verdict === 'daily-warn') onState({ kind: 'daily-warn', remaining: verdict.remaining });
    onRequest(req);
    let currentStream = '';
    try {
      const result = await send(req, { signal, timeoutMs: Math.min(45000, remaining()), onChunk: chunk => { currentStream += chunk; onChunk(combined + currentStream, chunk); } });
      latency += result.providerLatencyMs || 0;
      if (result.usage) {
        usage ||= { promptTokens: 0, outputTokens: 0 };
        usage.promptTokens += result.usage.promptTokens || 0;
        usage.outputTokens += result.usage.outputTokens || 0;
        try { await saveUsage(req.provider, result.usage, now()); } catch { /* never block reply */ }
      }
      combined += result.text;
      if (!result.truncated || !buildContinuation) return { text: combined, usage, truncated: Boolean(result.truncated), providerLatencyMs: latency };
      begin();
      if (remaining() <= 0) return { text: combined, usage, truncated: true, providerLatencyMs: latency };
      req = buildContinuation(combined);
      attempts = 0;
    } catch (error) {
      const partial = combined + (error?.partialText || currentStream);
      if (error?.name === 'AbortError' || signal?.aborted) throw abortError(partial);
      // A broken stream may already have displayed text; do not silently retry
      // from scratch and duplicate it. Keep it for a manual Continue instead.
      if (currentStream || error?.partialText) {
        const kind = remaining() <= 0 ? 'window-expired' : (error?.classification?.kind || 'network');
        try { await saveError(req.provider, kind, now()); } catch { /* best effort */ }
        throw new GovernorError(kind, 'Provider stream interrupted.', { partialText: partial });
      }
      if (error?.usage) {
        try { await saveUsage(req.provider, error.usage, now()); } catch { /* best effort */ }
      }
      if (remaining() <= 0) throw new GovernorError('window-expired', 'Recovery window expired.', { partialText: combined });
      const classification = error?.classification || { kind: 'network', retryAfterMs: null };
      try { await saveError(req.provider, classification.kind, now()); } catch { /* best effort */ }
      // Switch only for explicit credential/quota failures, never after partial
      // output, and count every switch against the existing retry budget.
      if (['auth', 'daily-quota', 'per-minute'].includes(classification.kind) && attempts < 2) {
        begin();
        if (classification.retryAfterMs == null || classification.retryAfterMs < remaining()) {
          const alternative = onKeyFailure(req, classification);
          if (alternative?.request && alternative.request.provider === req.provider && alternative.request.bodyString === req.bodyString) {
            attempts++;
            req = alternative.request;
            onState({kind:'switching-key', label:alternative.label || 'another key'});
            continue;
          }
        }
      }
      const delay = nextRetryMs(attempts++, classification, null, random, now());
      if (delay === null) throw new GovernorError(classification.kind, error?.message || 'Provider unavailable.', { partialText: combined });
      await waitFor(delay, 'retry');
    }
  }
}
