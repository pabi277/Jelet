/**
 * ai-history.js — JELET Study Hub (v3) · Device-Local AI Tutor Conversation History
 * ---------------------------------------------------------------------------
 * Stores past Codec AI Tutor conversations per question/unit/formula, keyed by
 * `tutorContextKey(...)`, in a dedicated IndexedDB **meta** record
 * (`key: "aiHistory"`). Never syncs, never touches the BYOK vault.
 *
 * Design decisions (docs/phases/phase-11/plan.md §3a):
 *   - Separate meta record (NOT inside the `app` record) so the sync payload
 *     stays small. `sanitizeForSync()` only projects `app`/`syncTombs` meta
 *     records, so `aiHistory` is automatically excluded from every sync
 *     payload; it is also listed in `SYNC_LOCAL_META_KEYS` so outbox marker
 *     filtering skips it.
 *   - Every read/write is best-effort: in memory-mode (IndexedDB blocked)
 *     history simply does not persist and the tutor works exactly as today.
 *   - Caps: MAX_SESSIONS sessions (LRU eviction), MAX_MESSAGES_PER_SESSION
 *     messages per session (keep newest).
 *   - Stores only a minimal rehydratable context + messages — never the full
 *     question/unit objects (they are re-fetched by id).
 */

import * as db from "./indexeddb.js";

/** Meta record key for the AI tutor history. */
export const AI_HISTORY_META_KEY = "aiHistory";

/** Hard caps (docs/phases/phase-11/plan.md §3b). */
export const MAX_SESSIONS = 12;
export const MAX_MESSAGES_PER_SESSION = 30;

/** A fresh, empty history record. */
export function emptyHistory() {
  return { key: AI_HISTORY_META_KEY, sessions: {}, order: [] };
}

/**
 * Derive a human-readable session title from a canonical tutor context:
 *   question → `JELET <year> · Q<n> · Unit <id>`
 *   formula  → `Unit <id> · <formulaLabel>`
 *   unit     → `Unit <id> · <unitTitle>`
 *   general  → `General · <origin>`
 */
export function sessionTitle(ctx = {}) {
  const q = ctx.question || null;
  const u = ctx.unit || null;
  const f = ctx.formula || null;
  if (q) {
    return `JELET ${q.year || ""} · Q${q.qNumber || ""} · Unit ${q.unitId || ""}`.replace(/\s+/g, " ").trim();
  }
  if (u && f) return `Unit ${u.unitId} · ${f.label}`;
  if (u) return `Unit ${u.unitId} · ${u.title}`;
  return `General · ${ctx.origin || "general"}`;
}

/**
 * Build a minimal rehydratable context snapshot (docs/phases/phase-11/plan.md §3b).
 * Only ids + light labels — the full question/unit objects are re-fetched.
 */
export function sessionContext(ctx = {}) {
  const q = ctx.question || null;
  const u = ctx.unit || null;
  const f = ctx.formula || null;
  return {
    mode: ctx.mode || (q ? "question" : f ? "formula" : u ? "unit" : "general"),
    questionId: q?.id || null,
    unitId: u?.unitId || q?.unitId || null,
    formulaId: f?.formulaId || null,
    origin: ctx.origin || "",
    section: ctx.section || "",
    paperTitle: ctx.paperTitle || "",
    selected: Array.isArray(ctx.selected) ? ctx.selected.slice() : [],
    studentOutcome: ctx.scoreResult?.outcome || null,
    studentScoreText: ctx.studentScoreText || "",
  };
}

function trimMessages(messages) {
  const list = Array.isArray(messages) ? messages.slice() : [];
  return list.slice(-MAX_MESSAGES_PER_SESSION);
}

/**
 * Upsert a session into a history record. PURE: returns a NEW record.
 * Enforces MAX_SESSIONS (evicts least-recently-updated beyond the cap) and
 * MAX_MESSAGES_PER_SESSION (keeps newest messages).
 */
export function upsertSession(record, { key, title, context, messages, updatedAt }) {
  const rec = record && typeof record === "object" ? { ...record } : emptyHistory();
  rec.sessions = { ...(rec.sessions || {}) };
  rec.order = Array.isArray(rec.order) ? rec.order.slice() : [];

  rec.sessions[key] = {
    title: title || "Conversation",
    updatedAt: updatedAt || new Date().toISOString(),
    messages: trimMessages(messages),
    context: context || null,
  };

  // Most-recently-updated first.
  rec.order = [key, ...rec.order.filter((k) => k !== key)];

  if (rec.order.length > MAX_SESSIONS) {
    const evicted = rec.order.slice(MAX_SESSIONS);
    rec.order = rec.order.slice(0, MAX_SESSIONS);
    for (const k of evicted) delete rec.sessions[k];
  }

  rec.key = AI_HISTORY_META_KEY;
  return rec;
}

/** Delete a single session. PURE: returns a NEW record. */
export function deleteSession(record, key) {
  const rec = record && typeof record === "object" ? { ...record } : emptyHistory();
  rec.sessions = { ...(rec.sessions || {}) };
  rec.order = Array.isArray(rec.order) ? rec.order.slice() : [];
  delete rec.sessions[key];
  rec.order = rec.order.filter((k) => k !== key);
  rec.key = AI_HISTORY_META_KEY;
  return rec;
}

/** Wipe all sessions. PURE: returns a NEW empty record. */
export function clearHistory() {
  return emptyHistory();
}

/** Ordered session list (newest first), each with key/title/updatedAt/messages/context. */
export function listSessions(record) {
  const rec = record && typeof record === "object" ? record : emptyHistory();
  const order = Array.isArray(rec.order) ? rec.order : Object.keys(rec.sessions || {});
  return order.filter((k) => rec.sessions && rec.sessions[k]).map((k) => ({
    key: k,
    ...rec.sessions[k],
  }));
}

/**
 * Async read of the aiHistory meta record. Best-effort — never throws;
 * returns an empty record when IndexedDB is unavailable or the record is absent.
 */
export async function loadAiHistory() {
  try {
    const rec = await db.get("meta", AI_HISTORY_META_KEY);
    if (!rec || !rec.sessions || !Array.isArray(rec.order)) return emptyHistory();
    return { key: AI_HISTORY_META_KEY, sessions: rec.sessions, order: rec.order };
  } catch {
    return emptyHistory();
  }
}

/**
 * Async write of the aiHistory meta record. Best-effort — never throws;
 * returns true on success, false when storage is unavailable.
 */
export async function persistAiHistory(record) {
  try {
    await db.put("meta", { ...record, key: AI_HISTORY_META_KEY });
    return true;
  } catch {
    return false;
  }
}
