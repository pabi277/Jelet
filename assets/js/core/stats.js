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
import { scoreAttempt, MAX_PAPER_TWELFTHS, isVoidedQuestion, SUBJECT_META } from "./scoring.js";

const DAY_MS = 24 * 60 * 60 * 1000;
export const SPACED_INTERVAL_DAYS = [0, 1, 3, 7];
export const MISTAKE_GRADUATION_THRESHOLD = 2;

export const WEAK_AREA_MIN_ATTEMPTS = 3;
export const WEAK_AREA_TOP_K = 3;
export const ADAPTIVE_MIN_ATTEMPTS = 5;
export const ADAPTIVE_MAINTENANCE_FLOOR = 0.25;

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
  mistakeContext = null,
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
    questionTimes: {}, // qId -> ms spent on that question (mock time analytics)
    assistedQuestionIds: [], // qIds where hint/AI was opened
    revealedQuestionIds: [], // qIds already checked in assisted drill
    mistakeContext: mistakeContext || null, // qId -> prior mistake attempt metadata
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

/* ------------------------------------------------------------------ *
 * Spaced Mistake Notebook & Graduation Engine (Phase 07 · Slice 3)
 * ------------------------------------------------------------------ */

/** True when a `questionStats` record is currently active in the Mistake Queue. */
export function isMistakeRecordActive(
  rec,
  { graduationThreshold = MISTAKE_GRADUATION_THRESHOLD } = {}
) {
  if (!rec) return false;
  if (typeof rec.inMistakeQueue === "boolean") {
    return rec.inMistakeQueue;
  }
  if (rec.flaggedAsMistake) return true;
  if ((rec.mistakeCount || 0) > 0) {
    const streak = rec.consecutiveCorrect ?? rec.leitnerBox ?? 0;
    return streak < graduationThreshold;
  }
  return false;
}

/** True when an active mistake's scheduled review time has arrived. */
export function isMistakeRecordDue(
  rec,
  nowMs = Date.now(),
  { graduationThreshold = MISTAKE_GRADUATION_THRESHOLD } = {}
) {
  if (!isMistakeRecordActive(rec, { graduationThreshold })) return false;
  const nowIso = new Date(nowMs).toISOString();
  return (rec.leitnerBox ?? 0) === 0 || !rec.nextReviewAt || rec.nextReviewAt <= nowIso;
}

/**
 * Pure state transition for a single independent question attempt.
 *   - Wrong/partial -> enters active mistake queue, due immediately (Box 0).
 *   - Correct while in mistake queue -> advances through 1-day / 3-day / 7-day
 *     deterministic spaced intervals and graduates out once answered correctly
 *     `graduationThreshold` (default N=2) consecutive times.
 */
export function applyQuestionAttemptToStat(
  prev,
  item,
  questionMeta = {},
  nowMs = Date.now(),
  { graduationThreshold = MISTAKE_GRADUATION_THRESHOLD } = {}
) {
  const nowIso = new Date(nowMs).toISOString();
  const wasActiveMistake = isMistakeRecordActive(prev, { graduationThreshold });
  const isMiss = item.outcome === "incorrect" || item.outcome === "partial";
  const isCorrect = item.outcome === "correct";

  const attemptsCount = (prev?.attemptsCount || 0) + 1;
  const correctCount = (prev?.correctCount || 0) + (isCorrect ? 1 : 0);
  const mistakeCount = (prev?.mistakeCount || 0) + (isMiss ? 1 : 0);

  let inMistakeQueue = false;
  let consecutiveCorrect = 0;
  let leitnerBox = 0;
  let nextReviewMs = nowMs;
  let flaggedAsMistake = Boolean(prev?.flaggedAsMistake);
  let graduatedAt = prev?.graduatedAt || null;
  let lastMistakeSelected = prev?.lastMistakeSelected || [];
  let lastMistakeOutcome = prev?.lastMistakeOutcome || null;

  if (isMiss) {
    inMistakeQueue = true;
    consecutiveCorrect = 0;
    leitnerBox = 0;
    nextReviewMs = nowMs + SPACED_INTERVAL_DAYS[0] * DAY_MS;
    graduatedAt = null;
    lastMistakeSelected = [...(item.selected || [])];
    lastMistakeOutcome = item.outcome;
  } else if (isCorrect && wasActiveMistake) {
    const prevStreak = prev?.consecutiveCorrect ?? prev?.leitnerBox ?? 0;
    consecutiveCorrect = prevStreak + 1;
    leitnerBox = Math.min(SPACED_INTERVAL_DAYS.length - 1, consecutiveCorrect);
    nextReviewMs = nowMs + SPACED_INTERVAL_DAYS[leitnerBox] * DAY_MS;

    if (!lastMistakeSelected.length && prev?.lastSelected?.length && prev?.lastOutcome !== "correct") {
      lastMistakeSelected = [...prev.lastSelected];
      lastMistakeOutcome = prev.lastOutcome || null;
    }

    if (consecutiveCorrect >= graduationThreshold) {
      inMistakeQueue = false;
      flaggedAsMistake = false;
      graduatedAt = nowIso;
    } else {
      inMistakeQueue = true;
      graduatedAt = null;
    }
  } else {
    consecutiveCorrect = (prev?.consecutiveCorrect || 0) + 1;
    leitnerBox = Math.min(SPACED_INTERVAL_DAYS.length - 1, (prev?.leitnerBox ?? 0) + 1);
    nextReviewMs = nowMs + SPACED_INTERVAL_DAYS[leitnerBox] * DAY_MS;
    inMistakeQueue = false;
    flaggedAsMistake = false;
  }

  return {
    questionId: item.questionId,
    sourceType: questionMeta?.sourceType || prev?.sourceType || "official-pyq",
    subjectId: item.subjectId || questionMeta?.subjectId || prev?.subjectId || "",
    unitId: item.unitId || questionMeta?.unitId || prev?.unitId || "",
    attemptsCount,
    correctCount,
    mistakeCount,
    consecutiveCorrect,
    inMistakeQueue,
    flaggedAsMistake,
    graduatedAt,
    lastAttemptAt: nowIso,
    lastOutcome: item.outcome,
    lastSelected: [...(item.selected || [])],
    lastMistakeSelected,
    lastMistakeOutcome,
    leitnerBox,
    nextReviewAt: new Date(nextReviewMs).toISOString(),
    updatedAt: nowIso,
  };
}

/** Pure helper to explicitly flag or unflag a question in the Mistake Queue. */
export function applyMistakeFlagToStat(
  prev,
  questionMeta = {},
  flagged = true,
  nowMs = Date.now(),
  { graduationThreshold = MISTAKE_GRADUATION_THRESHOLD } = {}
) {
  const nowIso = new Date(nowMs).toISOString();
  const qId = questionMeta.id || questionMeta.questionId || prev?.questionId;
  if (!qId) return null;

  if (!flagged) {
    if (!prev || ((prev.attemptsCount || 0) === 0 && (prev.mistakeCount || 0) === 0)) {
      return null;
    }
    const stillUnresolvedMistake =
      (prev.mistakeCount || 0) > 0 &&
      (prev.consecutiveCorrect ?? prev.leitnerBox ?? 0) < graduationThreshold &&
      !prev.graduatedAt;
    return {
      ...prev,
      flaggedAsMistake: false,
      inMistakeQueue: stillUnresolvedMistake,
      updatedAt: nowIso,
    };
  }

  return {
    questionId: qId,
    sourceType: questionMeta.sourceType || prev?.sourceType || "official-pyq",
    subjectId: questionMeta.subjectId || prev?.subjectId || "",
    unitId: questionMeta.unitId || prev?.unitId || "",
    attemptsCount: prev?.attemptsCount || 0,
    correctCount: prev?.correctCount || 0,
    mistakeCount: prev?.mistakeCount || 0,
    consecutiveCorrect: 0,
    inMistakeQueue: true,
    flaggedAsMistake: true,
    graduatedAt: null,
    lastAttemptAt: prev?.lastAttemptAt || null,
    lastOutcome: prev?.lastOutcome || null,
    lastSelected: prev?.lastSelected || [],
    lastMistakeSelected: prev?.lastMistakeSelected || [],
    lastMistakeOutcome: prev?.lastMistakeOutcome || null,
    leitnerBox: 0,
    nextReviewAt: nowIso,
    updatedAt: nowIso,
  };
}

/** Partition `questionStats` into active, due, scheduled, and graduated mistake lists. */
export function computeMistakeQueueState(
  questionStats = [],
  nowMs = Date.now(),
  { graduationThreshold = MISTAKE_GRADUATION_THRESHOLD } = {}
) {
  const dueMistakes = [];
  const scheduledMistakes = [];
  const graduatedMistakes = [];

  for (const rec of questionStats || []) {
    if (!rec) continue;
    if (isMistakeRecordActive(rec, { graduationThreshold })) {
      if (isMistakeRecordDue(rec, nowMs, { graduationThreshold })) {
        dueMistakes.push(rec);
      } else {
        scheduledMistakes.push(rec);
      }
    } else if ((rec.mistakeCount || 0) > 0 || Boolean(rec.graduatedAt)) {
      graduatedMistakes.push(rec);
    }
  }

  const dueSort = (a, b) =>
    (a.leitnerBox ?? 0) - (b.leitnerBox ?? 0) ||
    String(a.nextReviewAt || "").localeCompare(String(b.nextReviewAt || "")) ||
    String(a.questionId).localeCompare(String(b.questionId));

  const schedSort = (a, b) =>
    String(a.nextReviewAt || "").localeCompare(String(b.nextReviewAt || "")) ||
    String(a.questionId).localeCompare(String(b.questionId));

  dueMistakes.sort(dueSort);
  scheduledMistakes.sort(schedSort);

  return {
    dueMistakes,
    scheduledMistakes,
    activeMistakes: [...dueMistakes, ...scheduledMistakes],
    graduatedMistakes,
    graduationThreshold,
  };
}

export async function getQuestionStatsMap() {
  const rows = await db.getAll("questionStats");
  return new Map(rows.map((r) => [r.questionId, r]));
}

export async function toggleMistakeFlag(questionMeta, nowMs = Date.now()) {
  const qId = questionMeta?.id || questionMeta?.questionId;
  if (!qId) return null;
  const prev = await db.get("questionStats", qId);
  const nextFlagged = !Boolean(prev?.flaggedAsMistake);
  const updated = applyMistakeFlagToStat(prev, questionMeta, nextFlagged, nowMs);
  if (!updated) {
    await db.deleteRecord("questionStats", qId);
    return null;
  }
  await db.put("questionStats", updated);
  return updated;
}

/**
 * Create a focused Mistake Re-drill session (single item or due batch),
 * attaching prior mistake answer & attempt metadata so the runner can display it.
 */
export async function createMistakeRedrillSession({
  questions = [],
  mistakeRecords = null,
  title = null,
} = {}) {
  const statsMap = mistakeRecords
    ? new Map(mistakeRecords.map((r) => [r.questionId, r]))
    : await getQuestionStatsMap();

  const mistakeContext = {};
  for (const q of questions) {
    const rec = statsMap.get(q.id);
    if (rec) {
      mistakeContext[q.id] = {
        previousSelected:
          rec.lastMistakeSelected?.length
            ? rec.lastMistakeSelected
            : rec.lastSelected || [],
        lastSelected: rec.lastSelected || [],
        lastOutcome: rec.lastMistakeOutcome || rec.lastOutcome || null,
        lastAttemptAt: rec.lastAttemptAt || rec.updatedAt || null,
        attemptsCount: rec.attemptsCount || 0,
        consecutiveCorrect: rec.consecutiveCorrect ?? rec.leitnerBox ?? 0,
        flaggedAsMistake: Boolean(rec.flaggedAsMistake),
      };
    }
  }

  const singleQ = questions.length === 1 ? questions[0] : null;
  const resolvedTitle =
    title ||
    (singleQ
      ? `Mistake Re-drill · ${singleQ.year ? `JELET ${singleQ.year} Q${singleQ.qNumber}` : singleQ.id}`
      : `Spaced Mistake Queue (${questions.length} Qs)`);

  return createSession({
    kind: "mistake",
    mode: "independent",
    title: resolvedTitle,
    questions,
    durationMinutes: null,
    mistakeContext,
  });
}

/**
 * Finalize a session into an immutable `attempts` record and update `questionStats`
 * (Spaced Mistake Queue intervals + graduation) for independent attempts.
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
    durationMs: session.durationMs != null ? session.durationMs : null,
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

  // Per-mock performance analytics blob (section scores, accuracy, time, key
  // breakdown) persisted with the attempt for trend tracking & weak-area feeding.
  attempt.analytics = computeMockAnalytics(attempt, questions, session.questionTimes || {});

  await db.put("attempts", attempt);

  // Update per-question stats & Spaced Mistake Queue ONLY for unassisted items
  const existingStats = await db.getAll("questionStats");
  const statMap = new Map(existingStats.map((r) => [r.questionId, r]));
  const qMap = new Map(questions.map((q) => [q.id, q]));
  const updates = [];

  for (const item of scored.items) {
    if (item.outcome === "unattempted" || item.outcome === "voided_awarded") continue;
    if (session.mode === "assisted" || assistedSet.has(item.questionId)) continue;

    const q = qMap.get(item.questionId);
    const prev = statMap.get(item.questionId);
    updates.push(applyQuestionAttemptToStat(prev, item, q, nowMs));
  }

  if (updates.length) {
    await db.bulkPut("questionStats", updates);
  }
  await db.deleteRecord("sessions", session.sessionId);

  return attempt;
}

/** Questions slower than this multiple of the paper's average time-per-question are flagged. */
export const MOCK_SLOW_QUESTION_FACTOR = 2;

/**
 * Compute a rich, fully-local performance analytics blob for a single mock attempt.
 *
 * Pure function: derives section scores, accuracy, the time-per-question
 * distribution and the wrong-vs-key breakdown strictly from the frozen scoring
 * output (`attempt.items` / `attempt.bySubject`) plus the captured
 * `questionTimes` map. No telemetry, no fabricated scores.
 */
export function computeMockAnalytics(attempt, questions = [], questionTimes = {}) {
  const items = Array.isArray(attempt?.items) ? attempt.items : [];
  const bySubject = attempt?.bySubject || {};
  const counts = attempt?.counts || {};
  const totalTwelfths = Number(attempt?.totalTwelfths) || 0;
  const maxTwelfths = Number(attempt?.maxTwelfths) || 0;
  const elapsedMs = Number.isFinite(Number(attempt?.elapsedMs))
    ? Number(attempt.elapsedMs)
    : null;
  const durationMs = Number.isFinite(Number(attempt?.durationMs))
    ? Number(attempt.durationMs)
    : null;

  const SUBJECT_ORDER = ["MATH", "PHYS", "CHEM", "FEEE"];

  // Overall accuracy (voided "W" awards marks to everyone but is not user-attempted)
  const correct = counts.correct || 0;
  const partial = counts.partial || 0;
  const incorrect = counts.incorrect || 0;
  const unattempted = counts.unattempted || 0;
  const voided = counts.voided_awarded || 0;
  const attempted = correct + partial + incorrect;
  const accuracyPct = attempted > 0 ? Math.round((correct * 100) / attempted) : 0;
  const scorePct =
    maxTwelfths > 0 ? Math.max(0, Math.round((totalTwelfths * 100) / maxTwelfths)) : 0;

  // Section-wise scores + accuracy + average time
  const sections = [];
  for (const sid of SUBJECT_ORDER) {
    const sb = bySubject[sid];
    if (!sb) continue;
    const sCorrect = sb.correct || 0;
    const sPartial = sb.partial || 0;
    const sIncorrect = sb.incorrect || 0;
    const sUnattempted = sb.unattempted || 0;
    const sVoided = sb.voided_awarded || 0;
    const sAttempted = sCorrect + sPartial + sIncorrect;

    const sTimes = [];
    for (const item of items) {
      if (item.subjectId !== sid) continue;
      const t = Number(questionTimes[item.questionId]) || 0;
      if (t > 0) sTimes.push(t);
    }
    const sAvgTime = sTimes.length
      ? Math.round(sTimes.reduce((a, b) => a + b, 0) / sTimes.length)
      : 0;
    const sMaxTime = sTimes.length ? Math.max(...sTimes) : 0;

    sections.push({
      subjectId: sid,
      title: SUBJECT_META[sid]?.name || sid,
      shortName: SUBJECT_META[sid]?.shortName || sid,
      totalTwelfths: sb.totalTwelfths || 0,
      maxTwelfths: sb.maxTwelfths || 0,
      scorePct:
        sb.maxTwelfths > 0
          ? Math.max(0, Math.round(((sb.totalTwelfths || 0) * 100) / sb.maxTwelfths))
          : 0,
      correct: sCorrect,
      partial: sPartial,
      incorrect: sIncorrect,
      unattempted: sUnattempted,
      voided: sVoided,
      attempted: sAttempted,
      accuracyPct:
        sAttempted > 0 ? Math.round((sCorrect * 100) / sAttempted) : 0,
      avgTimeMs: sAvgTime,
      maxTimeMs: sMaxTime,
      questionCount: sb.questionCount || 0,
    });
  }

  // Time analysis (only over questions with captured time)
  const allTimes = [];
  for (const item of items) {
    const t = Number(questionTimes[item.questionId]) || 0;
    if (t > 0) allTimes.push(t);
  }
  const captured = allTimes.length > 0;
  const sortedTimes = [...allTimes].sort((a, b) => a - b);
  const avgTimeMs = captured
    ? Math.round(sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length)
    : 0;
  const medianTimeMs = captured
    ? sortedTimes[Math.floor(sortedTimes.length / 2)]
    : 0;
  const slowThresholdMs = captured
    ? Math.max(60000, Math.round(avgTimeMs * MOCK_SLOW_QUESTION_FACTOR))
    : 0;

  const perQuestionMs = items
    .map((item) => ({
      questionId: item.questionId,
      qNumber: item.qNumber,
      subjectId: item.subjectId,
      unitId: item.unitId,
      timeMs: Math.max(0, Math.round(Number(questionTimes[item.questionId]) || 0)),
    }))
    .filter((x) => x.timeMs > 0)
    .sort((a, b) => (a.qNumber || 0) - (b.qNumber || 0));

  const slowQuestions = captured
    ? perQuestionMs.filter((x) => x.timeMs >= slowThresholdMs)
    : [];

  const bySectionAvgMs = sections
    .filter((s) => s.avgTimeMs > 0)
    .map((s) => ({
      subjectId: s.subjectId,
      shortName: s.shortName,
      avgTimeMs: s.avgTimeMs,
      questionCount: s.questionCount,
    }));

  // Wrong / partial vs the official verified key (worst first)
  const wrongKey = items
    .filter((it) => it.outcome === "incorrect" || it.outcome === "partial")
    .map((it) => ({
      questionId: it.questionId,
      qNumber: it.qNumber,
      subjectId: it.subjectId,
      unitId: it.unitId,
      category: it.category,
      outcome: it.outcome,
      selected: [...(it.selected || [])],
      correctOptions: [...(it.correctOptions || [])],
      twelfths: it.twelfths,
    }))
    .sort((a, b) => {
      if (a.outcome !== b.outcome) return a.outcome === "incorrect" ? -1 : 1;
      return (a.qNumber || 0) - (b.qNumber || 0);
    });

  return {
    paperId: attempt?.paperId || null,
    title: attempt?.title || "",
    submittedAt: attempt?.submittedAt || null,
    durationMs,
    elapsedMs,
    elapsedMinutes: elapsedMs != null ? Math.round(elapsedMs / 60000) : null,
    totalTwelfths,
    maxTwelfths,
    scorePct,
    accuracy: {
      total: items.length,
      correct,
      partial,
      incorrect,
      unattempted,
      voided,
      attempted,
      accuracyPct,
    },
    sections,
    time: {
      captured,
      avgTimeMs,
      medianTimeMs,
      slowThresholdMs,
      perQuestionMs,
      slowQuestions,
      bySectionAvgMs,
    },
    wrongKey,
  };
}

/**
 * Build the mock history view model from real submitted attempts.
 * Only independent full 120-mark mocks count (never assisted drills).
 * Returns newest-first list, oldest-first trend series (for sparklines) and
 * honest personal bests (never faked — `null` when no mocks exist).
 */
export function computeMockHistory(attempts = []) {
  const safeAttempts = Array.isArray(attempts) ? attempts : [];
  const mocks = safeAttempts
    .filter(
      (a) =>
        a &&
        a.kind === "mock" &&
        a.mode === "independent" &&
        a.maxTwelfths === MAX_PAPER_TWELFTHS
    )
    .map((a) => {
      const c = a.counts || {};
      const attempted = (c.correct || 0) + (c.partial || 0) + (c.incorrect || 0);
      const accuracyPct =
        attempted > 0 ? Math.round(((c.correct || 0) * 100) / attempted) : 0;
      return {
        attemptId: a.attemptId,
        submittedAt: a.submittedAt,
        paperId: a.paperId || null,
        title: a.title || "Timed Mock",
        totalTwelfths: a.totalTwelfths,
        maxTwelfths: a.maxTwelfths,
        scoreMarks: a.totalTwelfths / 12,
        scorePct:
          a.maxTwelfths > 0
            ? Math.max(0, Math.round((a.totalTwelfths * 100) / a.maxTwelfths))
            : 0,
        accuracyPct,
        elapsedMs: Number.isFinite(Number(a.elapsedMs)) ? Number(a.elapsedMs) : null,
        durationMs: Number.isFinite(Number(a.durationMs)) ? Number(a.durationMs) : null,
        counts: c,
        hasAnalytics: Boolean(a.analytics),
      };
    })
    .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));

  const orderedOldestFirst = [...mocks].sort((a, b) =>
    String(a.submittedAt).localeCompare(String(b.submittedAt))
  );

  const trends = {
    score: orderedOldestFirst.map((m) => m.scoreMarks),
    accuracy: orderedOldestFirst.map((m) => m.accuracyPct),
    timeMs: orderedOldestFirst
      .filter((m) => m.elapsedMs != null)
      .map((m) => m.elapsedMs),
  };

  let bests = {
    bestScore: null,
    bestAccuracy: null,
    fastestTime: null,
  };
  if (mocks.length) {
    const byScore = [...mocks].sort((a, b) => b.totalTwelfths - a.totalTwelfths)[0];
    const byAcc = [...mocks].sort((a, b) => b.accuracyPct - a.accuracyPct)[0];
    const timed = mocks.filter((m) => m.elapsedMs != null);
    const byTime = timed.length
      ? [...timed].sort((a, b) => a.elapsedMs - b.elapsedMs)[0]
      : null;
    bests = {
      bestScore: byScore,
      bestAccuracy: byAcc,
      fastestTime: byTime,
    };
  }

  return {
    count: mocks.length,
    mocks,
    orderedOldestFirst,
    trends,
    bests,
    empty: mocks.length === 0,
  };
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
  return computeMistakeQueueState(stats, nowMs).dueMistakes;
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
 * Adaptive Question Routing & Unit Pool Resolution (Phase 07 · Slice 2)
 * ------------------------------------------------------------------ */

/**
 * Determine default Practice Arena routing mode from local independent `questionStats`.
 * Defaults to `"adaptive"` once >= `minAttempts` (5) independent question attempts exist;
 * falls back to `"balanced"` below that threshold.
 */
export function resolveDefaultRoutingStrategy(
  questionStats = [],
  { minAttempts = ADAPTIVE_MIN_ATTEMPTS } = {}
) {
  let totalAttempts = 0;
  for (const rec of questionStats || []) {
    totalAttempts += Math.max(0, Number(rec?.attemptsCount) || 0);
  }
  const adaptiveReady = totalAttempts >= minAttempts;
  return {
    strategy: adaptiveReady ? "adaptive" : "balanced",
    adaptiveReady,
    totalAttempts,
    minAttempts,
  };
}

/**
 * Resolve a syllabus unit's active practice pool from `unit.practiceQuestions`
 * (falling back to `unit.pyqIds`), strictly curated from the 400 verified questions.
 */
export function resolveUnitQuestionPool(unit, questionIndex, { filterFn = null } = {}) {
  if (!unit || !questionIndex) return [];
  const lookup =
    questionIndex instanceof Map
      ? (id) => questionIndex.get(id)
      : (id) => questionIndex[id];

  const candidateIds =
    Array.isArray(unit.practiceQuestions) && unit.practiceQuestions.length > 0
      ? unit.practiceQuestions
      : Array.isArray(unit.pyqIds)
      ? unit.pyqIds
      : [];

  const seen = new Set();
  const out = [];
  for (const qId of candidateIds) {
    if (!qId || seen.has(qId)) continue;
    seen.add(qId);
    const q = lookup(qId);
    if (!q || isVoidedQuestion(q)) continue;
    if (filterFn && !filterFn(q)) continue;
    out.push(q);
  }
  return out;
}

/**
 * Compute strictly positive adaptive selection weight for a question `q`.
 * Weak units/subjects & missed items get higher weight, while mastered items
 * keep a positive `ADAPTIVE_MAINTENANCE_FLOOR` so topics are never hard-blocked.
 */
export function computeQuestionAdaptiveWeight(
  question,
  questionStatsMap = new Map(),
  unitAccMap = new Map(),
  subjectAccMap = new Map()
) {
  const qStat = questionStatsMap.get(question.id);
  const uStat = unitAccMap.get(question.unitId);
  const sStat = subjectAccMap.get(question.subjectId);

  const unitErrorRate =
    uStat && uStat.attempts > 0 ? 1 - uStat.correct / uStat.attempts : 0.5;
  const subjectErrorRate =
    sStat && sStat.attempts > 0 ? 1 - sStat.correct / sStat.attempts : 0.5;

  // Topic weakness factor in [1.0, 3.6]
  const topicMultiplier = 1 + 2.0 * unitErrorRate + 0.6 * subjectErrorRate;

  let itemMultiplier = 1.3; // unseen item baseline
  const att = Number(qStat?.attemptsCount) || 0;
  if (att > 0) {
    const corr = Math.min(att, Math.max(0, Number(qStat?.correctCount) || 0));
    const qErr = 1 - corr / att;
    if (qErr <= 0) {
      // Mastered item: preserve small maintenance rotation (never 0 / hard-blocked)
      itemMultiplier = ADAPTIVE_MAINTENANCE_FLOOR;
    } else {
      const recentMissBoost =
        qStat.lastOutcome === "incorrect" || qStat.lastOutcome === "partial" ? 0.8 : 0;
      itemMultiplier = 1.2 + 2.2 * qErr + recentMissBoost;
    }
  }

  return Math.max(
    ADAPTIVE_MAINTENANCE_FLOOR,
    Number((topicMultiplier * itemMultiplier).toFixed(4))
  );
}

/**
 * Sample up to `count` questions from `pool` using either `"adaptive"`
 * (accuracy-weighted without replacement + maintenance floor) or `"balanced"`
 * (uniform Fisher-Yates random sampling). Automatically falls back to `"balanced"`
 * when `mode !== "independent"` or fewer than `minAttempts` (5) attempts exist.
 */
export function samplePracticeQuestions(
  pool = [],
  count = 10,
  {
    strategy = "adaptive",
    mode = "independent",
    questionStats = [],
    minAttempts = ADAPTIVE_MIN_ATTEMPTS,
    rng = Math.random,
  } = {}
) {
  const eligible = (pool || []).filter((q) => q && !isVoidedQuestion(q));
  const readiness = resolveDefaultRoutingStrategy(questionStats, { minAttempts });
  const limit = Math.max(0, Math.min(Number(count) || eligible.length, eligible.length));

  const effectiveStrategy =
    mode === "independent" && strategy === "adaptive" && readiness.adaptiveReady
      ? "adaptive"
      : "balanced";

  if (limit === 0) {
    return {
      questions: [],
      effectiveStrategy,
      adaptiveReady: readiness.adaptiveReady,
      totalAttempts: readiness.totalAttempts,
    };
  }

  if (effectiveStrategy === "balanced") {
    const copy = [...eligible];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.min(i, Math.max(0, Math.floor(rng() * (i + 1))));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return {
      questions: copy.slice(0, limit),
      effectiveStrategy: "balanced",
      adaptiveReady: readiness.adaptiveReady,
      totalAttempts: readiness.totalAttempts,
    };
  }

  // Build accuracy lookup maps from recorded independent questionStats
  const statMap = new Map();
  const unitAccMap = new Map();
  const subjAccMap = new Map();

  for (const rec of questionStats || []) {
    if (!rec || !rec.questionId) continue;
    statMap.set(rec.questionId, rec);
    const att = Number(rec.attemptsCount) || 0;
    if (att <= 0) continue;
    const corr = Math.min(att, Math.max(0, Number(rec.correctCount) || 0));

    if (rec.unitId) {
      const prevU = unitAccMap.get(rec.unitId) || { attempts: 0, correct: 0 };
      prevU.attempts += att;
      prevU.correct += corr;
      unitAccMap.set(rec.unitId, prevU);
    }
    if (rec.subjectId) {
      const prevS = subjAccMap.get(rec.subjectId) || { attempts: 0, correct: 0 };
      prevS.attempts += att;
      prevS.correct += corr;
      subjAccMap.set(rec.subjectId, prevS);
    }
  }

  const remaining = eligible.map((q) => ({
    q,
    weight: computeQuestionAdaptiveWeight(q, statMap, unitAccMap, subjAccMap),
  }));

  const picked = [];
  for (let k = 0; k < limit && remaining.length > 0; k++) {
    let totalW = 0;
    for (const item of remaining) totalW += item.weight;

    let threshold = rng() * totalW;
    let chosenIdx = remaining.length - 1;
    for (let idx = 0; idx < remaining.length; idx++) {
      threshold -= remaining[idx].weight;
      if (threshold <= 0) {
        chosenIdx = idx;
        break;
      }
    }
    picked.push(remaining[chosenIdx].q);
    remaining.splice(chosenIdx, 1);
  }

  return {
    questions: picked,
    effectiveStrategy: "adaptive",
    adaptiveReady: true,
    totalAttempts: readiness.totalAttempts,
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

  const streakDays = computeStreakDays(
    attempts.map((a) => a.submittedAt),
    nowMs
  );

  const officialStats = qStats.filter(
    (s) => (s.sourceType || "official-pyq") === "official-pyq" && (s.attemptsCount || 0) > 0
  );
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

  // Mock history view model (trend lines + personal bests)
  const mockHistory = computeMockHistory(attempts);

  // Paper best scores map (paperId -> best attempt)
  const paperBestMap = new Map();
  for (const a of attempts) {
    if (!a.paperId || a.maxTwelfths !== MAX_PAPER_TWELFTHS) continue;
    const prev = paperBestMap.get(a.paperId);
    if (!prev || a.totalTwelfths > prev.totalTwelfths) {
      paperBestMap.set(a.paperId, a);
    }
  }

  // Spaced Mistake Notebook (due + scheduled + graduated)
  const mistakeQueue = computeMistakeQueueState(qStats, nowMs);
  const dueMistakes = mistakeQueue.dueMistakes;

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
  const routingInfo = resolveDefaultRoutingStrategy(qStats);
  const readiness = computeReadinessEstimate({
    attempts,
    questionStats: qStats,
    totalUnits: manifestUnits.length || 42,
    totalQuestions: totalOfficialPyqs,
  });

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
    mockHistory,
    paperBestMap,
    dueMistakes,
    mistakeQueue,
    weakAreas,
    routingInfo,
    readiness,
    subjectStats,
    unitMap,
    roadmapUnit,
    savedBookmarks,
    bookmarkRows,
    recentlyVisitedUnits,
  };
}

/* ------------------------------------------------------------------ *
 * Readiness Snapshot (Phase 07 · Slice 4 — Estimate Only)
 * ------------------------------------------------------------------ */

export const READINESS_MIN_ATTEMPTS = 5;

/**
 * Computes an honest, local-only study readiness estimate from independent
 * attempt history — NEVER a prediction or guarantee of exam score/GMR.
 *
 * Breakdown:
 *  - totalQuestionAttempts & sessionCount (independent only)
 *  - averageAccuracyPct (totalCorrect / totalQuestionAttempts)
 *  - coverage across 42 syllabus units & 400 official PYQs
 *  - trend ("improving" | "flat" | "declining" | "insufficient") across recent independent sessions
 */
export function computeReadinessEstimate({
  attempts = [],
  questionStats = [],
  totalUnits = 42,
  totalQuestions = 400,
  minAttempts = READINESS_MIN_ATTEMPTS,
} = {}) {
  const safeStats = Array.isArray(questionStats) ? questionStats : [];
  const safeAttempts = Array.isArray(attempts) ? attempts : [];

  let totalQuestionAttempts = 0;
  let totalCorrect = 0;
  const coveredUnits = new Set();
  let officialAttemptedCount = 0;

  for (const s of safeStats) {
    if (!s) continue;
    const att = Math.max(0, Number(s.attemptsCount) || 0);
    if (att <= 0) continue;
    const corr = Math.min(att, Math.max(0, Number(s.correctCount) || 0));
    totalQuestionAttempts += att;
    totalCorrect += corr;
    if (s.unitId) coveredUnits.add(s.unitId);
    if ((s.sourceType || "official-pyq") === "official-pyq") {
      officialAttemptedCount += 1;
    }
  }

  const averageAccuracyPct =
    totalQuestionAttempts > 0
      ? Math.round((totalCorrect * 100) / totalQuestionAttempts)
      : null;

  const unitsCovered = Math.min(totalUnits, coveredUnits.size);
  const unitCoveragePct =
    totalUnits > 0 ? Math.round((unitsCovered * 100) / totalUnits) : 0;

  const questionsCovered = Math.min(totalQuestions, officialAttemptedCount);
  const questionCoveragePct =
    totalQuestions > 0 ? Math.round((questionsCovered * 100) / totalQuestions) : 0;

  // Independent session accuracy trend (oldest -> newest across up to last 6 scored sessions)
  const independentSessions = safeAttempts
    .filter((a) => a && a.mode === "independent")
    .slice()
    .sort((a, b) => String(a.submittedAt || "").localeCompare(String(b.submittedAt || "")));

  const scoredSessions = independentSessions
    .map((a) => {
      const c = a.counts || {};
      const answered = (c.correct || 0) + (c.partial || 0) + (c.incorrect || 0);
      if (answered <= 0) return null;
      return {
        submittedAt: a.submittedAt,
        accRatio: (c.correct || 0) / answered,
      };
    })
    .filter(Boolean);

  let trend = "insufficient";
  let trendDeltaPct = null;
  let trendLabel = "Practice more to establish trend";

  if (scoredSessions.length >= 2) {
    const windowSessions = scoredSessions.slice(-6);
    const splitIdx = Math.floor(windowSessions.length / 2);
    const firstHalf = windowSessions.slice(0, splitIdx);
    const secondHalf = windowSessions.slice(splitIdx);
    const mean = (arr) => arr.reduce((acc, x) => acc + x.accRatio, 0) / arr.length;
    const earlierAcc = mean(firstHalf);
    const recentAcc = mean(secondHalf);
    trendDeltaPct = Math.round((recentAcc - earlierAcc) * 100);
    if (trendDeltaPct >= 5) {
      trend = "improving";
      trendLabel = `Improving (+${trendDeltaPct}%)`;
    } else if (trendDeltaPct <= -5) {
      trend = "declining";
      trendLabel = `Dipping (${trendDeltaPct}%)`;
    } else {
      trend = "flat";
      trendLabel = `Flat (${trendDeltaPct >= 0 ? "+" : ""}${trendDeltaPct}%)`;
    }
  } else if (scoredSessions.length === 1) {
    trend = "flat";
    trendDeltaPct = 0;
    trendLabel = "Flat (1 session baseline)";
  }

  const hasEnoughData = totalQuestionAttempts >= minAttempts;

  if (!hasEnoughData) {
    return {
      minAttempts,
      hasEnoughData: false,
      estimatePct: null,
      stageLabel: "Insufficient data",
      sessionCount: independentSessions.length,
      totalQuestionAttempts,
      totalCorrect,
      averageAccuracyPct,
      unitsCovered,
      totalUnits,
      unitCoveragePct,
      questionsCovered,
      totalQuestions,
      questionCoveragePct,
      trend: "insufficient",
      trendDeltaPct: null,
      trendLabel: "Need more attempts",
    };
  }

  const trendBonus = trend === "improving" ? 5 : trend === "flat" ? 2.5 : 0;
  const rawEstimate =
    (averageAccuracyPct || 0) * 0.5 +
    unitCoveragePct * 0.25 +
    questionCoveragePct * 0.2 +
    trendBonus;
  const estimatePct = Math.max(0, Math.min(100, Math.round(rawEstimate)));

  let stageLabel = "Early Foundation";
  if (estimatePct >= 80) stageLabel = "Broad Revision";
  else if (estimatePct >= 60) stageLabel = "Expanding Mastery";
  else if (estimatePct >= 35) stageLabel = "Building Coverage";

  return {
    minAttempts,
    hasEnoughData: true,
    estimatePct,
    stageLabel,
    sessionCount: independentSessions.length,
    totalQuestionAttempts,
    totalCorrect,
    averageAccuracyPct,
    unitsCovered,
    totalUnits,
    unitCoveragePct,
    questionsCovered,
    totalQuestions,
    questionCoveragePct,
    trend,
    trendDeltaPct,
    trendLabel,
  };
}
