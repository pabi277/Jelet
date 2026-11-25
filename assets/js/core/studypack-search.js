/**
 * studypack-search.js — JELET Study Hub (v3) · Study Pack search-index text
 * ---------------------------------------------------------------------------
 * Pure builder shared by `views/learn.js` (unit `searchBlob`) and the phase-13
 * test suite, so the shipped search index and its tests can never drift apart.
 *
 * Owner spec (phase-13 fix 1): the Learn explorer search must surface
 * concept-primer headings + prose, key-formula labels, memory hooks, common
 * mistakes and exam-checklist terms. LaTeX is stripped via the existing
 * `stripLatexForSearch()`. The four Study Pack block labels are included too —
 * the Study Pack tab renders them as headings, so "memory hook" /
 * "common mistake" / "checklist" searches land on the section itself.
 * Excluded by spec: keyDefinitions, comparisons, mcqSelfTest and
 * furtherReading (the latter also stays out of AI-tutor grounding).
 *
 * `studyPack` ships inline in `_data/units/<id>.json` (Amendment B,
 * accept-in-place), so the explorer's existing `loadAllUnits()` fetch already
 * carries it — the search index is complete with zero extra requests.
 */

import { stripLatexForSearch } from "./math.js";

const SECTION_LABELS = {
  primer: "Concept Primer",
  hooks: "Memory Hooks",
  mistakes: "Common Mistakes",
  checklist: "Exam-Day Checklist",
};

/**
 * Flat, lower-case-friendly search text for one unit's studyPack.
 * Returns "" for units without a pack (legacy shape keeps the old blob).
 */
export function buildStudyPackSearchText(sp) {
  if (!sp || typeof sp !== "object") return "";
  return [
    SECTION_LABELS.primer,
    ...(sp.conceptPrimer || []).flatMap((p) => [p.heading, stripLatexForSearch(p.proseLatex)]),
    ...(sp.keyFormulas || []).map((f) => f.label),
    SECTION_LABELS.hooks,
    ...(sp.memoryHooks || []).map((h) => stripLatexForSearch(h)),
    SECTION_LABELS.mistakes,
    ...(sp.commonMistakes || []).map((m) => stripLatexForSearch(m)),
    SECTION_LABELS.checklist,
    ...(sp.examChecklist || []).map((c) => stripLatexForSearch(c)),
  ].join(" ");
}
