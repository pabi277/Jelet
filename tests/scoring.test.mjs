/**
 * scoring.test.mjs — Phase 04 Gate: Exact 1/12-Mark Scoring & Tie-Break Unit Tests
 * ---------------------------------------------------------------------------
 * Runs with Node's built-in runner:
 *   node --test tests/scoring.test.mjs
 * Verifies Category-I (+12/-3/0), Category-II partial credit (C=1..4, incl.
 * 8/12 = 2/3, 16/12 = 4/3, w>0 -> 0), WBJEEB voided "W" (+12/+24), 9-step
 * tie-breaking vector, JU cutoff bands, CGPA eligibility, and streak logic.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  scoreQuestion,
  scoreAttempt,
  compareAttemptsByWbjeebRules,
  formatTwelfths,
  formatExactFraction,
  evaluateJuCutoffBand,
  evaluateDiplomaEligibility,
  MAX_PAPER_TWELFTHS,
} from "../assets/js/core/scoring.js";

import { computeStreakDays } from "../assets/js/core/stats.js";

const cat1Q = {
  id: "q-cat1",
  qNumber: 1,
  subjectId: "MATH",
  unitId: "M01",
  category: 1,
  fullTwelfths: 12,
  negativeTwelfths: 3,
  key: { status: "active", correct: ["C"] },
};

test("Category I: correct (+12), wrong (-3), multi-bubble (-3), unattempted (0)", () => {
  assert.equal(scoreQuestion(cat1Q, ["C"]).twelfths, 12);
  assert.equal(scoreQuestion(cat1Q, ["C"]).outcome, "correct");

  const wrong = scoreQuestion(cat1Q, ["A"]);
  assert.equal(wrong.twelfths, -3);
  assert.equal(wrong.negativeTwelfths, 3);
  assert.equal(wrong.outcome, "incorrect");

  const multiBubble = scoreQuestion(cat1Q, ["B", "C"]);
  assert.equal(multiBubble.twelfths, -3);
  assert.equal(multiBubble.outcome, "incorrect");

  const blank = scoreQuestion(cat1Q, []);
  assert.equal(blank.twelfths, 0);
  assert.equal(blank.outcome, "unattempted");
});

test("Category II (C=3): exact rational twelfths 8 (2/3), 16 (4/3), 24 (2.0), and w>0 -> 0", () => {
  const q3 = {
    id: "q-cat2-3",
    qNumber: 31,
    subjectId: "MATH",
    unitId: "M02",
    category: 2,
    fullTwelfths: 24,
    negativeTwelfths: 0,
    key: { status: "active", correct: ["A", "B", "D"] },
  };

  const c1 = scoreQuestion(q3, ["A"]);
  assert.equal(c1.twelfths, 8);
  assert.equal(c1.outcome, "partial");
  assert.equal(formatExactFraction(c1.twelfths), "+2/3");
  assert.equal(formatTwelfths(c1.twelfths), "0.67");

  const c2 = scoreQuestion(q3, ["B", "D"]);
  assert.equal(c2.twelfths, 16);
  assert.equal(c2.outcome, "partial");
  assert.equal(formatExactFraction(c2.twelfths), "+4/3");
  assert.equal(formatTwelfths(c2.twelfths), "1.33");

  const full = scoreQuestion(q3, ["D", "A", "B"]);
  assert.equal(full.twelfths, 24);
  assert.equal(full.outcome, "correct");

  // One wrong option mixed with correct options -> 0 twelfths, 0 negative
  const poisoned = scoreQuestion(q3, ["A", "B", "C"]);
  assert.equal(poisoned.twelfths, 0);
  assert.equal(poisoned.negativeTwelfths, 0);
  assert.equal(poisoned.outcome, "incorrect");
});

test("Category II (C=1, C=2, C=4): all partial-credit permutations are exact integers", () => {
  const q1 = { id: "q1", qNumber: 32, subjectId: "MATH", unitId: "M01", category: 2, key: { status: "active", correct: ["B"] } };
  assert.equal(scoreQuestion(q1, ["B"]).twelfths, 24);
  assert.equal(scoreQuestion(q1, ["A"]).twelfths, 0);

  const q2 = { id: "q2", qNumber: 33, subjectId: "PHYS", unitId: "P01", category: 2, key: { status: "active", correct: ["A", "C"] } };
  assert.equal(scoreQuestion(q2, ["C"]).twelfths, 12);
  assert.equal(scoreQuestion(q2, ["A", "C"]).twelfths, 24);

  const q4 = { id: "q4", qNumber: 34, subjectId: "CHEM", unitId: "C01", category: 2, key: { status: "active", correct: ["A", "B", "C", "D"] } };
  assert.equal(scoreQuestion(q4, ["A"]).twelfths, 6);
  assert.equal(scoreQuestion(q4, ["A", "D"]).twelfths, 12);
  assert.equal(scoreQuestion(q4, ["A", "B", "C"]).twelfths, 18);
  assert.equal(scoreQuestion(q4, ["A", "B", "C", "D"]).twelfths, 24);
});

test("Board-Voided ('W') items award +12 (Cat-I) and +24 (Cat-II) regardless of selection", () => {
  const voidCat1 = {
    id: "jelet-2025-q041",
    qNumber: 41,
    subjectId: "PHYS",
    unitId: "P01",
    category: 1,
    fullTwelfths: 12,
    negativeTwelfths: 3,
    key: { status: "voided", correct: ["W"] },
  };
  const voidCat2 = {
    id: "jelet-2023-q088",
    qNumber: 88,
    subjectId: "CHEM",
    unitId: "C04",
    category: 2,
    fullTwelfths: 24,
    negativeTwelfths: 0,
    key: { status: "voided", correct: ["W"] },
  };

  assert.equal(scoreQuestion(voidCat1, []).twelfths, 12);
  assert.equal(scoreQuestion(voidCat1, ["B"]).twelfths, 12);
  assert.equal(scoreQuestion(voidCat1, ["B"]).outcome, "voided_awarded");
  assert.equal(scoreQuestion(voidCat2, []).twelfths, 24);
});

test("Full JELET 2025 official paper: perfect answer key scores exactly 1440 twelfths (120 marks)", () => {
  const paper2025 = JSON.parse(fs.readFileSync("./_data/papers/2025.json", "utf8"));
  const perfectResponses = {};
  for (const q of paper2025.questions) {
    if (q.key.status !== "voided") {
      perfectResponses[q.id] = q.key.correct;
    }
  }
  const result = scoreAttempt(paper2025.questions, perfectResponses);
  assert.equal(result.maxTwelfths, MAX_PAPER_TWELFTHS);
  assert.equal(result.totalTwelfths, MAX_PAPER_TWELFTHS);
  assert.equal(result.voidedTwelfths, 3 * 12); // Q41, Q79, Q84 in 2025 are all Cat-I voided
  assert.equal(result.counts.voided_awarded, 3);
  assert.equal(result.counts.correct, 97);
});

test("WBJEEB 9-step tie-breaker ranks fewer total negatives ahead of equal total marks", () => {
  const qs = [
    { id: "m1", qNumber: 1, subjectId: "MATH", unitId: "M01", category: 1, key: { status: "active", correct: ["A"] } },
    { id: "m2", qNumber: 2, subjectId: "MATH", unitId: "M01", category: 1, key: { status: "active", correct: ["A"] } },
    { id: "m3", qNumber: 31, subjectId: "MATH", unitId: "M01", category: 2, key: { status: "active", correct: ["A", "B", "C", "D"] } },
  ];
  // Candidate A: +12 on m1, 0 on m2, +6 on m3 -> +18 twelfths, 0 negatives
  const candA = scoreAttempt(qs, { m1: ["A"], m3: ["A"] });
  // Candidate B: -3 on m1, -3 on m2, +24 on m3 -> +18 twelfths, 6 negatives
  const candB = scoreAttempt(qs, { m1: ["B"], m2: ["B"], m3: ["A", "B", "C", "D"] });

  assert.equal(candA.totalTwelfths, 18);
  assert.equal(candB.totalTwelfths, 18);
  assert.ok(compareAttemptsByWbjeebRules(candA, candB) < 0);
});

test("JU Cutoff Band & WBSCTE CGPA 9.35 -> 86.0% JU Eligible", () => {
  assert.equal(evaluateJuCutoffBand(1107).band, "JU CSE / IT Safe Zone"); // 92.25 marks
  const elig = evaluateDiplomaEligibility(9.35, "General");
  assert.equal(elig.percentage, 86);
  assert.equal(elig.eligible, true);
  assert.equal(evaluateDiplomaEligibility(6.2, "General").eligible, false); // 54.5% < 60%
  assert.equal(evaluateDiplomaEligibility(6.2, "OBC-B").eligible, true); // 54.5% >= 54%
});

test("computeStreakDays returns 0 on fresh device and counts consecutive days honestly", () => {
  const now = new Date("2026-11-24T12:00:00Z").getTime();
  assert.equal(computeStreakDays([], now), 0);
  assert.equal(
    computeStreakDays(["2026-11-24T08:00:00Z", "2026-11-23T18:00:00Z", "2026-11-22T09:00:00Z"], now),
    3
  );
  // Stale attempt 4 days ago -> streak reset to 0
  assert.equal(computeStreakDays(["2026-11-20T08:00:00Z"], now), 0);
});
