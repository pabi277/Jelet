/**
 * ai-compact.test.mjs — Compact AI settings (#youAiSection) invariants
 * -----------------------------------------------------------------------------
 * Guards the Task-1 compaction contract:
 *   1. `#youAiSection` stays an always-open `card--compact` section (Phase 12
 *      invariant: no top-level disclosure wrapper).
 *   2. Essentials (Provider / Model / Language / Preview toggle, keys, custom
 *      model) remain visible outside any collapsed `<details>`.
 *   3. Advanced generation, passphrase protection and usage dashboard collapse
 *      into exactly three nested `details.ai-advanced`, closed by default,
 *      with summary-status spans that `you.js` keeps in sync.
 *   4. Every control ID the wiring depends on is preserved.
 *   5. `components.css` styles the new pattern with tap targets,
 *      reduced-motion, and tokens only (no max-width media queries).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const youJs = read("assets/js/views/you.js");
const css = read("assets/css/components.css");

function extractAiSection(src) {
  const m = src.match(/<section[^>]*id="youAiSection"[\s\S]*?<\/section>/);
  assert.ok(m, "#youAiSection section markup exists");
  return m[0];
}

test("AI card is compact, always-open, and nests exactly three closed sub-details", () => {
  const section = extractAiSection(youJs);

  assert.ok(section.includes('class="card card--compact'), "#youAiSection uses card--compact");
  assert.ok(!youJs.includes('id="discloseAi"'), "no top-level disclosure wrapper (Phase 12)");

  const nested = [...section.matchAll(/<details class="ai-advanced" id="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(
    nested,
    ["aiAdvancedDetails", "aiProtectDetails", "aiUsageDetails"],
    "exactly three nested ai-advanced details, in order"
  );

  // None of the nested details may be open by default.
  for (const id of nested) {
    const block = section.match(new RegExp(`<details class="ai-advanced" id="${id}"[^>]*>[\\s\\S]*?<\\/details>`));
    assert.ok(block, `#${id} block exists`);
    assert.ok(!block[0].startsWith(`<details class="ai-advanced" id="${id}" open`), `#${id} starts closed`);
  }

  // Summaries carry live status text and contain no interactive controls.
  for (const id of nested) {
    const detail = section.match(
      new RegExp(`<details class="ai-advanced" id="${id}"[\\s\\S]*?<\\/details>`)
    );
    assert.ok(detail, `#${id} block exists`);
    const summary = detail[0].match(/<summary class="ai-advanced__summary"[\s\S]*?<\/summary>/);
    assert.ok(summary, `#${id} has an ai-advanced__summary`);
    assert.ok(
      !/<(a|button|input|select|textarea)\b/i.test(summary[0]),
      `no interactive elements inside #${id} summary`
    );
  }
  const summaries = [...section.matchAll(/<summary class="ai-advanced__summary"[\s\S]*?<\/summary>/g)];
  assert.equal(summaries.length, 3, "three summary rows");
  assert.ok(section.includes('id="aiGenSummaryStatus"'), "generation summary status span");
  assert.ok(section.includes('id="aiProtectionSummaryStatus"'), "protection summary status span");
  assert.ok(section.includes('id="aiUsageSummaryStatus"'), "usage summary status span");
});

test("Essentials render outside the collapsed sub-details (visible by default)", () => {
  const section = extractAiSection(youJs);
  assert.ok(
    section.includes('<details class="ai-advanced"'),
    "sub-details exist inside the card"
  );

  // Strip the three collapsed blocks: whatever remains is visible on load.
  const visible = section
    .replace(/<details class="ai-advanced"[\s\S]*?<\/details>/g, "");
  assert.ok(
    visible.length < section.length,
    "details blocks were stripped for the visibility check"
  );

  for (const id of [
    "aiVaultStatusPill",
    "aiMaskedKeyLine",
    "aiProviderSelect",
    "aiModelModeSelect",
    "aiLanguageSelect",
    "aiPreviewToggleBtn",
    "aiCustomModelWrap",
    "aiCustomModelInput",
    "aiKeyChoice",
    "aiSavedKeys",
    "aiKeyInput",
    "saveAiKeyBtn",
    "testAiConnBtn",
    "clearAiKeyBtn",
    "aiConnDiagnostic",
  ]) {
    assert.ok(visible.includes(`id="${id}"`), `#${id} remains visible (outside collapsed details)`);
  }

  // And the collapsed-only controls live strictly inside a details block.
  for (const id of [
    "aiTemperature",
    "aiMaxOutputTokens",
    "aiHistoryTurns",
    "aiKeyPassphrase",
    "protectAiKeyBtn",
    "aiUsageDashboard",
  ]) {
    assert.ok(!visible.includes(`id="${id}"`), `#${id} is inside a collapsed details`);
  }
});

test("Every control ID the you.js wiring depends on is preserved", () => {
  for (const id of [
    "youAiSection",
    // advanced generation (collapsed)
    "aiAdvancedDetails",
    "aiTemperature",
    "aiMaxOutputTokens",
    "aiHistoryTurns",
    "aiGenSummaryStatus",
    // protect (collapsed)
    "aiProtectDetails",
    "aiKeyPassphrase",
    "aiKeyPassphraseConfirm",
    "protectAiKeyBtn",
    "unlockAiKeyBtn",
    "lockAiKeyBtn",
    "aiProtectionStatus",
    "aiProtectionSummaryStatus",
    "aiDefaultUpgradeNotice",
    "dismissAiDefaultNotice",
    // usage (collapsed)
    "aiUsageDetails",
    "aiUsageDashboard",
    "aiUsageSummaryStatus",
  ]) {
    assert.ok(youJs.includes(`id="${id}"`), `preserves #${id}`);
  }

  // Wiring: summaries stay in sync from vault state and usage renders.
  assert.ok(
    youJs.includes("aiProtectionSummaryStatus"),
    "syncAiVaultDom writes protection summary"
  );
  assert.ok(/aiGenSummaryStatus[^}]*textContent/.test(youJs), "generation summary text is written");
  assert.ok(/aiUsageSummaryStatus/.test(youJs), "usage summary text is written");
});

test("Compact AI CSS: token-only, 48px summaries, chevron rotation, reduced motion", () => {
  for (const cls of [
    ".card--compact",
    ".ai-compact-head",
    ".ai-compact-title",
    ".ai-masked-line",
    ".form-grid-2--compact",
    ".ai-advanced",
    ".ai-advanced__summary",
    ".ai-advanced__title",
    ".ai-advanced__status",
    ".ai-advanced__body",
  ]) {
    assert.ok(css.includes(cls), `defines ${cls}`);
  }

  const start = css.indexOf("Compact AI settings");
  assert.ok(start >= 0, "compact AI CSS section exists");
  const block = css.slice(start);
  assert.ok(
    block.includes("min-height: var(--tap-min)"),
    "ai-advanced summary enforces >=48px tap target"
  );
  assert.ok(
    block.includes(".ai-advanced[open] > .ai-advanced__summary::after"),
    "chevron rotates when open"
  );
  assert.ok(
    block.includes("@media (prefers-reduced-motion: reduce)"),
    "reduced-motion disables transitions"
  );
  // Phone-first contract: no max-width media queries in components.css.
  assert.ok(
    !/max-width:\s*\d+px/.test(block),
    "no max-width px media queries (phone-first per AGENTS.md)"
  );
});
