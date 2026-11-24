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
  computeWeakAreas,
} from "../assets/js/core/stats.js";

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
