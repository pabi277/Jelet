# Phase 13 — infrastructure slice record

Date: 2026-11-25 · Branch: `arena/8c00c198-jelet`

## Approval and scope

The owner selected **Approve infrastructure** in the conversation: gate validation,
separate lazy-loaded packs, lightweight index, Study Pack tab and AI grounding.
This authorizes the empty index and code, **not pilot publication or fabricated
review provenance**. Phase 13 is **not closed**: pilot authoring/review, later batches,
and final owner sign-off remain pending.

The architecture Markdown, strict `.gitignore`, and all 13 approved UI references
were already present locally before code edits. No private reference was read,
downloaded, copied into this workspace, or shipped in this slice. Historical book
inventory statements in `plan.md` were not re-verified during this work.

## Storage/schema decision (supersedes plan §2.1 in-place storage)

Use `_data/units/<unitId>.studyPack.json`, containing the **pack object itself**,
not an envelope with `unitId` or `studyPack`. Its filename provides identity against
the exact canonical 42-id registry. Existing unit JSON stays unchanged.

- Exactly the six fields: `conceptPrimer`, `memoryHooks`, `commonMistakes`,
  `examChecklist`, `furtherReading`, `provenance`.
- `conceptPrimer`: 2–4 objects, exactly `prdId`, `heading`, `proseLatex`;
  non-empty text, unique `<unitId>-PRD<two digits>` IDs.
- Hooks, mistakes and checklist: non-empty arrays of non-empty strings, as in
  the approved schema. Hooks have no separate IDs because their schema is strings.
- Reading: array of objects, exactly `book`, `author`, `chapters`, `note`, all
  non-empty strings. `chapters` contains numbers/ranges only, e.g. `1–2, 4`.
  No paths, URLs, PDF/EPUB/ZIP filenames in reading fields. Empty reading arrays
  are supported rather than inventing an inaccurate title/author/chapter pointer.
- Provenance: exactly `draftedBy: "AI-assisted draft"`, non-empty `reviewedBy`,
  and a real ISO `YYYY-MM-DD` `reviewedAt`. Never insert an owner's name/date
  before actual review.
- Gate also validates optional inline `unit.studyPack` for compatibility, but
  rejects simultaneous inline and sidecar packs. New production content uses
  sidecars only.

**A structural gate cannot prove originality, accurate bibliography, mathematical
truth or that a named reviewer actually approved a pack.** These remain required
human/content-pipeline checks, not claims inferred from JSON metadata.

### Payload/search

The 42 main unit files remain **444,024 bytes combined**, zero added bytes.
The empty `_data/units/studypack-index.json` is **3 bytes** (`{}\n`).

`loadUnit()` / `loadAllUnits()` do not fetch packs. Learn separately fetches the
index; only opening Study Pack calls `loadStudyPack()`. The index is generated
from all primer headings/prose, hooks, mistakes and checklist items, plus search
labels. It strips LaTeX commands and deduplicates terms instead of duplicating
full pack prose. Multiword pack searches require every query term, independent
of index order; existing lesson/title/formula substring matching is preserved.
The gate checks exact index consistency and a **64 KiB total index ceiling**.
No reading metadata or provenance is indexed. The UI still applies the existing
`stripLatexForSearch()` helper.

Generate the index after adding an owner-reviewed pack:

```sh
python3 scripts/build_studypack_index.py
python3 scripts/verify_corpus.py
```

Never hand-maintain search text or truncate away search coverage. If a future
batch hits the index budget, revisit index encoding/loading before publication.

### Loading, UI, offline, tutor

- Workbook → **Study Pack** → Formulas → Verified PYQs → Videos; deep links such
  as `#/learn/M01?tab=study` work without adding a top-level destination.
- All 42 units currently show the specified calm authoring empty state.
- Populated rendering uses existing worked-example, formula, caution, checklist
  and metadata components plus vendored offline KaTeX. No new CSS colors/tokens.
- Network errors show a local retry card; absent packs do not block lessons.
  Successful/deduplicated pack fetches attach the pack to the cached unit.
  Study/PYQ async work cannot overwrite a newer tab selection.
- The optional feedback button shows an explicitly local-only toast suggesting
  the Workbook personal note. It sends no report and invents no stored feedback.
- Service worker bumped to `jelet-v3-sw-14`. Only the small index joins corpus
  precaching; full packs remain lazy and use existing successful-response runtime
  caching after first opening. Unopened packs are **not** promised offline.
- Phase 11's optional `origin`/`sectionHeading` refactor already exists on the
  starting branch. Reviewed cached packs contribute hooks/mistakes to unit tutor
  prompts, capped at 400 characters total with space for both categories.
  No primer or further-reading content is injected. Legacy/no-pack prompts stay
  unchanged. Grounding becomes available after opening Study Pack; opening the
  tutor alone deliberately does not trigger a full-pack fetch.

## Gate-first rejection evidence

Before UI edits or any study content:

1. Extended `scripts/verify_corpus.py` to validate both sidecars and inline packs,
   exact registry, IDs, field types/keys, review fields, reading safety and index.
2. Temporarily set M01's inline pack to
   `{"unexpected":"synthetic rejection fixture"}`.
3. Ran the real `python3 scripts/verify_corpus.py`: **exit 1**, with diagnostics
   for unknown/missing pack keys, primers, string lists, reading and provenance.
4. Restored `_data/units/M01.json` **byte-for-byte in `finally`**; normal gate
   passes. No synthetic pack remains in `_data/`.

Automated Python tests additionally reject duplicate primers, malformed types,
missing reviewer, invalid date, wrong authoring attribution, paths/Drive URLs,
unknown sidecar unit IDs, duplicate inline/sidecar packs and stale indexes.

## Verification

- `python3 -m unittest discover -s tests -p 'test_study_pack_gate.py'`:
  **6/6 pass** (multiple malformed cases per test).
- `node --test tests/*.test.mjs`: **127/127 pass**.
- `python3 scripts/verify_corpus.py`: **pass**, 400 questions, 400 solutions,
  109 SVGs, 42 units, **0 shipped study packs**.
- `/tmp/jelet-phase13-venv/bin/python scripts/verify_solutions_sympy.py`:
  **pass**, SymPy installed in an external temporary virtual environment for
  independent re-verification; 400/400 validated. Existing official-key /
  interpretation diagnostics are unchanged. The earlier system-Python run
  lacked SymPy and was not treated as independent verification.
- `node scripts/check_tokens_and_links.mjs`: **pass**, no copyrighted files,
  token violations, absolute paths or broken links.
- `node scripts/check_responsive.mjs`: **47/47 pass**, including new Study Pack
  route at 360/390/414 phone widths and 1440×900 desktop.
- `node scripts/check_study_pack.mjs`: **32 checks pass**: real empty state,
  synthetic populated rendering/order/escaping/KaTeX, local feedback, full-index
  search before pack fetch for `memory hook`, `common mistake`, `exam checklist`,
  `eigenbridge` (synthetic primer term), no eager pack requests, tab-switch race,
  360×800 + 1440×900, 200% text sizing with overflow guard disabled, dark mode,
  offline empty state and cached synthetic pack on `/Jelet/` subpath.
- Browser tooling installed outside Git under `/tmp/pwtool`:
  `puppeteer-core` + `@sparticuz/chromium@133.0.0`. The dedicated gate fails rather
  than silently skipping when browser tooling is absent.
- `git diff --check`: clean. Frozen papers, solutions, unit files, builders,
  SymPy verifier and scoring semantics unchanged.

Synthetic fixtures live only in tests/browser interception or temporary browser
caches. Their `Test fixture only` reviewer is not owner approval and they are
never content candidates.

## Next owner checkpoint — pilot, not phase close

1. Author M01, C03, E05 following the exact eight-step reference → original draft
   → SymPy → gates → owner spot-check → evidence pipeline in `plan.md`.
2. Use read-only private references outside the repository; no runtime Drive use,
   no copied prose/exercises/diagrams, no 05E paper questions/keys.
3. Keep drafts out of shipped `_data/` until actual owner review. Verify book
   title/author/edition/chapter pointers and mathematical claims per unit.
4. Record actual reviewer/date and batch evidence, regenerate the index and
   rerun all gates; obtain pilot UI/content-voice sign-off before later batches.
5. Only after all batches and final owner sign-off may Phase 13 be closed.

## Continuation — pilot authoring candidates (2026-11-25)

After the owner requested continuation, prepared original candidates for **M01,
C03 and E05**, outside `_data/`. See [pilot review](pilot-review.md) for the exact
text and [batch evidence](batch-M01-C03-E05.md) for scope, reference attempts,
mathematical-check coverage, hashes and remaining checkpoints.

- Live read-only Drive inventory was checked. Relevant reference reads were
  limited by archive format, size/extraction limits, repeated provider failures
  and a suspected filename/attribution mismatch. No book/extraction bytes were
  saved locally. The reference milestone remains **incomplete**; these are
  corpus-grounded original candidates, not a completed book-enrichment batch.
- Each candidate has four primers, four hooks, student mistakes and six revision
  checks. Reading arrays and reviewer/date remain empty rather than fabricated.
- New author-only tools: `verify_studypack_pilot.py` (requires SymPy; 95 draft/text
  + 49 mathematical checks pass), and `build_studypack_review.py` (reproducible
  Markdown review with `--check`). Neither tool writes `_data/` or approvals.
- Strict offline KaTeX/review-generation tests added; **131/131 JS tests** now
  pass. Python gate tests **6/6**, responsive **47/47**, Study Pack browser
  **32/32**, corpus, independent SymPy, token/link and diff checks all pass.
- The production validator rejects every actual draft for its missing reviewer
  and review date, as intended. All **42 unit files and the 3-byte empty index
  remain unchanged**, with **0 published packs**. Runtime code is unchanged by
  this continuation.

**Next:** owner reads the review document, supplies corrections and actual review
identity/date, and completes the private-reference/bibliography check (or explicitly
approves an alternative fact-checking basis). Only then consider promotion into
sidecars, final pilot UI checks and batch sign-off. Phase 13 remains open.
