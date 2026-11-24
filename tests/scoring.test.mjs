/**
 * scoring.test.mjs — Phase 04 gate: Exhaustive scoring engine unit tests
 * ------------------------------------------------------------------------
 * Runs with the zero-dependency Node test runner:
 *   node --test tests/scoring.test.mjs
 *
 * Covers:
 *   - Cat-I (+12 / -3 / 0)
 *   - Cat-II (C=1..4 partial: 8/12, 16/12, etc.; w>0 → 0)
 *   - "W" voided items
 *   - 9-step tie-breaker vector
 *   - Full-paper scoring
 *   - Timer helpers
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  TWELFTH,
  FULL_MARK_TWELFTHS,
  CAT1_FULL,
  CAT1_NEGATIVE,
  CAT2_FULL,
  PAPER_MAX_TWELFTHS,
  twelfthsToMarks,
  toLetterArray,
  scoreQuestion,
  scorePaper,
  tieBreakerVector,
  compareTieBreaker,
  formatDuration,
  EXAM_DURATION_SECONDS,
  remainingSeconds,
} from "../assets/js/scoring.js";

/* ================================================================== *
 * Helper: build minimal question objects
 * ================================================================== */

function makeQ(qNumber, category, correct, subjectId = "MATH", voided = false) {
  return {
    qNumber,
    category,
    subjectId,
    key: {
      status: voided ? "voided" : "active",
      correct,
    },
  };
}

/* ================================================================== *
 * Constants sanity
 * ================================================================== */

test("constants: twelfths are exact integers", () => {
  assert.equal(TWELFTH, 1);
  assert.equal(FULL_MARK_TWELFTHS, 12);
  assert.equal(CAT1_FULL, 12);
  assert.equal(CAT1_NEGATIVE, 3);
  assert.equal(CAT2_FULL, 24);
  assert.equal(PAPER_MAX_TWELFTHS, 1440);
  assert.equal(EXAM_DURATION_SECONDS, 7200); // 2h
});

/* ================================================================== *
 * twelfthsToMarks
 * ================================================================== */

test("twelfthsToMarks: exact fractions, no float drift", () => {
  assert.equal(twelfthsToMarks(0), "0.00");
  assert.equal(twelfthsToMarks(12), "1.00");
  assert.equal(twelfthsToMarks(-12), "−1.00");
  assert.equal(twelfthsToMarks(-3), "−¼");
  assert.equal(twelfthsToMarks(6), "½");
  assert.equal(twelfthsToMarks(8), "⅔");
  assert.equal(twelfthsToMarks(16), "1 ⅓");
  assert.equal(twelfthsToMarks(24), "2.00");
  assert.equal(twelfthsToMarks(1440), "120.00");
});

test("twelfthsToMarks: negative fractions", () => {
  assert.equal(twelfthsToMarks(-3), "−¼");
  assert.equal(twelfthsToMarks(-8), "−⅔");
  assert.equal(twelfthsToMarks(-15), "−1 ¼");
});

/* ================================================================== *
 * Category-I scoring: +12 / -3 / 0
 * ================================================================== */

test("Cat-I: correct single option → +12 twelfths", () => {
  const q = makeQ(1, 1, ["D"]);
  const r = scoreQuestion(q, new Set(["D"]));
  assert.equal(r.twelfths, 12);
  assert.equal(r.outcome, "correct");
  assert.equal(r.negativeTwelfths, 0);
  assert.equal(r.positiveTwelfths, 12);
});

test("Cat-I: wrong single option → -3 twelfths", () => {
  const q = makeQ(1, 1, ["D"]);
  const r = scoreQuestion(q, new Set(["A"]));
  assert.equal(r.twelfths, -3);
  assert.equal(r.outcome, "incorrect");
  assert.equal(r.negativeTwelfths, 3);
  assert.equal(r.positiveTwelfths, 0);
});

test("Cat-I: multiple bubbles (even if one is right) → -3 twelfths", () => {
  const q = makeQ(1, 1, ["D"]);
  // marking D AND A → multiple bubbles on OMR → incorrect
  const r = scoreQuestion(q, new Set(["D", "A"]));
  assert.equal(r.twelfths, -3);
  assert.equal(r.outcome, "incorrect");
});

test("Cat-I: unattempted → 0 twelfths", () => {
  const q = makeQ(1, 1, ["D"]);
  const r = scoreQuestion(q, new Set());
  assert.equal(r.twelfths, 0);
  assert.equal(r.outcome, "unattempted");
  assert.equal(r.negativeTwelfths, 0);
});

test("Cat-I: marking only the correct letter with extra wrong letter → -3", () => {
  const q = makeQ(5, 1, ["B"]);
  const r = scoreQuestion(q, new Set(["B", "C"]));
  assert.equal(r.twelfths, -3);
  assert.equal(r.outcome, "incorrect");
});

test("Cat-I: all three other wrong options → -3", () => {
  const q = makeQ(7, 1, ["A"]);
  const r = scoreQuestion(q, new Set(["B", "C"]));
  assert.equal(r.twelfths, -3);
  assert.equal(r.outcome, "incorrect");
});

/* ================================================================== *
 * Category-II scoring: C=1..4 partial credit
 * ================================================================== */

test("Cat-II C=4: all 4 correct → +24", () => {
  const q = makeQ(31, 2, ["A", "B", "C", "D"]);
  const r = scoreQuestion(q, new Set(["A", "B", "C", "D"]));
  assert.equal(r.twelfths, 24);
  assert.equal(r.outcome, "correct");
});

test("Cat-II C=4, c=1: partial → +6 twelfths (0.50)", () => {
  const q = makeQ(32, 2, ["A", "B", "C", "D"]);
  const r = scoreQuestion(q, new Set(["A"]));
  assert.equal(r.twelfths, 6);
  assert.equal(r.outcome, "partial");
  assert.equal(r.negativeTwelfths, 0);
});

test("Cat-II C=4, c=2: partial → +12 twelfths (1.00)", () => {
  const q = makeQ(33, 2, ["A", "B", "C", "D"]);
  const r = scoreQuestion(q, new Set(["A", "B"]));
  assert.equal(r.twelfths, 12);
  assert.equal(r.outcome, "partial");
});

test("Cat-II C=4, c=3: partial → +18 twelfths (1.50)", () => {
  const q = makeQ(34, 2, ["A", "B", "C", "D"]);
  const r = scoreQuestion(q, new Set(["A", "B", "C"]));
  assert.equal(r.twelfths, 18);
  assert.equal(r.outcome, "partial");
});

test("Cat-II C=3, c=1: partial → +8 twelfths (⅔)", () => {
  const q = makeQ(35, 2, ["A", "B", "C"]);
  const r = scoreQuestion(q, new Set(["A"]));
  assert.equal(r.twelfths, 8);
  assert.equal(r.outcome, "partial");
});

test("Cat-II C=3, c=2: partial → +16 twelfths (4/3)", () => {
  const q = makeQ(36, 2, ["A", "B", "C"]);
  const r = scoreQuestion(q, new Set(["A", "B"]));
  assert.equal(r.twelfths, 16);
  assert.equal(r.outcome, "partial");
});

test("Cat-II C=3: all 3 correct → +24", () => {
  const q = makeQ(37, 2, ["A", "B", "C"]);
  const r = scoreQuestion(q, new Set(["A", "B", "C"]));
  assert.equal(r.twelfths, 24);
  assert.equal(r.outcome, "correct");
});

test("Cat-II C=2, c=1: partial → +12 twelfths (1.00)", () => {
  const q = makeQ(38, 2, ["A", "B"]);
  const r = scoreQuestion(q, new Set(["A"]));
  assert.equal(r.twelfths, 12);
  assert.equal(r.outcome, "partial");
});

test("Cat-II C=2: both correct → +24", () => {
  const q = makeQ(39, 2, ["A", "B"]);
  const r = scoreQuestion(q, new Set(["A", "B"]));
  assert.equal(r.twelfths, 24);
  assert.equal(r.outcome, "correct");
});

test("Cat-II C=1: single correct → +24 (same as full)", () => {
  const q = makeQ(40, 2, ["A"]);
  const r = scoreQuestion(q, new Set(["A"]));
  assert.equal(r.twelfths, 24);
  assert.equal(r.outcome, "correct");
});

test("Cat-II: w>0 (any wrong option) → 0 twelfths, zero negative", () => {
  const q = makeQ(31, 2, ["A", "B", "C", "D"]);
  // mark A (correct) + D (also correct) + B (correct) + C... wait
  // Let's mark A (correct) + E... no, options are A-D.
  // Mark A (correct) + ... but all A-D are correct here.
  // Better: C=3 case with a wrong letter
  const q2 = makeQ(66, 2, ["A", "B", "C"]);
  // mark A (correct) + D (wrong)
  const r2 = scoreQuestion(q2, new Set(["A", "D"]));
  assert.equal(r2.twelfths, 0);
  assert.equal(r2.outcome, "incorrect");
  assert.equal(r2.negativeTwelfths, 0);
});

test("Cat-II: w>0 with partial correct → still 0", () => {
  const q = makeQ(67, 2, ["A", "B", "C"]);
  // mark A + B (correct) + D (wrong) → w=1 > 0
  const r = scoreQuestion(q, new Set(["A", "B", "D"]));
  assert.equal(r.twelfths, 0);
  assert.equal(r.outcome, "incorrect");
  assert.equal(r.negativeTwelfths, 0);
});

test("Cat-II: only wrong options → 0 twelfths", () => {
  const q = makeQ(68, 2, ["A", "B"]);
  const r = scoreQuestion(q, new Set(["C", "D"]));
  assert.equal(r.twelfths, 0);
  assert.equal(r.outcome, "incorrect");
  assert.equal(r.negativeTwelfths, 0);
});

test("Cat-II: unattempted → 0 twelfths", () => {
  const q = makeQ(69, 2, ["A", "B", "C", "D"]);
  const r = scoreQuestion(q, new Set());
  assert.equal(r.twelfths, 0);
  assert.equal(r.outcome, "unattempted");
});

test("Cat-II: partial credit never has negative marks", () => {
  for (let C = 1; C <= 4; C++) {
    const correct = ["A", "B", "C", "D"].slice(0, C);
    const q = makeQ(70, 2, correct);
    for (let c = 1; c < C; c++) {
      const sel = correct.slice(0, c);
      const r = scoreQuestion(q, new Set(sel));
      assert.equal(r.negativeTwelfths, 0, `C=${C}, c=${c} should have 0 negative`);
    }
  }
});

test("Cat-II: all C=1..4 partial values are exact twelfths", () => {
  // C=1: no partial possible (c=0 → unattempted, c=1 → correct)
  // C=2: c=1 → 12
  const q2 = makeQ(71, 2, ["A", "B"]);
  assert.equal(scoreQuestion(q2, new Set(["A"])).twelfths, 12);
  // C=3: c=1 → 8, c=2 → 16
  const q3 = makeQ(72, 2, ["A", "B", "C"]);
  assert.equal(scoreQuestion(q3, new Set(["A"])).twelfths, 8);
  assert.equal(scoreQuestion(q3, new Set(["A", "B"])).twelfths, 16);
  // C=4: c=1 → 6, c=2 → 12, c=3 → 18
  const q4 = makeQ(73, 2, ["A", "B", "C", "D"]);
  assert.equal(scoreQuestion(q4, new Set(["A"])).twelfths, 6);
  assert.equal(scoreQuestion(q4, new Set(["A", "B"])).twelfths, 12);
  assert.equal(scoreQuestion(q4, new Set(["A", "B", "C"])).twelfths, 18);
});

/* ================================================================== *
 * Voided / Withdrawn ("W") items
 * ================================================================== */

test("Voided Cat-I: → +12 twelfths (+1.00)", () => {
  const q = makeQ(49, 1, ["W"], "MATH", true);
  const r = scoreQuestion(q, new Set()); // even if unattempted, voided awards full
  assert.equal(r.twelfths, 12);
  assert.equal(r.outcome, "voided_awarded");
  assert.equal(r.negativeTwelfths, 0);
  assert.equal(r.positiveTwelfths, 12);
});

test("Voided Cat-II: → +24 twelfths (+2.00)", () => {
  const q = makeQ(86, 2, ["W"], "CHEM", true);
  const r = scoreQuestion(q, new Set());
  assert.equal(r.twelfths, 24);
  assert.equal(r.outcome, "voided_awarded");
  assert.equal(r.negativeTwelfths, 0);
  assert.equal(r.positiveTwelfths, 24);
});

test("Voided: regardless of what user marked, still +12/+24", () => {
  const qCat1 = makeQ(49, 1, ["W"], "MATH", true);
  const r1 = scoreQuestion(qCat1, new Set(["A", "B"]));
  assert.equal(r1.twelfths, 12);
  assert.equal(r1.outcome, "voided_awarded");

  const qCat2 = makeQ(86, 2, ["W"], "CHEM", true);
  const r2 = scoreQuestion(qCat2, new Set(["A", "D"]));
  assert.equal(r2.twelfths, 24);
  assert.equal(r2.outcome, "voided_awarded");
});

test("Voided never counts as user mistake", () => {
  const q = makeQ(49, 1, ["W"], "MATH", true);
  const r = scoreQuestion(q, new Set(["A"]));
  // outcome is voided_awarded, not "incorrect"
  assert.equal(r.outcome, "voided_awarded");
  assert.equal(r.negativeTwelfths, 0);
});

/* ================================================================== *
 * Score Paper
 * ================================================================== */

test("scorePaper: all correct → 1440 twelfths (120.00)", () => {
  const paper = makePaper(80, ["A"], "MATH", 20, ["A","B","C","D"], "MATH");
  const answers = {};
  for (let i = 1; i <= 80; i++) answers[i] = new Set(["A"]);
  for (let i = 81; i <= 100; i++) answers[i] = new Set(["A","B","C","D"]);
  const r = scorePaper(paper, answers);
  assert.equal(r.totalTwelfths, 1440);
  assert.equal(r.totalMarks, "120.00");
});

test("scorePaper: all unattempted → 0 twelfths", () => {
  const paper = makePaper(80, ["A"], "MATH", 20, ["A","B","C","D"], "MATH");
  const r = scorePaper(paper, {});
  assert.equal(r.totalTwelfths, 0);
  assert.equal(r.totalMarks, "0.00");
});

test("scorePaper: all wrong → negative marks", () => {
  const paper = makePaper(80, ["A"], "MATH", 20, ["A","B"], "MATH");
  const answers = {};
  for (let i = 1; i <= 80; i++) answers[i] = new Set(["B"]); // wrong Cat-I → -3
  for (let i = 81; i <= 100; i++) answers[i] = new Set(["C","D"]); // Cat-II w>0 → 0
  const r = scorePaper(paper, answers);
  // 80 Cat-I wrong → -240 twelfths; 20 Cat-II wrong → 0
  assert.equal(r.totalTwelfths, -240);
  assert.equal(r.totalNegativeTwelfths, 240);
});

test("scorePaper: byOutcome counts", () => {
  const paper = makePaper(5, ["A"], "MATH", 5, ["A","B","C","D"], "MATH");
  const answers = {
    1: new Set(["A"]),       // Cat-I correct
    2: new Set(["B"]),       // Cat-I incorrect
    3: new Set(),            // Cat-I unattempted
    6: new Set(["A","B"]),   // Cat-II partial (c=2, C=4 → 12)
    7: new Set(["A","B","C","D"]), // Cat-II correct
  };
  const r = scorePaper(paper, answers);
  assert.equal(r.byOutcome.correct, 2);
  assert.equal(r.byOutcome.partial, 1);
  assert.equal(r.byOutcome.incorrect, 1);
  assert.equal(r.byOutcome.unattempted, 6); // Q3, Q4, Q5, Q8, Q9, Q10
  assert.equal(r.byOutcome.voided_awarded, 0);
});

test("scorePaper: bySubject breakdown", () => {
  const paper = makePaper(2, ["A"], "MATH", 2, ["A","B"], "PHYS");
  const answers = {
    1: new Set(["A"]), // correct math
    2: new Set(["B"]), // wrong math
    3: new Set(["A"]), // Cat-II partial phys (+12)
    4: new Set(["A","B"]), // correct phys
  };
  const r = scorePaper(paper, answers);
  assert.equal(r.bySubject.MATH.positiveTwelfths, 12);
  assert.equal(r.bySubject.MATH.negativeTwelfths, 3);
  assert.equal(r.bySubject.MATH.netTwelfths, 9);
  assert.equal(r.bySubject.PHYS.positiveTwelfths, 36); // 12 + 24
  assert.equal(r.bySubject.PHYS.negativeTwelfths, 0);
});

test("scorePaper: voided questions counted in byOutcome", () => {
  const paper = makePaper(2, ["A"], "MATH", 2, ["A","B"], "MATH", true);
  const answers = {
    1: new Set(["A"]), // correct → +12
    2: new Set(["B"]), // VOIDED (last Cat-I) → +12
    3: new Set(),      // unattempted → 0
    4: new Set(),      // VOIDED (last Cat-II) → +24
  };
  const r = scorePaper(paper, answers);
  // Q1=correct(12), Q2=voided Cat-I(+12), Q3=unattempted(0), Q4=voided Cat-II(+24)
  assert.equal(r.byOutcome.voided_awarded, 2);
  assert.equal(r.totalTwelfths, 12 + 12 + 0 + 24);
});

/* ================================================================== *
 * Tie-Breaker Vector
 * ================================================================== */

test("tieBreakerVector: returns 9-element vector", () => {
  const paper = makePaper(4, ["A"], "MATH", 4, ["A","B"], "MATH");
  const answers = {
    1: new Set(["A"]), // correct math → +12
    2: new Set(["B"]), // wrong math → -3
    5: new Set(["A"]), // Cat-II partial math → +12
    6: new Set(["A"]), // Cat-II partial math → +12
  };
  const scored = scorePaper(paper, answers);
  const tb = tieBreakerVector(scored);
  assert.equal(tb.vector.length, 9);
  assert.equal(tb.steps.length, 9);
  // step 1: total negative = 3
  assert.equal(tb.vector[0], 3);
  // step 2: math positive = 12 + 12 + 12 = 36
  assert.equal(tb.vector[1], 36);
  // step 3: math negative = 3
  assert.equal(tb.vector[2], 3);
});

test("tieBreakerVector: all zero for unattempted paper", () => {
  const paper = makePaper(2, ["A"], "MATH", 2, ["A","B"], "PHYS");
  const scored = scorePaper(paper, {});
  const tb = tieBreakerVector(scored);
  for (const v of tb.vector) assert.equal(v, 0);
});

test("tieBreakerVector: step directions correct", () => {
  const paper = makePaper(2, ["A"], "MATH", 2, ["A","B"], "PHYS");
  const scored = scorePaper(paper, {
    1: new Set(["A"]),
    2: new Set(["B"]),
    3: new Set(["A"]),
    4: new Set(["A","B"]),
  });
  const tb = tieBreakerVector(scored);
  // steps 1,3,5,7,9 (1-indexed) → ascending
  // steps 2,4,6,8 → descending
  assert.equal(tb.steps[0].direction, "asc");
  assert.equal(tb.steps[1].direction, "desc");
  assert.equal(tb.steps[2].direction, "asc");
  assert.equal(tb.steps[3].direction, "desc");
  assert.equal(tb.steps[4].direction, "asc");
  assert.equal(tb.steps[5].direction, "desc");
  assert.equal(tb.steps[6].direction, "asc");
  assert.equal(tb.steps[7].direction, "desc");
  assert.equal(tb.steps[8].direction, "asc");
});

test("compareTieBreaker: ascending steps (lower is better)", () => {
  // vectorA has less negative than vectorB → A is better
  const a = [3, 36, 3, 24, 0, 24, 0, 12, 0];
  const b = [6, 36, 6, 24, 0, 24, 0, 12, 0];
  assert.ok(compareTieBreaker(a, b) < 0);
  assert.ok(compareTieBreaker(b, a) > 0);
});

test("compareTieBreaker: descending steps (higher is better)", () => {
  // step 2 (index 1): a has 36, b has 30 → a is better (descending)
  const a = [3, 36, 3, 24, 0, 24, 0, 12, 0];
  const b = [3, 30, 3, 24, 0, 24, 0, 12, 0];
  assert.ok(compareTieBreaker(a, b) < 0);
  assert.ok(compareTieBreaker(b, a) > 0);
});

test("compareTieBreaker: identical vectors → 0", () => {
  const a = [3, 36, 3, 24, 0, 24, 0, 12, 0];
  assert.equal(compareTieBreaker(a, a), 0);
});

test("compareTieBreaker: tie broken by first differing step", () => {
  // steps 1 identical, step 2: a=36, b=30 → a wins
  const a = [3, 36, 99, 24, 0, 24, 0, 12, 0];
  const b = [3, 30, 3, 24, 0, 24, 0, 12, 0];
  assert.ok(compareTieBreaker(a, b) < 0);
});

/* ================================================================== *
 * Timer helpers
 * ================================================================== */

test("formatDuration: 2 hours → 02:00:00", () => {
  assert.equal(formatDuration(7200), "02:00:00");
});

test("formatDuration: 1 hour 30 min → 01:30:00", () => {
  assert.equal(formatDuration(5400), "01:30:00");
});

test("formatDuration: 120 seconds → 00:02:00", () => {
  assert.equal(formatDuration(120), "00:02:00");
});

test("formatDuration: 0 → 00:00:00", () => {
  assert.equal(formatDuration(0), "00:00:00");
});

test("formatDuration: negative → clamped to 0", () => {
  assert.equal(formatDuration(-10), "00:00:00");
});

test("remainingSeconds: positive diff", () => {
  const deadline = 20000;
  const now = 10000;
  assert.equal(remainingSeconds(deadline, now), 10);
});

test("remainingSeconds: deadline passed → 0", () => {
  const deadline = 5000;
  const now = 10000;
  assert.equal(remainingSeconds(deadline, now), 0);
});

test("remainingSeconds: exact match → 0", () => {
  assert.equal(remainingSeconds(10000, 10000), 0);
});

/* ================================================================== *
 * Helper: build a small paper
 * ================================================================== */

function makePaper(nCat1, cat1Correct, cat1Subj, cat2N, cat2Correct, cat2Subj, voided = false) {
  const questions = [];
  for (let i = 1; i <= nCat1; i++) {
    questions.push(makeQ(i, 1, cat1Correct, cat1Subj, voided && i === nCat1));
  }
  for (let i = 1; i <= cat2N; i++) {
    questions.push(makeQ(nCat1 + i, 2, cat2Correct, cat2Subj, voided && i === cat2N));
  }
  return { questions };
}
