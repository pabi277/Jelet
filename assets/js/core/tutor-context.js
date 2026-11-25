/**
 * tutor-context.js — JELET Study Hub (v3) · AI Tutor Context Normalizer
 * ---------------------------------------------------------------------------
 * One pure, Node-testable module that turns the heterogeneous contexts handed to
 * `openAiTutor(...)` by every call site into a single canonical shape, so the
 * tutor always sees the student's actual selection.
 *
 * Callers historically used two naming styles (`studentSelected` /
 * `studentOutcome` / `studentScoreText` vs the tutor's internal `selected` /
 * `scoreResult`). Instead of touching the six call sites, we normalize at the
 * single entry point (`openTutor`) and accept BOTH styles forever (defensive).
 *
 * Canonical output fields:
 *   - `selected`          string[] (sorted, unique subset of A..D)
 *   - `scoreResult`       { outcome, twelfths?, … } | null
 *   - `studentScoreText`  string (verbatim when provided, else derived)
 *   - passthrough:        origin, section, mode, question, solution, unit,
 *                         formula, paperTitle, manifest
 */

import { formatTwelfths, scoreQuestion } from "./scoring.js";

/** Fields carried through from the raw context into the canonical context. */
const PASSTHROUGH_FIELDS = [
  "origin",
  "section",
  "mode",
  "question",
  "solution",
  "unit",
  "formula",
  "paperTitle",
  "manifest",
];

function toSelectionArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

/**
 * Normalize a raw tutor context into the canonical shape.
 * Never mutates `ctx`; returns a new object.
 */
export function normalizeTutorContext(ctx = {}) {
  const c = ctx && typeof ctx === "object" ? ctx : {};

  // 1. selected — accept both naming styles.
  const selected = Array.isArray(c.selected)
    ? c.selected.slice()
    : Array.isArray(c.studentSelected)
    ? c.studentSelected.slice()
    : [];

  // 2. scoreResult — prefer an explicit one; otherwise derive it.
  let scoreResult;
  if (c.scoreResult && typeof c.scoreResult === "object") {
    scoreResult = { ...c.scoreResult };
  } else if (c.question && selected.length) {
    const computed = scoreQuestion(c.question, selected);
    scoreResult = { ...computed };
    // The recorded attempt is the truth for the outcome; keep the exact
    // computed twelfths (they are the authoritative score).
    if (c.studentOutcome) scoreResult.outcome = c.studentOutcome;
  } else if (c.studentOutcome !== undefined && c.studentOutcome !== null) {
    scoreResult = { outcome: c.studentOutcome };
  } else {
    scoreResult = null;
  }

  // 3. studentScoreText — verbatim when provided, else derived from twelfths.
  let studentScoreText = "";
  if (typeof c.studentScoreText === "string" && c.studentScoreText.trim() !== "") {
    studentScoreText = c.studentScoreText;
  } else if (
    scoreResult &&
    typeof scoreResult.twelfths === "number" &&
    Number.isFinite(scoreResult.twelfths)
  ) {
    studentScoreText = formatTwelfths(scoreResult.twelfths, { signed: true });
  }

  const out = { selected, scoreResult, studentScoreText };
  for (const key of PASSTHROUGH_FIELDS) {
    if (c[key] !== undefined) out[key] = c[key];
  }
  return out;
}

/**
 * Stable history key for a tutor context. First match wins:
 *   `q:<questionId>` → `f:<unitId>:<formulaId>` → `u:<unitId>` → `g:<origin|"general">`
 */
export function tutorContextKey(ctx = {}) {
  const c = ctx && typeof ctx === "object" ? ctx : {};
  const question = c.question || null;
  const questionId = question?.id || c.questionId || "";
  if (questionId) return `q:${questionId}`;

  const unit = c.unit || null;
  const formula = c.formula || null;
  const unitId = unit?.unitId || c.unitId || "";
  const formulaId = formula?.formulaId || c.formulaId || "";
  if (unitId && formulaId) return `f:${unitId}:${formulaId}`;
  if (unitId) return `u:${unitId}`;

  return `g:${c.origin || "general"}`;
}
