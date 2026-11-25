/**
 * phase13-studypack.test.mjs — Phase 13 Study Pack v2 invariants
 * ----------------------------------------------------------------
 * Verifies (owner-approved v2 anatomy, plan Amendment B):
 *   1. Lesson tab (`assets/js/views/learn.js`): `study` joins `validTabs`, tab order
 *      after Workbook/before Formulas, calm empty state, and the full v2 render
 *      order — Intro → Concept Primer → Key Formula Family → Key Definitions →
 *      Comparisons → MCQ Self-Test → Memory Hooks → Common Mistakes → Exam-Day
 *      Checklist → Read Further → provenance.
 *   2. MCQ self-test wiring: per-question reveal toggles the answer box, aria state,
 *      and marks ONLY the keyed options (`data-correct` subset match); never scored
 *      or stored.
 *   3. CSS block identities (token-only; hex is policed by the CI gate): v2 classes
 *      exist; hook grid widens via min-width only (phone-first law).
 *   4. AI Tutor grounding: hooks + mistakes only (≤400 chars), never furtherReading;
 *      legacy prompt untouched for units without studyPack.
 *   5. Pilot data v2 (`_data/units/M01|C03|E05.json`): 5-6 primers, 12-18 formulas
 *      (unique sfIds), 6-12 definitions, 3-4 comparison tables (columns[0] is the
 *      label column), 8-10 MCQs with honest A-D keys, 8-12 hooks/mistakes/checklist,
 *      clean provenance; the other 39 units ship NO studyPack (pilot isolation).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { buildGroundTruthSystemPrompt, summarizeStudyPackForTutor } from "../assets/js/core/ai-vault.js";

const ROOT = process.cwd();
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const PILOT_UNITS = ["M01", "C03", "E05"];

test("Lesson: study tab is valid, leads the tab sequence, with calm empty state", () => {
  const learnJs = read("assets/js/views/learn.js");

  assert.ok(
    learnJs.includes('const validTabs = new Set(["workbook", "study", "formulas", "pyqs", "videos"]);'),
    "validTabs gains 'study' so ?tab=study deep links work"
  );

  // Owner-approved tab sequence (plan Amendment B §5): Study Pack → Videos →
  // Formulas → Workbook → Verified PYQs.
  const order = [
    ['study', '{ id: "study", label: "Study Pack" }'],
    ["videos", '{ id: "videos", label: `Videos (${(unit.videoLectures || []).length})` }'],
    ["formulas", '{ id: "formulas", label: `Formulas (${unitFormulas.length})` }'],
    ["workbook", '{ id: "workbook", label: "Workbook" }'],
    ["pyqs", '{ id: "pyqs", label: `Verified PYQs (${unitPyqs.length})` }'],
  ];
  let prev = -1;
  for (const [name, needle] of order) {
    const idx = learnJs.indexOf(needle);
    assert.ok(idx > prev, `tab sequence: ${name} renders ${prev === -1 ? "first" : "after previous tab"}`);
    prev = idx;
  }

  assert.ok(
    learnJs.includes(
      "Study Pack for this unit is being authored — every pack is originally written and verified before shipping. Meanwhile: Videos · Formulas · Workbook · PYQs above."
    ),
    "calm empty-state copy present for units without a pack (updated tab order)"
  );
});

test("Lesson: v2 render order — primer, formulas, definitions, comparisons, MCQs, hooks, mistakes, checklist, reading, provenance", () => {
  const learnJs = read("assets/js/views/learn.js");
  const studyBranchStart = learnJs.indexOf('if (activeTab === "study") {');
  const formulasBranchStart = learnJs.indexOf('if (activeTab === "formulas") {');
  assert.ok(studyBranchStart > 0 && formulasBranchStart > studyBranchStart, "study branch exists before formulas branch");

  const branch = learnJs.slice(studyBranchStart, formulasBranchStart);
  const templateStart = branch.indexOf('<div class="stack-m">');
  assert.ok(templateStart > 0, "study tab appends a single wrapper template");
  const template = branch.slice(templateStart);
  const markers = [
    ["intro", 'class="study-pack-intro'],
    ["concept primer", "Concept Primer"],
    ["key formula family", "Key Formula Family"],
    ["key definitions", "Key Definitions"],
    ["comparisons", "Comparisons"],
    ["mcq self-test", "MCQ Self-Test"],
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
      branch.includes('class="lesson-formula-card study-sf"') &&
      branch.includes('<dl class="study-defs">') &&
      branch.includes('class="study-cmp"') &&
      branch.includes('class="card stack-xs study-mcq"') &&
      branch.includes('class="lesson-formula-card study-hook"') &&
      branch.includes("exam-trap") &&
      branch.includes("study-checklist") &&
      branch.includes("study-reading"),
    "v2 blocks carry distinct visual identities (tint cards, def list, tables, mcq cards, chips)"
  );
});

test("MCQ self-test wiring: per-question reveal, keyed-only highlighting, no scoring/storage", () => {
  const learnJs = read("assets/js/views/learn.js");
  const studyBranchStart = learnJs.indexOf('if (activeTab === "study") {');
  const branch = learnJs.slice(studyBranchStart, learnJs.indexOf('if (activeTab === "formulas") {'));

  assert.ok(branch.includes('class="btn btn--ghost btn--sm js-mcq-reveal"'), "reveal button per MCQ card");
  assert.ok(branch.includes('aria-expanded'), "reveal button manages aria-expanded");
  assert.ok(branch.includes('data-correct="${escapeHtml((q.correct || []).join(","))}"'), "key stored on the card dataset");
  assert.ok(branch.includes("correctSet.has(String(opt.dataset.opt))"), "only keyed options get data-hit");

  const wiringStart = branch.indexOf("slot.querySelectorAll(\".js-mcq-reveal\")");
  assert.ok(wiringStart > branch.indexOf("slot.appendChild(el("), "wiring attaches after mount");
  assert.ok(
    branch.slice(wiringStart).includes("box.hidden = revealed;") &&
      branch.slice(wiringStart).includes(".removeAttribute(\"data-hit\")"),
    "reveal toggles the answer box and clears highlights on hide"
  );
  assert.ok(!branch.includes("createSession") && !branch.includes("IndexedDB"), "self-test never touches scoring or storage");
});

test("CSS: v2 block identities exist, phone-first min-width enhancement only", () => {
  const css = read("assets/css/components.css");
  for (const cls of [
    ".study-pack-intro",
    ".study-primer",
    ".study-sf",
    ".study-defs",
    ".study-cmp",
    ".study-mcq",
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
  assert.ok(css.indexOf(".study-cmp-scroll") > 0, "comparison tables scroll horizontally on phones");
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

  assert.ok(summarizeStudyPackForTutor(unit.studyPack).length <= 400, "grounding summary capped at ~400 chars");
  const longUnit = { ...unit, studyPack: { memoryHooks: ["x".repeat(500)] } };
  assert.ok(summarizeStudyPackForTutor(longUnit.studyPack).length <= 400, "oversized hooks trimmed to the cap");

  const legacy = buildGroundTruthSystemPrompt({ unit: { unitId: "M02", officialCode: "Math-B", title: "Determinants", wbjeebTraps: [] } });
  assert.ok(!legacy.includes("Study Pack Hooks & Slips"), "units without studyPack keep the legacy prompt");

  assert.equal(summarizeStudyPackForTutor(null), "");
});

test("Pilot data v2: M01, C03, E05 carry the full anatomy; the other 39 do not", () => {
  for (const unitId of PILOT_UNITS) {
    const unit = JSON.parse(read(`_data/units/${unitId}.json`));
    const sp = unit.studyPack;
    assert.ok(sp && typeof sp === "object", `${unitId} ships a studyPack`);

    assert.deepEqual(
      Object.keys(sp).sort(),
      ["commonMistakes", "comparisons", "conceptPrimer", "examChecklist", "furtherReading",
       "keyDefinitions", "keyFormulas", "mcqSelfTest", "memoryHooks", "provenance"],
      `${unitId} studyPack has exactly the ten v2 schema keys`
    );

    assert.ok(sp.conceptPrimer.length >= 5 && sp.conceptPrimer.length <= 6, `${unitId} primer has 5-6 items`);
    assert.ok(sp.keyFormulas.length >= 12 && sp.keyFormulas.length <= 18, `${unitId} formula family has 12-18 entries`);
    assert.ok(sp.keyDefinitions.length >= 6 && sp.keyDefinitions.length <= 12, `${unitId} definitions have 6-12 entries`);
    assert.ok(sp.comparisons.length >= 3 && sp.comparisons.length <= 4, `${unitId} comparisons have 3-4 tables`);

    const prdIds = sp.conceptPrimer.map((p) => p.prdId);
    const sfIds = sp.keyFormulas.map((f) => f.sfId);
    const defIds = sp.keyDefinitions.map((d) => d.defId);
    const cmpIds = sp.comparisons.map((c) => c.cmpId);
    const mcqIds = sp.mcqSelfTest.map((q) => q.mcqId);
    for (const ids of [prdIds, sfIds, defIds, cmpIds, mcqIds]) {
      assert.equal(new Set(ids).size, ids.length, `${unitId} block ids unique across the unit`);
    }
    assert.ok(prdIds.every((id) => id.startsWith(`${unitId}-PRD`)), `${unitId} prdId convention`);
    assert.ok(sfIds.every((id) => id.startsWith(`${unitId}-SF`)), `${unitId} sfId convention`);
    assert.ok(defIds.every((id) => id.startsWith(`${unitId}-DEF`)), `${unitId} defId convention`);
    assert.ok(cmpIds.every((id) => id.startsWith(`${unitId}-CMP`)), `${unitId} cmpId convention`);
    assert.ok(mcqIds.every((id) => id.startsWith(`${unitId}-MCQ`)), `${unitId} mcqId convention`);

    for (const c of sp.comparisons) {
      assert.ok(c.columns.length >= 2 && c.columns.length <= 4, `${unitId} comparison columns 2-4`);
      assert.ok(c.rows.length >= 2 && c.rows.length <= 6, `${unitId} comparison rows 2-6`);
      for (const row of c.rows) {
        assert.equal(row.values.length, c.columns.length - 1, `${unitId} comparison row '${row.label}' has one cell per non-label column`);
      }
    }

    assert.ok(sp.mcqSelfTest.length >= 8 && sp.mcqSelfTest.length <= 10, `${unitId} self-test has 8-10 MCQs`);
    for (const q of sp.mcqSelfTest) {
      assert.deepEqual(q.options.map((o) => o.id), ["A", "B", "C", "D"], `${unitId} MCQ options keyed A-D in order`);
      assert.ok(q.correct.length >= 1 && q.correct.every((c) => ["A", "B", "C", "D"].includes(c)), `${unitId} MCQ key within A-D`);
      assert.ok(q.explanation && q.explanation.length > 10, `${unitId} MCQ carries a one-line reason`);
    }

    for (const listKey of ["memoryHooks", "commonMistakes", "examChecklist"]) {
      assert.ok(sp[listKey].length >= 8 && sp[listKey].length <= 12, `${unitId} ${listKey} has 8-12 entries`);
    }

    const flat = JSON.stringify(sp.furtherReading).toLowerCase();
    assert.ok(!flat.includes("http") && !flat.includes(".pdf") && !flat.includes(".zip"), `${unitId} furtherReading is pointer-only`);
    assert.ok(sp.provenance.draftedBy && sp.provenance.reviewedBy && sp.provenance.reviewedAt, `${unitId} provenance chain recorded`);

    // Owner-approved video enrichment (Amendment B §5): every pilot unit carries
    // 4+ curated, real lectures across languages (bn/en/hi), each with a
    // YouTube id, deep link, channel and an exam-relevant scope note.
    const videos = unit.videoLectures || [];
    assert.ok(videos.length >= 4, `${unitId} carries 4+ curated video lectures (${videos.length})`);
    for (const v of videos) {
      assert.ok(/^[\w-]{11}$/.test(v.videoId || ""), `${unitId} video ${v.videoId} has a well-formed YouTube id`);
      assert.equal(v.url, `https://www.youtube.com/watch?v=${v.videoId}`, `${unitId} video URL matches its id`);
      assert.ok(["bn", "en", "hi"].includes(v.language), `${unitId} video language tagged (bn/en/hi)`);
      assert.ok(v.channelName && v.scopeNote, `${unitId} video carries channel + exam-relevant scope note`);
    }
    assert.ok(new Set(videos.map((v) => v.videoId)).size === videos.length, `${unitId} video ids unique`);
  }

  const manifest = JSON.parse(read("_data/manifest.json"));
  for (const meta of manifest.units) {
    if (PILOT_UNITS.includes(meta.unitId)) continue;
    const unit = JSON.parse(read(`_data/units/${meta.unitId}.json`));
    assert.equal(unit.studyPack, undefined, `${meta.unitId} must not carry a studyPack yet (pilot isolation)`);
  }
});
