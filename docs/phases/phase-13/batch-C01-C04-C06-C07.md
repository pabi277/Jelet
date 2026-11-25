# Phase 13 — Batch 3 Evidence: C01 · C04 · C06 · C07 (2026-11-25)

Owner signed off batch 2 ("Ok continue next batch"); `provenance.reviewedBy/
reviewedAt` for P08/P12/P14/P15 were stamped **owner-approved** in the drafts
(`scripts/_build/study_packs/`) and the shipped `_data/units/*.json` in this
batch. Per plan §3.4 the next batch is **Batch 3 = C01 (Atomic Structure),
C04 (Oxidation, Reduction & Electrochemistry), C06 (Metallurgy), C07 (Water)**
— all four now carry the full owner-approved v2 anatomy plus the
video-enrichment contract.

## Study Pack anatomy shipped (drafts in `scripts/_build/study_packs/`)

| Unit | Primers | Formulas | Definitions | Comparisons | MCQs | Hooks | Mistakes | Checklist | Reading |
|---|---|---|---|---|---|---|---|---|---|
| C01 | 6 | 15 | 10 | 4 | 10 | 10 | 9 | 11 | 1 |
| C04 | 6 | 15 | 10 | 4 | 10 | 10 | 9 | 11 | 2 |
| C06 | 6 | 14 | 10 | 4 | 10 | 10 | 9 | 11 | 1 |
| C07 | 6 | 14 | 10 | 4 | 10 | 10 | 9 | 11 | 2 |

Every primer carries an inline **Micro-check**; MCQs are per-question reveal
(never scored/stored); IDs follow `<UNIT>-PRD/SF/DEF/CMP/MCQnn`, unique per
unit; provenance = `pending` owner spot-check until batch sign-off.

### Scoping notes (avoids overlap with shipped truth)

- C01 stays Bohr/quantum-machinery-first: hydrogenic scaling (r ∝ n²/Z,
  E ∝ −Z²/n², K = −E, U = 2E) → Rydberg series and line counting → quantum
  numbers and node counting → Aufbau/Pauli/Hund with the Cr/Cu exceptions →
  spin-only moments with the 4s-removes-first law → de Broglie/Heisenberg.
- C04 covers oxidation numbers with the peroxide traps (CrO₅, H₂SO₅) →
  medium-dependent n-factors and equivalent weights → Faraday's laws → κ vs
  Λm dilution seesaw → galvanic anatomy + EMF + Gibbs → Nernst and log K,
  including the ΔG-based half-cell combination law (E° is intensive).
- C06 covers ore-vs-mineral and the must-know ore formulas → concentration
  pairing (froth flotation/leaching/magnetic) → calcination vs roasting and
  flux/slag chemistry → blast furnace → Hall–Héroult → refining map and
  engineering alloys (german silver = 0% Ag).
- C07 covers the soap-scum reaction → temporary vs permanent salt lists →
  ppm CaCO₃ equivalents → softening ladder (boiling/Clark's, zeolite, Calgon,
  ion-exchange) → EDTA titration trio (pH 10, EBT, red→blue) → potable
  disinfection and BOD ≤ COD.

### Evidence citations (fact base, docs/06 §3.1)

- C01 ← NCERT Class 11 Chemistry Part II, Unit 2 (Structure of Atom), §2.2–2.7
- C04 ← NCERT Class 12 Chemistry Part I, Unit 2 (Electrochemistry), §2.1–2.4 +
  NCERT Class 11 Chemistry, Unit 8 (Redox Reactions)
- C06 ← NCERT Class 12 Chemistry Part I, Unit 6 (General Principles and
  Processes of Isolation of Elements), §6.1–6.4
- C07 ← NCERT Class 11 Chemistry Part II, Unit 9 (Hydrogen), §9.6 + Jain &
  Jain, Engineering Chemistry (water-treatment chapters; pointer only)

All shipped text is original prose; no book bytes, no URLs in `furtherReading`
(gate-enforced).

## Numerics verification (SymPy, exact arithmetic) — caught a real error

Full B3 sweep over every MCQ key, explanation arithmetic chain, primer
micro-check and the C06/C07 reaction balances: **37/41 on the first pass**.
3 non-passes were checker formulation artifacts (float-vs-int equality, a
typo'd ratio expression, a miscounted oxygen tally in the checker itself).
**1 was a real authored error**: the C04-MCQ02 explanation tallied Caro's acid
with ONE peroxo oxygen (`2(+1) + x + 3(−2) + (−1) = 0 ⇒ x = 5`) while the
correct structure has a two-oxygen −O−O− bridge — fixed to
`2(+1) + x + 3(−2) + 2(−1) = 0 ⇒ x = +6` in the draft AND the shipped unit
(the answer +6 was always right; the shown arithmetic now matches). Final
sweep: **41/41 PASS**, including stoichiometry balances for the roasting
(`2ZnS + 3O₂ → 2ZnO + 2SO₂`), flux–slag, Clark's lime and chlorination
reactions and the ppm conversions (16.2 mg/L Ca(HCO₃)₂ → 10 ppm; 13.6 mg/L
CaSO₄ → 10 ppm). Corpus gate `verify_solutions_sympy.py`: 400/400
(unchanged).

## Video enrichment (batch 3, same metadata law as pilot + batches 1–2)

Every new ID verified live via YouTube oEmbed (title + channel) — except
`ooXkzP1g3EQ`, whose oEmbed endpoint errored on four attempts; it was
verified from the watch page instead (title + channel + Length all captured).
Every duration read from the YouTube watch page `Length` header — never
invented. Rejected during curation: `LUoohWPTPcA` (43 min but a 129-view
re-upload — not the real PW one-shot), `4hWMhC8cbRE` (9:41), `VyvKhDjcC_w`
(49:54 but 15 views), `sQ1l48dYmV4` (6:51), `X4Qnmu-8bBs` (5:35),
`hI-l3u1lp58` (14-hour mega-lecture — impractical for a 30-minute unit),
`S9OJKqvqX9s` (Tamil — wrong language).

| Unit | ID | Lecture (channel, language) | Length |
|---|---|---|---|
| C01 | uRuUO0aD-Iw | (pre-existing) atomic structure lecture (en) | 25 min |
| C01 | wV_-s9xgDnE | Atomic Structure one shot, NCERT full revision (PW Class 11 Science, hi) | 123 min |
| C01 | 4-yKxIvkH60 | Structure of Atom full chapter, timed sections (ISC Wallah, hi) | 107 min |
| C01 | JC3IguOuekk | Structure of Atom one shot + PYQs (PW Class 11 Science, hi) | 159 min |
| C04 | QEeyE0dMHfM | (pre-existing) electrochemistry lecture (en) | 24 min |
| C04 | u9Oxgid_aaU | Electrochemistry full-chapter one shot (JEE Wallah, hi) | 159 min |
| C04 | qtqu3LH-EH8 | Electrochemistry one-shot revision (Magnet Brains, hi) | 182 min |
| C04 | ooXkzP1g3EQ | Faraday's laws of electrolysis with numericals (Salauddin Academy, bn) | 31 min |
| C06 | HwXx_ZXQ8CE | (pre-existing) metallurgy lecture (en) | 9 min |
| C06 | WEhGzEhAU1I | Occurrence of metals + concentration of ores (NCERT Wallah, hi) | 94 min |
| C06 | BB4qhs6ufXs | All metal-extraction reactions in one video (Quick Online School, bn) | 19 min |
| C06 | _ed36WRWRqA | Metallurgy MCQ drill (Vedantu NEET Made Ejee, hi) | 30 min |
| C07 | ilrt9YDQGkU | (pre-existing) water lecture (en) | 17 min |
| C07 | ggx6iVhNsLU | Hardness types, units, CaCO₃ equivalent (Easy Engineering Chemistry, hi) | 72 min |
| C07 | 6mzIjtGW65s | Zeolite/permutit softening with reactions (Easy Engineering Chemistry, en) | 22 min |
| C07 | SA9glYy_MXE | Hard vs soft water + softening (Brother Sir 11th, hi) | 15 min |
| C07 | Cho5Qqe2u_M | মৃদু জল ও খর জল, hardness removal (Chemistry Online, bn) | 19 min |

Each entry carries an exam-relevant `scopeNote`; facade + external deep links
only (zero auto-iframes). Language mix: C04, C06, C07 hit bn+hi+en; **C01
ships en+hi** — every Bengali atomic-structure candidate surfaced was
fragmentary (single-topic parts) or failed the exam-grade view bar (a 49-min
bn numerics video sat at 15 views), documented here rather than padded.

## Gate results (all green)

- `verify_corpus.py` PASS — 400q / 42u / 109 SVG, **Study Packs: 15/42
  validated (C01, C03, C04, C06, C07, E05, M01, M02, M03, M07, M11, P08,
  P12, P14, P15)**
- Negative tests: C06 dropped to 11 formulas → rejected (12–18 range rule);
  duplicate `C01-MCQ01` id → rejected with explicit duplicate list (both
  restored, gate re-PASS)
- `verify_solutions_sympy.py` 400/400
- `node --test` **130/130** (contract now: `PACKED_UNITS` = pilot + batches
  1–3 → 15; batch isolation covers the other 30; 4+ curated videos per
  packed unit)
- `check_tokens_and_links.mjs` PASS (341 files)
- Browser: `check_responsive.mjs` 43/43 · `check_community.mjs` 23 ·
  bespoke study-pack harness re-scoped to batch 3 (C01/C04/C06/C07 render +
  MCQ reveal at 4 viewports, C05 now the empty-state probe) → PASS ·
  tab+videos check PASS
- SW bumped `jelet-v3-sw-18` (unit JSON changed)

## Owner actions pending (plan §4 step 5, batch cadence)

1. Spot-check the four packs on device: `#/learn/C01?tab=study`,
   `#/learn/C04?tab=study`, `#/learn/C06?tab=study`, `#/learn/C07?tab=study`;
   videos at `?tab=videos`.
2. Sign off → `provenance.reviewedBy/reviewedAt` stamped for B3 and re-applied.
3. On approval, proceed to Batch 4 = E01–E04 + E06–E08.
