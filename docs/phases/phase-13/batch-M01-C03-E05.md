# Phase 13 Batch Evidence — Pilot v2 (`M01`, `C03`, `E05`)

**Date:** 2026-11-25 (UTC)
**Branch:** `arena/75454728-jelet`
**Template:** Study Pack **v2** (plan Amendment B — owner-approved after v1 on-device
review was judged too shallow). Pipeline §3 steps ①–⑥ executed for the pilot; step
⑦ owner re-review **pending**; provenance honestly marked `pending`.
**Supersedes:** `batch-M01-C03-E05.md` v1 record (git history).

---

## Owner decisions driving v2 (Amendment B, recorded in plan.md)

1. Full anatomy: primers 5–6 with micro-examples · complete formula family 12–18 ·
   key definitions · comparison tables · **10-MCQ self-test** · deeper hooks/
   mistakes/checklist (8–12 each).
2. MCQ reveal **per question**; self-test MCQs are inline reveal cards — never
   scored, never stored, never routed into practice metrics.
3. Pilot v2 first → owner re-review → batches 1–5 continue with the same template.

## ① Units picked (unchanged)

`M01` (Matrices up to Order 3, 16 PYQs) · `C03` (Acids, Bases & Salts, 15 PYQs) ·
`E05` (AC Sources & Circuits, 7 PYQs — the UI reference lesson).

## ② What was read (Drive, `read_file_text` — PDFs only, zero downloads)

| Unit | Reference read | Drive file ID | Verified title / scope |
| :--- | :--- | :--- | :--- |
| M01 | NCERT Cl-12 Maths P-I `lemh103.pdf` + `lemh104.pdf` | `1rY7QTpt7I_vPmz5slOQDAjCaMtj1GS40` / `1wNvhtFB36WYhs0IRJSEuRiwCt92qEGRk` | Ch. 3 **Matrices** (order/types/equality/transpose) + Ch. 4 **Determinants** (det → minors/cofactors → adjoint/inverse) |
| C03 | NCERT Cl-11 Chem P-I `kech106.pdf` | `1CT2XBEPOLVvVCbZza8eLaThllcJO5uYR` | Unit 6 **Equilibrium** — v2 scopes to the **ionic** half (acid-base theories, Kw/pH, Ka/Kb/Ostwald, common-ion, buffers, hydrolysis, indicators, Ksp); the chemical-equilibrium half is Unit **C05**'s territory (bridge line only) |
| E05 | NCERT Cl-12 Phys P-I `leph107.pdf` | `1xu_IZqP0eJJrzoaa7XJG6Jyb5KynXjZu` | Ch. 7 **Alternating Current** (RMS/mean, phasors, X_L/X_C, series RLC, resonance, power factor, wattless current) |

Scope calibration against the 42-unit registry: `C05 = Chemical Equilibrium`,
`M02 = Determinants` (M01 keeps only matrix-essential determinant laws with an
M02 pointer). No `05E` guidebook opened; no image-only scan used as a fact source;
**zero book prose copied** — every sentence original.

## ③④⑤ What was written and checked

Per unit (`scripts/_build/study_packs/<unitId>.json` → `build_study_packs.py`):

| Block | M01 | C03 | E05 |
| :--- | :--- | :--- | :--- |
| conceptPrimer | 6 (PRD01–06) | 6 | 6 |
| keyFormulas | 16 (SF01–16) | 15 | 15 |
| keyDefinitions | 10 | 11 | 10 |
| comparisons | 4 tables | 4 | 4 |
| mcqSelfTest | 10 keyed MCQs | 10 | 10 |
| memoryHooks / commonMistakes / examChecklist | 11 / 9 / 11 | 11 / 9 / 11 | 11 / 9 / 11 |
| furtherReading | 2 | 1 | 1 |

Content-span notes:
- **M01** primers cover the full unit: matrix anatomy & non-commutativity,
  transpose/symmetry split, determinant essentials, the adjoint–inverse engine,
  special squares (orthogonal/involutory/idempotent/nilpotent), Cayley-Hamilton
  & trace — each with a numeric micro-check.
- **C03** primers cover the ionic span: three acid-base languages, Kw/pH, strong
  vs weak ladder (Ostwald), common-ion & buffers (H-H), salt hydrolysis &
  indicators, Ksp/Q & endpoint arithmetic.
- **E05** primers cover: the sine & its four numbers, pure R/L/C, phasors &
  impedance triangle, series RLC frequency sweep, Q & bandwidth magnification,
  power triangle & wattless current.
- Common mistakes remain **distinct** from `wbjeebTraps[]` (checked per unit).

## Verification evidence

| Gate | Command | Result |
| --- | --- | --- |
| Corpus (v2 studyPack gate) | `python3 scripts/verify_corpus.py` | **PASS** — 400 Qs, 42 units, `Study Packs: 3/42 validated (M01, C03, E05)` |
| studyPack v2 negative tests | corrupt → gate → restore | **7/7 rejected** (MCQ key outside A-D, empty reason, comparison row mismatch, formula count <12, primer count <5, duplicate sfId, wrong-unit defId) |
| MCQ/primer numerics | SymPy script (one-off, `/tmp/jelet-py`) | **28/28 verified** — every MCQ answer and primer micro-example numeric checked (incl. |2A|=24, |adj A|=25, |2A|=−8 for orthogonal |A|=−1, A²=3A−2I, pH 2.87 weak-acid, S=1.34×10⁻⁵, N=0.2, 311 V, 157 Ω, Z=100/0.6, 79.6 Hz, ω₀=1000/Q=100/BW=10, 460 W, XL 7.85 Ω, 159 Hz) |
| SymPy solutions gate | `/tmp/jelet-py/bin/python3 scripts/verify_solutions_sympy.py` | **PASS** — 400/400 |
| Tokens/paths/links/copyright | `node scripts/check_tokens_and_links.mjs` | **PASS** — 327 files, 0 copyrighted files |
| Unit tests | `node --test "tests/*.test.mjs"` | **130/130 PASS** (phase-13 suite rewritten for v2) |
| Responsive | `JELET_PW_ROOT=/tmp/pwtool node scripts/check_responsive.mjs` | **43/43 PASS** |
| Community | `JELET_PW_ROOT=/tmp/pwtool node scripts/check_community.mjs` | **23 PASS**, zero console errors |
| Study Pack v2 browser check | bespoke (360/390/414/1440/1024) | **46/46 PASS** — full anatomy renders (6 primers, 15–16 formulas, 10–11 defs, 4 tables, 10 MCQs each), MCQ reveal interaction verified end-to-end (keyed-only highlight, aria-expanded, hide/clear, zero console errors), calm empty state on M02, no overflow anywhere |

## Infrastructure shipped with v2

- `scripts/verify_corpus.py` — v2 schema gate (10 keys, per-block shapes, id
  conventions `<UNIT>-{PRD,SF,DEF,CMP,MCQ}nn` with uniqueness, comparison
  row/column shape with `columns[0]` as the label column, honest A-D keys).
- `assets/js/views/learn.js` — Study Pack tab renders the full v2 anatomy in
  Diploma-model order; MCQ self-test is per-question reveal (zero storage/scoring).
- `assets/css/components.css` — token-only v2 block identities (`.study-sf` amber
  accent, `.study-defs` definition list, `.study-cmp` wrap-not-scroll tables per the
  no-horizontal-scrollbar law, `.study-mcq` cards with keyed highlighting).
- `tests/phase13-studypack.test.mjs` — v2 invariants (schema, order, wiring, data).
- SW bumped `jelet-v3-sw-14` (kept; JS/CSS changed again).

## Builder note (unchanged, important)

`scripts/_build/build_units.py` is **stale** vs shipped units (drops
`practiceQuestions[]`) — **do not re-run**. Unit truth changes go only through
`build_study_packs.py` (idempotent, byte-identical re-runs).

## Owner actions pending (plan §4 step 5)

1. Re-review pilot v2 on device (`#/learn/M01|C03|E05?tab=study`) — depth, voice,
   MCQ difficulty and reasons.
2. Sign off → `provenance.reviewedBy/reviewedAt` stamped in the drafts and
   re-applied; evidence updated.
3. Approve batches 1–5 (39 units) with the same template.

## Addendum — owner minor changes (2026-11-25)

### Tab sequence (learn.js)

Lesson tabs render in the owner-specified order `Study Pack → Videos →
Formulas → Workbook → Verified PYQs`; browser check confirms the ordered
sequence on M01/C03/E05 (pilot) and M02 (empty state, non-pilot).

### Video enrichment (pilot units)

All IDs verified via YouTube oEmbed; all durations read from the YouTube watch
page `Length` header (oEmbed does not expose duration). Format unchanged:
`duration: "NN min"` + integer `durationMinutes`.

| Unit | ID | Lecture (channel, language) | Length |
|---|---|---|---|
| M01 | 8sWzGgj-4Wc | (pre-existing) Matrices one shot | 18 min |
| M01 | 41Zst_NjNSU | Matrices & Determinants full revision (IITians Care, en) | 49 min |
| M01 | ssguxpJIhZM | Adjoint & inverse 2×2/3×3 quick problems (Let's Unlock Maths, en) | 11 min |
| M01 | sEp7_soozdw | ম্যাট্রিক্স ও নির্ণায়ক full class (SOE Bangla, bn) | 28 min |
| C03 | pbb1L64_qsA | (pre-existing) Ionic equilibrium intro | 14 min |
| C03 | IMrQFibBq9g | Ionic equilibrium one shot: pH, hydrolysis, buffers, Ksp (PW Class 11 Science, hi) | 278 min |
| C03 | zQFDh2lzXh4 | Ionic equilibrium marathon incl. buffer/Ksp (Pankaj Sir Chemistry, hi) | 60 min |
| C03 | rpvUz3lGLl8 | Buffer solutions lecture L5 (Pankaj Sir Chemistry, hi) | 75 min |
| C03 | J7a_DJ5a_1U | আয়নিক সাম্যবস্থায় important questions (SOE Bangla, bn) | 80 min |
| E05 | 2GvqQvohP2k | (pre-existing) Alternating current basics | 24 min |
| E05 | 54chkXMDIcI | AC one shot: RMS, reactance, LCR, resonance, transformer (PHYSICS with Umesh Rajoria, hi) | 302 min |
| E05 | MmgR1lyuhIg | LCR circuit & resonance JEE session (Vedantu JEE, en) | 36 min |
| E05 | Kr0UiVF-tPI | পরিবর্তী প্রবাহ LC oscillation + LCR part 3 (Physics Study Online In Bengali, bn) | 67 min |

Every added entry carries a one-line exam-relevant `scopeNote` tying it to the
unit's Study Pack scope. Zero auto-loaded iframes unchanged (facade + external
deep links only). SW bumped `jelet-v3-sw-15`.

### Post-addendum gate results (all green)

- `node --test` 130/130 (incl. tab-sequence ordered-needle + pilot video checks)
- `verify_corpus.py` PASS (400q/42u/109 SVG, packs 3/42)
- `check_tokens_and_links.mjs` PASS (327 files)
- `check_responsive.mjs` 43/43 · `check_community.mjs` 23 · bespoke study-pack
  browser check 46/46 · tab+videos browser check (pilot assertions) 22/22
