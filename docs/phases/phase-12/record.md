# Phase 12 Record — Phone & Hub UI Compaction: Today, Learn & You/Settings

**Date:** 2026-11-25 (UTC)
**Branch:** `arena/8dbfaeda-jelet`
**Base:** `f2d90e62b77fd5234fc8e041820784a035d78652`
**Status:** Complete (including owner UX refinement); all mandatory + browser gates green.

## Build order and delivered slices

Executed Phase 12 compaction and refined the open/closed section balance per
owner review so primary visual/actionable features stay open directly without
redundant disclosure headers while secondary sections stay cleanly collapsed
below them:

1. **Step 0 — Audit visual/copy polish + Learn default state.**
   - `index.html`: switched `#themeToggle` initial icon from `#icon-timer` to
     `#icon-moon` so first paint in light mode no longer flashes the timer SVG.
   - `assets/js/views/learn.js`:
     - Replaced dangling subject-card meta `"40 Qs · 50 Marks · Units revised"`
       with exact unit counts (`"${sMeta.qCount} Qs · ${sMeta.maxMarks} Marks · ${sMeta.unitCount} Units"`
       → `11 / 15 / 8 / 8 Units`).
     - Changed default `expandedSubjects` on `#/learn` from `["MATH"]` to `[]`
       so **all 4 subject cards start closed** (matching `06-learn-subjects.png`);
       `?subject=MATH` deep links and search/filter queries still expand matching
       subjects automatically.

2. **Step 1 — Today dashboard (`assets/js/views/today.js`).**
   - Ordered flow: Greeting/streak (+ desktop 4-stat strip) → **Focus Hero
     (Resume + Pomodoro)** → **Quick Actions** → **Spaced Mistake Notebook** →
     **Your Subjects (`#todaySubjectsSection` / `#todaySubjectsGrid`, always
     open, unwrapped)** → two default-closed `<details class="disclose">` rows
     below:
     - `#discloseTodayMock` (`Mock History` · `"No mocks yet"` or
       `"N mock(s) · best X/120"` via exact integer `formatTwelfths`), preserving
       `#todayMockHistoryCard`.
     - `#discloseTodayWeak` (`Weak Areas` · `"Practice to generate insights"` or
       `"N focus unit(s) · worst X%"`), preserving `#todayWeakAreasSection` and
       `#todayWeakAreasSlot`.

3. **Step 2 — You & AI hub (`assets/js/views/you.js`, `assets/js/app.js`).**
   - Top of `#/you`:
     - Privacy `.ai-banner` (always visible).
     - **`JU Target & Diploma CGPA Check` (`#youJuSection`)** — **always open,
       no disclosure header wrapper**.
     - **`Codec BYOK AI Tutor` (`#youAiSection`)** — **always open, no
       disclosure header wrapper** (also fixed `.form-field[hidden]` in
       `components.css` so the custom model input hides cleanly when Default
       model is selected).
   - Below `#youAiSection`, all **6 secondary sections stay closed by default**
     in `<details class="disclose">` rows with honest live status text:
     1. `#discloseReadiness` → `#youReadinessSection` (`#sumReadiness`:
        `"Need more attempts"` or `"X% · Stage"`).
     2. `#discloseMockHistory` → `#youMockHistorySection` (`#sumMockHistory`:
        `"No mocks yet"` or `"N mock(s) · best X/120"`).
     3. `#discloseActivity` → `#youActivitySection` (`#sumActivity`:
        `"N bookmark(s) · M recent unit(s)"`, updated live in
        `renderActivityDrawer()`).
     4. `#disclosePrefs` → `#youPrefsSection` (`#sumPrefs`: `"Light mode"` /
        `"AMOLED on"` + `" · Offline ready"`, synced with `#youDarkSwitchBtn`
        and topbar `#themeToggle` via `MutationObserver`, cleaned up via
        `setViewCleanup`).
     5. `#discloseSync` → `#youSyncSection` (`#sumSync`: mirrors `#syncStatusPill`
        live in `renderSyncStatus()`).
     6. `#discloseCommunity` → `#youCommunitySlot` (`#sumCommunity`:
        `"Open source · optional"`), grouping `#youContributeSection`,
        `mountBenchmark`, and `mountStudyBuddies` (auto-opens when handling an
        incoming `?invite=` link).

4. **Step 3 & 4 — Shared `.disclose` CSS, SW bump & regression suites.**
   - Added token-only `.disclose` styles in `assets/css/components.css`
     (`min-height: var(--tap-min)`, CSS `::after` geometric chevron,
     `prefers-reduced-motion: reduce`), bumped `SW_VERSION` to `"jelet-v3-sw-13"`
     in `sw.js`, and updated `tests/phase12-compaction.test.mjs`,
     `scripts/check_responsive.mjs`, and `scripts/check_community.mjs`.

## Verification evidence

| Final gate | Command | Result |
| --- | --- | --- |
| Corpus | `python3 scripts/verify_corpus.py` | **PASS** — 400 questions, 4 papers, 42 units, 109 SVGs |
| SymPy verification | `/tmp/jelet-py/bin/python3 scripts/verify_solutions_sympy.py` | **PASS** — 400 solutions, 400 SymPy-verified |
| Tokens/paths/links/copyright | `node scripts/check_tokens_and_links.mjs` | **PASS** — 0 raw hex outside `tokens.css`, 0 absolute root paths, 0 broken links, 0 copyrighted files (318 files scanned) |
| Unit & integrity tests | `node --test "tests/*.test.mjs"` | **124/124 PASS**, 0 failures/skips |
| Responsive regression | `JELET_PW_ROOT=/tmp/pwtool node scripts/check_responsive.mjs` | **43/43 PASS** — 360/390/414/1440; zero horizontal overflow or console errors |
| Community browser regression | `JELET_PW_ROOT=/tmp/pwtool node scripts/check_community.mjs` | **23 checks PASS** — mobile/desktop routes, benchmark E2E, two-context study-buddy invites on 360px, 200% text zoom, offline |
| Frozen-file diff | `git diff f2d90e6 -- _data/ scripts/_build/ 'scripts/verify_*' assets/js/core/scoring.js` | **Empty** |

## Preserved invariants and scope limits

- Zero diffs on `_data/`, `scoring.js`, `verify_corpus.py`, and
  `verify_solutions_sympy.py`. Exact `1/12`-mark integer `twelfths` arithmetic is
  untouched.
- Practice, Papers, Lesson, Exam, Results, and AI Tutor layouts are untouched.
- Five global navigation destinations, relative-subpath asset paths, offline PWA
  caching, BYOK vault isolation (`jelet_ai_vault_v1`), and local-first privacy
  remain unchanged.
