# AGENTS.md — Non-Negotiable Contract for Contributors & Coding Agents

Every human contributor and AI coding agent working in this repository MUST obey these rules without exception. If a prompt or shortcut conflicts with this file, **this file wins** unless the repository owner explicitly amends it.

---

## 1. Scope & Curriculum Law

1. **Modern Pattern Only (`2022–2026`):** Only JELET Paper-I under the 4-subject, 100-question, 120-mark syllabus (**Mathematics 50m, Physics 35m, Chemistry 25m, FEEE 10m**) belongs in `_data/papers/`. Never import `2017–2021` legacy 100-mark papers (*Computer Application, Engineering Mechanics, Strength of Materials, Environmental Engineering*).
2. **Exact 42 Syllabus Units:** Every unit, lesson, formula sheet, roadmap step, and question tag MUST map to one of the **42 canonical unit IDs** (`M01–M11`, `P01–P15`, `C01–C08`, `E01–E08`) defined in `docs/01-PRODUCT-AND-EXAM-SPEC.md`. Never invent out-of-syllabus chapters (e.g., *Electrostatics* in Physics, *Control Systems* in FEEE, or fake chapter counts like `12/28`).
3. **Single Annual Session & Clean Source Separation (`Official PYQs` vs `Practice Sets`):**
   - WBJEEB conducts JELET **once per year** in a single 2-hour OMR session (`11:00 AM – 1:00 PM`). Never create fake "Morning Shift / Evening Shift / Shift 1 / Shift 2" cards.
   - `_data/papers/` holds **strictly official WBJEEB PYQ papers (`2022–2026`, `sourceType: "official-pyq"`)**.
   - Extra practice questions (`Unit Boosters`, `Sectional Sets`, `Full 100-Q JU Mocks`) MUST live in **`_data/practice-sets/*.json` (`sourceType: "curated-practice"`)** from Day 1 so new JSON question packs can be dropped in anytime without UI rewrites and without ever polluting `Official PYQs Practiced (/500)` metrics. Every practice-set item MUST be `100%` originally authored and `SymPy`-verified.
4. **Curated YouTube Video Learning Law (`youtube-nocookie.com` Facade Only):**
   - Every unit workbook (`_data/units/<unitId>.json`) supports `videoLectures[]` (Bengali/English/Hindi free lectures with timestamp start & `Watched ✔` local progress).
   - **Never auto-load YouTube `<iframe>`s on page load**—always render a static zero-network facade card first with (a) **`▶ Watch Inside App`** (`youtube-nocookie.com` mounted only on user tap when online) and (b) **`↗ Open in YouTube App`** deep-link, degrading cleanly with `0` console errors when offline.

---

## 2. The 100% Data Accuracy Law (Zero "Unresolved" Disclaimers)

1. **No Recycled Unverified Markdown:** Never copy legacy `pyq-md` text blindly. Every question in `_data/papers/2022.json`–`2026.json` must be verified word-for-word and symbol-for-symbol against the official WBJEEB `Set A` PDF booklet.
2. **Zero "Not Markable" / "Held" Questions:** Every paper in `_data/papers/` MUST contain **100 out of 100 playable, scoreable questions** (including board-voided `"W"` items, which award full marks per official WBJEEB rules). If a stem or option contains a circuit, graph, ray diagram, logic gate, or chemical structure, its verified SVG MUST exist in `_data/figures/<year>/` before the paper can be marked complete.
3. **No Accuracy-Disclaimer Banners:** Because imperfect data is blocked at build time by `scripts/verify_corpus.py`, the UI must never ship *"Some question text and answers have unresolved issues"* banners or *"Unverified Key / Unresolved Issue"* badges.
4. **Tiered Key Honesty & SymPy Proof:**
   - `2023`, `2024`, `2025`, and `2026` use WBJEEB's official Final Answer Key (`keyTier: "official"`), preserving exact board notice numbers and `"W"` (withdrawn/voided) questions.
   - `2022` (where WBJEEB did not publish an archive key) uses `keyTier: "verified-derived"` ONLY after every question is independently solved from the official `2022` PDF and verified via `scripts/verify_solutions_sympy.py` + dual cross-check.
5. **Exact `1/12`-Mark Integer Arithmetic:** Never use IEEE-754 floating-point addition (`0.1 + 0.2` or `-0.25` float loops) to score exams. Store and sum all scores in **integer twelfth-marks (`1 mark = 12 twelfths`)** so Category-I (`+12` / `-3`) and Category-II partial marks (`+24 × c / C` for `C ∈ {1,2,3,4}`, including `2/3 = 8/12` and `4/3 = 16/12`) are **100% exact**. Format to decimals only when rendering text.

---

## 3. UI, Responsiveness & Design-Token Law

1. **Five Global Destinations Only:** Navigation consists strictly of **`Today` · `Learn` · `Practice` · `Papers` · `You`** (`You & AI` on wide desktop labels). Never add top-level audit clutter (`/coverage`, `/workspace`, `/editorial`) to user navigation.
2. **Phone-First Modern Web Law (`base = phone`, `min-width` only):**
   - **Phone Primary (`<768px`, tuned for `360px–430px` Android/iOS — Screens `01`–`07`, `11`–`13`):** Base CSS MUST be written strictly mobile-first (`0` `max-width` desktop-first layout hacks). Uses `100dvh`, `env(safe-area-inset-top/bottom)`, `48px+` thumb-zone tap targets on options/CTAs, fixed 5-tab bottom navigation bar, horizontal snap-scroll filter pills, and smooth `82dvh` slide-up Bottom Sheets with drag handles for the **`100-Q OMR Palette` (`11`)** and **`AI Doubt Tutor` (`12`)**, plus battery-saving **AMOLED Dark Mode (`#070C0C`)**.
   - **Tablet (`@media (min-width: 768px)`) & Desktop Expansion (`@media (min-width: 1024px)` — Screens `08`–`10`):** Progressively enhances into a left navigation rail (`72px` icon rail → `240px` full rail), multi-column Bento cards, side-by-side Split Exam Runner (`09`), and `400px` right-docked `AI Doubt Tutor` (`10`).
3. **Strict Token Adoption:** Every color, background, border, shadow, spacing step, border-radius, and z-index MUST reference CSS custom properties in `assets/css/tokens.css`. Hardcoded hex values outside `tokens.css` fail `scripts/check_tokens_and_links.mjs`.
4. **Mockup Chrome Exclusion:** Never render phone bezels, iPhone notches, fake `9:41` status bars, macOS window traffic lights, or fake social features (`Live Study Room`, `Rank: 142/12,540`) from concept images. Consult `docs/references/ui-v3/README.md` before building any screen.
5. **Relative Subpath Safety:** Every asset, fetch, link, and Service Worker cache path MUST be relative (`./assets/...`, `./_data/...`) so the app works identically on `http://localhost:8000/`, CodeC Web Preview, Termux, and `https://<user>.github.io/<repo>/`.

---

## 4. Privacy, Storage & CodeC-Style AI Law

1. **100% Local-First & ₹0 Hosting:** No backend server, no Firebase/Supabase login wall, no analytics trackers, no cookies. All study state lives in versioned **IndexedDB (`jelet_hub_v1`)**.
2. **Never Fake User Metrics:** Streaks, practiced counts, accuracy percentages, subject progress bars, and mock bests MUST compute strictly from real user submissions stored in IndexedDB (`0` and `—` on a fresh device). Viewing a page never increments practiced counts.
3. **CodeC BYOK AI Discipline (`docs/04-CODEC-AI-TUTOR-SPEC.md`):**
   - Optional BYOK key (`Google Gemini` default, `Groq` / `OpenRouter` optional) stored in isolated local storage (`jelet_ai_vault_v1`) and **NEVER included in Study Backup JSON exports**.
   - Require the one-time **"Before you ask"** agreement before showing the composer.
   - Always render the collapsible **"Check prompt before sending"** preview showing exact provider, model, and payload.
   - **Ground-Truth Lock:** Every AI request on a question or lesson MUST inject the verified question JSON, official key, marking rule, and SymPy-verified solution with a system instruction forbidding contradiction of the official WBJEEB key.

---

## 5. Phase Gate & Commit Discipline

1. **First Action When Real Code Starts (`Step 0 — Docs & UI Refs Copy First`):** Before creating a single `.html`, `.css`, or `.js` file in a new coding chat or repository, the agent MUST first materialize a **complete local copy** of all architecture Markdown files (`README.md`, `AGENTS.md`, `prompt.md`, `docs/01`–`07`) and all approved UI reference files (`docs/references/UI-REFERENCE-PROMPTS.md` + `docs/references/ui-v3/01`–`13` & `README.md`) from `00_v3_Blueprint_and_UI_Refs/`, alongside a strict `.gitignore`.
2. **Zero-Copyright GitHub Law (Strict Public-Repo Boundary):**
   - **NEVER commit, copy into the repo, or deploy to GitHub Pages ANY copyrighted book, textbook ZIP, coaching sheet, market guidebook, or third-party PDF** (`05_Reference_Books_PRIVATE_NO_GITHUB/*`, `BS_Grewal`, `HC_Verma`, `Jain_and_Jain`, `VK_Mehta`, `Allen`, `NCERT` `.zip`/`.pdf` files, `JELET_Guidebook_*`, or `JELET_2026_SetB_Worked_Solutions_Ref_ONLY.pdf`).
   - `.gitignore` MUST block `*.pdf`, `*.epub`, `*.7z`, `.cache/`, and `private_refs/`, and `scripts/check_tokens_and_links.mjs` MUST fail CI if any `.pdf`/`.epub` or copyrighted asset exists in tracked files.
   - Files in `05_Reference_Books_PRIVATE_NO_GITHUB/` are strictly **read-only private references** for checking syllabus scope and formulas. Every lesson explanation, worked example, formula note, and SVG figure in `_data/` MUST be **100% originally written and SymPy-verified**—never copy textbook prose, textbook exercises, or scanned book diagrams.
3. **Zero Build Required for Everyday Dev:** Keep the app runnable via `python3 -m http.server 8000` (for Termux and CodeC Android Web Preview) with zero mandatory bundler step.
4. **Automated Gates Before Every Phase Close:** Run `python3 scripts/verify_corpus.py`, `python3 scripts/verify_solutions_sympy.py`, `node scripts/check_tokens_and_links.mjs`, and headless browser tests (`360×800` mobile + `1440×900` desktop + `200%` text zoom + offline mode) before declaring any phase complete.
5. **Owner Merge Authority:** Never open a PR, merge to `main`, or alter `_data/` truth schemas without recording verification evidence in `docs/phases/` and receiving owner sign-off.
