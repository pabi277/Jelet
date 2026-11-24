/**
 * scoring.js — JELET Study Hub (v3) · Exact 1/12-Mark Rational Scoring Engine
 * ---------------------------------------------------------------------------
 * Implements docs/01-PRODUCT-AND-EXAM-SPEC.md §3 & §4 with ZERO floating-point
 * addition loops. Every score is an exact integer multiple of 1/12 mark
 * (`1 Full Mark = 12 twelfths`, `120 Marks = 1440 twelfths`):
 *   - Category I  : +12 correct, -3 wrong / multi-bubble, 0 unattempted
 *   - Category II : +24 * c / C when w === 0 and c > 0 (exact integers 6,8,12,16,18,24),
 *                   0 when w > 0 or unattempted (0 negative penalty)
 *   - Voided "W"  : +12 (Cat-I) or +24 (Cat-II) awarded to ALL candidates
 *   - Tie-Breaker : Official WBJEEB 9-step integer vector (§2.7 Information Bulletin)
 */

export const TWELFTHS_PER_MARK = 12;
export const MAX_PAPER_MARKS = 120;
export const MAX_PAPER_TWELFTHS = MAX_PAPER_MARKS * TWELFTHS_PER_MARK; // 1440
export const VALID_OPTIONS = ["A", "B", "C", "D"];

export const SUBJECT_META = {
  MATH: { id: "MATH", name: "Mathematics", shortName: "Maths", unitCount: 11, qCount: 40, maxMarks: 50, maxTwelfths: 600 },
  PHYS: { id: "PHYS", name: "Physics", shortName: "Physics", unitCount: 15, qCount: 30, maxMarks: 35, maxTwelfths: 420 },
  CHEM: { id: "CHEM", name: "Chemistry", shortName: "Chem", unitCount: 8, qCount: 20, maxMarks: 25, maxTwelfths: 300 },
  FEEE: {
    id: "FEEE",
    name: "Fundamentals of Electrical & Electronics Engg.",
    shortName: "FEEE",
    unitCount: 8,
    qCount: 10,
    maxMarks: 10,
    maxTwelfths: 120,
  },
};

/** Historical Jadavpur University (JU) Closing GMR & Safe Target Score Bands (docs/01 §4.2). */
export const JU_BENCHMARKS = [
  {
    branch: "Computer Science & Engg. (CSE)",
    campus: "Jadavpur Main",
    seats: 9,
    openGmr: "GMR 2 – 10 (spot ~28)",
    scGmr: "GMR 25 – 69",
    safeMinMarks: 92,
    safeRangeText: "92 – 102+ / 120",
  },
  {
    branch: "Information Technology (IT)",
    campus: "Salt Lake",
    seats: 9,
    openGmr: "GMR 10 – 29 (spot ~52)",
    scGmr: "GMR 53 – 138",
    safeMinMarks: 85,
    safeRangeText: "85 – 94+ / 120",
  },
  {
    branch: "Electronics & Telecomm. (ETCE)",
    campus: "Jadavpur Main",
    seats: 8,
    openGmr: "GMR 7 – 25 (spot ~75)",
    scGmr: "GMR 74 – 271",
    safeMinMarks: 84,
    safeRangeText: "84 – 92+ / 120",
  },
  {
    branch: "Instrumentation & Electronics (IEE)",
    campus: "Salt Lake",
    seats: 5,
    openGmr: "GMR 12 – 31",
    scGmr: "GMR 74 – 118",
    safeMinMarks: 82,
    safeRangeText: "82 – 90+ / 120",
  },
  {
    branch: "Electrical Engineering (EE)",
    campus: "Jadavpur Main",
    seats: 16,
    openGmr: "GMR 3 – 38",
    scGmr: "GMR 64 – 204",
    safeMinMarks: 80,
    safeRangeText: "80 – 90+ / 120",
  },
  {
    branch: "Mechanical / Civil / Chemical",
    campus: "Jadavpur Main",
    seats: 46,
    openGmr: "GMR 19 – 144",
    scGmr: "GMR 138 – 431",
    safeMinMarks: 70,
    safeRangeText: "70 – 82+ / 120",
  },
];

/** Normalize an array/Set of option letters to sorted unique subset of A..D. */
export function normalizeSelection(selected) {
  if (!selected) return [];
  const raw = Array.isArray(selected) ? selected : [...selected];
  const set = new Set();
  for (const item of raw) {
    const up = String(item).trim().toUpperCase();
    if (VALID_OPTIONS.includes(up)) set.add(up);
  }
  return VALID_OPTIONS.filter((opt) => set.has(opt));
}

/** True when WBJEEB withdrew/voided ("W") the item. */
export function isVoidedQuestion(question) {
  if (!question || !question.key) return false;
  return (
    question.key.status === "voided" ||
    (Array.isArray(question.key.correct) && question.key.correct.includes("W"))
  );
}

/**
 * Score a single JELET question in exact integer twelfths (`1 mark = 12 twelfths`).
 * @param {object} question
 * @param {string[]|Set<string>|null|undefined} selectedOptions
 */
export function scoreQuestion(question, selectedOptions) {
  const selected = normalizeSelection(selectedOptions);
  const category = question.category === 2 ? 2 : 1;
  const fullTwelfths = Number.isInteger(question.fullTwelfths)
    ? question.fullTwelfths
    : category === 2
    ? 24
    : 12;
  const negPenalty = Number.isInteger(question.negativeTwelfths)
    ? question.negativeTwelfths
    : category === 2
    ? 0
    : 3;

  // 1. Board-voided ("W"): full marks awarded to every candidate unconditionally
  if (isVoidedQuestion(question)) {
    return {
      questionId: question.id,
      qNumber: question.qNumber,
      subjectId: question.subjectId,
      unitId: question.unitId,
      category,
      selected,
      correctOptions: ["W"],
      outcome: "voided_awarded",
      twelfths: fullTwelfths,
      positiveTwelfths: fullTwelfths,
      negativeTwelfths: 0,
      maxTwelfths: fullTwelfths,
    };
  }

  const correct = normalizeSelection(question.key?.correct || []);

  // 2. Category I: single correct (+12 / -3 / 0)
  if (category === 1) {
    if (selected.length === 0) {
      return {
        questionId: question.id,
        qNumber: question.qNumber,
        subjectId: question.subjectId,
        unitId: question.unitId,
        category,
        selected,
        correctOptions: correct,
        outcome: "unattempted",
        twelfths: 0,
        positiveTwelfths: 0,
        negativeTwelfths: 0,
        maxTwelfths: fullTwelfths,
      };
    }
    if (selected.length === 1 && selected[0] === correct[0]) {
      return {
        questionId: question.id,
        qNumber: question.qNumber,
        subjectId: question.subjectId,
        unitId: question.unitId,
        category,
        selected,
        correctOptions: correct,
        outcome: "correct",
        twelfths: fullTwelfths,
        positiveTwelfths: fullTwelfths,
        negativeTwelfths: 0,
        maxTwelfths: fullTwelfths,
      };
    }
    // Wrong option OR multiple bubbles darkened on OMR
    return {
      questionId: question.id,
      qNumber: question.qNumber,
      subjectId: question.subjectId,
      unitId: question.unitId,
      category,
      selected,
      correctOptions: correct,
      outcome: "incorrect",
      twelfths: -negPenalty,
      positiveTwelfths: 0,
      negativeTwelfths: negPenalty,
      maxTwelfths: fullTwelfths,
    };
  }

  // 3. Category II: multi-correct (+24 * c / C when w === 0, 0 negative)
  const C = correct.length;
  if (selected.length === 0 || C === 0) {
    return {
      questionId: question.id,
      qNumber: question.qNumber,
      subjectId: question.subjectId,
      unitId: question.unitId,
      category,
      selected,
      correctOptions: correct,
      outcome: "unattempted",
      twelfths: 0,
      positiveTwelfths: 0,
      negativeTwelfths: 0,
      maxTwelfths: fullTwelfths,
    };
  }

  const correctSet = new Set(correct);
  let c = 0;
  let w = 0;
  for (const opt of selected) {
    if (correctSet.has(opt)) c += 1;
    else w += 1;
  }

  if (w > 0) {
    return {
      questionId: question.id,
      qNumber: question.qNumber,
      subjectId: question.subjectId,
      unitId: question.unitId,
      category,
      selected,
      correctOptions: correct,
      outcome: "incorrect",
      twelfths: 0,
      positiveTwelfths: 0,
      negativeTwelfths: 0,
      maxTwelfths: fullTwelfths,
    };
  }

  if (c === C) {
    return {
      questionId: question.id,
      qNumber: question.qNumber,
      subjectId: question.subjectId,
      unitId: question.unitId,
      category,
      selected,
      correctOptions: correct,
      outcome: "correct",
      twelfths: fullTwelfths,
      positiveTwelfths: fullTwelfths,
      negativeTwelfths: 0,
      maxTwelfths: fullTwelfths,
    };
  }

  // Exact integer division: since C in {1,2,3,4} and fullTwelfths = 24, (24 * c) % C === 0 always!
  const partialTwelfths = Math.trunc((fullTwelfths * c) / C);
  return {
    questionId: question.id,
    qNumber: question.qNumber,
    subjectId: question.subjectId,
    unitId: question.unitId,
    category,
    selected,
    correctOptions: correct,
    outcome: "partial",
    twelfths: partialTwelfths,
    positiveTwelfths: partialTwelfths,
    negativeTwelfths: 0,
    maxTwelfths: fullTwelfths,
  };
}

/**
 * Score a full paper or practice drill using integer twelfths only.
 * @param {object[]} questions
 * @param {Record<string, string[]>} responses  map of questionId -> selected option letters
 */
export function scoreAttempt(questions, responses = {}) {
  let totalTwelfths = 0;
  let maxTwelfths = 0;
  let positiveTwelfths = 0;
  let negativeTwelfths = 0;
  let cat1NetTwelfths = 0;
  let cat1MaxTwelfths = 0;
  let cat2Twelfths = 0;
  let cat2MaxTwelfths = 0;
  let voidedTwelfths = 0;

  const counts = {
    total: questions.length,
    correct: 0,
    partial: 0,
    incorrect: 0,
    unattempted: 0,
    voided_awarded: 0,
  };

  const bySubject = {};
  for (const subj of ["MATH", "PHYS", "CHEM", "FEEE"]) {
    bySubject[subj] = {
      subjectId: subj,
      totalTwelfths: 0,
      maxTwelfths: 0,
      positiveTwelfths: 0,
      negativeTwelfths: 0,
      questionCount: 0,
      correct: 0,
      partial: 0,
      incorrect: 0,
      unattempted: 0,
      voided_awarded: 0,
    };
  }

  const items = [];

  for (const q of questions) {
    const sel = responses[q.id] || [];
    const res = scoreQuestion(q, sel);
    items.push(res);

    totalTwelfths += res.twelfths;
    maxTwelfths += res.maxTwelfths;
    positiveTwelfths += res.positiveTwelfths;
    negativeTwelfths += res.negativeTwelfths;
    counts[res.outcome] += 1;

    if (res.outcome === "voided_awarded") {
      voidedTwelfths += res.twelfths;
    }
    if (res.category === 2) {
      cat2Twelfths += res.twelfths;
      cat2MaxTwelfths += res.maxTwelfths;
    } else {
      cat1NetTwelfths += res.twelfths;
      cat1MaxTwelfths += res.maxTwelfths;
    }

    const bucket = bySubject[res.subjectId];
    if (bucket) {
      bucket.totalTwelfths += res.twelfths;
      bucket.maxTwelfths += res.maxTwelfths;
      bucket.positiveTwelfths += res.positiveTwelfths;
      bucket.negativeTwelfths += res.negativeTwelfths;
      bucket.questionCount += 1;
      bucket[res.outcome] += 1;
    }
  }

  // Official WBJEEB 9-step Tie-Breaking Vector (docs/01 §3.2)
  const tieBreakVector = {
    totalNegativeTwelfths: negativeTwelfths,
    mathPositiveTwelfths: bySubject.MATH.positiveTwelfths,
    mathNegativeTwelfths: bySubject.MATH.negativeTwelfths,
    physPositiveTwelfths: bySubject.PHYS.positiveTwelfths,
    physNegativeTwelfths: bySubject.PHYS.negativeTwelfths,
    chemPositiveTwelfths: bySubject.CHEM.positiveTwelfths,
    chemNegativeTwelfths: bySubject.CHEM.negativeTwelfths,
    feeePositiveTwelfths: bySubject.FEEE.positiveTwelfths,
    feeeNegativeTwelfths: bySubject.FEEE.negativeTwelfths,
  };

  return {
    totalTwelfths,
    maxTwelfths,
    positiveTwelfths,
    negativeTwelfths,
    cat1NetTwelfths,
    cat1MaxTwelfths,
    cat2Twelfths,
    cat2MaxTwelfths,
    voidedTwelfths,
    counts,
    bySubject,
    tieBreakVector,
    items,
  };
}

/**
 * Compare two attempts under WBJEEB's total score + 9-step tie-breaking rule.
 * Returns < 0 if `a` ranks higher (better) than `b`, > 0 if `b` ranks higher, 0 if still tied.
 */
export function compareAttemptsByWbjeebRules(a, b) {
  if (a.totalTwelfths !== b.totalTwelfths) {
    return b.totalTwelfths - a.totalTwelfths; // higher total wins
  }
  const va = a.tieBreakVector;
  const vb = b.tieBreakVector;
  const steps = [
    ["totalNegativeTwelfths", "asc"],
    ["mathPositiveTwelfths", "desc"],
    ["mathNegativeTwelfths", "asc"],
    ["physPositiveTwelfths", "desc"],
    ["physNegativeTwelfths", "asc"],
    ["chemPositiveTwelfths", "desc"],
    ["chemNegativeTwelfths", "asc"],
    ["feeePositiveTwelfths", "desc"],
    ["feeeNegativeTwelfths", "asc"],
  ];
  for (const [field, dir] of steps) {
    if (va[field] !== vb[field]) {
      return dir === "asc" ? va[field] - vb[field] : vb[field] - va[field];
    }
  }
  return 0;
}

/** Greatest common divisor for exact rational display when needed. */
function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}

/**
 * Format integer twelfths (`1 mark = 12 twelfths`) into human-readable marks
 * using integer math (no float addition drift).
 */
export function formatTwelfths(twelfths, { signed = false, alwaysTwoDecimals = false } = {}) {
  const n = Math.trunc(Number(twelfths) || 0);
  const sign = n < 0 ? "-" : signed && n > 0 ? "+" : "";
  const abs = Math.abs(n);
  const whole = Math.trunc(abs / 12);
  const rem = abs % 12;

  if (rem === 0) {
    return alwaysTwoDecimals ? `${sign}${whole}.00` : `${sign}${whole}`;
  }
  // Exact terminating hundredths for multiples of 3 twelfths (1/4, 1/2, 3/4)
  if (rem % 3 === 0) {
    const quarters = { 3: "25", 6: "50", 9: "75" }[rem];
    const trimmed = !alwaysTwoDecimals && quarters === "50" ? "5" : quarters;
    return `${sign}${whole}.${trimmed}`;
  }
  // Thirds (4/12 = 1/3 -> .33, 8/12 = 2/3 -> .67) rounded cleanly from integer thousandths
  const hundredths = Math.round((rem * 100) / 12);
  return `${sign}${whole}.${String(hundredths).padStart(2, "0")}`;
}

/** Exact rational string for non-terminating thirds (e.g. `8 twelfths` -> `+2/3`). */
export function formatExactFraction(twelfths, { signed = true } = {}) {
  const n = Math.trunc(Number(twelfths) || 0);
  if (n === 0) return "0";
  const sign = n < 0 ? "-" : signed ? "+" : "";
  const abs = Math.abs(n);
  const g = gcd(abs, 12);
  const num = abs / g;
  const den = 12 / g;
  return den === 1 ? `${sign}${num}` : `${sign}${num}/${den}`;
}

/**
 * Evaluate historical JU lateral-entry cutoff band for a 120-mark full-paper score.
 * Never fabricates a simulated rank — strictly compares against docs/01 §4.2.
 */
export function evaluateJuCutoffBand(totalTwelfths, maxTwelfths = MAX_PAPER_TWELFTHS) {
  if (maxTwelfths !== MAX_PAPER_TWELFTHS) {
    return null; // Only full 120-mark mocks map to JU 120-mark cutoff bands
  }
  if (totalTwelfths >= 92 * 12) {
    return {
      band: "JU CSE / IT Safe Zone",
      tone: "correct",
      detail: "Historical Open GMR ~2–15 range (JU CSE safe target: 92–102+ / 120).",
    };
  }
  if (totalTwelfths >= 84 * 12) {
    return {
      band: "JU IT / ETCE / IEE Zone",
      tone: "correct",
      detail: "Historical Open GMR ~10–31 range (JU IT/ETCE safe target: 84–94+ / 120).",
    };
  }
  if (totalTwelfths >= 80 * 12) {
    return {
      band: "JU Electrical (EE) Zone",
      tone: "brand",
      detail: "Historical Open GMR ~15–38 range (JU EE safe target: 80–90+ / 120).",
    };
  }
  if (totalTwelfths >= 70 * 12) {
    return {
      band: "JU Core Branches (ME / CE / ChE) Zone",
      tone: "partial",
      detail: "Historical Open GMR ~25–144 range (JU Core safe target: 70–82+ / 120).",
    };
  }
  return {
    band: "Building Toward JU Cutoff (70+ / 120)",
    tone: "review",
    detail: "Historical JU Core Open cutoffs start around ~70/120 (CSE: 92+/120).",
  };
}

/**
 * WBSCTE Diploma CGPA -> WBJEEB Percentage & JU Eligibility Check (docs/01 §4.1).
 * Default WBJEEB conversion on 10-point scale: (CGPA - 0.75) * 10.
 */
export function evaluateDiplomaEligibility(cgpa, category = "General") {
  const num = Number(cgpa);
  if (!Number.isFinite(num) || num <= 0 || num > 10) {
    return { valid: false, percentage: null, cutoff: 60, eligible: null };
  }
  const rawPct = Math.max(0, Math.min(100, (num - 0.75) * 10));
  const percentage = Math.round(rawPct * 10) / 10;

  let cutoff = 60;
  if (category === "OBC-A" || category === "OBC-B") cutoff = 54;
  else if (category === "SC" || category === "ST" || category === "PwD") cutoff = 45;

  return {
    valid: true,
    cgpa: num,
    percentage,
    cutoff,
    category,
    eligible: percentage >= cutoff,
  };
}
