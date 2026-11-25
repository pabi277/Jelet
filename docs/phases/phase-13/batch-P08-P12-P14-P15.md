# Phase 13 — Batch 2 Evidence: P08 · P12 · P14 · P15 (2026-11-25)

Owner signed off batch 1 ("Thats good on every front"); `provenance.reviewedBy/
reviewedAt` for M02/M03/M07/M11 were stamped **owner-approved** in the drafts
(`scripts/_build/study_packs/`) and the shipped `_data/units/*.json` in this
batch, so future applier re-runs cannot regress them to `pending`. Per plan
§3.4 the next batch is **Batch 2 = P08 (Flow of Fluids), P12 (Reflection of
Light on Spherical Surfaces), P14 (Lens), P15 (Photoelectric Effect)** — all
four now carry the full owner-approved v2 anatomy plus the video-enrichment
contract.

## Study Pack anatomy shipped (drafts in `scripts/_build/study_packs/`)

| Unit | Primers | Formulas | Definitions | Comparisons | MCQs | Hooks | Mistakes | Checklist | Reading |
|---|---|---|---|---|---|---|---|---|---|
| P08 | 6 | 15 | 10 | 4 | 10 | 10 | 9 | 11 | 1 |
| P12 | 6 | 14 | 10 | 4 | 10 | 10 | 9 | 11 | 1 |
| P14 | 6 | 15 | 10 | 4 | 10 | 10 | 9 | 11 | 1 |
| P15 | 6 | 14 | 10 | 4 | 10 | 10 | 9 | 11 | 1 |

Every primer carries an inline **Micro-check**; MCQs are per-question reveal
(never scored/stored); IDs follow `<UNIT>-PRD/SF/DEF/CMP/MCQnn`, unique per
unit; provenance = `pending` owner spot-check until batch sign-off.

### Scoping notes (avoids overlap with shipped truth)

- P08 stays flow-machinery-first: pressure → Pascal → buoyancy/Archimedes →
  streamline vs turbulent → continuity → Bernoulli + efflux/Torricelli →
  viscosity → Stokes → terminal velocity. Surface tension and capillarity are
  explicitly out of the pack (not in the unit's syllabus notes).
- P12 covers the reflection law → spherical mirrors (sign convention, mirror
  formula, magnification) → image-nature tables → inclined-mirror image
  counting (even/odd rule incl. the bisector exception) → mirror uses.
- P14 covers refraction basics → spherical-surface refraction → lensmaker →
  thin-lens formula → power of a lens → lens combinations (contact/separated,
  incl. the equivalent-power MCQ fixed below) → behaviour checks.
- P15 covers the photoelectric observations (intensity vs frequency) →
  threshold/stopping potential → Einstein's equation → PE curves → work
  function numerics; de Broglie stays a pointer (own unit's territory).

### Evidence citations (fact base, docs/06 §3.1)

- P08 ← NCERT Class 11 Physics Part II, Ch. 10 (Mechanical Properties of
  Fluids), §10.1–10.6
- P12 ← NCERT Class 12 Physics Part II, Ch. 9 (Ray Optics), §9.1–9.2
- P14 ← NCERT Class 12 Physics Part II, Ch. 9 (Ray Optics), §9.4
- P15 ← NCERT Class 12 Physics Part II, Ch. 11 (Dual Nature), §11.1–11.4

All shipped text is original prose; no book bytes, no URLs in `furtherReading`
(gate-enforced).

## Numerics verification (SymPy, exact arithmetic) — caught a real error

Full B2 sweep over every MCQ key, explanation arithmetic chain and primer
micro-check number: **31/35 on the first pass**. The 3 non-passes were
formulation artifacts of the checker (float-equality vs `Rational`, interval
vs relational inequality) — the authored math was confirmed correct at exact
rationals/numeric sample points. **1 was a real authored error**: P14-MCQ10
claimed +9 D equivalent power for `+5 D` and `+5 D` lenses *separated by 5 cm*
— but `5 + 5 − 0.20·5·5 = 5 D`, not 9 D. Fixed in the draft **and** the
shipped unit by changing the separation to **4 cm** (`10 − 1 = +9 D`,
explanation rewritten). Final sweep: **35/35 PASS**. Corpus gate
`verify_solutions_sympy.py`: 400/400 (unchanged).

## Video enrichment (batch 2, same metadata law as the pilot + batch 1)

Every new ID verified live via YouTube oEmbed (title + channel); every
duration read from the YouTube watch page `Length` header — never invented.
Rejected during curation: `0XISEy1LMg8` (7:09, 542 views), `iegyO2nO3uE`
(9:27), `J6QlyT-QwfU` (9:23), `omiMccV__aE` (28:58 but **89 views** — same
exam-grade bar that rejected batch 1's 138-view candidate), `x83Abk0L9Nk` /
`xLVsHo3CdvA` (video unavailable), `HfXI07e8vII` (2:30, 39 views),
`gChY7EmYdxk` (9:13 — below the length bar).

| Unit | ID | Lecture (channel, language) | Length |
|---|---|---|---|
| P08 | O_HQklhIlwQ | (pre-existing) fluids lecture (en) | 49 min |
| P08 | R8gN-kDi5E8 | Mechanical Properties of Fluids full-chapter one shot (Prashant Kirad 11th & 12th, hi) | 168 min |
| P08 | fY6huKUsZFk | Bernoulli's Principle one shot (Vedantu 11&12, hi) | 68 min |
| P08 | KHncWNl2xtQ | Viscous drag, Stokes' law, terminal velocity & real fluids (Physics Inside Out, hi) | 73 min |
| P12 | xv5P7dM4EKA | (pre-existing) reflection lecture (en) | 23 min |
| P12 | mj1KloAu3B4 | Images formed by two plane mirrors at an angle (Make Me Scientific, hi) | 15 min |
| P12 | gumOVMoApCE | Uses of spherical mirrors (Magnet Brains, hi) | 28 min |
| P12 | BhVgw9musZY | Magnification in spherical mirrors WBCHSE (LET'S IMPROVE, bn) | 26 min |
| P14 | VKMswYSiyko | (pre-existing) lens lecture (en) | 29 min |
| P14 | ygUfE9Kg3xw | Lens maker's formula + thin-lens formula (EduPoint, hi) | 35 min |
| P14 | Kjg61WcSNHU | Lens maker's formula part 1 (EduPoint, hi) | 26 min |
| P14 | QkCdeGv3rfE | Lens formula derivation (Magnet Brains, hi) | 25 min |
| P15 | 3YF12Orwol4 | (pre-existing) photoelectric lecture (en) | 18 min |
| P15 | tfyUR573fkY | Dual Nature one shot + PYQs (Arvind Academy, hi) | 90 min |
| P15 | 2JYSVsXV3Ac | Photoelectric effect part 1 (Physics Wallah, hi) | 89 min |
| P15 | F-BXdS3yhN8 | Einstein's photoelectric equation WBCHSE (LET'S IMPROVE, bn) | 22 min |

Each entry carries an exam-relevant `scopeNote`; facade + external deep links
only (zero auto-iframes). Language mix: P12 and P15 hit bn+hi+en; **P08 and
P14 ship en+hi** — every Bengali candidate surfaced for fluids/lenses was
either dead, sub-10-minute, or under the exam-grade view bar (documented
above) rather than padding with a weak pick.

## Gate results (all green)

- `verify_corpus.py` PASS — 400q / 42u / 109 SVG, **Study Packs: 11/42
  validated (C03, E05, M01, M02, M03, M07, M11, P08, P12, P14, P15)**
- Negative tests: P12 dropped to 11 formulas → rejected (below-12 range rule);
  duplicate `P14-MCQ01` id → rejected with explicit duplicate list (both
  restored, gate re-PASS)
- `verify_solutions_sympy.py` 400/400
- `node --test` **130/130** (contract now: `PACKED_UNITS` = pilot + batch 1 +
  batch 2 → 11; batch isolation covers the other 34; 4+ curated videos per
  packed unit)
- `check_tokens_and_links.mjs` PASS (336 files)
- Browser: `check_responsive.mjs` 43/43 · `check_community.mjs` 23 ·
  bespoke study-pack harness re-scoped to batch 2 (P08/P12/P14/P15 render +
  MCQ reveal at 4 viewports, P09 now the empty-state probe) → PASS ·
  tab+videos check PASS
- SW bumped `jelet-v3-sw-17` (unit JSON changed)

## Owner actions pending (plan §4 step 5, batch cadence)

1. Spot-check the four packs on device: `#/learn/P08?tab=study`,
   `#/learn/P12?tab=study`, `#/learn/P14?tab=study`, `#/learn/P15?tab=study`;
   videos at `?tab=videos`.
2. Sign off → `provenance.reviewedBy/reviewedAt` stamped for B2 and re-applied.
3. On approval, proceed to Batch 3 = C01/C04/C06/C07.
