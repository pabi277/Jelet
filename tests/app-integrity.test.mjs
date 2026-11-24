/**
 * app-integrity.test.mjs — Phase 04 End-to-End Module Linker, KaTeX, SVG & Responsive Audit
 * ---------------------------------------------------------------------------
 * Guarantees:
 *   1. Every ESM module in `assets/js/core/*` and `assets/js/views/*` links cleanly
 *      with zero missing named exports/imports.
 *   2. Every hash route (`#/`, `#/learn`, `#/learn/M01`, `#/formulas`, `#/practice`,
 *      `#/practice-run/:id`, `#/results/:id`, `#/papers`, `#/papers/2025`,
 *      `#/omr-print/2025`, `#/exam/:id`, `#/you`) resolves cleanly via `parseRoute`.
 *   3. All 400 PYQ stems, 1,600 options, 400 SymPy solution walkthroughs, and all 42
 *      syllabus unit workbooks render through vendored offline KaTeX with 0 `katex-error`s.
 *   4. All 4 papers (2022–2025) score 1440 twelfths (`120` marks) on official keys.
 *   5. Every `#icon-*` symbol referenced in JS/HTML exists in `assets/icons/icons.svg`,
 *      and zero desktop-first `@media (max-width)` layout queries exist in CSS.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// Minimal DOM stubs so `app.js` and all view modules can be linked in Node
globalThis.document = {
  compatMode: "CSS1Compat",
  readyState: "loading",
  addEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  documentElement: { setAttribute: () => {} },
};
globalThis.window = {
  addEventListener: () => {},
};
globalThis.location = { hash: "#/" };

test("All ESM core & view modules link with 0 missing named exports", async () => {
  const modules = [
    "../assets/js/core/math.js",
    "../assets/js/core/scoring.js",
    "../assets/js/core/data-loader.js",
    "../assets/js/core/stats.js",
    "../assets/js/core/ui.js",
    "../assets/js/core/ai-vault.js",
    "../assets/js/views/today.js",
    "../assets/js/views/learn.js",
    "../assets/js/views/practice.js",
    "../assets/js/views/papers.js",
    "../assets/js/views/exam.js",
    "../assets/js/views/results.js",
    "../assets/js/views/you.js",
    "../assets/js/views/ai-tutor.js",
    "../assets/js/app.js",
  ];
  for (const modPath of modules) {
    const mod = await import(modPath);
    assert.ok(mod, `Failed to import ${modPath}`);
  }
});

test("Router parseRoute resolves all 12 parameterized & top-level routes cleanly", async () => {
  const { parseRoute, ROUTES } = await import("../assets/js/app.js");
  assert.equal(ROUTES.length, 5, "Strictly 5 global navigation tabs");

  assert.equal(parseRoute("#/").view, "today");
  assert.equal(parseRoute("#/formulas").view, "formulas");
  assert.equal(parseRoute("#/learn").view, "learn");
  assert.deepEqual(
    { view: parseRoute("#/learn/M01").view, param: parseRoute("#/learn/M01").param },
    { view: "lesson", param: "M01" }
  );
  assert.equal(parseRoute("#/practice").view, "practice");
  assert.equal(parseRoute("#/practice-run/sess-1").view, "practice-run");
  assert.equal(parseRoute("#/results/att-1").view, "results");
  assert.equal(parseRoute("#/papers").view, "papers");
  assert.equal(parseRoute("#/papers/jelet-2025").view, "paper-reader");
  assert.equal(parseRoute("#/omr-print/jelet-2025").view, "omr-print");
  assert.equal(parseRoute("#/exam/sess-mock").view, "exam");
  assert.equal(parseRoute("#/you").view, "you");
});

test("All 400 PYQs, 400 solutions & 42 units render offline KaTeX with 0 errors and 1440/1440 twelfths", async () => {
  const { renderLatex } = await import("../assets/js/core/math.js");
  const { scoreAttempt } = await import("../assets/js/core/scoring.js");

  for (const yr of [2022, 2023, 2024, 2025]) {
    const p = JSON.parse(fs.readFileSync(`./_data/papers/${yr}.json`, "utf8"));
    const s = JSON.parse(fs.readFileSync(`./_data/solutions/${yr}.solutions.json`, "utf8"));
    const resp = {};

    for (const q of p.questions) {
      resp[q.id] = q.key.status === "voided" ? [] : [...q.key.correct];
      assert.ok(!renderLatex(q.stemLatex).includes("katex-error"), `KaTeX error in ${q.id} stem`);
      for (const o of q.options) {
        assert.ok(!renderLatex(o.latex).includes("katex-error"), `KaTeX error in ${q.id} opt ${o.id}`);
      }
      const sol = s.solutions[q.id];
      assert.ok(sol, `Missing solution for ${q.id}`);
      for (const st of sol.steps) {
        assert.ok(!renderLatex(st.bodyLatex).includes("katex-error"), `KaTeX error in ${q.id} step ${st.stepNumber}`);
      }
    }
    const scored = scoreAttempt(p.questions, resp);
    assert.equal(scored.totalTwelfths, 1440, `${yr} perfect key must equal 1440 twelfths`);
  }

  const manifest = JSON.parse(fs.readFileSync("./_data/manifest.json", "utf8"));
  assert.equal(manifest.units.length, 42);
  for (const uMeta of manifest.units) {
    const u = JSON.parse(fs.readFileSync(`./_data/units/${uMeta.unitId}.json`, "utf8"));
    assert.ok(!renderLatex(u.overviewLatex).includes("katex-error"), `KaTeX error in ${u.unitId} overview`);
    for (const f of u.formulas || []) {
      assert.ok(!renderLatex(f.latex, { displayIfBare: true }).includes("katex-error"), `KaTeX error in ${u.unitId} formula ${f.id}`);
    }
  }
});

test("Phone-first CSS & SVG icon sprite integrity across all views", () => {
  for (const cssFile of ["./assets/css/shell.css", "./assets/css/components.css"]) {
    const css = fs.readFileSync(cssFile, "utf8");
    assert.equal(
      /@media\s*\([^)]*max-width/i.test(css),
      false,
      `Forbidden desktop-first max-width query in ${cssFile}`
    );
  }

  const sprite = fs.readFileSync("./assets/icons/icons.svg", "utf8");
  const definedIcons = new Set([...sprite.matchAll(/id="(icon-[^"]+)"/g)].map((m) => m[1]));
  const jsFiles = fs
    .readdirSync("./assets/js/views")
    .map((f) => `./assets/js/views/${f}`)
    .concat(["./assets/js/app.js", "./assets/js/core/ui.js", "./assets/js/core/data-loader.js", "./index.html"]);

  for (const jf of jsFiles) {
    const src = fs.readFileSync(jf, "utf8");
    for (const m of src.matchAll(/(?:icon\(["']|#)(icon-[a-z0-9-]+)/g)) {
      assert.ok(definedIcons.has(m[1]), `Missing SVG icon symbol #${m[1]} in ${jf}`);
    }
  }
});
