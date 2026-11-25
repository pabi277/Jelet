/**
 * tutor-context.test.mjs — Phase 11 gate: AI Tutor context normalizer & history
 * ---------------------------------------------------------------------------
 * Covers:
 *   1. `normalizeTutorContext` — canonical `selected` / `scoreResult` /
 *      `studentScoreText`, both caller naming styles, caller-outcome-wins,
 *      derived score text, and no-selection → null scoreResult.
 *   2. `tutorContextKey` — stable history key priority (q > f > u > g).
 *   3. `ai-history` pure record hygiene — session title/context, MAX_SESSIONS
 *      LRU eviction, MAX_MESSAGES_PER_SESSION trimming, delete/clear/list.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { normalizeTutorContext, tutorContextKey } from "../assets/js/core/tutor-context.js";
import {
  AI_HISTORY_META_KEY,
  MAX_SESSIONS,
  MAX_MESSAGES_PER_SESSION,
  emptyHistory,
  sessionTitle,
  sessionContext,
  upsertSession,
  deleteSession,
  clearHistory,
  listSessions,
} from "../assets/js/db/ai-history.js";
import { scoreQuestion, formatTwelfths } from "../assets/js/core/scoring.js";

function loadQuestion(yearFile, index = 0) {
  const paper = JSON.parse(fs.readFileSync(`./_data/papers/${yearFile}.json`, "utf8"));
  return paper.questions[index];
}

const Q1 = loadQuestion(2025, 0); // 2025 Q1, official key "D"

/* ================================================================== *
 * 1. normalizeTutorContext
 * ================================================================== */

test("normalizeTutorContext: studentSelected maps to canonical selected", () => {
  const out = normalizeTutorContext({ studentSelected: ["B"] });
  assert.deepEqual(out.selected, ["B"]);
  // No question + no outcome → no scoreResult.
  assert.equal(out.scoreResult, null);
});

test("normalizeTutorContext: scoreQuestion computed when only a selection is given", () => {
  const out = normalizeTutorContext({ question: Q1, studentSelected: ["B"] });
  const expected = scoreQuestion(Q1, ["B"]);
  assert.deepEqual(out.selected, ["B"]);
  assert.equal(out.scoreResult.outcome, expected.outcome);
  assert.equal(out.scoreResult.twelfths, expected.twelfths);
  // Derived score text from the computed twelfths.
  assert.equal(out.studentScoreText, formatTwelfths(expected.twelfths, { signed: true }));
});

test("normalizeTutorContext: caller studentOutcome wins over the computed outcome", () => {
  // Select the correct option (computed outcome "correct") but the recorded
  // attempt says "partial" — the recorded attempt is the truth.
  const out = normalizeTutorContext({
    question: Q1,
    studentSelected: ["D"],
    studentOutcome: "partial",
  });
  assert.equal(out.scoreResult.outcome, "partial");
  // twelfths still come from the exact scoreQuestion computation.
  assert.equal(out.scoreResult.twelfths, scoreQuestion(Q1, ["D"]).twelfths);
});

test("normalizeTutorContext: studentScoreText is preserved verbatim", () => {
  const out = normalizeTutorContext({
    question: Q1,
    studentSelected: ["B"],
    studentScoreText: "-0.25",
  });
  assert.equal(out.studentScoreText, "-0.25");
});

test("normalizeTutorContext: no selection and no outcome → scoreResult null", () => {
  const out = normalizeTutorContext({ question: Q1 });
  assert.deepEqual(out.selected, []);
  assert.equal(out.scoreResult, null);
  assert.equal(out.studentScoreText, "");
});

test("normalizeTutorContext: passthrough origin/section/mode/paperTitle", () => {
  const out = normalizeTutorContext({
    mode: "lesson",
    unit: { unitId: "M01" },
    formula: { formulaId: "F1", label: "Det" },
    origin: "Unit Lesson",
    section: "Matrices",
    paperTitle: "JELET 2025",
  });
  assert.equal(out.origin, "Unit Lesson");
  assert.equal(out.section, "Matrices");
  assert.equal(out.mode, "lesson");
  assert.equal(out.paperTitle, "JELET 2025");
});

/* ================================================================== *
 * 2. tutorContextKey priority
 * ================================================================== */

test("tutorContextKey: question wins over formula/unit/origin", () => {
  const key = tutorContextKey({
    question: { id: "Q42" },
    unit: { unitId: "M01" },
    formula: { formulaId: "F1" },
    origin: "Unit Lesson",
  });
  assert.equal(key, "q:Q42");
});

test("tutorContextKey: formula beats unit and origin", () => {
  const key = tutorContextKey({
    unit: { unitId: "M01" },
    formula: { formulaId: "F1" },
    origin: "Unit Lesson",
  });
  assert.equal(key, "f:M01:F1");
});

test("tutorContextKey: unit beats origin", () => {
  const key = tutorContextKey({ unit: { unitId: "M01" }, origin: "Unit Lesson" });
  assert.equal(key, "u:M01");
});

test("tutorContextKey: falls back to origin, then general", () => {
  assert.equal(tutorContextKey({ origin: "Today Dashboard" }), "g:Today Dashboard");
  assert.equal(tutorContextKey({}), "g:general");
});

/* ================================================================== *
 * 3. ai-history pure record hygiene
 * ================================================================== */

test("ai-history: session title derives from question / formula / unit / general", () => {
  assert.match(sessionTitle({ question: Q1 }), /^JELET · Q1 · Unit M03$/);
  assert.equal(
    sessionTitle({ unit: { unitId: "M01" }, formula: { label: "Determinant" } }),
    "Unit M01 · Determinant"
  );
  assert.equal(sessionTitle({ unit: { unitId: "M01", title: "Matrices" } }), "Unit M01 · Matrices");
  assert.equal(sessionTitle({ origin: "Today Dashboard" }), "General · Today Dashboard");
});

test("ai-history: sessionContext stores ids only (no full objects)", () => {
  const ctx = sessionContext({
    question: { id: "Q42", unitId: "M01" },
    unit: { unitId: "M01" },
    origin: "Unit Lesson",
    selected: ["B"],
    scoreResult: { outcome: "incorrect", twelfths: -3 },
  });
  assert.equal(ctx.questionId, "Q42");
  assert.equal(ctx.unitId, "M01");
  assert.equal(ctx.origin, "Unit Lesson");
  assert.deepEqual(ctx.selected, ["B"]);
  assert.equal(ctx.studentOutcome, "incorrect");
  assert.equal(ctx.question, undefined); // full object never stored
});

test("ai-history: upsertSession trims messages to the newest MAX_MESSAGES_PER_SESSION", () => {
  const msgs = Array.from({ length: MAX_MESSAGES_PER_SESSION + 5 }, (_, i) => ({
    role: "user",
    text: `m${i}`,
  }));
  let rec = upsertSession(emptyHistory(), { key: "q:Q1", title: "T", messages: msgs });
  assert.equal(rec.sessions["q:Q1"].messages.length, MAX_MESSAGES_PER_SESSION);
  // Newest MAX_MESSAGES_PER_SESSION messages kept (m5..m34 for 35 inputs).
  assert.equal(rec.sessions["q:Q1"].messages.at(-1).text, "m34");
  assert.equal(rec.sessions["q:Q1"].messages[0].text, "m5");
});

test("ai-history: upsertSession enforces MAX_SESSIONS with LRU eviction", () => {
  let rec = emptyHistory();
  for (let i = 0; i < MAX_SESSIONS + 3; i++) {
    rec = upsertSession(rec, { key: `q:Q${i}`, title: `T${i}`, messages: [{ role: "user", text: `m${i}` }] });
  }
  assert.equal(listSessions(rec).length, MAX_SESSIONS);
  // Most-recently-updated keys survive; the oldest are evicted.
  assert.ok(rec.sessions["q:Q" + (MAX_SESSIONS + 2)]);
  assert.equal(rec.sessions["q:Q0"], undefined);
});

test("ai-history: deleteSession and clearHistory prune correctly", () => {
  let rec = upsertSession(emptyHistory(), { key: "q:Q1", title: "T1", messages: [] });
  rec = upsertSession(rec, { key: "q:Q2", title: "T2", messages: [] });
  rec = deleteSession(rec, "q:Q1");
  assert.deepEqual(listSessions(rec).map((s) => s.key), ["q:Q2"]);
  rec = clearHistory();
  assert.deepEqual(listSessions(rec), []);
  assert.equal(rec.key, AI_HISTORY_META_KEY);
});

test("ai-history: listSessions returns newest-first ordering", () => {
  let rec = upsertSession(emptyHistory(), { key: "q:Q1", title: "T1", messages: [] });
  rec = upsertSession(rec, { key: "q:Q2", title: "T2", messages: [] });
  assert.deepEqual(listSessions(rec).map((s) => s.key), ["q:Q2", "q:Q1"]);
});
