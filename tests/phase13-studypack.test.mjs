/**
 * phase13-studypack.test.mjs — Phase 13 Study Pack invariants
 * ------------------------------------------------------------
 * Verifies:
 *   1. Lesson tab (`assets/js/views/learn.js`): `study` joins `validTabs` (deep link
 *      `#/learn/<unitId>?tab=study` works), the tab sits after Workbook and before
 *      Formulas, the calm empty-state copy exists, and the render order inside the
 *      tab is Intro → Concept Primer → Memory Hooks → Common Mistakes → Exam-Day
 *      Checklist → Read Further → provenance footnote.
 *   2. Per-block visual identity CSS (`assets/css/components.css`): the Study Pack
 *      block classes exist and are token-only (checked by the CI hex gate; here we
 *      assert the classes + the phone-first min-width enhancement of the hook grid).
 *   3. AI Tutor grounding (`assets/js/core/ai-vault.js`): a unit with `studyPack`
 *      injects ONLY hooks + common mistakes (capped ~400 chars) and never the
 *      furtherReading pointers; units without `studyPack` keep the legacy prompt.
 *   4. Pilot data (`_data/units/M01|C03|E05.json`): every shipped pack carries the
 *      six schema keys, unique unit-prefixed prdIds, non-empty lists, further
 *      reading with no URLs/paths, and a non-empty provenance chain; the other 39
 *      units ship NO studyPack yet (pilot isolation).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { buildGroundTruthSystemPrompt, summarizeStudyPackForTutor } from "../assets/js/core/ai-vault.js";

const ROOT = process.cwd();
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const PILOT_UNITS = ["M01", "C03", "E05"];

test("Lesson: study tab is valid, ordered after Workbook, with calm empty state", () => {
  const learnJs = read("assets/js/views/learn.js");

  assert.ok(
    learnJs.includes('const validTabs = new Set(["workbook", "study", "formulas", "pyqs", "videos"]);'),
    "validTabs gains 'study' so ?tab=study deep links work"
  );

  const workbookIdx = learnJs.indexOf('{ id: "workbook", label: "Workbook" }');
  const studyIdx = learnJs.indexOf('{ id: "study", label: "Study Pack" }');
  const formulasIdx = learnJs.indexOf("{ id: \"formulas\", label: `Formulas (${unitFormulas.length})` }");
  assert.ok(studyIdx > workbookIdx, "Study Pack tab sits after Workbook");
  assert.ok(formulasIdx > studyIdx, "Study Pack tab sits before Formulas");

  assert.ok(
    learnJs.includes(
      "Study Pack for this unit is being authored — every pack is originally written and verified before shipping. Meanwhile: Workbook · Formulas · PYQs above."
    ),
    "calm empty-state copy present for units without a pack"
  );
});

test("Lesson: study tab render order — primer, hooks, mistakes, checklist, reading, provenance", () => {
  const learnJs = read("assets/js/views/learn.js");
  const studyBranchStart = learnJs.indexOf('if (activeTab === "study") {');
  const formulasBranchStart = learnJs.indexOf('if (activeTab === "formulas") {');
  assert.ok(studyBranchStart > 0 && formulasBranchStart > studyBranchStart, "study branch exists before formulas branch");

  const branch = learnJs.slice(studyBranchStart, formulasBranchStart);
  // The checklist is built into a variable (with its own collapsed variant), so
  // assert render order inside the actual appended template — where the
  // checklist appears via its `${checklistBlock}` slot.
  const templateStart = branch.indexOf('<div class="stack-m">');
  assert.ok(templateStart > 0, "study tab appends a single wrapper template");
  const template = branch.slice(templateStart);
  const markers = [
    ["intro", 'class="study-pack-intro'],
    ["concept primer", "Concept Primer"],
    ["memory hooks", "Memory Hooks"],
    ["common mistakes", "Common Mistakes"],
    ["exam checklist", "${checklistBlock}"],
    ["further reading", "Read Further"],
    ["provenance", "study-provenance"],
  ];
  let prev = -1;
  for (const [name, needle] of markers) {
    const idx = template.indexOf(needle);
    assert.ok(idx > prev, `study tab renders ${name} in order`);
    prev = idx;
  }

  assert.ok(
    branch.includes('class="worked-example study-primer') &&
      branch.includes('class="lesson-formula-card study-hook"') &&
      branch.includes("exam-trap") &&
      branch.includes("study-checklist") &&
      branch.includes("study-reading"),
    "study blocks reuse existing lesson components (worked-example, formula card, amber trap)"
  );
  const checklistVar = branch.indexOf("const checklistBlock");
  assert.ok(
    checklistVar > 0 &&
      branch.slice(checklistVar, branch.indexOf("const readingHtml")).includes("tiebreak-details"),
    "long checklists collapse behind tiebreak-details"
  );
});

test("CSS: Study Pack block identities exist and enhance phone-first via min-width", () => {
  const css = read("assets/css/components.css");
  for (const cls of [
    ".study-pack-intro",
    ".study-primer",
    ".study-hook-grid",
    ".study-checklist",
    ".study-reading",
    ".study-provenance",
  ]) {
    assert.ok(css.includes(cls), `${cls} styled in components.css`);
  }
  const gridIdx = css.indexOf(".study-hook-grid");
  const enhanceIdx = css.indexOf("@media (min-width: 768px)", gridIdx);
  assert.ok(enhanceIdx > gridIdx, "hook grid widens only via min-width (phone-first law)");
});

test("AI Tutor: studyPack grounds hooks + mistakes only, capped, legacy prompt untouched", () => {
  const unit = {
    unitId: "M01",
    officialCode: "Math-A",
    title: "Matrices up to Order 3",
    wbjeebTraps: ["Trap one"],
    studyPack: {
      memoryHooks: ["Hook A", "Hook B", "Hook C", "Hook D"],
      commonMistakes: ["Slip A", "Slip B"],
      furtherReading: [{ book: "Secret Book", author: "X", chapters: "Ch. 1", note: "n" }],
      provenance: { draftedBy: "d", reviewedBy: "r", reviewedAt: "2026-11-25" },
    },
  };

  const prompt = buildGroundTruthSystemPrompt({ unit, languageMode: "English" });
  assert.ok(prompt.includes("- Study Pack Hooks & Slips: Memory hooks: Hook A; Hook B; Hook C | Common mistakes: Slip A; Slip B"));
  assert.ok(!prompt.includes("Secret Book"), "furtherReading never injected into tutor grounding");
  assert.ok(!prompt.includes("Hook D"), "hooks capped at first three");
  assert.ok(prompt.includes("Trap one"), "wbjeebTraps grounding preserved");

  const line = summarizeStudyPackForTutor(unit.studyPack);
  assert.ok(line.length <= 400, "grounding summary capped at ~400 chars");

  const longUnit = {
    ...unit,
    studyPack: { memoryHooks: ["x".repeat(500)] },
  };
  assert.ok(summarizeStudyPackForTutor(longUnit.studyPack).length <= 400, "oversized hooks trimmed to the cap");

  const legacyUnit = { unitId: "M02", officialCode: "Math-B", title: "Determinants", wbjeebTraps: [] };
  const legacy = buildGroundTruthSystemPrompt({ unit: legacyUnit });
  assert.ok(!legacy.includes("Study Pack Hooks & Slips"), "units without studyPack keep the legacy prompt");

  assert.equal(summarizeStudyPackForTutor(null), "");
  assert.equal(summarizeStudyPackForTutor({}), "Memory hooks:  | Common mistakes: ");
});

test("Pilot data: M01, C03, E05 carry complete, schema-clean studyPacks; the other 39 do not", () => {
  for (const unitId of PILOT_UNITS) {
    const unit = JSON.parse(read(`_data/units/${unitId}.json`));
    const sp = unit.studyPack;
    assert.ok(sp && typeof sp === "object", `${unitId} ships a studyPack`);

    const keys = Object.keys(sp).sort();
    assert.deepEqual(
      keys,
      ["commonMistakes", "conceptPrimer", "examChecklist", "furtherReading", "memoryHooks", "provenance"],
      `${unitId} studyPack has exactly the six schema keys`
    );

    assert.ok(sp.conceptPrimer.length >= 2 && sp.conceptPrimer.length <= 4, `${unitId} primer has 2-4 items`);
    const prdIds = sp.conceptPrimer.map((p) => p.prdId);
    assert.ok(
      prdIds.every((id) => new RegExp(`^${unitId}-PRD\\d{2}$`).test(id)),
      `${unitId} prdIds follow the ${unitId}-PRDnn convention`
    );
    assert.equal(new Set(prdIds).size, prdIds.length, `${unitId} prdIds unique across the unit`);

    for (const listKey of ["memoryHooks", "commonMistakes", "examChecklist"]) {
      assert.ok(Array.isArray(sp[listKey]) && sp[listKey].length >= 2, `${unitId} ${listKey} non-empty`);
    }

    assert.ok(sp.furtherReading.length >= 1, `${unitId} furtherReading non-empty`);
    const flat = JSON.stringify(sp.furtherReading).toLowerCase();
    assert.ok(!flat.includes("http"), `${unitId} furtherReading has no URLs`);
    assert.ok(!flat.includes(".pdf") && !flat.includes(".zip"), `${unitId} furtherReading has no file names`);

    assert.ok(
      sp.provenance.draftedBy && sp.provenance.reviewedBy && sp.provenance.reviewedAt,
      `${unitId} provenance chain fully recorded`
    );
  }

  const manifest = JSON.parse(read("_data/manifest.json"));
  for (const meta of manifest.units) {
    if (PILOT_UNITS.includes(meta.unitId)) continue;
    const unit = JSON.parse(read(`_data/units/${meta.unitId}.json`));
    assert.equal(unit.studyPack, undefined, `${meta.unitId} must not carry a studyPack yet (pilot isolation)`);
  }
});
