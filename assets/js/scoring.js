/**
 * scoring.js — JELET Study Hub (v3) · Exact 1/12-Mark Scoring Engine
 * ------------------------------------------------------------------------
 * Zero-float-drift scoring: every JELET question score and the paper total
 * are exact integer multiples of 1/12 mark (`twelfths`).
 *
 *   LCM(1, 2, 3, 4) = 12
 *   1 full mark  = 12 twelfths
 *   Max paper score = 120 marks = 1,440 twelfths
 *
 * Pure framework-free module — safe to unit-test in Node.
 *
 * Scoring rules (per docs/01-PRODUCT-AND-EXAM-SPEC.md §3):
 *
 * 1. Board-Voided / Withdrawn Question (key.status === "voided"):
 *    Cat-I voided:   +12  twelfths  (+1.00)
 *    Cat-II voided:  +24  twelfths  (+2.00)
 *    Outcome: "voided_awarded"
 *
 * 2. Category-I (key.correct has exactly 1 option, full = 12 twelfths):
 *    selected.size === 0                     → 0     ("unattempted")
 *    selected.size === 1 && correct         → +12  ("correct")
 *    selected.size > 1 OR wrong single       → -3   ("incorrect")
 *
 * 3. Category-II (key.correct has C options, full = 24 twelfths):
 *    c = |selected ∩ correct|,  w = |selected \\ correct|
 *    selected.size === 0          → 0              ("unattempted")
 *    w > 0                       → 0              ("incorrect")  [0 negative]
 *    w === 0 && c === C          → +24            ("correct")
 *    w === 0 && 0 < c < C        → +(24*c)/C      ("partial")
 *
 * 4. 9-step WBJEEB Tie-Breaker Vector (§2.7 of the JELET Information Bulletin):
 *    (1)  less total negative marks  (ascending)
 *    (2)  more math positive marks   (descending)
 *    (3)  less math negative marks   (ascending)
 *    (4)  more physics positive      (descending)
 *    (5)  less physics negative      (ascending)
 *    (6)  more chemistry positive    (descending)
 *    (7)  less chemistry negative    (ascending)
 *    (8)  more FEEE positive         (descending)
 *    (9)  less FEEE negative         (ascending)
 */

/* ================================================================== *
 * Constants
 * ================================================================== */

export const TWELFTH = 1;        // one twelfth mark (integer unit)
export const FULL_MARK_TWELFTHS = 12;    // 1 mark = 12 twelfths
export const CAT1_FULL = 12;             // Cat-I full marks in twelfths
export const CAT1_NEGATIVE = 3;          // Cat-I negative penalty in twelfths
export const CAT2_FULL = 24;             // Cat-II full marks in twelfths
export const PAPER_MAX_TWELFTHS = 1440;  // 120 marks × 12

/** Ordered subject list for tie-breaker vector. */
export const SUBJECT_ORDER = ["MATH", "PHYS", "CHEM", "FEEE"];

/* ================================================================== *
 * Helpers
 * ================================================================== */

/**
 * Convert twelfths to a human-readable mark string, e.g. 8 → "⅔",
 * 12 → "1.00", -3 → "−¼". Uses exact fractions, never floats.
 */
export function twelfthsToMarks(t) {
  const n = Math.round(t);
  const abs = Math.abs(n);
  const whole = Math.trunc(abs / 12);
  const rem = abs - whole * 12;
  if (rem === 0) {
    if (abs === 0) return "0.00";
    const sign = n < 0 ? "−" : "";
    return `${sign}${whole}.00`;
  }
  const fracMap = {
    1: "1/12", 2: "1/6", 3: "¼", 4: "⅓", 5: "5/12",
    6: "½", 7: "7/12", 8: "⅔", 9: "¾", 10: "5/6", 11: "11/12",
  };
  const frac = fracMap[rem] || `${rem}/12`;
  const sign = n < 0 ? "−" : "";
  if (whole === 0) return `${sign}${frac}`;
  return `${sign}${whole} ${frac}`;
}

/**
 * Convert a Set<string> of selected option letters into a sorted array.
 */
export function toLetterArray(set) {
  return [...set].sort();
}

/* ================================================================== *
 * Per-Question Scoring
 * ================================================================== */

/**
 * Score a single question.
 *
 * @param {object} q      Question object (from _data/papers/*.json)
 * @param {Set<string>} selected  User's selected option letters, e.g. new Set(["A","C"])
 * @returns {object} {
 *   questionNumber, category, outcome, twelfths, marks (string),
 *   negativeTwelfths, positiveTwelfths, correct (Set)
 * }
 */
export function scoreQuestion(q, selected) {
  const sel = selected instanceof Set ? selected : new Set(selected || []);
  const key = q.key || {};
  const status = key.status || "active";
  const category = q.category || 1;
  const correctArr = key.correct || [];
  const correctSet = new Set(correctArr);

  const result = {
    questionNumber: q.qNumber,
    category,
    outcome: "",
    twelfths: 0,
    marks: "0.00",
    negativeTwelfths: 0,
    positiveTwelfths: 0,
    correct: correctSet,
  };

  // -------- 1. Voided / Withdrawn --------
  if (status === "voided") {
    result.outcome = "voided_awarded";
    result.twelfths = category === 2 ? CAT2_FULL : CAT1_FULL;
    result.positiveTwelfths = result.twelfths;
    result.marks = twelfthsToMarks(result.twelfths);
    return result;
  }

  // -------- 2. Category-I --------
  if (category === 1) {
    if (sel.size === 0) {
      result.outcome = "unattempted";
      return result;
    }
    if (sel.size === 1 && sel.has(correctArr[0])) {
      result.outcome = "correct";
      result.twelfths = CAT1_FULL;
      result.positiveTwelfths = CAT1_FULL;
      result.marks = twelfthsToMarks(CAT1_FULL);
      return result;
    }
    // multiple bubbles OR wrong single
    result.outcome = "incorrect";
    result.twelfths = -CAT1_NEGATIVE;
    result.negativeTwelfths = CAT1_NEGATIVE;
    result.marks = twelfthsToMarks(-CAT1_NEGATIVE);
    return result;
  }

  // -------- 3. Category-II --------
  // category === 2
  const C = correctArr.length;
  let c = 0;
  let w = 0;
  for (const letter of sel) {
    if (correctSet.has(letter)) c++;
    else w++;
  }

  if (sel.size === 0) {
    result.outcome = "unattempted";
    return result;
  }
  if (w > 0) {
    // any wrong option → zero, no negative
    result.outcome = "incorrect";
    result.twelfths = 0;
    return result;
  }
  if (c === C) {
    result.outcome = "correct";
    result.twelfths = CAT2_FULL;
    result.positiveTwelfths = CAT2_FULL;
    result.marks = twelfthsToMarks(CAT2_FULL);
    return result;
  }
  // strict subset, zero wrong → partial
  result.outcome = "partial";
  result.twelfths = (CAT2_FULL * c) / C;
  result.positiveTwelfths = result.twelfths;
  result.marks = twelfthsToMarks(result.twelfths);
  return result;
}

/* ================================================================== *
 * Full-Paper Scoring
 * ================================================================== */

/**
 * Score a complete paper (all 100 questions).
 *
 * @param {object} paper  Paper object from _data/papers/*.json
 * @param {object} answers  Map of qNumber → Set<string> (or array) of selected letters
 * @returns {object} {
 *   totalTwelfths, totalMarks (string),
 *   totalPositiveTwelfths, totalNegativeTwelfths,
 *   perQuestion: [{ questionNumber, outcome, twelfths, marks, ... }],
 *   bySubject: { MATH: {...}, PHYS: {...}, CHEM: {...}, FEEE: {...} },
 *   byOutcome: { correct, partial, incorrect, unattempted, voided_awarded }
 * }
 */
export function scorePaper(paper, answers) {
  const questions = paper.questions || [];
  const perQuestion = [];
  const bySubject = {};
  const byOutcome = { correct: 0, partial: 0, incorrect: 0, unattempted: 0, voided_awarded: 0 };

  let totalTwelfths = 0;
  let totalPositive = 0;
  let totalNegative = 0;

  for (const q of questions) {
    const sel = answers[q.qNumber];
    const r = scoreQuestion(q, sel instanceof Set ? sel : new Set(sel || []));
    perQuestion.push(r);
    totalTwelfths += r.twelfths;
    totalPositive += r.positiveTwelfths || 0;
    totalNegative += r.negativeTwelfths || 0;
    byOutcome[r.outcome] = (byOutcome[r.outcome] || 0) + 1;

    // per-subject breakdown
    const subj = q.subjectId || "UNKNOWN";
    if (!bySubject[subj]) {
      bySubject[subj] = {
        positiveTwelfths: 0,
        negativeTwelfths: 0,
        netTwelfths: 0,
        questions: 0,
      };
    }
    bySubject[subj].positiveTwelfths += r.positiveTwelfths || 0;
    bySubject[subj].negativeTwelfths += r.negativeTwelfths || 0;
    bySubject[subj].netTwelfths += r.twelfths;
    bySubject[subj].questions++;
  }

  return {
    totalTwelfths,
    totalMarks: twelfthsToMarks(totalTwelfths),
    totalPositiveTwelfths: totalPositive,
    totalNegativeTwelfths: totalNegative,
    perQuestion,
    bySubject,
    byOutcome,
  };
}

/* ================================================================== *
 * 9-Step WBJEEB Tie-Breaker Vector
 * ================================================================== */

/**
 * Compute the 9-step tie-breaker vector for a scored paper.
 *
 * Each step is an integer in twelfths. The vector is used to rank
 * candidates who share the same total marks — lower index = higher priority.
 *
 * Steps:
 *   1  totalNegativeTwelfths        (ascending — less negative is better)
 *   2  mathPositiveTwelfths         (descending — more positive is better)
 *   3  mathNegativeTwelfths         (ascending)
 *   4  physPositiveTwelfths         (descending)
 *   5  physNegativeTwelfths         (ascending)
 *   6  chemPositiveTwelfths         (descending)
 *   7  chemNegativeTwelfths         (ascending)
 *   8  feeePositiveTwelfths         (descending)
 *   9  feeeNegativeTwelfths         (ascending)
 *
 * @param {object} scored  Result of scorePaper()
 * @returns {object} {
 *   vector: [9 integers],
 *   steps: [{ step, label, value, direction }]
 * }
 */
export function tieBreakerVector(scored) {
  const bs = scored.bySubject || {};
  const get = (subj, field) => (bs[subj] ? bs[subj][field] : 0);

  const vector = [
    scored.totalNegativeTwelfths || 0,
    get("MATH", "positiveTwelfths"),
    get("MATH", "negativeTwelfths"),
    get("PHYS", "positiveTwelfths"),
    get("PHYS", "negativeTwelfths"),
    get("CHEM", "positiveTwelfths"),
    get("CHEM", "negativeTwelfths"),
    get("FEEE", "positiveTwelfths"),
    get("FEEE", "negativeTwelfths"),
  ];

  const labels = [
    "Less total negative marks",
    "More Mathematics positive",
    "Less Mathematics negative",
    "More Physics positive",
    "Less Physics negative",
    "More Chemistry positive",
    "Less Chemistry negative",
    "More FEEE positive",
    "Less FEEE negative",
  ];

  // Steps 1,3,5,7,9: ascending (lower is better)
  // Steps 2,4,6,8: descending (higher is better)
  const directions = ["asc", "desc", "asc", "desc", "asc", "desc", "asc", "desc", "asc"];

  const steps = vector.map((v, i) => ({
    step: i + 1,
    label: labels[i],
    value: v,
    direction: directions[i],
  }));

  return { vector, steps };
}

/**
 * Compare two tie-breaker vectors step by step.
 * Returns < 0 if a is better, > 0 if b is better, 0 if identical.
 * "Better" depends on the direction of each step.
 */
export function compareTieBreaker(vectorA, vectorB) {
  for (let i = 0; i < vectorA.length; i++) {
    const a = vectorA[i];
    const b = vectorB[i];
    // steps 0,2,4,6,8 (1-indexed 1,3,5,7,9) are ascending — lower is better
    // steps 1,3,5,7 (1-indexed 2,4,6,8) are descending — higher is better
    const ascending = i % 2 === 0;
    if (ascending) {
      if (a !== b) return a - b;
    } else {
      if (a !== b) return b - a;
    }
  }
  return 0;
}

/* ================================================================== *
 * Timer helpers (for the live exam runner)
 * ================================================================== */

/** Convert seconds to "HH:MM:SS" string. */
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** JELET Paper-I exam duration: 2 hours = 120 minutes. */
export const EXAM_DURATION_SECONDS = 120 * 60;

/**
 * Compute remaining seconds from a deadline timestamp.
 * Returns 0 if the deadline has passed.
 */
export function remainingSeconds(deadlineEpochMs, nowEpochMs) {
  const diff = Math.floor((deadlineEpochMs - nowEpochMs) / 1000);
  return Math.max(0, diff);
}

/* ================================================================== *
 * Export for Node test runner
 * ================================================================== */

export default {
  TWELFTH,
  FULL_MARK_TWELFTHS,
  CAT1_FULL,
  CAT1_NEGATIVE,
  CAT2_FULL,
  PAPER_MAX_TWELFTHS,
  SUBJECT_ORDER,
  twelfthsToMarks,
  toLetterArray,
  scoreQuestion,
  scorePaper,
  tieBreakerVector,
  compareTieBreaker,
  formatDuration,
  EXAM_DURATION_SECONDS,
  remainingSeconds,
};
