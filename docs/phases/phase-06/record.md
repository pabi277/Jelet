# Phase 06 — JELET Study Hub (v3): Content & UX Refinement Record

## 1. Summary

Phase 06 delivered a five-slice **content + mobile UX refinement pass** across the
42 syllabus units, the Learn unit view, the Paper Booklet reader, and the You & AI
hub, while keeping the verified 2022–2025 PYQ corpus (`_data/papers/*.json` and
`_data/solutions/*.solutions.json`), the exact `1/12`-mark scoring engine
(`assets/js/core/scoring.js`), and all build/verification gates untouched.

All changes were committed incrementally in priority order and verified against
the full Node + Python gate suite and a headless Chromium responsive audit across
`360px`, `390px`, `414px`, and `1440px` viewports.

---

## 2. Slice 1 & Responsive Hardening (`<=360px` Zero Horizontal Scroll)

- **Root-cause layout fixes (`assets/css/shell.css`, `assets/css/components.css`):**
  - Added universal `box-sizing: border-box`, reset default `body` margins, added
    `overflow-wrap: anywhere` on `.app-shell`, capped embedded media (`iframe`,
    `video`) to `max-width: 100%`, and applied `overflow-x: hidden; overflow-x: clip`
    as a document-level guard (`clip` preserves `position: sticky` behavior).
  - Replaced all 5 `overflow-x: auto` rules in `assets/css/components.css`
    (`.chip-row`, `.math-scroll`, `.question-stem`, `.solution-step__body`, and
    `.exam-subject-strip`) with clean multi-row wrapping (`flex-wrap: wrap`) on
    filter/tab pills and responsive KaTeX wrapping/scaling (`white-space: normal`
    on top-level `.katex` with `white-space: nowrap` preserved on atomic
    `.mfrac`, `.mtable`, `.msqrt`, `.msupsub`, and `.accent` sub-boxes) plus
    `overflow-x: hidden`.
  - Added `min-width: 0` on `.input-field`, `.input-select`, and `.input-textarea`
    so flex/grid form controls shrink cleanly on `360px` screens.
  - Enforced zero `overflow-x: auto` rules in `tests/app-integrity.test.mjs`
    alongside the existing `min-width`-only media-query rule.
- **Headless browser responsive gate (`scripts/check_responsive.mjs`):**
  - Serves the repository over local HTTP, launches headless Chromium
    (`@sparticuz/chromium` / `$JELET_CHROMIUM_PATH` / system Chromium, skipping
    cleanly if no binary is installed), neutralizes `html, body { overflow-x: visible !important }`
    while measuring so real overflow cannot hide behind document clipping, and
    verifies `scrollWidth <= clientWidth (+1px)`, zero console/page errors, and
    zero HTTP `>=400` responses across 10 routes × 4 viewports (`360`, `390`,
    `414`, `1440`) plus 3 interactive `360px` + AMOLED Dark Mode E2E checks
    (**43/43 checks passing**).

---

## 3. Slice 2 — Unit Database Restructure (`_data/units/*.json` + Migration Guard)

- **Expanded all 42 canonical syllabus units (`M01`–`M11`, `P01`–`P15`, `C01`–`C08`, `E01`–`E08`):**
  - Added rich `notes[]` (`126` structured sections across 42 units, 3 per unit)
    with original Polytechnic-to-JELET derivations in KaTeX (`proseLatex`),
    `132` structured `keyFormulas[]`, `77` worked `examples[]`, and `126`
    `wbjeebTraps[]`, while retaining synchronized `sections[]` and
    `workedExamples[]` arrays for backward compatibility.
  - Populated `videoLectures[]` (`42` lectures, 1 per unit) with `{ title, url, duration, provider, videoId, channelName, language, scopeNote }`,
    each verified via the YouTube oEmbed endpoint (`HTTP 200`, embeddable,
    authentic educational channels). Rendered via the `AGENTS.md`-mandated
    click-to-load `youtube-nocookie.com` facade ("Watch Inside App") plus an
    "Open in YouTube App" deep-link with zero preloaded third-party iframes.
  - Added `practiceQuestions[]` (`390` active markable corpus PYQ IDs across the
    40 units that have corpus PYQs; `C07` and `P12` have `[]` because 0 corpus
    PYQs map to those two units, and the 10 board-voided `W` questions remain in
    `pyqIds` for `verify_corpus.py` 1-to-1 bijection while excluded from active
    unit drills). No new or synthetic questions were created.
- **Schema migration guard (`assets/js/core/data-loader.js`):**
  - Added `extractYouTubeId(url)` and `normalizeUnit(raw)` wired into
    `loadUnit(unitId)` so both legacy (`sections` / `workedExamples` / `videoId`)
    and Phase 06 (`notes` / `examples` / `practiceQuestions` / `url` + `duration`
    + `provider`) unit shapes normalize identically at load time.
- **Unit view enhancements (`assets/js/views/learn.js`):**
  - Renders `notes[]` with inline worked examples, a **Focused Unit Practice**
    launcher (`Start Assisted Set` / `Independent Drill`) powered by
    `unit.practiceQuestions`, and click-to-load video lecture cards.

---

## 4. Slice 3 — Dedicated Per-Unit Formula Sheet (`#/learn/:unitId?tab=formulas`)

- Added a first-class **`Formulas (N)`** tab on every unit page (`#/learn/:unitId`
  and deep-linkable via `#/learn/:unitId?tab=formulas` through `route.query` in
  `assets/js/app.js`).
- Aggregates all `keyFormulas` across `notes[]` / `sections[]`, renders offline
  vendored KaTeX equations with AMOLED-safe `var(--fig-*)` tokens
  (`.unit-formula-sheet` in `assets/css/components.css`), wires one-tap
  **Explain** into the Codec AI Tutor, and cross-links each unit card on global
  `#/formulas` (`Unit Formulas →`) back to `#/learn/:unitId?tab=formulas`.

---

## 5. Slice 4 — Unified Paper Booklet Action Bar (`assets/js/views/papers.js`)

- Regrouped **`Read & Keys`**, **`Print OMR`**, and **`Start 2h Mock`** into a
  single compact `.reader-action-bar` (`role="group"`) in both the Paper Booklet
  reader header (`#/papers/:paperId`) and the Papers Library cards (`#/papers`).
- Preserves all existing behavior (`#readerReadKeysBtn` smooth-scrolls to the
  booklet questions, `Print OMR` opens `#/omr-print/:paperId`, and
  `Start 2h Mock` launches the 2-hour WBJEEB mock), while wrapping cleanly on
  `<=360px` viewports with zero horizontal overflow.

---

## 6. Slice 5 — Free-Text College & Custom BYOK AI Model Inputs

- **Free-text College / Department (`assets/js/views/you.js`):**
  - Replaced `<select id="profTargetSelect">` with `<input type="text" id="profTargetInput">`,
    preserving any previously saved `meta.profile.targetBranch` /
    `targetCollege` value on migration and persisting updates to IndexedDB
    (`jelet_hub_v1`).
  - Also fixed an async DOM event bug in `#youDarkSwitchBtn` (`ev.currentTarget`
    captured synchronously before `await onThemeToggle()`).
- **Custom BYOK AI Model & Provider Validation (`assets/js/core/ai-vault.js`, `assets/js/views/you.js`, `assets/js/views/ai-tutor.js`):**
  - Kept provider selection (`gemini` / `groq` / `openrouter`) and added a
    **Model** selector (`Default (...)` vs **`Custom model`**) that reveals
    `#aiCustomModelInput` for any free-text model identifier.
  - Persists `{ useCustomModel, customModel, model }` in the isolated
    `jelet_ai_vault_v1` vault (never exported in signed backups), routes custom
    models into Gemini's `:generateContent` URL and Groq/OpenRouter's JSON
    `model` field, and falls back to `AI_PROVIDERS[provider].defaultModel` when
    blank.
  - Added `validateAiProvider()` and endpoint-origin checks in
    `buildAiRequestPayload()`, `sendBuiltAiRequest()`, and `testAiConnection()`
    so unknown custom providers or endpoints surface a clear error instead of
    silently falling back.
  - Kept the offline corpus-grounded AI Tutor (`buildOfflineCorpusReply`)
    100% independent of API key, provider, or model configuration.

---

## 7. Trade-Offs & Scope Notes

- **Canonical 42-unit IDs preserved:** The repository's binding syllabus contract
  (`AGENTS.md` + `verify_corpus.py`) defines 42 canonical units (`M01`–`M11`,
  `P01`–`P15`, `C01`–`C08`, `E01`–`E08`); all unit files use those exact IDs.
- **Units with 0 corpus PYQs (`C07`, `P12`):** Because no new/unverified exam
  questions may be invented in Phase 06, `C07` and `P12` define
  `"practiceQuestions": []` and receive full rich notes, formulas, worked
  examples, and verified video lectures without synthetic PYQs.
- **Click-to-load YouTube facade:** Per `AGENTS.md` §3.5, unit lecture videos
  never auto-mount third-party iframes on page load; tapping "Watch Inside App"
  mounts `youtube-nocookie.com/embed/...` on demand, and "Open in YouTube App"
  provides a direct fallback.

---

## 8. Final Gate & Responsive Verification Results

- `node tests/db-backup.test.mjs` → **11 / 11 PASSED**
- `node tests/scoring.test.mjs` → **8 / 8 PASSED**
- `node tests/ai-vault.test.mjs` → **5 / 5 PASSED**
- `node tests/app-integrity.test.mjs` → **5 / 5 PASSED**
- `node tests/pwa.test.mjs` → **5 / 5 PASSED**
- **Total Node tests: 34 / 34 PASSED**
- `node scripts/check_tokens_and_links.mjs` → **PASSED** (0 raw hex outside
  `tokens.css`, 0 absolute root paths, 0 broken links, 0 copyrighted files)
- `python3 scripts/verify_corpus.py` → **PASSED** (4 papers, 400 questions,
  109 SVGs, 42 units, 0 control characters, 1-to-1 unit mapping)
- `python3 scripts/verify_solutions_sympy.py` → **PASSED** (400 solutions, 100%
  SymPy-verified)
- `node scripts/check_responsive.mjs` → **43 / 43 PASSED** (10 routes × 4
  viewports `360`/`390`/`414`/`1440` + 3 interactive `360px` & AMOLED Dark Mode
  checks, zero horizontal overflow, zero console errors)
