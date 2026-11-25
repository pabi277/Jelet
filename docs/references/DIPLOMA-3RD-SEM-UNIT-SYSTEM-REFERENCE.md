# Reference — Diploma-3rd-sem "Unit System" (owner-selected model for JELET units)

> **Purpose:** The owner pointed at the sister repository
> [`pabitra27706-oss/Diploma-3rd-sem`](https://github.com/pabitra27706-oss/Diploma-3rd-sem)
> and said: *"see the unit system i want like that"*. This document is the
> **senior-researcher write-up** of exactly how that repo structures a study unit,
> and how each element maps onto JELET Study Hub's existing 42-unit architecture.
> **It is a research document only — zero code is written or proposed to be written
> in this pass.** Any future phase that adopts pieces of this model must go through
> the normal plan → owner sign-off → gates loop (`AGENTS.md` §5).
>
> **Snapshot:** `main` @ `06656a9`, cloned 2026-11-25 (MIT-licensed, same owner —
> first-party source; the *model* is safe to emulate, but JELET keeps its own
> JSON-driven, gate-verified architecture).

---

## 1. What that repo is

A zero-build static study hub for WBSCTE **3rd-semester CST diploma** students
(C · Python · DS · CSO · Algorithms), served straight from HTML + checked-in JSON,
mirroring JELET's own "no bundler" law. Status per its `docs/STATUS.md`: Phases 1–10
administratively closed 2026-11-18; later unit/content phases (e.g. Phase 14
"Data Structures", Phase 17 "Topic-map cross-check") owner-passed on device. Its
discipline is the same family as ours: frozen `_data/`, integrity checkers
(`check_pyq_integrity.py`, `validate_data`, `validate_syllabus`), honest skip
reporting, and no unverified claims in the UI.

## 2. The unit system — directory & data architecture

```text
subjects/
  <CODE>/                      # one folder per subject (CST201, CST203, …)
    index.html                 # subject hub linking its units
    units/
      unit-1.html … unit-N.html   # ONE static page per syllabus unit
  units-com/                   # shared per-unit chrome
    common.css  common.js      # unit-page styling & behaviour
    notes-tracker.js           # per-unit highlights & notes system (see §3.3)
_data/
  <CODE>/
    <CODE>-P001-2021-03.json … # per-paper archives (frozen)
    registry.json              # paper registry
    questions.md               # human-readable paper transcripts
  catalog.json  practice-days.json
docs/
  syllabus/syllabus.json       # DECLARED units & topics — the source of truth
```

Key plumbing facts (verified in the snapshot):

| Element | Mechanism |
| :--- | :--- |
| **Declared units** | `docs/syllabus/syllabus.json` → `subjects[].units[]`, each unit with `topics[]` (4–8 topics), sourced & page-anchored to the official WBSCTE syllabus PDF. Same idea as our `docs/01` 42-ID registry. |
| **Unit-tagged questions** | **Every** archived question carries `unit` (1-based int), `topic` (short label), `tags[]`, `sourcePage` — so PYQs, coverage, practice days and revision cards all aggregate per unit. JELET equivalent: `pyqIds[]` per unit + 2-way links (`docs/03` §2.4) — already on par. |
| **Honest coverage** | `coverage.html` reconciles *declared* units vs *shipped* unit pages: note depth, PYQ/quiz/card counts, out-of-syllabus rows **listed rather than hidden**, Unit-1 skew explained. A pattern worth copying conceptually for our 42 units. |
| **Study order** | `suggestions/<subject>/easy-read.html` — "What to study first" ranks the units (Rank 1…5) with reasons, "what matters" per unit, two linked reading sections per unit, drills and dated practice — plus a **"Last-minute checklist"** section. |
| **Deep links** | Every topic section on a unit page has a stable `id` anchor (`#compilation-process`, `#preprocessor-and-macros`, `#escape-sequences-and-ascii`, …); the topic map cross-check phase proved **421/421 anchors resolve** to landable headings. |

## 3. The unit page anatomy (the part the owner wants)

Each `unit-N.html` follows one **fixed 15-section anatomy**, in this exact order
(observed on `subjects/CST201/units/unit-1.html`, consistent across subjects):

| # | Section | Content shape |
| :-: | :--- | :--- |
| 1 | **Unit Overview** | A short orientation block of icon-labelled sub-sections (e.g. *History & Files, Fundamentals, Operators, Type Conversion, I/O Functions*) — "what this unit is about" in plain words before any depth. |
| 2–6 | **Topic-by-topic teaching sections** | One `h3` section per syllabus topic, each with stable anchor, original prose pitched at diploma level. This is the bulk of the page — the "Easy Read" body. |
| 7 | **Key Formulas and Syntax** | Scannable card/table of formulas + syntax worth memorising. |
| 8 | **Key Definitions** | One-line definitions of the terms the paper uses. |
| 9 | **Comparisons** | Side-by-side tables (e.g. `if` vs `switch`, `=` vs `==`, stack vs heap). |
| 10 | **Multiple Choice Questions** | ~12 MCQs (`mcq1…mcq12`) with keyed answers + short explanations. |
| 11 | **Short Answer Questions** | 2–5 mark written answers. |
| 12 | **Long Answer Questions** | 6-mark style full answers (`lq1…lq3`). |
| 13 | **Practice Problems** | Unsupervised drills referencing the questions above. |
| 14 | **Quick Revision** | Last-minute recap list (the exam-day skim). |
| 15 | **Watch & Learn** | Curated video links for the unit. |

### 3.1 Shared unit chrome (`subjects/units-com/`)

- `common.css` / `common.js` — identical look & behaviour on every unit page; print
  stylesheet; save/export; theme toggle; jump-to-top.
- **`notes-tracker.js`** — a per-unit notes & highlights system: 4-colour text
  highlighting on selection, notes CRUD in a slide-in panel, section note
  indicators, star/favourites, tab filters (All pages / This page / Starred),
  export as `.txt` / `.md`. **Everything is local storage** — a pattern fully
  compatible with JELET's local-first privacy law (`AGENTS.md` §4).

### 3.2 Print & revision support

Unit pages, papers and answer keys are printable with a labelled "Include answers"
toggle; revision sheets exist per unit. JELET already has printable OMR for exams;
unit-level printable summaries are a candidate idea only (no code in this pass).

### 3.3 What JELET already has vs. what this model adds

| Diploma pattern | JELET today (`_data/units/<unitId>.json` + `#/learn/:unitId`) | Verdict |
| :--- | :--- | :--- |
| Declared units/topics from syllabus | `docs/01` 42-ID registry (`M01–M11, P01–P15, C01–C08, E01–E08`) | ✅ Already canonical (and stricter) |
| One page per unit | One JSON workbook per unit rendered by the Lesson screen | ✅ Equivalent — **keep JSON + gates**, do not switch to static HTML |
| Unit Overview orientation block | `sections[]` (3 prose sections/unit) | ➕ "plain-words primer" gap → Phase 13's proposed `studyPack.conceptPrimer` covers this |
| Topic-by-topic anchored sections | `sections[].anchor` exists (3 sections/unit) | ➕ Depth/coverage per topic is the real gap; Phase 13 §1.2 already identifies it |
| Key Formulas | `sections[].keyFormulas[]` + `#/formulas` screen | ✅ Already present |
| **Key Definitions block** | — no first-class field | ➕ Candidate `studyPack` block (definition list per unit) |
| **Comparisons block** | — absent | ➕ Candidate `studyPack` block (e.g. DC vs AC circuit behaviour, saturated vs unsaturated) |
| MCQs with explanations | `practice-sets` loader ready; `boost-M01..E08` packs not yet authored (Wave C2) | ➕ Existing engine, content pending — separate from Phase 13 |
| SAQ / Long-answer questions | Exam is 100-Q MCQ-only (`AGENTS.md` §1) | ⚠️ **Design question** — Jelet's engine has no subjective renderer; treat as practice-set schema decision for the owner, not a Lesson feature |
| Practice Problems | Practice-sets engine (Phase 05) | ✅ Engine exists, packs pending |
| **Quick Revision / last-minute checklist** | — | ➕ Phase 13's proposed `studyPack.examChecklist` matches exactly |
| Watch & Learn | `videoLectures[]` with facade law | ✅ Already present (and stricter: zero auto-iframe) |
| Notes & highlights tracker | Personal note field on Lesson | ➕ Candidate future feature (local-only, sync-exempt storage) |
| Coverage/honesty page | none dedicated | ➕ Candidate: a 42-unit coverage view fed from existing data (no new truth) |
| Easy Read study order | 42-Unit Study Roadmap sequencer (Phase 07) | ✅ Already present |

## 4. Translation contract (if a future phase adopts this model)

1. **Architecture stays JELET's:** JSON workbooks + hash router + 4-gate pipeline —
   the Diploma anatomy is the *content shape*, never a port of its HTML/JS.
2. **Originality law unchanged:** the sister repo is first-party and MIT-licensed,
   but its *prose* is about a different syllabus anyway; JELET unit content remains
   100% originally written and gate-verified (`AGENTS.md` §5.2).
3. **No new navigation destination:** the fixed anatomy would live inside the
   existing Lesson tabs (same conclusion Phase 13 §2.3 reached for `studyPack`).
4. **MCQ-only scoring untouched:** any SAQ/LAQ-style value must be re-expressed as
   (a) `workedExamples` in the workbook, (b) curated practice-set items, or
   (c) a documented schema extension owner-approved via `docs/03` §2.5.

## 5. Owner questions — status (updated 2026-11-25)

1. ~~Reshape `studyPack` to mirror this anatomy (first-class `definitions[]` /
   `comparisons[]` blocks)?~~ → **RESOLVED: keep the proposed `studyPack` schema
   as-is** (`docs/phases/phase-13/plan.md` §2.1). The anatomy remains a *craft
   reference* for how the blocks are presented, not extra schema.
2. ~~SAQ/LAQ-style self-review written items?~~ → **RESOLVED: stay MCQ-only**;
   long-form value is expressed through `workedExamples` (owner, 2026-11-25).
3. 42-unit coverage page (declared units vs. shipped depth, listed honestly) as a
   future phase → **still open**.

## 6. Owner decision log — session 2 (2026-11-25)

**Q: "For topic load, the system is JSON data load now, but Diploma-3rd-sem is
everything on separate HTML files — I think that will be better?"**

Research verdict: **keep JSON as the single source of truth; do not migrate to
hand-written per-unit HTML.** Reasoning:

| Concern | Separate static HTML (Diploma model) | JELET JSON + gates (current) |
| :--- | :--- | :--- |
| 100%-accuracy enforcement | Content hidden inside markup; gates would need HTML parsers and can miss drift | `verify_corpus.py` validates every unit JSON structurally; SymPy verifies every worked example |
| Single source | Content duplicated across shell markup in every file; redesigns touch 42 files | One JSON per unit feeds Lesson, formula sheet, AI-tutor grounding, practice links |
| Data-driven features | Aggregations (formula sheet, practice-set loader, roadmap) need scraping | Native — these features already run off the JSON |
| Deep links / instant load | Strong (static, anchorable) | Equivalent in practice: hash-router deep links + tiny JSON fetches + SW/PWA caching |
| Content authoring | Edit HTML directly (error-prone at scale) | Edit gated JSON (draft → gates → owner sign-off) |

What JELET should still take from the Diploma model is the **content shape**
(§3), not the delivery mechanism. If the "instant static page" feel ever matters
(SEO / no-JS / print), the safe route is an **optional build-time pre-render**
(script generating static unit HTML *from* the JSON — additive, owner-approved
phase), never hand-maintained HTML.

**DECISION (owner, 2026-11-25): data stays JSON — confirmed.** One owner
refinement attaches to it:

> *"The preview must feel not a template — use HTML, CSS, JS for the UI to the
> user."*

Meaning: JSON is the storage/gate layer only; **what the user sees must be a
bespoke, hand-authored-feeling page**, not a stack of identical repeated cards.
For the future Learn-enrichment execution this translates into UI-craft
requirements inside the existing design-token law (`docs/02`, `AGENTS.md` §3):

- **Per-block visual identity** — concept primers read as prose with drop-in
  emphasis; memory hooks as compact formula-style chips; common mistakes as amber
  caution callouts; the exam checklist as a tick-list; further reading as a quiet
  footnote block — never five sections wearing the same card.
- **Varied rhythm & hierarchy** — mixed widths, numbered/lettered markers, rule
  lines and spacing rhythm (as on the Diploma repo's unit pages) instead of a
  uniform grid; subject-appropriate accents (math vs chemistry vs FEEE).
- **Real markup, not JSON dump** — server-side-free but JS-rendered semantic
  HTML (`<section>`, `<dl>`, `<table>`) styled via `components.css`; no raw JSON
  ever reaches the user.
- **Gates unchanged** — all presentation lives in JS/CSS; `_data/` truth and the
  4-gate pipeline are untouched.

## 7. Sources consulted for this document

- Sister repo `Diploma-3rd-sem` (`main` @ `06656a9`, 2026-11-25): `README.md`,
  `subjects/CST201/units/unit-1.html` (and its siblings),
  `subjects/units-com/{common.css,common.js,notes-tracker.js}`,
  `_data/CST201/*.json`, `docs/syllabus/syllabus.json`, `docs/STATUS.md`,
  `docs/ROADMAP.md`, `suggestions/c/easy-read.html`, `coverage.html`.
- JELET: `AGENTS.md`, `docs/01`, `docs/03` §2.4–2.5, `docs/05`, `docs/08` §4–5,
  `docs/phases/phase-13/plan.md`, `_data/units/M01.json`.
