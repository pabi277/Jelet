# Phase 12 Record — Phone UI Compaction: Today & You/Settings (Disclosure Row Pattern)

**Date:** 2026-11-25 (UTC)
**Branch:** `arena/8dbfaeda-jelet`
**Base:** `f2d90e62b77fd5234fc8e041820784a035d78652`
**Status:** Complete; all mandatory + browser gates green. Awaiting owner review/sign-off before any PR/merge (per `AGENTS.md` §5.5).

## Build order and delivered slices

Executed `docs/phases/phase-12/plan.md` step-by-step after auditing `today.js`,
`you.js`, `learn.js`, `index.html`, `components.css`, `sw.js`, and the browser
regression suites. Every card, metric, empty state, and interaction handler is
preserved unchanged; only visibility defaults and phone section order changed.

1. **Step 0 — Audit visual/copy polish.**
   - `index.html`: switched `#themeToggle` initial icon from `#icon-timer` to
     `#icon-moon` so first paint in light mode no longer flashes the timer SVG
     before `app.js` hydrates the theme button.
   - `assets/js/views/learn.js`: replaced the dangling subject-card meta
     `"40 Qs · 50 Marks · Units revised"` with exact unit counts
     (`"${sMeta.qCount} Qs · ${sMeta.maxMarks} Marks · ${sMeta.unitCount} Units"` →
     `11 / 15 / 8 / 8 Units`); the meter row directly underneath continues to
     show `revised / total`.

2. **Step 1 — Today dashboard restructure (`assets/js/views/today.js`).**
   - Reordered phone flow so **Focus Hero (Resume + Pomodoro)** immediately
     follows the greeting/desktop-stat strip, followed by **Quick Actions** and
     the **Spaced Mistake Notebook** strip.
   - Wrapped the three secondary sections in native `<details class="disclose">`
     disclosures with honest live status lines computed strictly from real
     IndexedDB data (`0` / empty-state strings on a fresh device):
     - `#discloseTodayMock` (`Mock History` · `"No mocks yet"` or
       `"N mock(s) · best X/120"` via exact integer `formatTwelfths`), preserving
       `#todayMockHistoryCard`.
     - `#discloseTodayWeak` (`Weak Areas` · `"Practice to generate insights"` or
       `"N focus unit(s) · worst X%"`, with safe fallback when subject attempts
       unlock before any single unit reaches 3 attempts), preserving
       `#todayWeakAreasSection` and `#todayWeakAreasSlot`.
     - `#discloseTodaySubjects` (`Your Subjects` · `"N/42 units revised"`),
       preserving `#todaySubjectsGrid`.
   - On mount, `matchMedia("(min-width: 768px)")` opens all three `.disclose`
     elements automatically so tablet/desktop keeps the full dashboard layout.

3. **Step 2 — You/Settings restructure (`assets/js/views/you.js`, `assets/js/app.js`).**
   - Kept the top privacy `.ai-banner` always visible and wrapped all eight
     settings sections in `<details class="disclose">` rows so the entire phone
     settings home fits on the first `360×800` screen (`last row bottom = 666px`,
     above the `64px` bottom navigation bar):
     1. `#discloseReadiness` → `#youReadinessSection` (`#sumReadiness`:
        `"Need more attempts"` or `"X% · Stage"`).
     2. `#discloseMockHistory` → `#youMockHistorySection` (`#sumMockHistory`:
        `"No mocks yet"` or `"N mock(s) · best X/120"`).
     3. `#discloseJu` → `#youJuSection` (`#sumJU`: `"Not set"`, `"Invalid CGPA"`,
        or `"X.X% · Eligible / Below cutoff"`, updated live in `renderCgpaStatus()`).
     4. `#discloseAi` → `#youAiSection` (`#sumAI`: `"Offline corpus mode"` or
       `"<Provider> · Key saved"`, updated live in `syncAiVaultDom()`).
     5. `#discloseActivity` → `#youActivitySection` (`#sumActivity`:
        `"N bookmark(s) · M recent unit(s)"`, synced at mount and in
        `renderActivityDrawer()`).
     6. `#disclosePrefs` → `#youPrefsSection` (`#sumPrefs`: `"Light mode"` /
        `"AMOLED on"` + `" · Offline ready"` once warmed; stays in sync with
        both `#youDarkSwitchBtn` and topbar `#themeToggle` via `MutationObserver`,
        cleaned up on view teardown via `setViewCleanup`).
     7. `#discloseSync` → `#youSyncSection` (`#sumSync`: mirrors `#syncStatusPill`
        live in `renderSyncStatus()` — `Off` / `Locked` / `Pending N` / `Up to date` / `Error`).
     8. `#discloseCommunity` → `#youCommunitySlot` (`#sumCommunity`:
        `"Open source · optional"`), grouping `#youContributeSection`,
        `mountBenchmark(communitySlot, …)` and `mountStudyBuddies(communitySlot, …)`
        with zero duplicate renders. Automatically opens `#discloseCommunity`
        on phone when deep-linking an incoming `?invite=` link so the invite
        preview is immediately actionable.
   - On mount, `matchMedia("(min-width: 1024px)")` opens all eight `.disclose`
     elements on desktop while keeping phone and 768–1023px tablet collapsed.

4. **Step 3 — Shared `.disclose` component (`assets/css/components.css`, `sw.js`).**
   - Added mobile-first, 100% token-driven `.disclose`, `.disclose__summary`,
     `.disclose__title`, and `.disclose__status` rules (`min-height: var(--tap-min)`
     = `48px`, geometric CSS chevron via `::after` so screen readers do not
     announce glyph noise, single-line status ellipsis for `360px` and `200%`
     zoom, subtle collapsed divider, hover/active surface tokens, and
     `prefers-reduced-motion: reduce` transition suppression).
   - Zero interactive elements inside `<summary>`, no manual `aria-expanded` on
     native `<details>/<summary>`.
   - Bumped `SW_VERSION` in `sw.js` (`jelet-v3-sw-12`) so installed PWAs refresh
     the cached app shell cleanly.

5. **Step 4 — Automated tests & browser gate updates.**
   - Added `tests/phase12-compaction.test.mjs` (4 tests covering Step 0.1/0.2,
     Today DOM ordering & 3 disclosures, You 8 disclosures + `#youCommunitySlot`
     mounting + status IDs, and `.disclose` CSS invariants).
   - Updated `scripts/check_responsive.mjs` and `scripts/check_community.mjs` so
     360px interactive flows assert default-collapsed 8-row compaction (`>=48px`
     tap height, zero nested interactive controls in `<summary>`) and tap the
     disclosure headers before interacting with inner controls.

## Verification evidence

| Final gate | Command | Result |
| --- | --- | --- |
| Corpus | `python3 scripts/verify_corpus.py` | **PASS** — 400 questions, 4 papers, 42 units, 109 SVGs |
| SymPy verification | `/tmp/jelet-py/bin/python3 scripts/verify_solutions_sympy.py` | **PASS** — 400 solutions, 400 SymPy-verified; full independent SymPy re-verification executed |
| Tokens/paths/links/copyright | `node scripts/check_tokens_and_links.mjs` | **PASS** — 0 raw hex outside `tokens.css`, 0 absolute root paths, 0 broken links, 0 copyrighted files (318 files scanned) |
| Unit & integrity tests | `node --test "tests/*.test.mjs"` | **124/124 PASS**, 0 failures/skips (120 → 124; +4 Phase 12 compaction tests) |
| Responsive regression | `JELET_PW_ROOT=/tmp/pwtool node scripts/check_responsive.mjs` | **43/43 PASS** — 360/390/414/1440; zero horizontal overflow or console errors |
| Community browser regression | `JELET_PW_ROOT=/tmp/pwtool node scripts/check_community.mjs` | **23 checks PASS** — mobile/desktop routes, benchmark E2E, two-context study-buddy invites on 360px, 200% text zoom, offline |
| Frozen-file diff | `git diff f2d90e6 -- _data/ scripts/_build/ 'scripts/verify_*' assets/js/core/scoring.js` | **Empty** |

**Ad-hoc Phase 12 E2E browser smoke (`360×800`, `768×1024`, `1440×900`, Light + AMOLED Dark + `200%` text zoom):**
- Verified on fresh `360×800` phone: Today places Focus Hero + Quick Actions on
  screen 1 above Mock History with all 3 disclosures collapsed; You renders the
  privacy banner + all 8 collapsed rows on screen 1 (`bottom = 666px < 736px`
  nav top) with exact fresh-device statuses (`Need more attempts`, `No mocks yet`,
  `Not set`, `Offline corpus mode`, `0 bookmarks · 0 recent units`, `Light mode`,
  `Off`, `Open source · optional`).
- Verified keyboard (`Enter` / `Space`) disclosure toggling, Pomodoro countdown
  ticks, live `#sumJU` (`9.35 → 86.0% · Eligible`), live `#sumAI` save/clear,
  live `#sumPrefs` updates from both `#youDarkSwitchBtn` and topbar
  `#themeToggle`, live `#sumSync` (`Off → Up to date → Off`), populated device
  statuses (`1 mock · best 96/120`, `1 focus unit · worst 40%`, `1/42 units revised`,
  `23% · Early Foundation`, `1 bookmark · 1 recent unit`), tablet `768×1024`
  (Today open, You collapsed), desktop `1440×900` (both open), and `200%` root
  font zoom (`0px` horizontal overflow, zero console errors).

## Preserved invariants and scope limits

- Zero diffs on `_data/`, `scoring.js`, `verify_corpus.py`, and
  `verify_solutions_sympy.py`. Exact `1/12`-mark integer `twelfths` arithmetic is
  untouched.
- Practice, Papers, Lesson, Exam, Results, and AI Tutor layouts are untouched.
- Five global navigation destinations, relative-subpath asset paths, offline PWA
  caching, BYOK vault isolation (`jelet_ai_vault_v1`), and local-first privacy
  remain unchanged.
- No PR opened, no merge/push performed, and no branch switch. Owner review and
  sign-off remain required before any PR/merge.
