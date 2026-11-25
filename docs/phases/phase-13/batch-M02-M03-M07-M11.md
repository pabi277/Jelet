# Phase 13 — Batch 1 Evidence: M02 · M03 · M07 · M11 (2026-11-25)

Owner approved the pilot v2 (`d044860`) **and** the two minor changes
(`c460da3`: tab sequence + pilot video enrichment). Per plan §3.4 the next
batch is **Batch 1 = M02 (Determinants up to Order 3), M03 (Complex Numbers),
M07 (Application of Derivative), M11 (Probability)** — all four now carry the
full owner-approved v2 anatomy plus the same video-enrichment contract.

## Study Pack anatomy shipped (drafts in `scripts/_build/study_packs/`)

| Unit | Primers | Formulas | Definitions | Comparisons | MCQs | Hooks | Mistakes | Checklist | Reading |
|---|---|---|---|---|---|---|---|---|---|
| M02 | 6 | 16 | 10 | 4 | 10 | 10 | 9 | 11 | 1 |
| M03 | 6 | 15 | 10 | 4 | 10 | 10 | 9 | 11 | 1 |
| M07 | 6 | 15 | 10 | 4 | 10 | 10 | 9 | 11 | 1 |
| M11 | 6 | 15 | 10 | 4 | 10 | 10 | 9 | 11 | 1 |

Every primer carries an inline **Micro-check**; MCQs are per-question reveal
(never scored/stored); provenance = `pending` owner spot-check, as with the pilot.
Draft IDs follow `<UNIT>-PRD/SF/DEF/CMP/MCQnn`, unique per unit.

### Scoping notes (avoids overlap with shipped truth)

- M02 stays determinant-machinery-first (Sarrus, properties, Cramer
  consistency court, Δ(x) derivatives, geometry tests); matrix algebra stays in
  the M01 pack — only the bridge identities (`|kA|`, `|adj A|`, `|AB|`) appear.
- M03 packs the i-cycle / conjugate-division engine / quadrant discipline /
  De Moivre / ω toolkit / Argand loci, matching the unit's three notes.
- M07 covers tangents-normals → monotonicity → extrema tests → inflection →
  global extrema & word-problem recipe (subtangent + related rates included).
- M11 covers classical → addition/De Morgan → conditional → independence →
  total probability + Bayes → binomial mean/variance.

### Evidence citations (fact base, docs/06 §3.1)

- M02 ← NCERT Class 12 Mathematics Part I, Ch. 4 (Determinants), §4.2–4.6
- M03 ← NCERT Class 11 Mathematics, Ch. 5 (Complex Numbers & Quadratic Eqns) +
  diploma-syllabus De Moivre / cube-roots facts cross-checked against the
  owner-approved unit notes
- M07 ← NCERT Class 12 Mathematics Part I, Ch. 6 (Applications of Derivatives),
  §6.1–6.5
- M11 ← NCERT Class 12 Mathematics Part II, Ch. 13 (Probability), §13.1–13.6

All shipped text is original prose; no book bytes, no URLs in `furtherReading`
(gate-enforced).

## Video enrichment (batch 1, same metadata law as the pilot)

Every ID verified live via YouTube oEmbed (title + channel); every duration
read from the YouTube watch page `Length` header — never invented. Rejected
during curation: `kLcEN9w_AEc` (oEmbed fetch failed), `m6jh9eh2lxY`
(8:16, 138-view channel — not exam-grade), `-F-FHNTz4qk` (leading-dash ID
class, known oEmbed failure).

| Unit | ID | Lecture (channel, language) | Length |
|---|---|---|---|
| M02 | 351-yosR2z4 | (pre-existing) Adjoint & inverse explained (G.S.CLASSES, en) | 24 min |
| M02 | plKcrDXy2FM | Determinants L2: Properties (Vedantu JEE Made Ejee, hi) | 47 min |
| M02 | MkAPDS_bhAU | নির্ণায়ক দীর্ঘ উত্তরধর্মী Ex-2(B) (SOE Bangla, bn) | 35 min |
| M02 | 6FFBRPT5o-U | Determinants in 1 Shot: NCERT + PYQs (Neha Agrawal Mathematically Inclined, en) | 104 min |
| M03 | oEkhSc-wqak | (pre-existing) Standard form & algebra (Ekeeda, en) | 14 min |
| M03 | slZQwjI5e58 | Complex Numbers one shot: iota → polar/Euler → cube roots → De Moivre (Vedantu Maharashtra MHTCET, hi) | 245 min |
| M03 | or-JqQJLSRw | Conjugate complex numbers WBCHSE (Creative Education Centre, bn) | 32 min |
| M03 | 2kKl16-7lE4 | Introduction to Complex Numbers / iota properties (Vedantu JEE Made Ejee, en) | 39 min |
| M07 | esF7M2o3duo | (pre-existing) Maxima-minima tests (Arya Anjum, en) | 22 min |
| M07 | kgCR_3uqRv4 | Maxima-Minima marathon: both derivative tests, concavity, absolute extrema (Toppers Village, hi) | 137 min |
| M07 | p0ZI5JwO5OA | Maxima-Minima condition, part 1 (LET'S IMPROVE, bn) | 16 min |
| M07 | FemsNVoCtow | Application of Derivatives in 1 Shot (Vedantu JEE Made Ejee, en) | 104 min |
| M11 | y-q0AN-NkfY | (pre-existing) Binomial problems (Ekeeda, en) | 12 min |
| M11 | WfKYCxXRFwY | Probability one shot: NCERT + PYQs (NCERT Wallah, hi) | 143 min |
| M11 | qtGj2N4lOU0 | Probability full theory + Bayes in Bengali (School Of Learning, bn) | 58 min |
| M11 | C9AK4IRYtFU | দ্বিপদ বিভাজন binomial one shot (SOE Bangla, bn) | 46 min |

Each entry carries an exam-relevant `scopeNote`; facade + external deep links
only (zero auto-iframes). Language mix per unit ≥ bn + hi + en.

## Numerics verification (SymPy, exact arithmetic)

47/47 checks PASS over every B1 MCQ key and primer micro-check number,
including: M02 Δ(x) = x³−6x+9 with Δ(2)=5, Cramer −11/−11, collinearity det 0;
M03 i²⁰²⁶ = −1, arg(−1+i√3) = 2π/3, ω¹⁰⁰ = ω, (1+ω)(1+ω²) = 1,
Im((2+3i)/(3−4i)) = 17/25, De Moivre cos2θ identity (re-verified numerically
at θ=π/7 after symbolic-formulation dead end); M07 slope 1, normal −¼,
f(−1)=2, min 1 on [0,3], inflections ±1, area rate 20, max √2; M11 5/36 dice,
Bayes P(M₁|D) = 3/8, P(X=3) = 5/16, n=8 from mean 4/var 2, exactly-one 0.7.
Corpus gate `verify_solutions_sympy.py`: 400/400 (unchanged).

## Gate results (all green)

- `verify_corpus.py` PASS — 400q / 42u / 109 SVG, **Study Packs: 7/42 validated
  (C03, E05, M01, M02, M03, M07, M11)**
- Negative tests: dropping M02 to 11 formulas → rejected; duplicate MCQ id in
  M11 → rejected (both restored, gate re-PASS)
- `verify_solutions_sympy.py` 400/400
- `node --test` **130/130** (updated contract: `PACKED_UNITS` = pilot + batch 1;
  batch isolation now covers the other 38 units)
- `check_tokens_and_links.mjs` PASS (331 files)
- Browser: `check_responsive.mjs` 43/43 · `check_community.mjs` 23 ·
  bespoke study-pack harness extended to M02/M03/M07/M11 (M04 now the
  empty-state probe) → PASS · tab+videos check (sequence + facade/deep-link +
  language mix on all four B1 units) → PASS
- SW bumped `jelet-v3-sw-16` (unit JSON changed)

## Owner actions pending (plan §4 step 5, batch cadence)

1. Spot-check the four packs on device: `#/learn/M02?tab=study`,
   `#/learn/M03?tab=study`, `#/learn/M07?tab=study`, `#/learn/M11?tab=study`;
   videos at `?tab=videos`.
2. Sign off → `provenance.reviewedBy/reviewedAt` stamped for B1 and re-applied.
3. On approval, proceed to Batch 2 = P08/P12/P14/P15.
