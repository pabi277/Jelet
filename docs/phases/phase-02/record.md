# Phase 02 — Evidence Record

**Phase:** `02` — JELET PYQ Corpus: Official PDFs → Verified Question Corpus & Manifest
**Status:** ✅ Complete — all automated gates pass
**Date:** 2026-11-23

---

## 1. Overview

Phase 02 materialized the full JELET (West Bengal Joint Entrance Examination)
Paper I question corpus for four examination years (2022–2025) into structured
JSON, built from the official WBJEEB question booklets and validated against
the official Final Answer Keys.

### Source Materials

| Source | Location | Description |
| :--- | :--- | :--- |
| Official PYQ Booklets | Google Drive `02_Official_PYQ_Booklets` | `JELET_2022_Paper_I_SetA.pdf`, `JELET_2023_Paper_I_SetA.pdf`, `JELET_2024_Paper_I_SetA.pdf`, `JELET_2025_Paper_I_SetA.pdf` |
| Official Final Answer Keys | Google Drive | `JELET_2023_Final_Answer_Key.pdf`, `JELET_2024_Final_Answer_Key.pdf`, `JELET_2025_Final_Answer_Key.pdf` |
| README Status Map | Google Drive `02_Official_PYQ_Booklets` | `README_2026_STATUS_AND_SET_MAP.md` — booklet series mapping |

All PDFs were downloaded to the gitignored `.cache/official_pdfs/` directory
only. **Zero PDFs or page renders are tracked in Git.**

---

## 2. Corpus Structure

### 2.1 Paper JSON (`_data/papers/<year>.json`)

Each paper file contains:

- **`paperId`**: `jelet-<year>`
- **`bookletSeries`**: `"A"` (Set A — the booklet series this corpus targets)
- **`sections`**: 4 subjects with qStart/qEnd ranges:
  - **MATH** (Q1–Q40): Mathematics, 50 marks (Cat-1 Q1–30, Cat-2 Q31–40)
  - **PHYS** (Q41–Q70): Physics, 35 marks (Cat-1 Q41–65, Cat-2 Q66–70)
  - **CHEM** (Q71–Q90): Chemistry, 25 marks (Cat-1 Q71–85, Cat-2 Q86–90)
  - **FEEE** (Q91–Q100): Fundamentals of Electrical & Electronics Engineering, 10 marks
- **`questions`**: 100 entries per paper, each with:
  - `id`, `qNumber`, `subjectId`, `unitId`
  - `category`: 1 (Cat-I, 1 mark, negative ¼) or 2 (Cat-II, 2 marks, no negative)
  - `fullTwelfths` / `negativeTwelfths`: score in twelfths (LCM(1,2,3,4)=12)
  - `pdfPage`: source page reference
  - `stemLatex`: LaTeX question stem
  - `stemFigure`: optional figure reference (SVG)
  - `options`: list of 4 options with `id`, `latex`, optional `figure`
  - `key`: `{status, correct, keyTier, sourceRef}` — answer key with provenance
  - `difficulty`: `easy` / `medium` / `hard`
  - `tags`: subject topic tags

### 2.2 Answer Key Tiers

| Year | Key Tier | Source Document | Voided Questions |
| :--- | :--- | :--- | :--- |
| 2022 | derived | Dual-solver + SymPy (no official 2022 key in Drive) | none |
| 2023 | **official** | JEEB/Reg-267/23 (03-08-2023) | 6, 46, 88, 94 |
| 2024 | **official** | WBE/Ex-71 (01-08-2024) | 49, 58 |
| 2025 | **official** | JEEB/Reg-171/25 (16-11-2025) | 41, 79, 84 |

### 2.3 Voided Questions

Voided questions (marked `"W"` in official answer keys) are preserved in the
corpus with `status: "voided"`. They are not markable but remain in the data
for completeness. The scoring engine awards marks to all candidates for voided
questions.

---

## 3. Figure Corpus (`_data/figures/<year>/`)

### 3.1 Stem Figures

Questions that reference diagrams, graphs, or circuits in their stem have an
associated SVG figure (`stemFigure`) rendered as `fig-<year>-q<qnum>.svg`.

### 3.2 Option Figures (Graph/Diagram Questions)

For questions where options (A)–(D) are graphs, circuits, or diagrams rather
than text/math expressions, each option carries a `figure` field pointing to
a dedicated SVG. This prevents spoiling the answer in the stem figure and
accurately represents the visual options from the official booklet.

**Questions with figure-based options:**

| Year | Questions | Description |
| :--- | :--- | :--- |
| 2022 | Q49, Q57, Q62 | Gravitational potential graph, apparent depth vs. height graph, P-V cycle diagram |
| 2024 | Q42 | Projectile velocity-time graphs (vx, vy) |
| 2025 | Q44, Q51, Q58, Q66 | Acceleration→velocity graph, velocity-time in viscous fluid, P-V diagram, displacement-time graph |

Each such question has 4 option SVGs (`fig-<year>-q<qnum>-A.svg` through `-D.svg`).

### 3.3 SVG Color Tokens

All SVG figures use CSS custom properties (`var(--fig-*)`) instead of hardcoded
hex colors. 13 figure color tokens are defined in `assets/css/tokens.css` with
light and dark-mode values:

| Token | Light | Dark |
| :--- | :--- | :--- |
| `--fig-primary` | `#60a5fa` | `#3b82f6` |
| `--fig-positive` | `#34d399` | `#10b981` |
| `--fig-amber` | `#f59e0b` | `#f59e0b` |
| `--fig-negative` | `#f87171` | `#ef4444` |
| `--fig-text` | `#94a3b8` | `#94a3b8` |
| `--fig-text-light` | `#cbd5e1` | `#64748b` |
| `--fig-axis` | `#475569` | `#94a3b8` |
| `--fig-surface` | `#f8fafc` | `#1e293b` |
| `--fig-dark` | `#1e293b` | `#0f172a` |
| `--fig-neg-light` | `#fca5a5` | `#fca5a5` |
| `--fig-pos-light` | `#6ee7b7` | `#6ee7b7` |
| `--fig-amber-light` | `#fcd34d` | `#fcd34d` |
| `--fig-amber-bold` | `#fbbf24` | `#fbbf24` |

**Verification:** `node scripts/check_tokens_and_links.mjs` confirms 0 raw hex
outside `tokens.css` across all 198 scanned files.

---

## 4. Build Pipeline

### 4.1 Source Files (`scripts/_build/`)

| File | Role |
| :--- | :--- |
| `q2022.py`, `q2023.py`, `q2024.py`, `q2025.py` | Question data source files — each exports a list of 11-tuples: `(qnum, subjectId, unitId, category, pdfPage, stemLatex, options, correct, difficulty, tags, figKey)` |
| `build_papers.py` | Reads source files, validates against official answer keys, generates `_data/papers/<year>.json` |
| `build_solutions.py` | Generates step-by-step solution derivations for all 400 questions → `_data/solutions/<year>.solutions.json` |

### 4.2 LaTeX Control-Character Safety

All LaTeX strings in `scripts/_build/` use **raw Python strings** (`r"""..."""`)
to prevent escape-sequence interpretation. The `\vec` corruption (non-raw
strings interpreting `\v` as vertical tab) was a critical defect that has been
fully resolved. `scripts/verify_corpus.py` includes a hard check rejecting
ASCII control characters (`[\x00-\x08\x0b\x0c\x0e-\x1f\t]`) in any
`_data/**/*.json` string.

**Verification:** 0 control characters confirmed across all `_data/` JSON.

---

## 5. Automated Gates Run & Results

| Gate | Command | Result |
| :--- | :--- | :--- |
| Corpus validation | `python3 scripts/verify_corpus.py` | ✅ **PASSED** — 4 papers, 400 questions, 90 figures, 42 units, 0 control chars, 0 stub solutions |
| Token / link / copyright gate | `node scripts/check_tokens_and_links.mjs` | ✅ **PASSED** — 0 raw hex, 0 absolute root paths, 0 broken links, 0 copyrighted files (198 files scanned) |
| Solution structure | `python3 scripts/verify_solutions_sympy.py` | ✅ **PASSED** — 400 solutions (113 SymPy-verified, 287 manual) |
| DB & backup tests | `node tests/db-backup.test.mjs` | ✅ **PASSED** — 0 failures |

### 5.1 Answer Key Verification

All 300 official answer keys (100 per year for 2023, 2024, 2025) were parsed
from the official WBJEEB Final Answer Key PDFs and compared against the JSON
corpus. **Zero mismatches.** Voided question sets also verified:

- 2023: voided = {6, 46, 88, 94} ✓
- 2024: voided = {49, 58} ✓
- 2025: voided = {41, 79, 84} ✓

---

## 6. Compliance Confirmation

- **Verbatim fidelity:** Question stems, options, and answer keys verified
  against official WBJEEB PDFs (via OCR + text-layer extraction + answer-key
  comparison). ✅
- **Zero-Copyright GitHub Law:** No PDFs or page renders tracked in Git;
  all source PDFs in gitignored `.cache/official_pdfs/`. ✅
- **Token adoption:** All SVG figures use CSS custom properties; zero raw
  hex outside `tokens.css`. ✅
- **Figure-option fidelity:** Graph/diagram questions use figure-based options
  (`options[i].figure`) rather than text descriptions, matching the official
  booklet format. ✅

**Sign-off:** Phase 02 corpus is complete and all gates pass.
