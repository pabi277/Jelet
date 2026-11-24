/**
 * adaptive.test.mjs — Phase 07 Gate: Adaptive Learning, Weak Areas, Spaced Mistake Queue & Readiness
 * ---------------------------------------------------------------------------------------------------
 * Runs with the zero-dependency Node test runner:
 *   node --test tests/adaptive.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  WEAK_AREA_MIN_ATTEMPTS,
  WEAK_AREA_TOP_K,
  ADAPTIVE_MIN_ATTEMPTS,
  ADAPTIVE_MAINTENANCE_FLOOR,
  SPACED_INTERVAL_DAYS,
  MISTAKE_GRADUATION_THRESHOLD,
  computeWeakAreas,
  resolveDefaultRoutingStrategy,
  resolveUnitQuestionPool,
  computeQuestionAdaptiveWeight,
  samplePracticeQuestions,
  applyQuestionAttemptToStat,
  applyMistakeFlagToStat,
  computeMistakeQueueState,
  READINESS_MIN_ATTEMPTS,
  computeReadinessEstimate,
} from "../assets/js/core/stats.js";
import { normalizeUnit } from "../assets/js/core/data-loader.js";

const manifest = JSON.parse(fs.readFileSync("./_data/manifest.json", "utf8"));

test("computeWeakAreas: returns honest empty state when no attempts or <3 attempts exist", () => {
  const empty = computeWeakAreas([], manifest.units);
  assert.equal(empty.minAttempts, WEAK_AREA_MIN_ATTEMPTS);
  assert.equal(empty.topK, WEAK_AREA_TOP_K);
  assert.equal(empty.totalAttempts, 0);
  assert.equal(empty.hasEnoughData, false);
  assert.deepEqual(empty.topWeakUnits, []);
  assert.deepEqual(empty.units, []);
  assert.deepEqual(empty.subjects, []);

  // Below N=3 per unit and per subject -> noisy data excluded
  const noisy = computeWeakAreas(
    [
      { questionId: "q1", subjectId: "MATH", unitId: "M01", attemptsCount: 2, correctCount: 0, mistakeCount: 2 },
      { questionId: "q2", subjectId: "PHYS", unitId: "P01", attemptsCount: 1, correctCount: 0, mistakeCount: 1 },
    ],
    manifest.units
  );
  assert.equal(noisy.totalAttempts, 3);
  assert.equal(noisy.hasEnoughData, false);
  assert.equal(noisy.units.length, 0);
  assert.equal(noisy.subjects.length, 0);
});

test("computeWeakAreas: aggregates per-unit and per-subject accuracy sorted worst-first and caps topWeakUnits at K=3", () => {
  const stats = [
    // P02: 1/4 = 25%
    { questionId: "p02-1", subjectId: "PHYS", unitId: "P02", attemptsCount: 2, correctCount: 0, mistakeCount: 2 },
    { questionId: "p02-2", subjectId: "PHYS", unitId: "P02", attemptsCount: 2, correctCount: 1, mistakeCount: 1 },
    // M06: 1/3 = 33%
    { questionId: "m06-1", subjectId: "MATH", unitId: "M06", attemptsCount: 3, correctCount: 1, mistakeCount: 2 },
    // C01: 2/4 = 50%
    { questionId: "c01-1", subjectId: "CHEM", unitId: "C01", attemptsCount: 4, correctCount: 2, mistakeCount: 2 },
    // E01: 3/4 = 75%
    { questionId: "e01-1", subjectId: "FEEE", unitId: "E01", attemptsCount: 4, correctCount: 3, mistakeCount: 1 },
    // M01: only 2 attempts -> excluded from unit breakdown, but contributes to MATH subject total!
    { questionId: "m01-1", subjectId: "MATH", unitId: "M01", attemptsCount: 2, correctCount: 2, mistakeCount: 0 },
  ];

  const res = computeWeakAreas(stats, manifest.units);
  assert.equal(res.hasEnoughData, true);
  assert.equal(res.totalAttempts, 17);

  // 4 units have >=3 attempts, sorted worst-first: P02 (25%), M06 (33%), C01 (50%), E01 (75%)
  assert.deepEqual(
    res.units.map((u) => [u.unitId, u.accuracyPct]),
    [
      ["P02", 25],
      ["M06", 33],
      ["C01", 50],
      ["E01", 75],
    ]
  );

  // Top K=3 weak units
  assert.deepEqual(
    res.topWeakUnits.map((u) => u.unitId),
    ["P02", "M06", "C01"]
  );
  assert.equal(res.topWeakUnits[0].title, "Kinematics");

  // Subjects sorted worst-first: PHYS (1/4=25%), CHEM (2/4=50%), MATH (3/5=60%), FEEE (3/4=75%)
  assert.deepEqual(
    res.subjects.map((s) => [s.subjectId, s.accuracyPct]),
    [
      ["PHYS", 25],
      ["CHEM", 50],
      ["MATH", 60],
      ["FEEE", 75],
    ]
  );
});

test("resolveDefaultRoutingStrategy & samplePracticeQuestions: falls back to Balanced below 5 attempts and activates Adaptive at >=5", () => {
  const below = resolveDefaultRoutingStrategy([
    { questionId: "q1", attemptsCount: 4, correctCount: 2 },
  ]);
  assert.equal(below.minAttempts, ADAPTIVE_MIN_ATTEMPTS);
  assert.equal(below.adaptiveReady, false);
  assert.equal(below.strategy, "balanced");

  const atThreshold = resolveDefaultRoutingStrategy([
    { questionId: "q1", attemptsCount: 3, correctCount: 1 },
    { questionId: "q2", attemptsCount: 2, correctCount: 2 },
  ]);
  assert.equal(atThreshold.adaptiveReady, true);
  assert.equal(atThreshold.strategy, "adaptive");

  const pool = [
    { id: "q1", subjectId: "MATH", unitId: "M01", key: { correct: ["A"] } },
    { id: "q2", subjectId: "PHYS", unitId: "P01", key: { correct: ["B"] } },
  ];
  const fallbackRes = samplePracticeQuestions(pool, 2, {
    strategy: "adaptive",
    mode: "independent",
    questionStats: [{ questionId: "q1", attemptsCount: 4, correctCount: 1 }],
  });
  assert.equal(fallbackRes.effectiveStrategy, "balanced");
  assert.equal(fallbackRes.adaptiveReady, false);
});

test("samplePracticeQuestions: weights weak units heavily while keeping a positive maintenance floor on mastered topics", () => {
  // Deterministic LCG PRNG for reproducible statistical assertions
  let seed = 42;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  const pool = [
    { id: "weak-missed", subjectId: "PHYS", unitId: "P02", key: { correct: ["A"] } },
    { id: "weak-unseen", subjectId: "PHYS", unitId: "P02", key: { correct: ["B"] } },
    { id: "mastered-1", subjectId: "MATH", unitId: "M01", key: { correct: ["C"] } },
    { id: "mastered-2", subjectId: "MATH", unitId: "M01", key: { correct: ["D"] } },
  ];

  const qStats = [
    {
      questionId: "weak-missed",
      subjectId: "PHYS",
      unitId: "P02",
      attemptsCount: 3,
      correctCount: 0,
      mistakeCount: 3,
      lastOutcome: "incorrect",
    },
    {
      questionId: "mastered-1",
      subjectId: "MATH",
      unitId: "M01",
      attemptsCount: 3,
      correctCount: 3,
      mistakeCount: 0,
      lastOutcome: "correct",
    },
    {
      questionId: "mastered-2",
      subjectId: "MATH",
      unitId: "M01",
      attemptsCount: 3,
      correctCount: 3,
      mistakeCount: 0,
      lastOutcome: "correct",
    },
  ];

  const statMap = new Map(qStats.map((r) => [r.questionId, r]));
  const unitMap = new Map([
    ["P02", { attempts: 3, correct: 0 }],
    ["M01", { attempts: 6, correct: 6 }],
  ]);
  const subjMap = new Map([
    ["PHYS", { attempts: 3, correct: 0 }],
    ["MATH", { attempts: 6, correct: 6 }],
  ]);

  const wMissed = computeQuestionAdaptiveWeight(pool[0], statMap, unitMap, subjMap);
  const wUnseen = computeQuestionAdaptiveWeight(pool[1], statMap, unitMap, subjMap);
  const wMastered = computeQuestionAdaptiveWeight(pool[2], statMap, unitMap, subjMap);

  assert.ok(wMissed > wUnseen, "Missed item in weak unit must outrank unseen item");
  assert.ok(wUnseen > wMastered * 5, "Weak unit unseen item must outrank mastered item");
  assert.ok(
    wMastered >= ADAPTIVE_MAINTENANCE_FLOOR && wMastered > 0,
    "Mastered topic must retain positive maintenance weight (never hard-blocked)"
  );

  // Sample 1 question 400 times: weak items must dominate, yet mastered items still rotate in (>0)
  const counts = { "weak-missed": 0, "weak-unseen": 0, "mastered-1": 0, "mastered-2": 0 };
  for (let i = 0; i < 400; i++) {
    const { questions, effectiveStrategy } = samplePracticeQuestions(pool, 1, {
      strategy: "adaptive",
      mode: "independent",
      questionStats: qStats,
      rng,
    });
    assert.equal(effectiveStrategy, "adaptive");
    counts[questions[0].id] += 1;
  }

  assert.ok(
    counts["weak-missed"] + counts["weak-unseen"] > 340,
    `Weak-area items should receive vast majority of draws, got ${JSON.stringify(counts)}`
  );
  assert.ok(
    counts["mastered-1"] + counts["mastered-2"] > 0,
    `Mastered items must appear occasionally for maintenance rotation, got ${JSON.stringify(counts)}`
  );
});

test("resolveUnitQuestionPool: reuses unit.practiceQuestions / pyqIds and excludes board-voided W items", () => {
  const p01Raw = JSON.parse(fs.readFileSync("./_data/units/P01.json", "utf8"));
  const p01 = normalizeUnit(p01Raw);
  const qIndex = new Map();
  for (const yr of [2022, 2023, 2024, 2025]) {
    const paper = JSON.parse(fs.readFileSync(`./_data/papers/${yr}.json`, "utf8"));
    for (const q of paper.questions) qIndex.set(q.id, q);
  }

  // Note: jelet-2025-q041 is voided ("W") in P01's pyqIds, excluded from practiceQuestions
  const p01Pool = resolveUnitQuestionPool(p01, qIndex);
  assert.equal(p01Pool.length, 5);
  assert.equal(p01Pool.some((q) => q.id === "jelet-2025-q041"), false);

  // Even when falling back to pyqIds directly, voided items are filtered out
  const fallbackPool = resolveUnitQuestionPool({ ...p01, practiceQuestions: [] }, qIndex);
  assert.equal(fallbackPool.length, 5);
  assert.equal(fallbackPool.some((q) => q.id === "jelet-2025-q041"), false);
});

test("Spaced Mistake Notebook: schedules 1d/3d/7d intervals, preserves previous answer, and graduates at N=2 correct", () => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const t0 = Date.parse("2026-11-24T10:00:00.000Z");
  assert.deepEqual(SPACED_INTERVAL_DAYS, [0, 1, 3, 7]);
  assert.equal(MISTAKE_GRADUATION_THRESHOLD, 2);

  const qMeta = { id: "jelet-2024-q041", subjectId: "PHYS", unitId: "P01", sourceType: "official-pyq" };

  // 1. Wrong attempt -> enters active mistake queue, due immediately, records lastAttemptAt & wrong pick
  let rec = applyQuestionAttemptToStat(
    null,
    { questionId: qMeta.id, subjectId: "PHYS", unitId: "P01", outcome: "incorrect", selected: ["B"] },
    qMeta,
    t0
  );
  assert.equal(rec.inMistakeQueue, true);
  assert.equal(rec.attemptsCount, 1);
  assert.equal(rec.mistakeCount, 1);
  assert.equal(rec.consecutiveCorrect, 0);
  assert.deepEqual(rec.lastMistakeSelected, ["B"]);
  assert.equal(rec.lastAttemptAt, new Date(t0).toISOString());

  let state = computeMistakeQueueState([rec], t0);
  assert.equal(state.dueMistakes.length, 1);
  assert.equal(state.scheduledMistakes.length, 0);

  // 2. First correct re-drill -> stays in queue (1/2), scheduled +1 day later
  const t1 = t0 + 60 * 1000;
  rec = applyQuestionAttemptToStat(
    rec,
    { questionId: qMeta.id, subjectId: "PHYS", unitId: "P01", outcome: "correct", selected: ["A"] },
    qMeta,
    t1
  );
  assert.equal(rec.inMistakeQueue, true);
  assert.equal(rec.consecutiveCorrect, 1);
  assert.equal(rec.nextReviewAt, new Date(t1 + 1 * DAY_MS).toISOString());
  // Original wrong pick is still preserved for reference!
  assert.deepEqual(rec.lastMistakeSelected, ["B"]);

  // Before 1 day elapses -> scheduled, NOT due
  state = computeMistakeQueueState([rec], t1 + 12 * 3600 * 1000);
  assert.equal(state.dueMistakes.length, 0);
  assert.equal(state.scheduledMistakes.length, 1);

  // After 1 day elapses -> due again!
  const tDue1 = t1 + DAY_MS + 1000;
  state = computeMistakeQueueState([rec], tDue1);
  assert.equal(state.dueMistakes.length, 1);

  // 3. Second consecutive correct re-drill (N=2) -> graduates out of active mistake queue!
  rec = applyQuestionAttemptToStat(
    rec,
    { questionId: qMeta.id, subjectId: "PHYS", unitId: "P01", outcome: "correct", selected: ["A"] },
    qMeta,
    tDue1
  );
  assert.equal(rec.inMistakeQueue, false);
  assert.equal(rec.consecutiveCorrect, 2);
  assert.ok(rec.graduatedAt);

  state = computeMistakeQueueState([rec], tDue1 + 10 * DAY_MS);
  assert.equal(state.activeMistakes.length, 0);
  assert.equal(state.dueMistakes.length, 0);
  assert.equal(state.graduatedMistakes.length, 1);
});

test("Spaced Mistake Notebook: deterministic 1d -> 3d -> 7d schedule & explicit mistake flagging", () => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const t0 = Date.parse("2026-11-24T12:00:00.000Z");
  const qMeta = { id: "jelet-2025-q002", subjectId: "MATH", unitId: "M01" };

  // Explicit flag on unattempted question -> due immediately with attemptsCount=0
  let flagged = applyMistakeFlagToStat(null, qMeta, true, t0);
  assert.equal(flagged.flaggedAsMistake, true);
  assert.equal(flagged.inMistakeQueue, true);
  assert.equal(flagged.attemptsCount, 0);
  assert.equal(computeMistakeQueueState([flagged], t0).dueMistakes.length, 1);

  // Unflagging a zero-attempt stub removes it cleanly (returns null)
  assert.equal(applyMistakeFlagToStat(flagged, qMeta, false, t0), null);

  // Verify 1d -> 3d -> 7d interval progression when graduationThreshold = 4
  let r = flagged;
  r = applyQuestionAttemptToStat(
    r,
    { questionId: qMeta.id, outcome: "correct", selected: ["C"] },
    qMeta,
    t0,
    { graduationThreshold: 4 }
  );
  assert.equal(r.nextReviewAt, new Date(t0 + 1 * DAY_MS).toISOString());

  r = applyQuestionAttemptToStat(
    r,
    { questionId: qMeta.id, outcome: "correct", selected: ["C"] },
    qMeta,
    t0 + DAY_MS,
    { graduationThreshold: 4 }
  );
  assert.equal(r.nextReviewAt, new Date(t0 + DAY_MS + 3 * DAY_MS).toISOString());

  r = applyQuestionAttemptToStat(
    r,
    { questionId: qMeta.id, outcome: "correct", selected: ["C"] },
    qMeta,
    t0 + 4 * DAY_MS,
    { graduationThreshold: 4 }
  );
  assert.equal(r.nextReviewAt, new Date(t0 + 4 * DAY_MS + 7 * DAY_MS).toISOString());
});

test("computeReadinessEstimate: returns honest empty state below threshold and ignores zero-attempt flagged stubs", () => {
  assert.equal(READINESS_MIN_ATTEMPTS, 5);

  const empty = computeReadinessEstimate({ attempts: [], questionStats: [] });
  assert.equal(empty.hasEnoughData, false);
  assert.equal(empty.estimatePct, null);
  assert.equal(empty.totalQuestionAttempts, 0);
  assert.equal(empty.unitsCovered, 0);
  assert.equal(empty.questionsCovered, 0);
  assert.equal(empty.trend, "insufficient");

  // 4 independent question attempts + 2 flagged-only zero-attempt stubs -> still < 5 attempts!
  const underThreshold = computeReadinessEstimate({
    attempts: [
      { mode: "independent", submittedAt: "2026-11-20T10:00:00Z", counts: { correct: 3, partial: 0, incorrect: 1 } },
      { mode: "assisted", submittedAt: "2026-11-21T10:00:00Z", counts: { correct: 10, partial: 0, incorrect: 0 } },
    ],
    questionStats: [
      { questionId: "jelet-2025-q001", unitId: "M01", sourceType: "official-pyq", attemptsCount: 2, correctCount: 1 },
      { questionId: "jelet-2025-q002", unitId: "M02", sourceType: "official-pyq", attemptsCount: 2, correctCount: 2 },
      { questionId: "jelet-2025-q003", unitId: "P01", sourceType: "official-pyq", attemptsCount: 0, correctCount: 0, flaggedAsMistake: true },
    ],
  });
  assert.equal(underThreshold.hasEnoughData, false);
  assert.equal(underThreshold.estimatePct, null);
  assert.equal(underThreshold.totalQuestionAttempts, 4);
  assert.equal(underThreshold.sessionCount, 1); // assisted session excluded
  assert.equal(underThreshold.unitsCovered, 2); // flagged stub with 0 attempts excluded
  assert.equal(underThreshold.questionsCovered, 2);
});

test("computeReadinessEstimate: computes transparent accuracy, 42-unit/400-PYQ coverage, and improving/flat/declining trends", () => {
  // 21 units covered (50%), 100 official PYQs covered (25%), 80% accuracy, improving session trend
  const qStats = [];
  for (let i = 1; i <= 100; i++) {
    const unitNum = ((i - 1) % 21) + 1;
    qStats.push({
      questionId: `jelet-2025-q${String(i).padStart(3, "0")}`,
      unitId: `U${String(unitNum).padStart(2, "0")}`,
      sourceType: "official-pyq",
      attemptsCount: 1,
      correctCount: i <= 80 ? 1 : 0,
    });
  }

  const improvingAttempts = [
    { mode: "independent", submittedAt: "2026-11-20T10:00:00Z", counts: { correct: 5, partial: 0, incorrect: 5 } },
    { mode: "independent", submittedAt: "2026-11-21T10:00:00Z", counts: { correct: 6, partial: 0, incorrect: 4 } },
    { mode: "independent", submittedAt: "2026-11-22T10:00:00Z", counts: { correct: 8, partial: 0, incorrect: 2 } },
    { mode: "independent", submittedAt: "2026-11-23T10:00:00Z", counts: { correct: 9, partial: 0, incorrect: 1 } },
  ];

  const rImproving = computeReadinessEstimate({
    attempts: improvingAttempts,
    questionStats: qStats,
    totalUnits: 42,
    totalQuestions: 400,
  });

  assert.equal(rImproving.hasEnoughData, true);
  assert.equal(rImproving.totalQuestionAttempts, 100);
  assert.equal(rImproving.averageAccuracyPct, 80);
  assert.equal(rImproving.unitsCovered, 21);
  assert.equal(rImproving.unitCoveragePct, 50);
  assert.equal(rImproving.questionsCovered, 100);
  assert.equal(rImproving.questionCoveragePct, 25);
  assert.equal(rImproving.trend, "improving");
  assert.ok(rImproving.trendDeltaPct >= 25);
  // 80*0.5 (40) + 50*0.25 (12.5) + 25*0.20 (5) + 5 = 62.5 -> 63 ("Expanding Mastery")
  assert.equal(rImproving.estimatePct, 63);
  assert.equal(rImproving.stageLabel, "Expanding Mastery");

  // Reversing chronological order of those accuracies produces "declining" trend
  const decliningAttempts = [
    { mode: "independent", submittedAt: "2026-11-20T10:00:00Z", counts: { correct: 9, partial: 0, incorrect: 1 } },
    { mode: "independent", submittedAt: "2026-11-21T10:00:00Z", counts: { correct: 8, partial: 0, incorrect: 2 } },
    { mode: "independent", submittedAt: "2026-11-22T10:00:00Z", counts: { correct: 6, partial: 0, incorrect: 4 } },
    { mode: "independent", submittedAt: "2026-11-23T10:00:00Z", counts: { correct: 5, partial: 0, incorrect: 5 } },
  ];
  const rDeclining = computeReadinessEstimate({
    attempts: decliningAttempts,
    questionStats: qStats,
    totalUnits: 42,
    totalQuestions: 400,
  });
  assert.equal(rDeclining.trend, "declining");
  assert.ok(rDeclining.estimatePct < rImproving.estimatePct);
});
