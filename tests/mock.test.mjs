/**
 * mock.test.mjs — Phase 08 Gate: Mock Analytics, History Trends, Sparklines &
 *                                        Mock ↔ Readiness / Weak-Area Integration
 * ---------------------------------------------------------------------------------------------------
 * Runs with the zero-dependency Node test runner:
 *   node --test tests/mock.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  computeMockAnalytics,
  computeMockHistory,
  computeReadinessEstimate,
  computeWeakAreas,
  MOCK_SLOW_QUESTION_FACTOR,
} from "../assets/js/core/stats.js";
import { sparklineSvg } from "../assets/js/core/charts.js";
import { scoreAttempt, MAX_PAPER_TWELFTHS } from "../assets/js/core/scoring.js";

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */
function cat1(id, qNumber, subjectId, unitId, correct) {
  return {
    id,
    qNumber,
    subjectId,
    unitId,
    category: 1,
    fullTwelfths: 12,
    negativeTwelfths: 3,
    key: { status: "active", correct: [correct] },
  };
}

function cat2(id, qNumber, subjectId, unitId, correct) {
  return {
    id,
    qNumber,
    subjectId,
    unitId,
    category: 2,
    fullTwelfths: 24,
    negativeTwelfths: 0,
    key: { status: "active", correct: correct },
  };
}

/* ------------------------------------------------------------------ *
 * 1. Negative marking is applied per-question via the frozen scoring engine
 * ------------------------------------------------------------------ */
test("scoring integration: Category-I negative marking is per-question (+12 / -3 / 0)", () => {
  const q = cat1("q1", 1, "MATH", "M01", "A");
  const correct = scoreAttempt([q], { q1: ["A"] }).items[0];
  assert.equal(correct.outcome, "correct");
  assert.equal(correct.twelfths, 12);

  const wrong = scoreAttempt([q], { q1: ["B"] }).items[0];
  assert.equal(wrong.outcome, "incorrect");
  assert.equal(wrong.twelfths, -3); // 1/4 negative marking, exact integer twelfths

  const multi = scoreAttempt([q], { q1: ["A", "B"] }).items[0];
  assert.equal(multi.outcome, "incorrect");
  assert.equal(multi.twelfths, -3); // multi-bubble darkened => incorrect

  const unattempted = scoreAttempt([q], { q1: [] }).items[0];
  assert.equal(unattempted.outcome, "unattempted");
  assert.equal(unattempted.twelfths, 0);
});

/* ------------------------------------------------------------------ *
 * 2. computeMockAnalytics — section scores, accuracy, time, key breakdown
 * ------------------------------------------------------------------ */
test("computeMockAnalytics: derives section scores, accuracy, time distribution & wrong-key breakdown", () => {
  const questions = [
    cat1("m1", 1, "MATH", "M01", "A"),
    cat1("m2", 2, "MATH", "M02", "B"),
    cat1("p1", 41, "PHYS", "P01", "C"),
    cat2("c1", 71, "CHEM", "C01", ["A", "B"]),
    cat1("e1", 91, "FEEE", "E01", "D"),
  ];
  const responses = {
    m1: ["A"], // correct
    m2: ["C"], // wrong (-3)
    p1: ["C"], // correct
    c1: ["A"], // partial (c=1, C=2 => 24*1/2 = 12)
    e1: [], // unattempted
  };
  const scored = scoreAttempt(questions, responses);
  const times = { m1: 30000, m2: 240000, p1: 60000, c1: 90000 }; // e1 not captured
  const a = computeMockAnalytics(scored, questions, times);

  // Overall accuracy: 2 correct / 4 attempted = 50%
  assert.equal(a.accuracy.correct, 2);
  assert.equal(a.accuracy.partial, 1);
  assert.equal(a.accuracy.incorrect, 1);
  assert.equal(a.accuracy.unattempted, 1);
  assert.equal(a.accuracy.attempted, 4);
  assert.equal(a.accuracy.accuracyPct, 50);

  // Section scores mapped from question IDs -> subjects
  assert.equal(a.sections.length, 4);
  const math = a.sections.find((s) => s.subjectId === "MATH");
  assert.equal(math.questionCount, 2);
  assert.equal(math.totalTwelfths, 9); // +12 -3
  assert.equal(math.correct, 1);
  assert.equal(math.incorrect, 1);

  const chem = a.sections.find((s) => s.subjectId === "CHEM");
  assert.equal(chem.partial, 1);
  assert.equal(chem.totalTwelfths, 12); // Cat-II partial 24*1/2

  // Time analysis: captured, median, slow flagging
  assert.equal(a.time.captured, true);
  assert.equal(a.time.perQuestionMs.length, 4);
  const slow = a.time.slowQuestions.find((q) => q.questionId === "m2");
  assert.ok(slow, "m2 (240s) must be flagged slow");
  assert.ok(slow.timeMs >= a.time.slowThresholdMs);
  assert.equal(MOCK_SLOW_QUESTION_FACTOR, 2);
  // avg per section present
  const phys = a.time.bySectionAvgMs.find((t) => t.subjectId === "PHYS");
  assert.equal(phys.avgTimeMs, 60000);

  // Wrong-vs-key breakdown (incorrect first, then partial), with key + pick
  assert.equal(a.wrongKey.length, 2);
  assert.equal(a.wrongKey[0].outcome, "incorrect");
  assert.equal(a.wrongKey[0].questionId, "m2");
  assert.deepEqual(a.wrongKey[0].correctOptions, ["B"]);
  assert.deepEqual(a.wrongKey[0].selected, ["C"]);
  assert.equal(a.wrongKey[1].outcome, "partial");
  assert.deepEqual(a.wrongKey[1].correctOptions, ["A", "B"]);
});

test("computeMockAnalytics: degrades gracefully with no timing data", () => {
  const questions = [cat1("m1", 1, "MATH", "M01", "A")];
  const scored = scoreAttempt(questions, { m1: ["A"] });
  const a = computeMockAnalytics(scored, questions, {});
  assert.equal(a.time.captured, false);
  assert.equal(a.time.slowQuestions.length, 0);
  assert.equal(a.wrongKey.length, 0);
});

/* ------------------------------------------------------------------ *
 * 3. computeMockHistory — trend series + personal bests + empty state
 * ------------------------------------------------------------------ */
test("computeMockHistory: filters full independent mocks, builds trends & bests, honest empty state", () => {
  const attempts = [
    {
      attemptId: "att-1",
      kind: "mock",
      mode: "independent",
      maxTwelfths: MAX_PAPER_TWELFTHS,
      paperId: "jelet-2025",
      title: "JELET 2025 · Official Timed Mock",
      submittedAt: "2026-11-20T10:00:00Z",
      totalTwelfths: 600,
      elapsedMs: 120 * 60 * 1000,
      durationMs: 120 * 60 * 1000,
      counts: { correct: 50, partial: 0, incorrect: 20, unattempted: 30, voided_awarded: 0 },
    },
    {
      attemptId: "att-2",
      kind: "mock",
      mode: "independent",
      maxTwelfths: MAX_PAPER_TWELFTHS,
      paperId: "jelet-2024",
      title: "JELET 2024 · Official Timed Mock",
      submittedAt: "2026-11-22T10:00:00Z",
      totalTwelfths: 720,
      elapsedMs: 95 * 60 * 1000,
      durationMs: 120 * 60 * 1000,
      counts: { correct: 60, partial: 0, incorrect: 15, unattempted: 25, voided_awarded: 0 },
    },
    // Assisted mock must be excluded
    {
      attemptId: "att-assist",
      kind: "mock",
      mode: "assisted",
      maxTwelfths: MAX_PAPER_TWELFTHS,
      submittedAt: "2026-11-23T10:00:00Z",
      totalTwelfths: 900,
      counts: { correct: 75, partial: 0, incorrect: 10, unattempted: 15, voided_awarded: 0 },
    },
    // Drill must be excluded
    {
      attemptId: "att-drill",
      kind: "drill",
      mode: "independent",
      maxTwelfths: 120,
      submittedAt: "2026-11-23T11:00:00Z",
      totalTwelfths: 60,
      counts: { correct: 5, partial: 0, incorrect: 1, unattempted: 0, voided_awarded: 0 },
    },
  ];

  const empty = computeMockHistory([]);
  assert.equal(empty.empty, true);
  assert.equal(empty.count, 0);
  assert.deepEqual(empty.trends.score, []);
  assert.equal(empty.bests.bestScore, null);

  const h = computeMockHistory(attempts);
  assert.equal(h.count, 2);
  assert.equal(h.empty, false);
  // newest first
  assert.equal(h.mocks[0].attemptId, "att-2");
  // oldest-first trend series
  assert.deepEqual(h.trends.score, [50, 60]);
  assert.deepEqual(h.trends.accuracy, [71, 80]); // 50/70, 60/75 rounded
  assert.deepEqual(h.trends.timeMs, [120 * 60 * 1000, 95 * 60 * 1000]);

  // Personal bests
  assert.equal(h.bests.bestScore.attemptId, "att-2");
  assert.equal(h.bests.bestScore.totalTwelfths, 720);
  assert.equal(h.bests.bestAccuracy.attemptId, "att-2");
  assert.equal(h.bests.fastestTime.attemptId, "att-2");
  assert.equal(h.bests.fastestTime.elapsedMs, 95 * 60 * 1000);
});

/* ------------------------------------------------------------------ *
 * 4. sparklineSvg — inline SVG trend line, theme tokens, edge cases
 * ------------------------------------------------------------------ */
test("sparklineSvg: renders a polyline for N values, placeholder for 0, dot for 1", () => {
  const multi = sparklineSvg([10, 20, 15, 30], { width: 120, height: 36 });
  assert.match(multi, /<svg/);
  assert.match(multi, /<polyline/);
  assert.match(multi, /var\(--fig-primary\)/);
  assert.match(multi, /<circle/);

  const single = sparklineSvg([42], { width: 120, height: 36 });
  assert.match(single, /<svg/);
  assert.match(single, /<circle/);

  const none = sparklineSvg([], { width: 120, height: 36 });
  assert.match(none, /<svg/);
  assert.doesNotMatch(none, /<polyline/);

  const custom = sparklineSvg([1, 2, 3], { stroke: "var(--fig-accent)" });
  assert.match(custom, /var\(--fig-accent\)/);
});

/* ------------------------------------------------------------------ *
 * 5. Mock ↔ readiness integration
 * ------------------------------------------------------------------ */
test("computeReadinessEstimate: surfaces mock count, best score, avg accuracy & trend", () => {
  const qStats = [
    { questionId: "jelet-2025-q001", unitId: "M01", sourceType: "official-pyq", attemptsCount: 3, correctCount: 2 },
    { questionId: "jelet-2025-q002", unitId: "M02", sourceType: "official-pyq", attemptsCount: 3, correctCount: 3 },
  ];
  const attempts = [
    {
      kind: "mock",
      mode: "independent",
      maxTwelfths: MAX_PAPER_TWELFTHS,
      submittedAt: "2026-11-20T10:00:00Z",
      totalTwelfths: 600,
      counts: { correct: 50, partial: 0, incorrect: 20, unattempted: 30, voided_awarded: 0 },
    },
    {
      kind: "mock",
      mode: "independent",
      maxTwelfths: MAX_PAPER_TWELFTHS,
      submittedAt: "2026-11-22T10:00:00Z",
      totalTwelfths: 720,
      counts: { correct: 65, partial: 0, incorrect: 15, unattempted: 20, voided_awarded: 0 },
    },
  ];
  const r = computeReadinessEstimate({ attempts, questionStats: qStats });
  assert.equal(r.mockCount, 2);
  assert.equal(r.mockBestTwelfths, 720);
  assert.equal(r.mockAvgAccuracyPct, 76); // mean of rounded mock accuracies [71, 81]
  assert.equal(r.mockTrend, "improving");
});

/* ------------------------------------------------------------------ *
 * 6. Mock ↔ weak-area integration (additive, non-double-counting)
 * ------------------------------------------------------------------ */
test("computeWeakAreas: folds mock analytics blob into an additive mock signal", () => {
  const manifestUnits = [
    { unitId: "M01", subjectId: "MATH", title: "Matrices", officialCode: "Math-A" },
    { unitId: "P01", subjectId: "PHYS", title: "Kinematics", officialCode: "Phys-A" },
  ];
  const questionStats = [
    // M01 has 4 attempts -> qualifies for the main weak-area list
    { questionId: "m01-1", subjectId: "MATH", unitId: "M01", attemptsCount: 4, correctCount: 1, mistakeCount: 3 },
  ];
  const mockAttempts = [
    {
      kind: "mock",
      mode: "independent",
      items: [
        { questionId: "m01-1", subjectId: "MATH", unitId: "M01", outcome: "incorrect" },
        { questionId: "m01-2", subjectId: "MATH", unitId: "M01", outcome: "correct" },
        { questionId: "p01-1", subjectId: "PHYS", unitId: "P01", outcome: "incorrect" },
        { questionId: "p01-2", subjectId: "PHYS", unitId: "P01", outcome: "incorrect" },
        { questionId: "p01-3", subjectId: "PHYS", unitId: "P01", outcome: "unattempted" },
      ],
    },
  ];

  const res = computeWeakAreas(questionStats, manifestUnits, { mockAttempts, minAttempts: 2 });

  // Main weak-area accuracy is NOT double-counted by the mock signal
  const m01 = res.units.find((u) => u.unitId === "M01");
  assert.equal(m01.attempts, 4);
  assert.equal(m01.correct, 1);
  // Mock-only additive fields attached
  assert.equal(m01.mockAttempts, 2);
  assert.equal(m01.mockCorrect, 1);
  assert.equal(m01.mockAccuracyPct, 50);

  // Mock-derived weak units surfaced from the analytics blob
  assert.equal(res.mockTotalAttempts, 4); // incorrect+correct counted, unattempted skipped
  const mockWeak = res.mockWeakUnits.map((u) => u.unitId);
  assert.deepEqual(mockWeak, ["P01", "M01"]); // P01 0/2=0% worst-first, then M01 1/2=50%
  const p01Mock = res.mockUnits.find((u) => u.unitId === "P01");
  assert.equal(p01Mock.accuracyPct, 0);
});
