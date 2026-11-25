# Phase 13 Batch Evidence — Pilot (`M01`, `C03`, `E05`)

**Date:** 2026-11-25 (UTC)
**Branch:** `arena/75454728-jelet`
**Pipeline:** plan §3 steps ①–⑥ executed for the pilot batch (step ⑦ owner
spot-check = **pending**; step ⑧ = this file).
**Provenance state:** every shipped pack carries
`reviewedBy: "pending — owner spot-check required before merge"` — the honest
pre-sign-off chain. After owner review the loader drafts are updated to the
reviewer name/date and the builder re-applied (byte-identical elsewhere).

---

## ① Units picked

Plan §3.4 pilot: `M01` (Matrices up to Order 3, 16 PYQs — highest traffic),
`C03` (Acids, Bases & Salts, 15 PYQs), `E05` (AC Sources & Circuits, 7 PYQs,
the UI reference lesson). One per major subject.

## ② What was read (Drive, `read_file_text` — PDFs only, zero downloads)

| Unit | Reference read | Drive file ID | Verified title / scope |
| :--- | :--- | :--- | :--- |
| M01 | NCERT Class 12 Mathematics Part-I `lemh103.pdf` | `1rY7QTpt7I_vPmz5slOQDAjCaMtj1GS40` | Ch. 3 **Matrices** (Reprint 2026-27): matrix/order/elements, equality, types (column, row, square, diagonal, scalar, identity, zero) — facts only |
| M01 | NCERT Class 12 Mathematics Part-I `lemh104.pdf` | `1wNvhtFB36WYhs0IRJSEuRiwCt92qEGRk` | Ch. 4 **Determinants**: det as a square-matrix function, minors/cofactors → adjoint/inverse applications (title page + intro verified live) |
| C03 | NCERT Class 11 Chemistry Part-I `kech106.pdf` | `1CT2XBEPOLVvVCbZza8eLaThllcJO5uYR` | Unit 6 **Equilibrium** (Reprint 2026-27): dynamic equilibrium, Kc/Kp relations (reverse → 1/K, ×n → Kⁿ, Kp = Kc(RT)^Δn), Arrhenius/Brønsted/Lewis, ionization constants, common-ion, pH scale, Kw/pKw, buffers, Ksp (unit objectives list verified live) |
| E05 | NCERT Class 12 Physics Part-I `leph107.pdf` | `1xu_IZqP0eJJrzoaa7XJG6Jyb5KynXjZu` | Ch. 7 **Alternating Current** (Reprint 2026-27): RMS = im/√2, household 220 V ↔ 311 V peak, phasors, X_L = ωL (current lags π/2), X_C, series RLC, resonance, P = VI cos φ, power-factor cases, wattless current |

No `05E` guidebook was opened (scope-only law). No image-only scan (BS Grewal /
HCV Vol-2 / VK Mehta) was used as a fact source. All shipped facts are standard
relationships/scope from the agent-readable set; **zero book prose was copied**
(every sentence is original — rule-of-thumb §3 ③ applied at draft time).

## ③④ What was written and checked

Per unit (`scripts/_build/study_packs/<unitId>.json` drafts → merged into
`_data/units/<unitId>.json` by `scripts/_build/build_study_packs.py`):

| Unit | Primer | Hooks | Mistakes | Checklist | Reading |
| :--- | :--- | :--- | :--- | :--- | :--- |
| M01 | 3 (PRD01–03) | 6 | 5 | 7 | 2 (NCERT Ch. 3, Ch. 4) |
| C03 | 3 (PRD01–03) | 6 | 5 | 7 | 1 (NCERT Unit 6) |
| E05 | 3 (PRD01–03) | 6 | 5 | 7 | 1 (NCERT Ch. 7) |

- Common mistakes are **distinct** from `wbjeebTraps[]` (each item checked
  against the unit's existing traps; e.g. the 10⁻⁸ M HCl trap is NOT repeated in
  C03 mistakes — α-vs-Ka confusion is used instead).
- `furtherReading` carries titles/authors/chapter numbers only (gate-enforced:
  URLs / file paths / Drive pointers rejected).
- SymPy sanity (one-off, `/tmp/jelet-py/bin/python3`): 11/11 quantitative
  claims verified — 1/√2 ≈ 0.707, 2/π ≈ 0.637, π/(2√2) ≈ 1.11, √2 ≈ 1.414,
  220√2 ≈ 311 V, Cayley–Hamilton 2×2 identity (symbolic), Q = ω₀L/R =
  1/(ω₀CR), Δf = (R/L)/2π, series-resonance V_L = Q·V_S, Ostwald weak limit
  (lim u→0 of exact/√(Ka·C) − 1 = 0; the pack keeps the exact (1−α) form), and
  Henderson–Hasselbalch 1:1 → pH = pKa.

## ⑥ Gate results (final sweep)

| Gate | Command | Result |
| --- | --- | --- |
| Corpus (+ new studyPack gate) | `python3 scripts/verify_corpus.py` | **PASS** — 400 Qs, 42 units, `Study Packs: 3/42 validated (M01, C03, E05)` |
| studyPack negative tests | corrupt → gate → restore (scripted) | **8/8 rejected** (unknown key, duplicate prdId, empty reviewedBy, URL leak, wrong prdId prefix, missing key, `.pdf` leak, orphan unit file with studyPack) — restored, gate green |
| SymPy | `/tmp/jelet-py/bin/python3 scripts/verify_solutions_sympy.py` | **PASS** — 400/400 verified |
| Tokens/paths/links/copyright | `node scripts/check_tokens_and_links.mjs` | **PASS** — 326 files, 0 hex outside tokens.css, 0 copyrighted files |
| Unit tests | `node --test "tests/*.test.mjs"` | **129/129 PASS** (5 new phase-13 tests) |
| Responsive browser gate | `JELET_PW_ROOT=/tmp/pwtool node scripts/check_responsive.mjs` | **43/43 PASS** — 360/390/414/1440, zero overflow/console errors |
| Community browser gate | `JELET_PW_ROOT=/tmp/pwtool node scripts/check_community.mjs` | **23 checks PASS**, zero console errors |
| Study Pack browser check | bespoke (360/390/414/1440/1024) | **27/27 PASS** — pilot blocks render (1/3/6/5/7/≥1), `?tab=study` chip active, provenance footnote, calm empty state on M02, hook grid 2-col at ≥768px, zero console errors |

## Builder notes (important for future batches)

- `scripts/_build/build_units.py` is **stale** vs shipped units (it would drop
  `practiceQuestions[]`) — **do not re-run it**. Study packs ship only through
  `build_study_packs.py`, which touches ONLY the `studyPack` key and is
  idempotent (byte-identical re-run verified via sha256).
- Browser-gate tooling in this sandbox: `puppeteer-core` + `@sparticuz/chromium`
  at `/tmp/pwtool` (`JELET_PW_ROOT=/tmp/pwtool`); newer `@sparticuz/chromium`
  blocks the `./package.json` subpath, so both check scripts now resolve the
  package root by walking up from the entry (small robustness fix, this commit).
- SW version bumped `jelet-v3-sw-13` → `jelet-v3-sw-14` (CSS/JS changed).

## Owner actions pending (plan §4 step 5)

1. Spot-check pilot content voice/depth (Workbooks → Study Pack tab on M01,
   C03, E05) and the UI presentation.
2. Sign off → `provenance.reviewedBy/reviewedAt` updated to reviewer name/date
   in the drafts, builder re-applied, evidence updated.
3. Approve continuing batches 1–5 (§3.4) or request template adjustments first.
