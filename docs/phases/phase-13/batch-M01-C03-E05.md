# Phase 13 pilot — M01 / C03 / E05 authoring evidence

Date: 2026-11-25 · Status: **original candidates prepared; not published**

## Approval boundary

The owner requested continuation after the infrastructure slice. This work prepares
review candidates; it does **not** interpret that request as review/sign-off on text
the owner had not yet seen. No pack, search text or other field was added to `_data/`.
Review fields remain empty. The production gate correctly rejects these candidates.

Owner-readable text: [pilot-review.md](pilot-review.md).
JSON source: [M01](drafts/M01.studyPack.draft.json),
[C03](drafts/C03.studyPack.draft.json), [E05](drafts/E05.studyPack.draft.json).

## 1. Pick / scope check

Use the canonical unit titles, not broader shorthand in the phase handoff:

| Unit | Canonical title | Candidate focus |
| --- | --- | --- |
| M01 | Matrices up to Order 3 | Dimensions, inverse as an operation, transpose/symmetric split, 2×2 Cayley-Hamilton rewriting |
| C03 | Acids, Bases & Salts | Mole/volume bookkeeping, weak-acid assumptions, logarithmic pH, buffer partner amounts |
| E05 | AC Sources & Circuits | RMS as heating equivalence, phase reference, ideal series resonance conditions, power quantities |

In particular, C03 is **not** a licence to add a general chemical-equilibrium chapter.
All draft topics map back to the corresponding existing unit `sections` and
`keyFormulas`. No new questions, graded exercises, diagrams or paper keys were made.

## 2. Private-reference attempts — incomplete, not misrepresented as verified

Read-only Drive search on 2026-11-25 confirmed these relevant private inventory
entries and sizes. Only metadata and bounded text-tool responses were viewed;
**no private file or extracted book text was written to disk or the repository**.

| Reference inventory entry | Attempt / factual result | Consequence |
| --- | --- | --- |
| B. S. Grewal-labelled mathematics PDF | Metadata: 154,124,637 bytes. Not read or downloaded; above the documented large-file limit and there is no targeted-page input on the available text tool. | Matrix facts use the existing corpus plus independent algebra checks. Book/edition/chapter checking remains open. |
| NCERT Class 12 Mathematics Part 1 ZIP | Metadata: 17,901,352 bytes, ZIP archive. No archive was downloaded or unpacked. | Owner-side reference check remains open. |
| NCERT Class 11 Chemistry Part 1 ZIP | Metadata: 29,199,422 bytes, ZIP archive. No archive was downloaded or unpacked. | Owner-side reference check remains open. |
| Compact chemistry PDF labelled Jain and Jain | Read first 14,000 extracted characters, remotely, for bibliographic/scope triage. Much of the text is glyph-encoded. Visible front-matter attribution appears inconsistent with the filename. No relevant acids/bases chapter facts were established. | Do **not** infer title, author or chapters from this filename; no bibliography entry proposed. No words retained. |
| Full engineering chemistry reference PDF | Text extraction refused: 43,048,268 bytes exceeds the connector's **25 MB extraction cap**. | No download fallback; relevant chapter not read. |
| Allen-labelled physics reference PDF | Exact 12,000-character text-read call attempted twice, as the connector instructed after the first failure; both returned `provider_unavailable`, and it instructed no further identical retries. | No physics text or chapter facts obtained. |
| NCERT Class 12 Physics circuits ZIP | Metadata: 22,543,941 bytes, ZIP archive. No archive was downloaded or unpacked. | Owner-side reference check remains open. |

The content-production pipeline's **reference milestone is not complete**.
The documents in `drafts/` are corpus-grounded, AI-assisted original **candidates**,
not a completed reference-enriched pilot batch. Preparing them does not waive that
milestone. Neither a filename nor a failed read is evidence of having consulted a
chapter. No 05E guidebook was read or used.

To finish this milestone, the owner can confirm the relevant facts and bibliography
from the private books, or provide an accessible individual chapter/title-page file
through the private connector. No book upload to GitHub is needed. Any further
reference read must stay outside the repository and supply facts only.

## 3. What was originally written

Each candidate contains:

- Four short primer entries, written afresh rather than expanding copied sentences.
- Four memory hooks.
- Four M01 / five C03 / five E05 student-error patterns, distinct in wording and
  purpose from the existing question-design trap lists.
- Six revision checks.
- Empty `furtherReading`: intentionally no guessed author, title, edition or chapters.
- `draftedBy: "AI-assisted draft"`, `reviewedBy: ""`, `reviewedAt: ""`.

No book quotation, solved exercise, exercise number, table or diagram description
is included. The only fact base used for these candidates was the corresponding
existing unit sections, plus independently checked mathematical relationships.
Originality and pedagogical quality still need the owner's spot-check.

## 4. Independent mathematical checks

`scripts/verify_studypack_pilot.py` requires SymPy and fails rather than silently
skipping if it is absent. It writes nothing under `_data/` and does not fabricate
an in-memory reviewer. It calls the unchanged production validator on the actual
drafts and permits **only** its two expected missing-review errors in this
**authoring** check. Release validation is never relaxed.

Run:

```sh
/tmp/jelet-phase13-venv/bin/python scripts/verify_studypack_pilot.py
```

For Termux, install SymPy in your Python environment and run the same script with
`python` instead of the temporary sandbox path.

Result: **95 draft structure/text checks + 49 mathematical checks PASS** with
SymPy 1.14.0. These checks validate the stated identities and representative error
counterexamples; they are not an automatic proof of every natural-language sentence,
reference accuracy or actual owner review.

| Draft claim locations | Checks |
| --- | --- |
| M01 PRD01 | Generic rectangular product sizes and row-column entry rule |
| M01 PRD02, hooks/mistakes/checklist | Generic 2×2 left/right inverse identities and matrix-equation multiplication side; counterexamples to entry reciprocals and singular cancellation; adjoint/cofactor transpose |
| M01 PRD03 | Generic 3×3 symmetric/skew split, recombination, transpose entries and zero skew diagonal |
| M01 PRD04 | Generic 2×2 Cayley-Hamilton identity and inverse rearrangement, assuming nonzero determinant |
| C03 PRD01, mistakes/checklist | Original exact rational 1:1 neutralization bookkeeping and total-volume denominator; unequal concentrations at equal volumes |
| C03 PRD02 | Weak-monoprotic-acid positive quadratic root, small-ionization approximation, conservative 5% classroom check and failing approximation case, under the stated ideal-solution/no-water approximation |
| C03 PRD03, hooks/checklist | Exact base-10 values, multiplicative concentration change and monotonic pH direction |
| C03 PRD04 | Common-volume cancellation, logarithmic buffer ratio orientation, partner conservation and direction after acid addition; assumptions/remaining partners stated in prose |
| E05 PRD01 | Full-cycle sine average/mean square/RMS and equivalent resistor heating |
| E05 PRD02 | Phase direction from ideal L/C derivative laws and complex series-impedance magnitude |
| E05 PRD03 | Resonance cancellation, resonant current and non-negative reactance-square argument at fixed RMS voltage and positive resistance |
| E05 PRD04, hooks/mistakes/checklist | Period-averaged real power, ideal reactive phase cases, reactive-power identity, quality-factor rearrangement and SI-prefix/angle conversions |

Candidate file hashes from that run:

```text
M01 1826a5b81fd37ac6097f0563a14b27e6225c200e6c736042366478551b468ee5
C03 51b83db57fc7032fb358be5b935c29b8b09e24b9ebb058ce8d033326afd78dcd
E05 ac65fa5db093c36f799803067d05ff1c067dd67c26cc6e27e6e508cf9e32d75c
```

## 5. Draft/review reproducibility

`python3 scripts/build_studypack_review.py` renders the review Markdown directly
from draft JSON and includes hashes. `--check` fails on stale text/hashes. The Node
tests parse every math expression with vendored offline KaTeX in strict mode,
reject malformed delimiters/control characters, and ensure provenance remains
honestly blank. There is no new runtime draft mode or route.

## 6. Release status / next checkpoint

- [x] Canonical pilot scope selected.
- [ ] Relevant private-reference facts and bibliography checked for all three units.
- [x] Original corpus-grounded candidate text prepared outside `_data/`.
- [x] Independent draft mathematics and strict offline KaTeX checked.
- [ ] Owner has reviewed each candidate and supplied actual reviewer/date.
- [ ] Reading pointers populated only with confirmed metadata (or omission explicitly accepted).
- [ ] Approved candidates promoted to sidecars, index regenerated, full release gates rerun.
- [ ] Owner pilot UI/content-voice sign-off before later batches.

All units in the running app still show the authoring empty state. Do not copy these
candidates into `_data/` merely to preview them; use the review document. Phase 13
remains open.

## 7. Regression evidence for this continuation

- `node --test tests/*.test.mjs`: **131/131 PASS** (four new candidate/review tests).
- `python3 -m unittest discover -s tests -p 'test_study_pack_gate.py'`: **6/6 PASS**.
- `python3 scripts/verify_corpus.py`: **PASS**, still **0 published packs**;
  400 questions, 400 solutions, 109 figures, 42 units unchanged.
- Independent `verify_solutions_sympy.py` under the SymPy-equipped temporary
  virtual environment: **PASS**, 400/400; no frozen-verifier edits.
- `node scripts/check_tokens_and_links.mjs`: **PASS**, 334 files at time of run,
  no private reference file, absolute root path, broken link or token violation.
- `node scripts/check_responsive.mjs`: **47/47 PASS**.
- `node scripts/check_study_pack.mjs`: **32/32 PASS** (synthetic infrastructure
  cases, not a claim that these unpublished candidates were loaded into the app).
- `git diff --check`: **PASS**. No changes to `_data/`, runtime assets, scoring,
  frozen paper/solution files, or existing gate semantics in this continuation.

These green results do not complete the private-reference or owner-review stages.
