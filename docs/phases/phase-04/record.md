# Phase 04 — JELET Study Hub (v3) Complete Phone-First PWA Record

## 1. Summary

Phase 04 built the complete, 100% offline-capable, phone-first **JELET Study Hub (v3)** PWA directly on top of the Phase 01 design-token shell and the verified Phase 03 `_data/` corpus (**4 papers `2022–2025`**, **400 PYQs**, **400 SymPy-verified solutions**, **109 theme-adaptive SVG figures**, **42 canonical syllabus units `M01–M11`, `P01–P15`, `C01–C08`, `E01–E08`**, and **10 board-withdrawn `"W"` items**).

All 8 approved incremental slices were built, wired to `./_data/...` and `jelet_hub_v1` IndexedDB, verified against all automated gates, and committed sequentially:

1. **Core Loader, Vendored Offline KaTeX & Exact `1/12`-Mark (`twelfths`) Scoring Engine** (`assets/js/core/math.js`, `scoring.js`, `data-loader.js`, `stats.js`, `assets/vendor/katex/`)
2. **Verified `Papers` Library & 100-Q Booklet Reader** (`assets/js/views/papers.js` — `#/papers`, `#/papers/:paperId`)
3. **Phone-First `Live Timed Exam & OMR Runner` + Printable A4 OMR Sheet** (`assets/js/views/exam.js` — `#/exam/:sessionId`, `#/omr-print/:paperId`)
4. **`Practice` Arena, Assisted/Independent Runner & `Results & Solutions`** (`assets/js/views/practice.js`, `assets/js/views/results.js` — `#/practice`, `#/practice-run/:sessionId`, `#/results/:attemptId`)
5. **42-Unit `Learn` Explorer, Deep `Unit Lesson` Workbook, Click-to-Load Video Facade & `Formula Sheet`** (`assets/js/views/learn.js` — `#/learn`, `#/learn/:unitId`, `#/formulas`)
6. **`Today` Dashboard, Timestamp-Persisted `25:00` Pomodoro Focus Timer & Daily 10-Q Sprint** (`assets/js/views/today.js` — `#/`)
7. **`You & AI` Local Vault, WBSCTE Diploma CGPA → JU Eligibility Checker, AMOLED Dark Mode & Signed Backup Export/Import** (`assets/js/views/you.js`, `assets/js/core/ai-vault.js` — `#/you`)
8. **Scoped, Corpus-Grounded `Codec AI Tutor`** (`assets/js/views/ai-tutor.js` — offline corpus synthesis + optional BYOK Gemini/Groq/OpenRouter with one-time agreement, byte-exact JSON prompt preview, `AbortController` `Stop`, and hard Timed-Mock lock)

---

## 2. Key Architectural Invariants Enforced

- **Exact Integer `twelfths` Scoring (`1 mark = 12 twelfths`):**
  - Category I: `+12` (`+1.00`), `-3` (`-0.25`) on wrong or multi-bubble, `0` unattempted.
  - Category II: `+24 * c / C` when `w === 0` (`8` for `1/3`, `16` for `2/3`, `12` for `1/2`, `6`/`12`/`18` for `C = 4`), `0` if `w > 0`, `0` negative.
  - Board-Voided (`status: "voided"`, key `["W"]`): full `+12` (Cat-I) / `+24` (Cat-II) to all candidates regardless of selection.
  - All 4 official papers (`2022–2025`) verified to sum to `1440` twelfths (`120` marks) on official keys.
  - Full 9-step WBJEEB tie-breaking tuple implemented in `compareAttemptsByWbjeebRules()`.
- **100% Offline Vendored KaTeX (`0.19.1`):**
  - Vendored locally under `./assets/vendor/katex/` (`katex.mjs`, `katex.css`, 20 `.woff2` fonts), normalized to CSS custom properties / `rgb()` with zero CDN requests and `0` `katex-error` outputs across all 400 stems, 1,600 options, 400 solutions, and 42 units.
- **Phone-First Responsive CSS & Strict Token Discipline:**
  - Base styles target `360px–430px` portrait phones and scale upward exclusively via `@media (min-width: 768px)` and `@media (min-width: 1024px)` (`0` `@media (max-width)` rules).
  - `0` raw hex colors outside `./assets/css/tokens.css`; all 109 inline SVGs adapt seamlessly between Daylight Paper and AMOLED Dark themes via `var(--fig-*)` and `currentColor`.
- **Honest Local-First State & Isolated BYOK AI Vault:**
  - Fresh devices render `0` streaks, `0/400` practiced PYQs, `— / 120` mock best, and `0` bookmarks — zero fake ranks or placeholder counters.
  - Optional BYOK API keys reside strictly in `localStorage["jelet_ai_vault_v1"]` and are proven by automated tests never to enter `jelet_hub_v1` IndexedDB or SHA-256 signed backup exports.

---

## 3. Gate Verification Results

- `node --test tests/*.test.mjs` → **25 / 25 tests PASSED** (`db-backup.test.mjs`, `scoring.test.mjs`, `ai-vault.test.mjs`, `app-integrity.test.mjs`)
- `node scripts/check_tokens_and_links.mjs` → **PASSED** (`0` raw hex outside `tokens.css`, `0` absolute root paths, `0` broken relative links, `0` copyrighted files across 276 files)
- `python3 scripts/verify_corpus.py` → **PASSED** (`400` questions, `109` SVG figures, `42` units, `0` orphaned figures)
- `python3 scripts/verify_solutions_sympy.py` → **PASSED** (`400` SymPy-verified solutions validated)
