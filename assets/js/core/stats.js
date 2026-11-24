/**
 * stats.js — JELET Study Hub (v3) · Honest IndexedDB Study State & Leitner Engine
 * ---------------------------------------------------------------------------
 * Computes all user metrics strictly from `jelet_hub_v1` IndexedDB stores:
 *   - 0 and "—" on a fresh device (never faked)
 *   - Official PYQs Practiced (/400) strictly separated from Curated Practice Sets
 *   - Assisted attempts NEVER pollute Independent Accuracy or Mock Bests
 *   - Leitner Spaced Repetition (`leitnerBox: 0..4`) surfaces missed/partial
 *     questions in the Mistake Queue automatically
 */

import * as db from "../db/indexeddb.js";
import { scoreAttempt, MAX_PAPER_TWELFTHS } from "./scoring.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const LEITNER_INTERVAL_DAYS = [0, 1, 3, 7, 14];

export const WEAK_AREA_MIN_ATTEMPTS = 3;
export const WEAK_AREA_TOP_K = 3;

function localDateKey(isoOrMs) {
  const d = new Date(isoOrMs);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Pure streak calculation from an array of submitted attempt timestamps. */
export function computeStreakDays(submittedTimestamps, nowMs = Date.now()) {
  if (!submittedTimestamps || !submittedTimestamps.length) return 0;
  const days = new Set();
  for (const ts of submittedTimestamps) {
    const key = localDateKey(ts);
    if (key) days.add(key);
  }
  if (days.size === 0) return 0;

  const todayKey = localDateKey(nowMs);
  const yesterdayKey = localDateKey(nowMs - DAY_MS);
  let cursorMs = days.has(todayKey)
    ? nowMs
    : days.has(yesterdayKey)
    ? nowMs - DAY_MS
    : null;

  if (cursorMs === null) return 0;

  let streak = 0;
  while (days.has(localDateKey(cursorMs))) {
    streak += 1;
    cursorMs -= DAY_MS;
  }
  return streak;
}

/** Create and persist a new in-progress exam or practice session. */
export async function createSession({
  kind = "mock", // "mock" | "drill" | "cat2" | "mistake" | "daily10" | "practice-set"
  mode = "independent", // "independent" | "assisted"
  paperId = null,
  title = "Practice Session",
  questions = [],
  durationMinutes = null,
}) {
  const now = new Date().toISOString();
  const sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const remainingMs = durationMinutes ? durationMinutes * 60 * 1000 : null;
  const session = {
    sessionId,
    kind,
    mode,
    paperId,
    title,
    status: "in_progress",
    questionIds: questions.map((q) => q.id),
    currentIndex: 0,
    responses: {}, // qId -> string[]
    markedForReview: [], // qId[]
    assistedQuestionIds: [], // qIds where hint/AI was opened
    revealedQuestionIds: [], // qIds already checked in assisted drill
    durationMs: remainingMs,
    remainingMs,
    lastTickAt: Date.now(),
    createdAt: now,
    updatedAt: now,
  };
  await db.put("sessions", session);
  return session;
}

export async function getSession(sessionId) {
  return db.get("sessions", sessionId);
}

export async function saveSession(session) {
  const next = {
    ...session,
    updatedAt: new Date().toISOString(),
  };
  await db.put("sessions", next);
  return next;
}

export async function deleteSession(sessionId) {
  return db.deleteRecord("sessions", sessionId);
}

export async function getActiveSessions() {
  const all = await db.getAll("sessions");
  return all
    .filter((s) => s.status === "in_progress")
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

/**
 * Finalize a session into an immutable `attempts` record and update `questionStats`
 * (Leitner spaced-repetition boxes) for independent attempts.
 */
export async function submitSessionToAttempt({ session, questions }) {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const scored = scoreAttempt(questions, session.responses || {});
  const assistedSet = new Set(session.assistedQuestionIds || []);
  const effectiveMode =
    session.mode === "assisted" || assistedSet.size > 0 ? "assisted" : "independent";

  const attemptId = `att-${nowMs}-${Math.random().toString(36).slice(2, 7)}`;
  const elapsedMs =
    session.durationMs != null && session.remainingMs != null
      ? Math.max(0, session.durationMs - session.remainingMs)
      : null;

  const attempt = {
    attemptId,
    sessionId: session.sessionId,
    kind: session.kind,
    mode: effectiveMode,
    paperId: session.paperId || null,
    title: session.title,
    submittedAt: nowIso,
    updatedAt: nowIso,
    elapsedMs,
    questionIds: questions.map((q) => q.id),
    responses: session.responses || {},
    assistedQuestionIds: [...assistedSet],
    totalTwelfths: scored.totalTwelfths,
    maxTwelfths: scored.maxTwelfths,
    positiveTwelfths: scored.positiveTwelfths,
    negativeTwelfths: scored.negativeTwelfths,
    cat1NetTwelfths: scored.cat1NetTwelfths,
    cat1MaxTwelfths: scored.cat1MaxTwelfths,
    cat2Twelfths: scored.cat2Twelfths,
    cat2MaxTwelfths: scored.cat2MaxTwelfths,
    voidedTwelfths: scored.voidedTwelfths,
    counts: scored.counts,
    bySubject: scored.bySubject,
    tieBreakVector: scored.tieBreakVector,
    items: scored.items,
  };

  await db.put("attempts", attempt);

  // Update per-question stats & Leitner spaced-repetition ONLY for unassisted items
  const existingStats = await db.getAll("questionStats");
  const statMap = new Map(existingStats.map((r) => [r.questionId, r]));
  const qMap = new Map(questions.map((q) => [q.id, q]));
  const updates = [];

  for (const item of scored.items) {
    if (item.outcome === "unattempted" || item.outcome === "voided_awarded") continue;
    if (session.mode === "assisted" || assistedSet.has(item.questionId)) continue;

    const q = qMap.get(item.questionId);
    const prev = statMap.get(item.questionId);
    const prevBox = prev?.leitnerBox ?? 0;

    let nextBox = 0;
    let nextReviewMs = nowMs;
    if (item.outcome === "correct") {
      nextBox = Math.min(4, prevBox + 1);
      nextReviewMs = nowMs + LEITNER_INTERVAL_DAYS[nextBox] * DAY_MS;
    } else {
      // incorrect or partial -> Leitner Box 0 (due immediately in Mistake Queue)
      nextBox = 0;
      nextReviewMs = nowMs;
    }

    updates.push({
      questionId: item.questionId,
      sourceType: q?.sourceType || "official-pyq",
      subjectId: item.subjectId,
      unitId: item.unitId,
      attemptsCount: (prev?.attemptsCount || 0) + 1,
      correctCount: (prev?.correctCount || 0) + (item.outcome === "correct" ? 1 : 0),
      mistakeCount:
        (prev?.mistakeCount || 0) +
        (item.outcome === "incorrect" || item.outcome === "partial" ? 1 : 0),
      lastOutcome: item.outcome,
      lastSelected: item.selected,
      leitnerBox: nextBox,
      nextReviewAt: new Date(nextReviewMs).toISOString(),
      updatedAt: nowIso,
    });
  }

  if (updates.length) {
    await db.bulkPut("questionStats", updates);
  }
  await db.deleteRecord("sessions", session.sessionId);

  return attempt;
}

export async function getAttempt(attemptId) {
  return db.get("attempts", attemptId);
}

export async function getAllAttempts() {
  const all = await db.getAll("attempts");
  return all.sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));
}

/** Return questionStats records due today in the Spaced Mistake Queue. */
export async function getDueMistakeRecords(nowMs = Date.now()) {
  const stats = await db.getAll("questionStats");
  const nowIso = new Date(nowMs).toISOString();
  return stats
    .filter(
      (s) =>
        (s.mistakeCount || 0) > 0 &&
        (s.leitnerBox === 0 || !s.nextReviewAt || s.nextReviewAt <= nowIso)
    )
    .sort((a, b) => (a.leitnerBox - b.leitnerBox) || String(a.nextReviewAt).localeCompare(String(b.nextReviewAt)));
}

/* ------------------------------------------------------------------ *
 * Unit Progress & Video Lecture Tracking (`unitProgress` store)
 * ------------------------------------------------------------------ */
export async function getUnitProgressMap() {
  const rows = await db.getAll("unitProgress");
  return new Map(rows.map((r) => [r.unitId, r]));
}

export async function updateUnitProgress(unitId, patch) {
  const prev = (await db.get("unitProgress", unitId)) || {
    unitId,
    status: "unstarted", // "unstarted" | "studying" | "revised"
    watchedVideoIds: [],
    lastVisitedAt: null,
  };
  const next = {
    ...prev,
    ...patch,
    unitId,
    updatedAt: new Date().toISOString(),
  };
  await db.put("unitProgress", next);
  return next;
}

export async function toggleWatchedVideo(unitId, videoId) {
  const prev = await db.get("unitProgress", unitId);
  const set = new Set(prev?.watchedVideoIds || []);
  if (set.has(videoId)) set.delete(videoId);
  else set.add(videoId);
  return updateUnitProgress(unitId, { watchedVideoIds: [...set] });
}

/* ------------------------------------------------------------------ *
 * Bookmarks & Personal Notes (`bookmarksNotes` store)
 * ------------------------------------------------------------------ */
export async function getBookmarksMap() {
  const rows = await db.getAll("bookmarksNotes");
  return new Map(rows.map((r) => [r.targetId, r]));
}

export async function toggleBookmark(targetId, type = "question", label = "") {
  const existing = await db.get("bookmarksNotes", targetId);
  const nextBookmarked = !existing?.bookmarked;
  if (!nextBookmarked && !existing?.note) {
    await db.deleteRecord("bookmarksNotes", targetId);
    return null;
  }
  const rec = {
    targetId,
    type,
    label: label || existing?.label || targetId,
    bookmarked: nextBookmarked,
    note: existing?.note || "",
    updatedAt: new Date().toISOString(),
  };
  await db.put("bookmarksNotes", rec);
  return rec;
}

export async function savePersonalNote(targetId, type = "question", noteText = "", label = "") {
  const existing = await db.get("bookmarksNotes", targetId);
  const trimmed = String(noteText || "").trim();
  if (!trimmed && !existing?.bookmarked) {
    await db.deleteRecord("bookmarksNotes", targetId);
    return null;
  }
  const rec = {
    targetId,
    type,
    label: label || existing?.label || targetId,
    bookmarked: Boolean(existing?.bookmarked),
    note: trimmed,
    updatedAt: new Date().toISOString(),
  };
  await db.put("bookmarksNotes", rec);
  return rec;
}

/* ------------------------------------------------------------------ *
 * Weak-Area Detection (Phase 07 · Slice 1)
 * ------------------------------------------------------------------ */

/**
 * Aggregate per-unit and per-subject accuracy from real independent `questionStats`.
 * Only surfaces units/subjects with at least `minAttempts` (default 3) attempts,
 * sorted worst-first (lowest accuracy ratio, then most mistakes, then canonical ID).
 */
export function computeWeakAreas(
  questionStats = [],
  manifestUnits = [],
  { minAttempts = WEAK_AREA_MIN_ATTEMPTS, topK = WEAK_AREA_TOP_K } = {}
) {
  const unitMetaMap = new Map();
  for (const u of manifestUnits || []) {
    if (u && u.unitId) unitMetaMap.set(u.unitId, u);
  }

  const unitBuckets = new Map();
  const subjectBuckets = new Map();
  for (const sid of ["MATH", "PHYS", "CHEM", "FEEE"]) {
    subjectBuckets.set(sid, {
      subjectId: sid,
      attempts: 0,
      correct: 0,
      mistakes: 0,
      questionsAttempted: 0,
    });
  }

  let totalAttempts = 0;

  for (const rec of questionStats || []) {
    if (!rec) continue;
    const att = Number(rec.attemptsCount) || 0;
    if (att <= 0) continue;
    const corr = Math.min(att, Math.max(0, Number(rec.correctCount) || 0));
    const mist = Math.max(0, Number(rec.mistakeCount) || 0);
    totalAttempts += att;

    if (rec.unitId) {
      const meta = unitMetaMap.get(rec.unitId);
      let uBucket = unitBuckets.get(rec.unitId);
      if (!uBucket) {
        uBucket = {
          unitId: rec.unitId,
          subjectId: rec.subjectId || meta?.subjectId || "",
          officialCode: meta?.officialCode || rec.unitId,
          title: meta?.title || rec.unitId,
          attempts: 0,
          correct: 0,
          mistakes: 0,
          questionsAttempted: 0,
        };
        unitBuckets.set(rec.unitId, uBucket);
      }
      uBucket.attempts += att;
      uBucket.correct += corr;
      uBucket.mistakes += mist;
      uBucket.questionsAttempted += 1;
    }

    const sid = rec.subjectId || unitMetaMap.get(rec.unitId)?.subjectId;
    if (sid && subjectBuckets.has(sid)) {
      const sBucket = subjectBuckets.get(sid);
      sBucket.attempts += att;
      sBucket.correct += corr;
      sBucket.mistakes += mist;
      sBucket.questionsAttempted += 1;
    }
  }

  const finalize = (bucket) => ({
    ...bucket,
    accuracyRatio: bucket.attempts > 0 ? bucket.correct / bucket.attempts : null,
    accuracyPct: bucket.attempts > 0 ? Math.round((bucket.correct * 100) / bucket.attempts) : null,
  });

  const worstFirstUnitSort = (a, b) =>
    a.accuracyRatio - b.accuracyRatio ||
    b.mistakes - a.mistakes ||
    b.attempts - a.attempts ||
    String(a.unitId).localeCompare(String(b.unitId));

  const worstFirstSubjectSort = (a, b) =>
    a.accuracyRatio - b.accuracyRatio ||
    b.mistakes - a.mistakes ||
    b.attempts - a.attempts ||
    String(a.subjectId).localeCompare(String(b.subjectId));

  const units = [...unitBuckets.values()]
    .filter((u) => u.attempts >= minAttempts)
    .map(finalize)
    .sort(worstFirstUnitSort);

  const subjects = [...subjectBuckets.values()]
    .filter((s) => s.attempts >= minAttempts)
    .map(finalize)
    .sort(worstFirstSubjectSort);

  const topWeakUnits = units.slice(0, Math.max(0, topK));

  return {
    minAttempts,
    topK,
    totalAttempts,
    hasEnoughData: units.length > 0 || subjects.length > 0,
    topWeakUnits,
    units,
    subjects,
  };
}

/* ------------------------------------------------------------------ *
 * Aggregated Honest Dashboard & Subject Snapshot
 * ------------------------------------------------------------------ */
export async function computeHubSnapshot(manifest) {
  const [meta, sessions, attempts, qStats, unitRows, bookmarkRows] = await Promise.all([
    db.getMeta(),
    getActiveSessions(),
    getAllAttempts(),
    db.getAll("questionStats"),
    db.getAll("unitProgress"),
    db.getAll("bookmarksNotes"),
  ]);

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  const streakDays = computeStreakDays(
    attempts.map((a) => a.submittedAt),
    nowMs
  );

  const officialStats = qStats.filter((s) => (s.sourceType || "official-pyq") === "official-pyq");
  const officialPyqsPracticed = officialStats.length;
  const totalOfficialPyqs = manifest?.totals?.questions || 400;

  // Independent accuracy across independent questionStats
  let totalIndepAttempts = 0;
  let totalIndepCorrect = 0;
  for (const s of qStats) {
    totalIndepAttempts += s.attemptsCount || 0;
    totalIndepCorrect += s.correctCount || 0;
  }
  const independentAccuracy =
    totalIndepAttempts > 0 ? Math.round((totalIndepCorrect * 100) / totalIndepAttempts) : null;

  // Best independent full-paper 120-mark mock
  const fullIndepMocks = attempts.filter(
    (a) => a.mode === "independent" && a.maxTwelfths === MAX_PAPER_TWELFTHS
  );
  const mockBestTwelfths = fullIndepMocks.length
    ? Math.max(...fullIndepMocks.map((a) => a.totalTwelfths))
    : null;

  // Paper best scores map (paperId -> best attempt)
  const paperBestMap = new Map();
  for (const a of attempts) {
    if (!a.paperId || a.maxTwelfths !== MAX_PAPER_TWELFTHS) continue;
    const prev = paperBestMap.get(a.paperId);
    if (!prev || a.totalTwelfths > prev.totalTwelfths) {
      paperBestMap.set(a.paperId, a);
    }
  }

  // Due mistakes in Leitner queue
  const dueMistakes = qStats.filter(
    (s) =>
      (s.mistakeCount || 0) > 0 &&
      (s.leitnerBox === 0 || !s.nextReviewAt || s.nextReviewAt <= nowIso)
  );

  // Per-subject mastery (combined unit revision + independent PYQ practice)
  const unitMap = new Map(unitRows.map((u) => [u.unitId, u]));
  const manifestUnits = manifest?.units || [];
  const subjectIds = ["MATH", "PHYS", "CHEM", "FEEE"];
  const subjectStats = {};

  for (const sid of subjectIds) {
    const unitsForSubj = manifestUnits.filter((u) => u.subjectId === sid);
    const revisedUnits = unitsForSubj.filter(
      (u) => unitMap.get(u.unitId)?.status === "revised"
    ).length;
    const studyingUnits = unitsForSubj.filter(
      (u) => unitMap.get(u.unitId)?.status === "studying"
    ).length;
    const pyqPracticed = officialStats.filter((s) => s.subjectId === sid).length;
    const unitPct = unitsForSubj.length
      ? Math.round((revisedUnits * 100) / unitsForSubj.length)
      : 0;
    subjectStats[sid] = {
      subjectId: sid,
      totalUnits: unitsForSubj.length,
      revisedUnits,
      studyingUnits,
      pyqPracticed,
      completionPct: unitPct,
    };
  }

  // Determine next roadmap unit (cursor if set and not revised, else first studying/unstarted unit)
  let roadmapUnit = null;
  if (meta.roadmapCursor) {
    roadmapUnit = manifestUnits.find((u) => u.unitId === meta.roadmapCursor) || null;
  }
  if (!roadmapUnit || unitMap.get(roadmapUnit.unitId)?.status === "revised") {
    roadmapUnit =
      manifestUnits.find((u) => unitMap.get(u.unitId)?.status === "studying") ||
      manifestUnits.find((u) => unitMap.get(u.unitId)?.status !== "revised") ||
      manifestUnits[0] ||
      null;
  }

  const savedBookmarks = bookmarkRows.filter((b) => b.bookmarked);
  const recentlyVisitedUnits = [...unitRows]
    .filter((u) => u.lastVisitedAt || u.updatedAt)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

  const weakAreas = computeWeakAreas(qStats, manifestUnits);

  return {
    meta,
    activeSession: sessions[0] || null,
    activeSessions: sessions,
    attempts,
    questionStats: qStats,
    streakDays,
    officialPyqsPracticed,
    totalOfficialPyqs,
    independentAccuracy,
    mockBestTwelfths,
    paperBestMap,
    dueMistakes,
    weakAreas,
    subjectStats,
    unitMap,
    roadmapUnit,
    savedBookmarks,
    bookmarkRows,
    recentlyVisitedUnits,
  };
}
