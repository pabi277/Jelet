/**
 * phase12-compaction.test.mjs — Phase 12 UI Compaction & Open/Closed Invariants
 * -----------------------------------------------------------------------------
 * Verifies:
 *   1. Step 0.1 (`index.html`): `#themeToggle` initial SVG uses `#icon-moon` (never `#icon-timer`).
 *   2. Step 0.2 + Learn default (`assets/js/views/learn.js`): Subject cards show exact unit counts
 *      (`${sMeta.unitCount} Units`) AND all 4 subjects start closed by default (`new Set(initialSubj ? [initialSubj] : [])`).
 *   3. Today (`assets/js/views/today.js`): Focus Hero → Quick Actions → Mistake Notebook →
 *      `Your Subjects` (`#todaySubjectsSection` / `#todaySubjectsGrid`, always open, unwrapped) →
 *      2 default-closed `<details class="disclose">` sections (`Mock History` & `Weak Areas`),
 *      with zero nested interactive controls inside `<summary>` and no manual `aria-expanded`.
 *   4. You (`assets/js/views/you.js`): `.ai-banner` → `JU Target & CGPA` (`#youJuSection`, always open,
 *      no disclosure header) → `AI Tutor` (`#youAiSection`, always open, no disclosure header) →
 *      6 default-closed `<details class="disclose">` sections below (`Study readiness`, `Mock history`,
 *      `My Activity`, `Preferences & backup`, `Cloud sync`, `Community (optional)` with `#youCommunitySlot`).
 *   5. Shared `.disclose` CSS (`assets/css/components.css`): token-only styles, `min-height: var(--tap-min)`,
 *      and `prefers-reduced-motion: reduce`.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

function extractSummaries(html) {
  return [...html.matchAll(/<summary class="disclose__summary"[^>]*>([\s\S]*?)<\/summary>/g)].map(
    (m) => m[1]
  );
}

test("Step 0 & Learn: index.html uses #icon-moon; learn.js shows unitCount and starts all subjects closed", () => {
  const indexHtml = read("index.html");
  const themeBtnMatch = indexHtml.match(/<button[^>]*id="themeToggle"[^>]*>[\s\S]*?<\/button>/);
  assert.ok(themeBtnMatch, "#themeToggle button exists in index.html");
  assert.ok(themeBtnMatch[0].includes("#icon-moon"), "#themeToggle uses #icon-moon on initial load");
  assert.ok(!themeBtnMatch[0].includes("#icon-timer"), "#themeToggle no longer uses #icon-timer");

  const learnJs = read("assets/js/views/learn.js");
  assert.ok(
    learnJs.includes("${sMeta.qCount} Qs · ${sMeta.maxMarks} Marks · ${sMeta.unitCount} Units"),
    "learn.js subject card displays exact unitCount"
  );
  assert.ok(
    !learnJs.includes("Marks · Units revised"),
    "learn.js no longer contains dangling 'Units revised' copy"
  );
  assert.ok(
    learnJs.includes("const expandedSubjects = new Set(initialSubj ? [initialSubj] : []);"),
    "learn.js starts with all 4 subject cards closed unless ?subject= is requested"
  );
});

test("Today: Your Subjects stays always open; Mock History & Weak Areas stay closed below it", () => {
  const todayJs = read("assets/js/views/today.js");

  const heroIdx = todayJs.indexOf('class="hero-card today-hero"');
  const qaIdx = todayJs.indexOf('aria-label="Quick actions"');
  const mistakeIdx = todayJs.indexOf('id="todayMistakeNotebookCard"');
  const subjIdx = todayJs.indexOf('id="todaySubjectsSection"');
  const mockIdx = todayJs.indexOf('id="discloseTodayMock"');
  const weakIdx = todayJs.indexOf('id="discloseTodayWeak"');

  assert.ok(heroIdx > 0 && qaIdx > heroIdx, "Quick Actions follows Focus Hero");
  assert.ok(mistakeIdx > qaIdx, "Mistake Notebook follows Quick Actions");
  assert.ok(subjIdx > mistakeIdx, "Your Subjects follows Mistake Notebook");
  assert.ok(mockIdx > subjIdx, "Mock History disclosure sits below Your Subjects");
  assert.ok(weakIdx > mockIdx, "Weak Areas disclosure follows Mock History");
  assert.ok(!todayJs.includes('id="discloseTodaySubjects"'), "Your Subjects is not wrapped in .disclose");
  assert.ok(!todayJs.includes('matchMedia?.("(min-width: 768px)")'), "Today disclosures stay closed until tapped");

  for (const preservedId of [
    "todaySubjectsSection",
    "todaySubjectsGrid",
    "todayMockHistoryCard",
    "todayWeakAreasSection",
    "todayWeakAreasSlot",
  ]) {
    assert.ok(todayJs.includes(`id="${preservedId}"`), `preserves #${preservedId}`);
  }

  const summaries = extractSummaries(todayJs);
  assert.equal(summaries.length, 2, "Today renders 2 compact disclosures (Mock History & Weak Areas)");
  for (const s of summaries) {
    assert.ok(
      !/<(a|button|input|select|textarea)\b/i.test(s),
      "no interactive elements nested inside <summary>"
    );
  }
  assert.ok(
    !/<details class="disclose"[^>]*aria-expanded/i.test(todayJs) &&
      !/<summary class="disclose__summary"[^>]*aria-expanded/i.test(todayJs),
    "no manual aria-expanded on native <details>/<summary>"
  );
});

test("You: JU Target & CGPA + AI Tutor stay always open (no header) above 6 closed disclosures", () => {
  const youJs = read("assets/js/views/you.js");

  const bannerIdx = youJs.indexOf('class="ai-banner"');
  const juIdx = youJs.indexOf('id="youJuSection"');
  const aiIdx = youJs.indexOf('id="youAiSection"');
  const orderedDisclosures = [
    "discloseReadiness",
    "discloseMockHistory",
    "discloseActivity",
    "disclosePrefs",
    "discloseSync",
    "discloseCommunity",
  ];

  assert.ok(bannerIdx > 0, ".ai-banner exists at top of You");
  assert.ok(juIdx > bannerIdx, "JU Target & CGPA follows .ai-banner");
  assert.ok(aiIdx > juIdx, "AI Tutor follows JU Target & CGPA");
  assert.ok(!youJs.includes('id="discloseJu"'), "JU Target & CGPA has no disclosure header wrapper");
  assert.ok(!youJs.includes('id="discloseAi"'), "AI Tutor has no disclosure header wrapper");
  assert.ok(!youJs.includes('matchMedia?.("(min-width: 1024px)")'), "Other 6 disclosures stay closed by default");

  let prevIdx = aiIdx;
  for (const id of orderedDisclosures) {
    const idx = youJs.indexOf(`id="${id}"`);
    assert.ok(idx > prevIdx, `#${id} sits below #youAiSection in order`);
    prevIdx = idx;
  }

  for (const sectionId of [
    "youJuSection",
    "youAiSection",
    "youReadinessSection",
    "youMockHistorySection",
    "youActivitySection",
    "youPrefsSection",
    "youSyncSection",
    "youCommunitySlot",
    "youContributeSection",
  ]) {
    assert.ok(youJs.includes(`id="${sectionId}"`), `preserves #${sectionId}`);
  }

  assert.ok(
    youJs.includes("mountBenchmark(communitySlot,") &&
      youJs.includes("mountStudyBuddies(communitySlot,"),
    "Benchmark and Study Buddies mount inside #youCommunitySlot"
  );

  for (const statusId of [
    "sumReadiness",
    "sumMockHistory",
    "sumActivity",
    "sumPrefs",
    "sumSync",
    "sumCommunity",
  ]) {
    assert.ok(youJs.includes(`id="${statusId}"`), `status span #${statusId} exists`);
  }

  const summaries = extractSummaries(youJs);
  assert.equal(summaries.length, 6, "You renders 6 .disclose__summary elements below JU & AI");
  for (const s of summaries) {
    assert.ok(
      !/<(a|button|input|select|textarea)\b/i.test(s),
      "no interactive elements nested inside <summary>"
    );
  }
  assert.ok(
    !/<details class="disclose"[^>]*aria-expanded/i.test(youJs) &&
      !/<summary class="disclose__summary"[^>]*aria-expanded/i.test(youJs),
    "no manual aria-expanded on native <details>/<summary>"
  );
});

test("Step 3: components.css defines token-only .disclose styles with 48px tap target & reduced-motion", () => {
  const css = read("assets/css/components.css");
  const start = css.indexOf("Phase 12 — Phone UI Compaction");
  assert.ok(start >= 0, "Phase 12 CSS section exists in components.css");
  const block = css.slice(start);

  assert.ok(block.includes(".disclose__summary"), "defines .disclose__summary");
  assert.ok(block.includes("min-height: var(--tap-min)"), "enforces >=48px tap target via --tap-min");
  assert.ok(block.includes(".disclose[open] > .disclose__summary::after"), "rotates chevron on [open]");
  assert.ok(
    block.includes("@media (prefers-reduced-motion: reduce)"),
    "disables chevron transition under prefers-reduced-motion: reduce"
  );
});
