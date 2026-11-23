# 05 — Staged Implementation Roadmap, Acceptance Gates & Dev Workflow

> **Golden Rule:** Follow **gates, not calendar guesses**. No phase starts until the previous phase's automated scripts and mobile/desktop visual checks pass `100%`.

---

## 1. Phase-by-Phase Roadmap (`Phase 00` → `Phase 10`)

| Phase | Name | Deliverables | Hard Exit Gate (Must Pass `100%`) |
| :---: | :--- | :--- | :--- |
| **`00`** | **Pre-Code Blueprint & Phone-First UI Reference Lock** *(Complete)* | `README.md`, `AGENTS.md`, `prompt.md`, `docs/01`–`07`, `docs/references/ui-v3/` (`01`–`13` Phone-First primary + `UI-REFERENCE-PROMPTS.md`) + Organized Google Drive Vault | Owner approves blueprint; `0` unresolved product/schema ambiguities. |
| **`01`** | **Step 0: Full Docs/Refs Repo Copy + `.gitignore` Copyright Wall → Phone-First Tokens, App Shell & IndexedDB Core** | **Step 0 (Mandatory 1st Work):** Copy complete `README.md`, `AGENTS.md`, `prompt.md`, `docs/01`–`07`, and `docs/references/` (`01`–`13` + prompts) into the repo + create `.gitignore` blocking all PDFs/books/copyrighted files. **Step 1:** `tokens.css` (incl. AMOLED dark mode), mobile-first `shell.css` & `components.css`, SVG icon sprite, Phone 5-tab bottom bar + bottom-sheet primitive → Desktop left rail, `jelet_hub_v1` IndexedDB + `BroadcastChannel` + Backup Export/Import | `100%` of docs & UI refs verified present in repo; `check_tokens_and_links.mjs` passes (`0` raw hex outside `tokens.css` AND `0` `.pdf`/`.epub`/copyrighted files in repo); DB & backup unit tests green; `360×800`, `390×844` & `1440×900` shell verified. |
| **`02`** | **Official PDF Corpus Extraction & SVG Figures (`2024` & `2025`)** | Verbatim extraction of `JELET 2025` & `JELET 2024` Paper-I (`200/200` Qs) from official WBJEEB PDFs + all theme-adaptive SVG diagrams + Official WBJEEB Final Keys (`Set A`, incl. `"W"` voided Qs) + `SymPy`-verified solutions | `verify_corpus.py` & `verify_solutions_sympy.py` pass with **`100/100` markable Qs in 2025** and **`100/100` markable Qs in 2024** (`0` unmarkable, `0` KaTeX errors). |
| **`03`** | **Official PDF Corpus Extraction & SVG Figures (`2022`, `2023` & `2026`)** | Verbatim extraction + SVG diagrams + SymPy-verified solutions for `JELET 2023` (Official Key), `JELET 2022` (Dual-solver + SymPy complete key), and owner-supplied `JELET 2026` (`500/500` total Qs) | All **500 questions across 5 papers** pass Gates 1–4 (`0` missing numbers, `0` missing figures, `100%` mapped to `M01..E08`). |
| **`04`** | **Exact `1/12`-Mark Exam Engine, Phone-First Live OMR Runner & Printable OMR (`Screens 11, 09`)** | `scoring.js` (`twelfths` exact rational engine + 9-step tie-breaker vector), Phone-First Live 2h Timed Mock Runner + `82dvh` slide-up `100-Q OMR Bottom Sheet` (`11`, expanding to desktop split sidebar `09`), auto-save/resume on crash, printable A4 OMR companion sheet | Exhaustive unit tests for Cat-I (`+12/-3/0`), Cat-II (`C=1..4` partial `8/12`, `16/12`, `w>0 → 0`), and `"W"` voided items; crash-reload resumes exact millisecond & bubble state. |
| **`05`** | **Results Analytics, Extensible Practice Sets Engine, Leitner Queue & Practice Modes (`Screens 03, 04, 12, 10-Left`)** | Phone-First Results screen with JU Historical Cutoff Bands, 9-step tie-breaker breakdown, item-by-item solution & trap cards, `Independent` vs `With Assistance` toggle, **Extensible `_data/practice-sets/` Loader & Source Filter (`Official PYQs` vs `Practice Sets` + starter verified Booster pack)**, Topic Drill, Category-II Mastery Drill, and Leitner Spaced Review | Assisted attempts verified never to pollute Independent Accuracy; dropping a new `_data/practice-sets/<id>.json` renders automatically with `0` UI code edits and keeps `Official PYQs (/500)` counter strictly separate. |
| **`06`** | **Complete 42-Unit Learn Workbooks + Curated YouTube Video Lectures (`Screens 05, 06`)** | Authoring all **42 official JELET-2026 unit JSON workbooks** (`11 Maths + 15 Physics + 8 Chemistry + 8 FEEE`): KaTeX formulas, SymPy-checked worked examples, WBJEEB traps, **Curated YouTube Video Lectures (`youtube-nocookie.com` click-to-load facade + native Android YouTube deep-link + `Watched ✔` tracking + calm offline fallback)**, and 2-way links to PYQs & Practice Sets | `42 / 42` units populated (`0` `"No lesson yet"` states); `0` auto-loaded iframes on initial page load; every worked example verified by `verify_solutions_sympy.py`; offline mode renders `0` broken video frames. |
| **`07`** | **Today Dashboard, Focus Timer, JU Target & CGPA Tools (`Screens 07, 13, 01, 08`)** | Phone-First `Today` dashboard (`07`), 42-Unit Study Roadmap sequencer, persistent `25:00` Pomodoro Focus Timer, `Papers` library (`02` cleaned), and `You & AI` hub (`13` + `01`: WBSCTE CGPA → `%` calculator, category selector, AMOLED toggle, storage controls) | Fresh browser shows honest `0` / `—` metrics; submitting 1 drill updates Streak, Practiced, Subject bars, and Roadmap identically across tabs. |
| **`08`** | **CodeC-Style BYOK AI Doubt Tutor (`Screens 12, 13, 10-Right`)** | Isolated `jelet_ai_vault_v1`, Gemini/Groq direct streaming client, `Test Connection`, one-time `"Before you ask"` agreement, Phone-First `82dvh` AI Bottom Sheet (`12`), `"Check prompt before sending"` preview, grounded official-key injection, `Stop` abort, Bengali/English switch | Unit tests assert: (a) backup export never touches `jelet_ai_vault_v1`, (b) preview string `===` network body, (c) AI Tutor hard-locked during active Timed Mock. |
| **`09`** | **Offline PWA, Vendored KaTeX & Opt-In Paper Packs** | `manifest.webmanifest`, staged atomic `sw.js`, vendored KaTeX + WOFF2 fonts, opt-in offline paper/unit packs with failure-safe rollback | Headless Chromium test with `context.setOffline(true)` loads `Today`, `Learn` (math + SVGs), and a downloaded `2025` mock with `0` network errors. |
| **`10`** | **Accessibility, `320px/200%` Zoom, Device QA & GitHub Pages Release** | Keyboard navigation, ARIA semantics, TalkBack/screen-reader labels, `320px` narrow mobile + `200%` font zoom audit, GitHub Actions CI gate + Pages workflow | `axe-core` `0` critical/serious violations; all CI gates green; physical Android phone (`CodeC` / Chrome) owner sign-off. |
| **`11+`** | **Continuous Practice Question Sets Expansion (`_data/practice-sets/`)** | Progressive drop-in authoring of **42 Unit Booster Packs (`boost-M01..E08`)**, **Sectional Speed Drills**, and **Full-Length 100-Q Original JU Ranker Mock Papers (`mock-ju-01+`)** using the Phase `05` practice-set loader (zero UI code edits required) | Every added `<setId>.json` is `100%` originally authored (zero copied textbook text), passes `verify_corpus.py` + `verify_solutions_sympy.py`, and keeps `Official PYQs` vs `Practice Sets` stats cleanly separated. |

---

## 2. Local Preview Workflow (Desktop, Android Termux & CodeC IDE)

Because JELET Study Hub v3 uses **Vanilla ES Modules + Vendored KaTeX + Static JSON**, no Node compilation step is required just to run, edit, or preview the website on your phone:

### A. Inside `CodeC IDE` on Android
1. Clone or open the project folder in **CodeC**.
2. Open `index.html` and launch **Local Web Preview** (CodeC's local HTTP server handles relative `fetch('./_data/...')` and `<script type="module">` natively).
3. Edit CSS tokens, unit JSONs, or JS modules and reload on save.

### B. Inside `Termux` on Android or Desktop Linux/macOS/Windows
```bash
# Serve from repo root on port 8000
python3 -m http.server 8000

# Also test subpath behaviour (matching https://<user>.github.io/<repo>/)
mkdir -p /tmp/gh-pages-sim && ln -sfn "$(pwd)" /tmp/gh-pages-sim/jelet-study-hub
python3 -m http.server 8080 --directory /tmp/gh-pages-sim
# Open http://localhost:8080/jelet-study-hub/
```

---

## 3. Automated CI Gate Suite (GitHub Actions `pages.yml`)

On every Pull Request and `main` push, the workflow runs 4 fast, deterministic checks before publishing to GitHub Pages:

1. **`python3 scripts/verify_corpus.py`** — Asserts `5` papers, `500/500` markable questions, `42/42` non-empty units, valid `Set A` keys, existing SVG diagrams, and `0` KaTeX syntax errors.
2. **`python3 scripts/verify_solutions_sympy.py`** — Re-runs symbolic/numerical math verification on derived keys and worked examples.
3. **`node scripts/check_tokens_and_links.mjs`** — Verifies `0` hardcoded colors outside `tokens.css`, `0` absolute root-breaking paths (`/assets/...` forbidden; `./assets/...` required), `100%` valid internal anchors, and **`0` `.pdf`/`.epub`/`.zip` or copyrighted reference files anywhere in the repository**.
4. **`npx vitest run && npx playwright test`** — Runs `1/12`-mark scoring invariants, IndexedDB backup merge tests, AI vault isolation tests, `axe` accessibility scans, and offline Service Worker smoke tests.
