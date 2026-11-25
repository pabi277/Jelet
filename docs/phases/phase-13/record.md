# Phase 13 Record — Study Packs 42/42 + Search-Index & Loading Follow-up

**Date:** 2026-11-25 (UTC)
**Branch:** `arena/75454728-jelet`
**Base:** `99cf7d3b90f832a399e32c1dfa08f18b950fb535`
**Status:** Complete — both spec follow-ups closed (Fix 1 shipped, Fix 2 documented with lazy-load explicitly deferred); all gates + tests green.

Phase 13 shipped the owner-approved Study Pack v2 anatomy to all 42 units
(pilot → batches 1–5; see `plan.md` §3.4 and the five `batch-*.md` evidence
docs: anatomy tables, per-unit video enrichment with watch-page +
oEmbed verification, SymPy sweeps, provenance). This record closes the two
items the patched spec added on top:

## Fix 1 — Search indexing (REQUIRED)

**Problem.** The Learn explorer search matched only
`unitId officialCode title <section formulas>` (`assets/js/views/learn.js:76`),
so Study Pack content — concept-primer headings, memory hooks, common
mistakes, exam-checklist terms, keyFormula labels — was unsearchable.

**Change.**

- New shared builder `assets/js/core/studypack-search.js`:
  `buildStudyPackSearchText(sp)` emits primer **headings + LaTeX-stripped
  prose** (via the existing `stripLatexForSearch()`), **keyFormula labels**,
  **memoryHooks**, **commonMistakes** and **examChecklist terms**, prefixed by
  the four block labels the Study Pack tab renders (`Concept Primer`,
  `Memory Hooks`, `Common Mistakes`, `Exam-Day Checklist`). Excluded by spec:
  keyDefinitions, comparisons, mcqSelfTest, furtherReading (the last also
  stays out of AI-tutor grounding). Returns `""` for units without a pack.
- `learn.js` composes it into the index:
  `searchBlob = ${unitId} ${officialCode} ${title} ${formulasText} ${buildStudyPackSearchText(u.studyPack)}.toLowerCase()`.
  Because `studyPack` ships inline in `_data/units/<id>.json` (Amendment B,
  accept-in-place), the explorer's existing `loadAllUnits()` fetch already
  carries the content — **the index is complete with zero extra requests; no
  `studypack-index.json` was needed**.
- Design note: `unitMatches` is a literal substring match on the lower-cased
  blob. The section labels are therefore part of the blob so searching
  "memory hook" / "common mistake" lands on the section itself (every packed
  unit has one → all 42 surface), while content terms land per-unit ("matrix
  anatomy" → exactly M01).
- `sw.js`: `./assets/js/core/studypack-search.js` added to the shell precache
  list (the PWA test derives the expected shell from disk and caught the
  omission), and `SW_VERSION` bumped → `jelet-v3-sw-21` so returning clients
  re-precache the changed `learn.js`.

**Verification.**

- Tests (`tests/phase13-studypack.test.mjs`, new "Learn search" case): asserts
  the `learn.js` wiring, then executes the owner's probes against the **real
  builder + real M01 data** — `matrix anatomy`, `memory hook`, `common
  mistake`, the exam-checklist term `inner orders must agree`, the hook term
  `shoes before socks` — plus null/undefined/partial-pack handling. Node suite
  is now **131/131**.
- Browser (puppeteer harness, `#/learn`, real app): `matrix anatomy` → 1 row
  incl. M01; `memory hook` → 42 rows; `common mistake` → 42 rows;
  `inner orders must agree` → 1 row incl. M01; `shoes before socks` → 1 row
  incl. M01; full checklist sentence → M01 surfaces; gibberish probe → 0 rows
  + calm empty state; zero console errors. **11/11 PASSED.**

## Fix 2 — Loading trade-off (RECOMMENDED, documented; lazy-load deferred)

**The inline choice.** Amendment B (owner-approved) accepted the Study Pack
`in-place`: each pack lives inside its unit JSON as `studyPack`, applied by
`scripts/_build/build_study_packs.py`, which merges a draft onto the unit and
touches nothing else. One file per unit remains the source of truth for the
lesson view, the AI-tutor grounding and now search.

**The added bytes (measured).**

| | at base `99cf7d3` | now |
|---|---|---|
| `_data/units/*.json` (42 files), raw | 434 KB | **1363 KB** |
| average per unit | 10.3 KB | **32.4 KB** |
| gzipped (transfer-size proxy) | — | **296 KB** |

So the corpus grew by ~0.93 MB raw (~3.1×) — about 296 KB over the wire once
HTTP compression is applied, paid once, not per view.

**Why the SW makes this cheap.** `sw.js` already best-effort **precaches every
`_data/units/<id>.json` at install** (manifest-driven; install never blocks on
failure) and mirrors them into a stale-while-revalidate runtime cache. First
visit downloads the corpus; every later visit — including the heavy 42-unit
explorer list build — is served locally, and versioned cache names
(`jelet-v3-sw-21`) invalidate cleanly on each bump.

**Why lazy-load was deferred (explicit).** Splitting `studyPack` into
`_data/units/<id>.studyPack.json`, fetched on Study Pack tab open, would NOT
make the first load lean today: the explorer's list build already calls
`loadAllUnits()` and needs the full unit JSONs (progress fields, PYQ ids,
`examFrequency`, `videoLectures`, titles all live there). A sidecar split
would therefore add a second request per unit open while the list fetch stays
heavy — unless the manifest grew into a list-index, which is a data-shape
migration across the applier, data-loader, SW precache list, and every data
test. That cost is not justified by a ~296 KB-once transfer that the SW
amortizes after the first visit.

**Decision & revisit trigger.** Inline stays. Revisit the split if (a)
real-user or Lighthouse timings show cold-start suffering on slow networks, or
(b) the corpus grows past ~2 MB raw (≈600 KB gzip), or (c) a feature needs
unit metadata without pack content on mobile-critical paths.

## Gates after this fix (all green)

| Gate | Result |
|---|---|
| `verify_corpus.py` | PASSED — 42/42 units, 400 q, 109 figures (data untouched) |
| SymPy sweeps (B1–B5) | 163/163 (data untouched) |
| node `--test tests/*.test.mjs` | **131/131** (new search-index test included) |
| `check_tokens_and_links.mjs` | PASSED — 372 files, 0 raw hex, 0 broken links |
| Browser: search probes | **11/11 PASSED**, zero console errors |
| Browser: Study Pack v2 audit | PASSED (17 unit audits + MCQ wiring, 360/768/1024 px) |
| Service worker | `jelet-v3-sw-21`; new module in shell precache (PWA test enforces) |

## Constraint compliance

- `_data/papers/*`, `_data/solutions/*`, `scripts/verify_*` semantics and
  `scoring.js`: untouched.
- No books, copyrighted prose or Drive identifiers entered the repo; search
  indexes only first-party studyPack prose and pointer-only reading metadata.
- Content untouched by this fix — only indexing, docs and the SW manifest.
