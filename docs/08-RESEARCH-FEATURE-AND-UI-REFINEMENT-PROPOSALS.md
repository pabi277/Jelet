# 08 — Research Audit: Feature Opportunities & Page-by-Page UI Refinement Plan

> **Status:** Research only — **zero application code written**. This is the implementation
> brief for the next phase(s) of JELET Study Hub (v3).
> **→ Executable phase plans derived from this audit:** [`docs/phases/README.md`](./phases/README.md)
> (**Phase 11** AI tutor context/history · **Phase 12** phone UI compaction · **Phase 13** book-based Learn enrichment).
> **Method:** Full read-through of every routed screen (`assets/js/views/*`), core engine
> (`assets/js/core/*`), DB layer (`assets/js/db/*`), all three stylesheets, `index.html`,
> `sw.js`, manifest, `_data/` corpus, all tests, and docs `01`–`07` + phase records.
> Gates executed for this audit: `node --test "tests/*.test.mjs"` → **102/102 PASS**;
> `node scripts/check_tokens_and_links.mjs` → **PASS** (307 files, 0 raw hex, 0 broken links).
> Phase-10 recorded gates (responsive 43/43, community 23 checks) were not re-run here
> (they need external Puppeteer tooling) — re-run before any phase close.
>
> **Constraint frame (AGENTS.md — every proposal below obeys these):**
> 5 global destinations only · phone-first `min-width` CSS · tokens-only colors ·
> honest local-first metrics (`0`/`—` on fresh device) · no fake ranks/percentiles as
> facts · no accuracy-disclaimer banners · zero copyrighted assets · owner sign-off
> before any PR/merge.

---

## 1. Repository Snapshot & Health

| Area | Found | Health |
| :--- | :--- | :--- |
| Architecture | Zero-build static PWA · vanilla ESM · hash router · IndexedDB `jelet_hub_v1` · BroadcastChannel sync · vendored KaTeX · staged `sw.js` | ✅ Solid |
| Screens | 11 view modules (~7,100 LOC) + 2 sheet overlays (OMR, AI Tutor) + printable OMR | ✅ All 5 tabs + 9 sub-routes wired |
| Engine | Exact integer 1/12-mark scoring, Leitner mistake queue, adaptive/balanced sampling, mock analytics, readiness estimate, JU cutoff bands | ✅ Unit-tested |
| Corpus | 4 papers (2022–2025) · 400/400 Qs · 400 solutions · 42 units (sections/formulas/worked examples/traps/PYQs all populated) · 109 theme-adaptive SVGs · 42 curated videos (1/unit) | ✅ Verifiable, ⚠️ 2026 missing (§3) |
| Practice sets | Loader + source filter ready; `_data/practice-sets/` **does not exist** (0 packs) | ⚠️ Flagship feature unexercised (§3) |
| Tests | 102 unit tests (scoring, DB, backup, sync, AI vault, PWA, community, benchmark, mock) | ✅ PASS today |
| Tokens/links CI | `check_tokens_and_links.mjs` | ✅ PASS today |
| Design system | `tokens.css` (light + AMOLED dark) · `shell.css` (phone → 72px rail → 240px rail, sheets → drawers → docked panel) · `components.css` (2,501 lines) | ✅ Spec-aligned |
| Docs | `AGENTS.md`, `docs/01`–`07`, 13 UI references, 9 phase records (`phase-01`, `03`–`10`) | ✅ Mature |

---

## 2. Screen Inventory & Maturity Scorecard

| # | Route | Module | Maturity | One-line assessment |
| :-: | :--- | :--- | :-: | :--- |
| 1 | `#/` Today | `views/today.js` (671) | **Strong** | Hero + Pomodoro + weak areas + mistake strip all honest; desktop stat strip gated at 768px |
| 2 | `#/learn` Explorer | `views/learn.js` (385) | **Strong** | Search/filters/expanders solid; one copy bug (§3-P2) |
| 3 | `#/learn/:unitId` Lesson | `views/learn.js` (rest) | **Excellent** | 4 tabs, KaTeX, traps, videos facade, sticky CTA — flagship screen |
| 4 | `#/formulas` | `views/learn.js` | **Solid** | Works; no print/export, no per-formula copy |
| 5 | `#/practice` Arena | `views/practice.js` (470) | **Strong** | 5 mode cards, routing toggle, resume banner, history |
| 6 | `#/practice-run/:id` Runner | `views/practice.js` (rest) | **Solid** | Assisted/independent logic good; linear nav only, no timer |
| 7 | `#/papers` Library | `views/papers.js` (300) | **Strong** | Search + chips + best scores + mock launch |
| 8 | `#/papers/:id` Reader | `views/papers.js` (rest) | **Solid** | 100-Q reader with subject chips; chips scroll away, no jump-to-Q |
| 9 | `#/exam/:sessionId` Live Exam | `views/exam.js` (665) | **Excellent** | Crash-safe timer, OMR sheet/dock, keyboard, integrity lock |
| 10 | `#/omr-print/:id` | `views/exam.js` (rest) | **Excellent** | Clean A4 print sheet |
| 11 | `#/results/:attemptId` | `views/results.js` (585) | ⚠️ **Broken (P0)** | Full analytics/tie-breaker/solutions — but crashes for every timed mock (§3-P0) |
| 12 | `#/you` You & AI | `views/you.js` (1,083) | **Strong** | Vault, CGPA, backup, sync, readiness, mock history — very long page |
| 13 | AI Tutor sheet | `views/ai-tutor.js` (671) | **Excellent** | Grounded offline corpus + BYOK, prompt preview, welcome gate, abort |
| — | Mounted: Benchmark / Share / Study buddies | `views/benchmark.js`, `share-result.js`, `study-buddies.js` | **Solid** | Honest optional community features inside You/Results |

---

## 3. Defects & Spec Gaps (fix before building new things)

### P0 — Results page crashes for every timed mock

* `assets/js/views/results.js` calls `formatDurationClock(...)` **3×** (Time Analysis
  block, lines ~259/262/267) but **never imports it** — the `../core/ui.js` import
  block omits it (`ui.js:27` exports it; `today.js`, `you.js`, `exam.js` all import it
  correctly).
* `stats.js:457` attaches `attempt.analytics` to **every** submission, and
  `analytics.time.captured` is `true` whenever any `questionTimes` exist
  (`stats.js:574`) — i.e. **every mock submitted through the Live Exam runner**.
* Effect: `ReferenceError` while building the results DOM → `renderResultsView`
  rejects → screen stuck on *"Loading Result Analysis…"*. Drills (no `questionTimes`)
  render fine, which is why fixtures/tests missed it.
* **Fix:** add `formatDurationClock` to the `../core/ui.js` import. One line.
* **Gate gap:** add a browser test that renders a results fixture with
  `analytics.time.captured: true`.

### P1 — JELET 2026 corpus missing (promise vs. reality)

* README/`docs/01` promise **5 papers / 500 verified Qs (2022–2026)**;
  `_data/manifest.json` ships **4 papers / 400 Qs (2022–2025)**.
* `docs/07-JELET-2026-FORENSIC-AUDIT.md` (Set A↔B↔C↔D mapping + 3 Final-Key
  overrides) is ready — the ingestion slot exists, the paper JSON does not.
* UI copy is internally consistent at 2022–2025 (chips, placeholders, About card), so
  this is a data/README gap, not a UI bug. Ingest `2026.json` → chips, best-scores,
  `/500` counters and search all light up without UI rewrites.

### P1 — `_data/practice-sets/` empty (Phase 11+ never started)

* The extensible loader (`data-loader.js:314`), source chips and "Extra Practice
  Question Sets" card all work and honestly show **0 packs** — but the roadmap's
  flagship promise (42 Unit Boosters `boost-M01..E08`, sectional speed drills,
  full 100-Q original `mock-ju-01+`) has zero content. This is the highest-leverage
  content work remaining; no UI code is needed to ship it.

### P2 — Polish defects found during the read-through

| # | Issue | Where |
| :-: | :--- | :--- |
| 1 | Theme toggle paints `icon-timer` until JS boots (flash of wrong icon) | `index.html:29` |
| 2 | Learn subject card copy dangles: `"40 Qs · 50 Marks · Units revised"` (no count; meter below already shows `0 / 11`) | `learn.js` subject-card__count |
| 3 | First-run ignores `prefers-color-scheme` → dark-preference users get a light flash before IndexedDB meta loads | `app.js applyTheme` |
| 4 | Dead no-op helper `cardPaper(p)` | `papers.js` |
| 5 | Loading states are plain text (`"Loading Practice Arena…"`) — no skeletons | all views |
| 6 | Bottom sheets don't trap focus or restore it on close (Escape/overlay close only) | `app.js openSheet/closeSheet` |
| 7 | OMR palette states are color-only (answered/review/left) — glyph or letter overlay would be color-blind safe | `exam.js populateGrid` |
| 8 | `prefers-reduced-motion` covered in `shell.css` only — components.css animations (score ring, meters, toasts) unguarded | `components.css` |

---

## 4. New Feature Proposals (prioritized, law-compliant)

### Wave A — Quick wins (existing engines do the heavy lifting)

| ID | Feature | Why | Lives | Effort |
| :-: | :--- | :--- | :--- | :--- |
| **F1** | **Global command-palette search** — topbar 🔍 opens an 82dvh sheet searching 42 units + 400 PYQs + routes (reuse `searchableQuestions` + `stripLatexForSearch`) | Search exists per-page but never across; biggest daily-driver win | Topbar → sheet | S |
| **F2** | **Question navigator in Practice Runner** — compact OMR-style mini grid (reuse `.omr-grid`) + swipe left/right | 20-Q drills are blind linear today; exam runner already solves this | `practice.js` runner | S |
| **F3** | **Timed drills** — optional countdown in practice runner (minutes selector), feeds the existing `questionTimes` → analytics/time analysis | Exam skill = pacing; analytics pipeline already exists | `practice.js` + `stats.js` | M |
| **F4** | **Due-mistakes badge dot on Practice tab** (honest count from `computeHubSnapshot`, refreshed on sync events) | Mistake queue is the retention loop; it's buried one tap deep today | `app.js` nav | S |
| **F5** | **Pomodoro extras** — 5-min break mode + honest "focus sprints today" counter in `meta` | Timer exists; no session semantics yet | `today.js` + meta | S |
| **F6** | **Copy-answer / copy-response buttons** — per solution block (LaTeX source) and per AI tutor bubble (markdown text) | Students retype formulas into notes today | `ui.js` buildSolutionBlock, `ai-tutor.js` | S |
| **F7** | **Shuffle + last-used drill settings** — persist last Topic Drill filters, add shuffle toggle (seeded, honest) | Repeated drills feel identical today | `practice.js` | S |

### Wave B — Differentiators (medium effort, high retention)

| ID | Feature | Why | Lives | Effort |
| :-: | :--- | :--- | :--- | :--- |
| **F8** | **Formula Flashcards** — flip-card drill generated from `sections[].keyFormulas[]` with the same Leitner spacing (mark "knew / forgot") | Formula memorization is the #1 JELET revision act; data already exists for all 42 units | New `#/practice?panel=cards` mode card (no new tab) | M |
| **F9** | **Attempt comparison** — on Results, honest subject-wise Δ vs your previous attempt (`getAllAttempts` already loads history) | "Am I improving?" is unanswered per-subject today | `results.js` | M |
| **F10** | **Per-paper offline pack picker** — choose which year to cache with exact MB (`manifest.papers[].packBytesEstimate`) instead of all-or-nothing `warmOfflineCorpus` | Storage-conscious phones; sizes are already in the manifest | `you.js` offline card | M |
| **F11** | **AI Tutor conversation memory** — persist last N threads per context key (`questionId` / `unitId`) in IndexedDB meta; "thinking…" indicator; history survives sheet close | Tutor resets to zero on every open — biggest UX gap in an otherwise excellent sheet | `ai-tutor.js` + meta | M |
| **F12** | **Local danger zone** — "Reset all study data" behind typed `RESET` confirmation + live storage usage (`navigator.storage.estimate()`) + dataset version line (`manifest.generatedAt`) | Backup/replace exists; plain wipe + transparency doesn't | `you.js` | S |
| **F13** | **Opt-in local reminder** for due mistakes (`Notification` API, only when `due > 0`, explicit toggle, never on exam route) | Brings the spaced-repetition loop back without any backend | `you.js` pref + `stats.js` | M |
| **F14** | **Weekly report card** — extend `share-result.js` SVG to a "week in review" (sets done, accuracy Δ, streak, mistakes graduated) + `navigator.share()` when available | Share pipeline exists for mocks only | `core/share-result.js` | M |

### Wave C — Content (Phase 11+ per `docs/05`)

| ID | Item | Gate |
| :-: | :--- | :--- |
| **C1** | Ingest **JELET 2026** (`_data/papers/2026.json`) using `docs/07` forensic audit → 500/500 | `verify_corpus.py` Gates 1–4 |
| **C2** | Author **practice-set packs**: `boost-M01..E08` → sectional drills → `mock-ju-01+` (loader ready, zero UI edits) | `verify_corpus.py` + `verify_solutions_sympy.py` + originality law |
| **C3** | Grow `videoLectures[]` beyond 1/video per unit (currently exactly 42 total) — language-balanced BN/EN/HI | Facade law (§1.4) |

> **Law check for new features:** none of F1–F14 add a 6th tab, fake a metric,
> require a backend, or touch scoring. F13 (notifications) and F1 (sheet search) stay
> inside existing shells. F14 keeps the existing "no profile data in payloads" rule
> (SVG is generated locally, shared by the user deliberately).

---

## 5. Page-by-Page UI Refinement Plan

Each screen: what already works (keep), then concrete refinements.

### 5.0 Shell — topbar, bottom nav, sheets, toasts *(applies everywhere)*

**✅ Keep:** phone-first shell, safe-area padding, 5-tab bar → 72px rail → 240px rail,
sheet → drawer → docked-panel morphing, skip link, focus-visible ring, storage notice,
reduced-motion in shell.

🔧 Refine:
1. **Contextual back button in the topbar** for sub-routes (`results`, `formulas`,
   `papers/:id`, `practice-run`) — today each view rolls its own back/Done control;
   unify (immersive lesson/exam keep their own headers).
2. Fix **theme-toggle initial icon** (`icon-timer` → moon) and honor
   **`prefers-color-scheme`** on first paint before IndexedDB meta resolves.
3. **Skeleton loaders** (shimmer blocks in `--bg-surface-subtle`) instead of
   `"Loading …"` text on all 11 views — one shared `renderSkeleton()` helper in `ui.js`.
4. **Focus management:** trap Tab inside open sheets, return focus to the opener on
   close (Escape already closes).
5. **Bottom-nav badge:** small brand-tint count dot on Practice when mistakes are due
   (ties to F4) — honest number only, `0` hides the dot.
6. **Online/offline chip** in topbar (tiny dot) — PWA already tracks connectivity via
   sync engine; offline is currently invisible until a fetch fails.
7. Page-change **fade-in** (120 ms) on `.app-main`, guarded by `prefers-reduced-motion`.

### 5.1 Today (`#/`)

**✅ Keep:** honest greeting/streak strip, hero resume logic, Pomodoro ring with
persistence, quick actions, mistake strip with 1-tap re-drill, weak-area empty state,
2×2 subject grid, mock-history sparkline, desktop 4-tile strip.

🔧 Refine:
1. **Week streak dots** (Mon–Sun mini heatmap) next to the flame chip — 7 circles
   computed from real attempt dates; complements the total count.
2. Hero progress line: show **what the next 3 roadmap units are** under the bar
   (one-line preview) so "Resume Learning" feels like a path, not a single card.
3. Quick Actions → make the row **horizontally snap-scrollable with a 4th card**
   (`Mistake Queue` or `Mock History`) on ≥390px, per the swipeable spec in `docs/02`.
4. Pomodoro: add **break state** (5:00, different ring color via status token) and a
   daily sprint counter (F5); long-press/secondary button for settings later.
5. Subject cards: add **per-subject PYQ accuracy** (already computed in
   `subjectStats`) as a right-aligned mono chip — currently only units/PYQs counts.
6. Desktop: move Mock History card **into the bento row beside Weak Areas** at
   ≥1024px to shorten the vertical scroll.

### 5.2 Learn explorer (`#/learn`)

**✅ Keep:** search blob across formulas, filter chips, subject accordions with real
revised counts, unit rows with PYQ counts/est-time/high-yield, floating AI pill.

🔧 Refine:
1. **Copy fix:** `"40 Qs · 50 Marks · Units revised"` → `"11 units · 40 Qs · 50 Marks"`
   (drop the dangling phrase; the meter row already says `0 / 11`).
2. **Search highlighting** — bold/underline the matched substring in unit titles
   (search already filters; feedback of *why* it matched is missing).
3. Add **`Bookmarked` filter chip** alongside All/High Weightage/Studying/Revised
   (bookmarks map already loaded everywhere else).
4. Subject accordion: show a **high-yield count** (`3 high-yield units`) in the header
   meta; today `examFrequency` is only visible inside rows.
5. Empty search state → offer **3 suggested queries** (e.g. "Cayley-Hamilton",
   "Thevenin", "buffer") as tappable chips instead of a dead-end sentence.
6. Desktop ≥1024px: the spec's **2-column bento** isn't implemented — subject cards
   are still one column; grid them at desktop.

### 5.3 Unit lesson (`#/learn/:unitId`)

**✅ Keep:** immersive phone header + position bar, 4 tabs, worked examples, traps,
personal note, PYQ reveal with SymPy steps, video facade law, sticky CTA, desktop
outline card, prev/next unit.

🔧 Refine:
1. **Phone TOC:** outline card is `display:none <1024px` — add a collapsible
   "Jump to section" `<details>` at the top of the Workbook tab (anchors already exist:
   `#sec-<anchor>`).
2. **Scroll progress hairline** under the lesson topbar (page scroll %, token-colored)
   — position bar shows unit position, not reading progress.
3. Videos tab: **language filter chips** (Bengali/English/Hindi) above the list;
   show total watched (`2 / 5 watched`) in the tab label once >1 video exists.
4. Formula cards: add **copy-LaTeX button** (F6) next to "Explain this step".
5. PYQ tab: **subject/year sub-chips** when a unit maps to many PYQs (M01 has 16);
   currently a flat stack of 16 full cards.
6. Sticky bottom bar: show **pyq count + last practiced accuracy** on the primary CTA
   (`Practise this topic (16 PYQs · 62%)`) — honest, from `questionStats`.
7. **Reference model (owner-selected, 2026-11-25):** the sister repo's fixed 15-block
   unit anatomy (overview → anchored topic sections → formulas → definitions →
   comparisons → MCQs → SAQ/LAQ → practice → quick revision → watch & learn) is
   documented with a JELET mapping in
   [`docs/references/DIPLOMA-3RD-SEM-UNIT-SYSTEM-REFERENCE.md`](references/DIPLOMA-3RD-SEM-UNIT-SYSTEM-REFERENCE.md) —
   mine it when the Learn-enrichment phase executes; keep JELET's JSON + gates
   architecture (no static-HTML port), and note its SAQ/LAQ blocks conflict with the
   MCQ-only exam law unless re-expressed as worked examples / practice-set items.

### 5.4 Formula sheet (`#/formulas`)

**✅ Keep:** subject chips, per-unit cards, AI explain, search, links back to unit.

🔧 Refine:
1. **Print / Save-as-PDF** button (reuse print styles from OMR sheet; students
   physically revise from printed formula sheets).
2. **Collapsible unit sections** (`<details>`, first open) — 42 cards of full length
   is a marathon scroll.
3. **Copy LaTeX** per formula + "copy all formulas of this unit".
4. Sticky **subject chips while scrolling** (currently chips scroll away inside
   `.sticky-filter-bar` — verify the bar actually sticks above the card stack).
5. Add a **"formulas you haven't revised" filter** (unit progress status × formula
   presence) — ties the sheet to the roadmap.

### 5.5 Practice arena (`#/practice`)

**✅ Keep:** Independent/Assisted segmented control with explanatory note,
adaptive/balanced routing gate at 5 attempts, source chips, 5 mode cards, resume
banner, mistake lists with due/scheduled/graduated, recent results.

🔧 Refine:
1. Mode cards: show **last-used configuration** as a subtitle (`Last: MATH · 10 Qs ·
   Balanced`) and a **"Repeat last drill"** ghost button.
2. Source chip `Practice Sets (0)` → when 0, render it **disabled with a `Soon` pill**
   instead of an empty pool error on click.
3. Recent Results: show **top 6 → "View all (N)"** link into a history list (You page
   has mock history; drill history has no full view).
4. Exam-Style Paper panel: add **per-year best score** next to each Start button
   (`paperBestMap` already computed) to motivate the right retry.
5. Mistake panel: add a **7-day due calendar strip** (dots per day) under the header
   so "scheduled 1d/3d/7d" is visual, not just text.
6. Routing card: move it **below the mode cards on phone** (it currently pushes the
   primary cards below the fold) — it's a preference, not an action.

### 5.6 Practice runner (`#/practice-run/:id`)

**✅ Keep:** assisted auto-reveal for Cat-I, Check Answer for Cat-II, hint box,
previous-answer banner, flag/bookmark, double-submit guard, empty-pool guard.

🔧 Refine:
1. **Mini question navigator** (F2): compact grid pill above the progress meter →
   jump to any question; states = answered/unanswered/current (reuse OMR cell CSS).
2. **Swipe left/right** between questions on touch (with button fallback).
3. Optional **session countdown** (F3) in the header row next to the mode pill.
4. Show **live session tally** in assisted mode (`3 correct · 1 wrong so far`) —
   independent mode must stay silent until submit (exam honesty).
5. Bottom bar: make **Prev/Next a sticky thumb bar** (like exam's
   `.exam-bottom-bar`) instead of in-flow buttons that scroll away on long stems.
6. On finish failure paths, the toast already preserves answers — add a persistent
   **inline retry banner**, not just a 2.6 s toast.

### 5.7 Papers library (`#/papers`)

**✅ Keep:** search across all PYQs, year/bookmark/Cat-II/voided chips, honest key
badges, best score, action bar (Read/Print/Mock), active-mock resume banner.

🔧 Refine:
1. Paper card: add **per-subject mini bars** (from best attempt's `bySubject`) when a
   best exists — turns the card from metadata into a diagnostic.
2. **Search match highlighting** in question results (same helper as Learn).
3. When a year chip is active, show a **compact "Open2024 →" header** above results.
4. Add **2026 chip + card automatically** the moment `2026.json` lands (C1) —
   verify chip list is data-driven rather than hardcoded `PAPER_CHIPS` (it is
   hardcoded today; consider deriving from `manifest.papers`).
5. Empty bookmarked state: add **1-tap "Browse all papers"** CTA inside the card.

### 5.8 Paper reader (`#/papers/:id`)

**✅ Keep:** subject/Cat-II chips, per-question bookmark + note, solution reveal with
official-key highlight, print/mock actions, key document reference.

🔧 Refine:
1. **Sticky subject chips** — they currently scroll away with the header card.
2. **Jump to question** input (`Go to Q#` → scrolls to `#qcard-<id>`).
3. **Collapse/expand all solutions** toggle; **"Hide answered/revealed"** filter for
   re-reads.
4. Reader header: show **your personal best** for this paper (from `paperBestMap`) —
   library card shows it, reader doesn't.
5. On phone, add a **back-to-top floating button** after Q40+ (100 cards deep).

### 5.9 Live exam runner (`#/exam/:id`)

**✅ Keep:** crash-safe ms timer + 5s persist, subject jump strip, OMR sheet +
desktop dock, multi-bubble warning, Cat-II callout, keyboard shortcuts, integrity
lock, submit modal summary, auto-submit, pause/resume.

🔧 Refine:
1. **Color-blind-safe OMR cells:** overlay a glyph — `✓` answered, `!` review, `–`
   left (color stays as-is; text alternative already in `aria-label`).
2. Submit modal: add **per-subject unanswered list** (`Maths 4 · Physics 2 …`) with
   tap-to-jump before confirming.
3. Timer: **5-min/1-min warning states** already switch color — add an optional
   single haptic pulse (`navigator.vibrate(80)`, gated behind a setting, off by
   default for iOS where it's unsupported anyway).
4. Palette sheet: add **"Jump to first unanswered"** button under the grid
   (high-value during the last 10 minutes).
5. Question card: persist a visible **"answers auto-saved ✓"** micro-indicator that
   pulses on each `persistNow()` (reduces save anxiety; data is already safe).
6. Desktop: show the **shortcut legend as a `?` popover** instead of only footnote
   text.

### 5.10 Printable OMR (`#/omr-print/:id`)

**✅ Keep:** A4 4-column layout, Cat I/II marking, rule legend, name/date fields.

🔧 Refine:
1. Add **cut/fold guidelines** and a footer with the paper's key reference.
2. Print-only CSS audit: ensure `@media print` hides app chrome even when printed
   from the in-app button (verify `.no-print` coverage — currently only the top
   action row).
3. Optional **QR/link line** back to the digital paper (relative URL, prints fine).

### 5.11 Results (`#/results/:id`) — *fix P0 first*

**✅ Keep:** exact twelfths hero, JU band (never fake ranks), 9-step tie-breaker,
analytics sections, wrong-key list with jump-to-question, outcome filter chips,
per-item solutions with AI, flag/re-drill/bookmark, share + benchmark mounts,
priority-revision links.

🔧 Refine:
1. **P0:** import `formatDurationClock` (§3).
2. **Sticky bottom action bar on phone** per reference `03`: `Retry independently` +
   `Review answers` (scroll-to-items) — the current top-right buttons get lost after
   the analytics stack.
3. **Subject Δ vs previous attempt** (F9): one strip under the hero —
   `Maths +4.25 vs last mock` (honest, local, from history).
4. Add **`Flagged` filter chip** (mistake-flagged items) alongside outcome filters.
5. Score ring: **animate stroke on first paint** (respect reduced motion).
6. Wrong-key item rows: show **time spent** (`Q47 · 2:14`) when analytics captured it —
   the slow-question pills exist but the per-item row doesn't.
7. Empty "Review" state (0 items filtered): offer **"Retake only incorrect (N)"**
   one-tap session (creates a mistake-redrill session from this attempt's misses).

### 5.12 You & AI (`#/you`)

**✅ Keep:** privacy banner, honest readiness estimate, mock trends, CGPA checker,
BYOK vault with masked key/test/clear, activity tiles, AMOLED switch, offline pack,
signed backup with merge/replace confirm, encrypted sync with full disclosure,
study buddies, benchmark, contribute card.

🔧 Refine:
1. **Section anchor nav** (sticky chip row: Privacy · Readiness · JU Check · AI ·
   Activity · Backup · Sync · Community) — the page is ~1,100 lines of DOM; anchors
   are the cheapest fix (no route changes, no 6th tab).
2. **Reorder for frequency:** move AI Vault + Preferences above Mock History;
   demote Benchmark/Study-buddies/Contribute into one collapsible
   **"Community (optional)"** group — currently three text-heavy cards dilute the
   vault UX.
3. Add **Mistake Queue tile** to My Activity (reference `01` shows it; today only
   Bookmarks + Recent Units exist).
4. Add **dataset version line** (`Corpus v3.0.0 · generated 2026-11-23 · 400 Qs`)
   under About — provenance is a brand promise; surface it.
5. **Storage usage bar** (`navigator.storage.estimate()`) above the offline pack row.
6. **Danger zone** (F12): typed-`RESET` wipe, export-first nudge.
7. Sync card: when enabled and healthy, collapse technical fields behind
   **"Advanced"** — passphrase inputs on the main scroll are intimidating.

### 5.13 Codec AI Tutor sheet

**✅ Keep:** ground-truth system prompt, offline corpus fallback (Bengali/EN),
welcome agreement, byte-exact prompt preview with live JSON, AbortController,
exam integrity lock, context card, preset chips, provider error → offline fallback.

🔧 Refine:
1. **Conversation persistence** (F11) per context key + "thinking…" bubble while
   awaiting BYOK response (today only the Send button flips to `Stop`).
2. **Copy response** button on each assistant bubble.
3. Sheet: add a **drag-to-dismiss** gesture on the handle (visual handle exists;
   swipe-down close is the platform pattern for 82dvh sheets).
4. On desktop ≥1024px the sheet docks at 400px — add a **pin toggle** so it stays
   open while browsing results (reference `10` shows docked tutor beside results).
5. Chips: add **"Explain in simpler words"** and **"Give me a similar PYQ"**
   (offline corpus can answer the second via unit PYQ list).
6. Show a **corpus-mode vs BYOK cost hint** (`0 tokens used offline`) to reinforce
   the free-tier story.

---

## 6. Cross-Cutting Design-System Upgrades

| Upgrade | Scope | Notes |
| :--- | :--- | :--- |
| Skeleton loader primitive | `ui.js` + `components.css` | One `renderSkeleton(view)` used by all 11 views |
| Focus trap + focus return | `app.js` sheets | a11y: keyboard users currently tab behind overlays |
| Reduced-motion audit | `components.css` | Ring/meter/toast/analytics transitions — only `shell.css` is guarded today |
| Color + glyph state system | `components.css` `.omr-cell`, outcome badges | WCAG: never state-by-color alone |
| Sticky thumb bottom bar pattern | results, practice runner | Reuse `.exam-bottom-bar` styling; spec `03` calls for it |
| Empty-state pattern | all views | Icon + 1 sentence + 1 primary CTA + 1 ghost link (mostly there; standardize) |
| Print stylesheet pass | formulas, results summary, OMR | `@media print` rules beyond `.no-print` |
| Desktop hover/active polish | `shell.css` rail | Hover states exist for tabs; add for cards (subtle shadow lift) |
| Toast duration by length | `ui.js` `showToast` | 2.6 s is tight for two-line messages |
| Test: render every route | `tests/` + browser gate | Fixture attempts incl. `time.captured: true` — would have caught P0 |

---

## 7. Recommended Execution Plan (waves + gates)

| Wave | Content | Exit gate (all must pass) |
| :--- | :--- | :--- |
| **1 — Stop the bleeding** | P0 results import · theme icon/prefers-color-scheme · Learn copy fix · `cardPaper` cleanup · reduced-motion + focus-trap · results browser fixture with `time.captured` | `node --test` · `check_tokens_and_links` · `check_responsive` (360/390/414/1440) · manual: submit a mock → Results renders |
| **2 — Per-page polish** | §5 refinements (skeletons, sticky bars, section anchors, OMR glyphs, search highlighting, phone TOC, viewer utilities) | same gates + TalkBack/keyboard pass on phone + 200% zoom |
| **3 — Features** | Wave A (F1–F7), then Wave B (F8–F14) one at a time, each with its unit/browser test | gates per feature + privacy review (no new network surface except F13 local notifications) |
| **4 — Content** | C1 2026 ingestion → C2 booster packs → C3 video growth (Phase 11+ of `docs/05`) | `verify_corpus.py` + `verify_solutions_sympy.py` + originality law |

Per `AGENTS.md` §5: record evidence in `docs/phases/`, **no PR/merge without owner
sign-off**, `_data/` truth-schema changes only with verification records.

---

## 8. Open Questions for the Owner

1. **Priority order:** Wave 1 is non-negotiable (P0). After that — polish (Wave 2),
   features (Wave 3), or content (Wave 4: 2026 + boosters) first?
2. **JELET 2026:** is the official Set-A PDF available in the private vault for
   ingestion (`docs/07` already maps it)? That single item closes the biggest
   promise-vs-reality gap.
3. **Feature taste-check:** is F8 (Formula Flashcards) or F1 (global search) more
   valuable to your daily flow? They're the two biggest UX bets.
4. **Notifications (F13):** worth the permission prompt, or keep the app 100%
   permission-silent?
5. Any **6th-destination temptation** (e.g. a "Saved/Bookmarks" tab)? Current law
   says no — F1 search + You activity tiles cover the same need; confirm before
   any nav change.
