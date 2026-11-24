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
  computeWeakAreas,
  resolveDefaultRoutingStrategy,
  resolveUnitQuestionPool,
  computeQuestionAdaptiveWeight,
  samplePracticeQuestions,
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
