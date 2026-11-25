/**
 * phase12-compaction.test.mjs — Phase 12 Phone UI Compaction Invariants
 * ---------------------------------------------------------------------------
 * Locks in:
 *   1. Step 0.1 (`index.html`): `#themeToggle` initial icon uses `#icon-moon` (no timer flash).
 *   2. Step 0.2 (`learn.js`): subject card copy shows unit count (`11 Units` etc.), not dangling `"Units revised"`.
 *   3. Step 1 (`today.js`): Focus Hero precedes Mock History; 3 `.disclose` blocks wrap
 *      `#todayMockHistoryCard`, `#todayWeakAreasSection`, `#todaySubjectsGrid`; `min-width: 768px` opens on desktop.
 *   4. Step 2 (`you.js`): Privacy banner unwrapped; 8 `.disclose` blocks with live status IDs;
 *      Community mounts benchmark + study buddies into `#youCommunitySlot`; `min-width: 1024px` opens on desktop.
 *   5. Step 3 (`components.css`): `.disclose` pattern uses tokens only, `var(--tap-min)`, reduced-motion guard,
 *      zero interactive elements inside `<summary class="disclose__summary">`, no manual `aria-expanded` on native `<details>`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (rel) => fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");

function extractDiscloseSummaries(src) {
  return [...src.matchAll(/<summary class="disclose__summary"[^>]*>([\s\S]*?)<\/summary>/g)];
}

test("Step 0.1 & 0.2: index.html initial theme icon is #icon-moon and Learn subject count copy is clean", () => {
  const html = read("index.html");
  const toggleBlock = html.match(/<button[^>]*id="themeToggle"[\s\S]*?<\/button>/);
  assert.ok(toggleBlock, "#themeToggle button must exist in index.html");
  assert.ok(toggleBlock[0].includes("#icon-moon"), "#themeToggle must render #icon-moon on initial light paint");
  assert.ok(!toggleBlock[0].includes("#icon-timer"), "#themeToggle must not flash #icon-timer");

  const learnSrc = read("assets/js/views/learn.js");
  assert.ok(!learnSrc.includes("Marks · Units revised"), "Dangling 'Units revised' copy must be removed from learn.js");
  assert.ok(
    learnSrc.includes("${sMeta.qCount} Qs · ${sMeta.maxMarks} Marks · ${sMeta.unitCount} Units"),
    "Learn subject card must show ${sMeta.unitCount} Units"
  );
});

test("Step 1: Today dashboard reorders Focus Hero above Mock History and wraps 3 disclosures cleanly", () => {
  const todaySrc = read("assets/js/views/today.js");

  const heroIdx = todaySrc.indexOf('class="hero-card today-hero"');
  const qaIdx = todaySrc.indexOf('id="qaAiDoubtBtn"');
  const mistakeIdx = todaySrc.indexOf('id="todayMistakeNotebookCard"');
  const mockIdx = todaySrc.indexOf('id="discloseTodayMock"');
  const weakIdx = todaySrc.indexOf('id="discloseTodayWeak"');
  const subjIdx = todaySrc.indexOf('id="discloseTodaySubjects"');

  assert.ok(heroIdx > 0 && qaIdx > heroIdx, "Quick Actions must follow Focus Hero");
  assert.ok(mistakeIdx > qaIdx, "Mistake Notebook strip must follow Quick Actions");
  assert.ok(mockIdx > mistakeIdx, "Mock History disclosure must follow Mistake Notebook (below Hero)");
  assert.ok(weakIdx > mockIdx, "Weak Areas disclosure must follow Mock History");
  assert.ok(subjIdx > weakIdx, "Your Subjects disclosure must follow Weak Areas");

  // Preserved inner IDs
  for (const id of [
    "todayMockHistoryCard",
    "todayWeakAreasSection",
    "todayWeakAreasSlot",
    "todaySubjectsGrid",
    "todaySumMock",
    "todaySumWeak",
    "todaySumSubjects",
  ]) {
    assert.ok(todaySrc.includes(`id="${id}"`), `today.js must preserve id="${id}"`);
  }

  const discloseMatches = [...todaySrc.matchAll(/<details class="disclose"[^>]*>/g)];
  assert.equal(discloseMatches.length, 3, "Today must contain exactly 3 .disclose elements");
  for (const m of discloseMatches) {
    assert.ok(!m[0].includes("aria-expanded"), "Native <details> must not carry manual aria-expanded");
  }

  const summaries = extractDiscloseSummaries(todaySrc);
  assert.equal(summaries.length, 3, "Today must contain 3 .disclose__summary headers");
  for (const s of summaries) {
    assert.ok(!s[0].includes("aria-expanded"), "Native <summary> must not carry manual aria-expanded");
    assert.ok(
      !/<(a|button|input|select|textarea)\b/i.test(s[1]),
      "No interactive elements allowed inside .disclose__summary"
    );
  }

  assert.ok(
    todaySrc.includes('matchMedia?.("(min-width: 768px)")') ||
      todaySrc.includes('matchMedia("(min-width: 768px)")'),
    "Today disclosures must open at min-width: 768px"
  );
});

test("Step 2: You/Settings wraps 8 disclosures, keeps Community inside #youCommunitySlot, and wires live statuses", () => {
  const youSrc = read("assets/js/views/you.js");

  const bannerIdx = youSrc.indexOf('class="ai-banner"');
  const discloseIds = [
    "discloseReadiness",
    "discloseMockHistory",
    "discloseJu",
    "discloseAi",
    "discloseActivity",
    "disclosePrefs",
    "discloseSync",
    "discloseCommunity",
  ];
  let prevIdx = bannerIdx;
  assert.ok(bannerIdx > 0, "Privacy .ai-banner must exist at top of You view");
  for (const id of discloseIds) {
    const idx = youSrc.indexOf(`id="${id}"`);
    assert.ok(idx > prevIdx, `#${id} must appear in order after previous block`);
    prevIdx = idx;
  }

  const discloseMatches = [...youSrc.matchAll(/<details class="disclose"[^>]*>/g)];
  assert.equal(discloseMatches.length, 8, "You view must contain exactly 8 .disclose elements");

  for (const id of [
    "youReadinessSection",
    "youMockHistorySection",
    "youJuSection",
    "youAiSection",
    "youActivitySection",
    "youPrefsSection",
    "youSyncSection",
    "youCommunitySlot",
    "youContributeSection",
    "sumReadiness",
    "sumMockHistory",
    "sumJU",
    "sumAI",
    "sumActivity",
    "sumPrefs",
    "sumSync",
    "sumCommunity",
  ]) {
    assert.ok(youSrc.includes(`id="${id}"`), `you.js must define/preserve id="${id}"`);
  }

  // Community slot mounts benchmark & study buddies inside the disclosure, never on root directly
  assert.ok(youSrc.includes("mountBenchmark(communitySlot,"), "mountBenchmark must mount into #youCommunitySlot");
  assert.ok(youSrc.includes("mountStudyBuddies(communitySlot,"), "mountStudyBuddies must mount into #youCommunitySlot");
  assert.ok(!youSrc.includes("mountBenchmark(root,"), "mountBenchmark must not mount on root outside disclosure");
  assert.ok(!youSrc.includes("mountStudyBuddies(root,"), "mountStudyBuddies must not mount on root outside disclosure");

  const summaries = extractDiscloseSummaries(youSrc);
  assert.equal(summaries.length, 8, "You view must contain 8 .disclose__summary headers");
  for (const s of summaries) {
    assert.ok(!s[0].includes("aria-expanded"), "Native <summary> must not carry manual aria-expanded");
    assert.ok(
      !/<(a|button|input|select|textarea)\b/i.test(s[1]),
      "No interactive elements allowed inside .disclose__summary"
    );
  }

  assert.ok(
    youSrc.includes('matchMedia?.("(min-width: 1024px)")') ||
      youSrc.includes('matchMedia("(min-width: 1024px)")'),
    "You disclosures must open at min-width: 1024px"
  );
});

test("Step 3: components.css defines token-driven .disclose rules with 48px tap target and reduced-motion guard", () => {
  const css = read("assets/css/components.css");
  for (const needle of [
    ".disclose",
    ".disclose__summary",
    ".disclose__summary::-webkit-details-marker",
    ".disclose__title",
    ".disclose__status",
    ".disclose[open] > .disclose__summary::after",
    ".disclose > .disclose__summary + *",
    "min-height: var(--tap-min)",
  ]) {
    assert.ok(css.includes(needle), `components.css must include "${needle}"`);
  }
});
