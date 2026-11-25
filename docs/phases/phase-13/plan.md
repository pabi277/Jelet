# Phase 13 PLAN — Learn Enrichment from Private Reference Books (AI-Assisted, Copyright-Safe)

> **Status:** 📋 Research complete · **zero code written** · **owner sign-off required
> before any `_data/` change** (`AGENTS.md` §5.5).
> **Previous:** Phase 12 (`phase-12/plan.md`) · **Next:** legacy content row of
> `docs/05` → becomes Phase 14+ on approval.
> **Research basis:** live Google Drive inventory (2026-11-25, **re-verified after the
> owner's vault restructure** — see Amendment A) + `docs/06` vault guide +
> `docs/03` §2.4 unit schema + `scripts/verify_corpus.py` unit gate + `docs/08` §4
> Wave C + owner-selected unit model
> [`docs/references/DIPLOMA-3RD-SEM-UNIT-SYSTEM-REFERENCE.md`](../../references/DIPLOMA-3RD-SEM-UNIT-SYSTEM-REFERENCE.md).

---

## Amendment A — 2026-11-25 (docs-only research refresh — zero code)

The owner restructured `05_Reference_Books_PRIVATE_NO_GITHUB/` and re-pointed
research at the sister repo's unit system. Per owner direction, **this plan is not
being executed in the current session** — only these research facts were refreshed.

1. **Vault restructure:** every NCERT `.zip` is now an **unzipped chapter folder**
   (one PDF per chapter) and every large PDF is **split** into
   `NNN_…_split_NNN.pdf` chunks (≈ ≤ 20 MB each). The old size constraints are
   obsolete — **but a live readability smoke test (2026-11-25, `docs/06` §3.1)
   shows the chunked big books are image-only scans**: BS Grewal, HC Verma Vol-2,
   VK Mehta and all `05E` guidebooks have **no text layer** (owner-eyes / offline
   OCR only). The agent-readable reference set is: **all NCERT chapter folders,
   HC Verma Vol-1, Jain & Jain, Engineering Chemistry pack** (Allen unverified at
   audit time). Plan the §3 fact-base step around that set.
2. **Unit-content model (owner-selected):** unit study substance should be shaped
   like the sister repo's fixed 15-block unit anatomy (Unit Overview →
   topic-by-topic anchored sections → Key Formulas → Key Definitions → Comparisons
   → MCQs → SAQ → LAQ → Practice Problems → Quick Revision → Watch & Learn). The
   §2.1 `studyPack` proposal already covers several of these blocks; the exact
   mapping, gaps and open owner questions (first-class `definitions[]` /
   `comparisons[]` blocks; SAQ/LAQ self-review items vs the MCQ-only exam law) are
   in `docs/references/DIPLOMA-3RD-SEM-UNIT-SYSTEM-REFERENCE.md` §3.3 & §5.
   **Resolve those before executing §2.**
3. §1.1, §3 step ② and §3.4 below were updated to the post-restructure vault state
   (marked *Amendment A*). All other sections are unchanged from the original plan.
4. **Session-2 verification (owner direction: try download→OCR / direct page view):**
   all agent-side OCR routes are closed — connector download cannot reach the
   workspace (no URL field in the tool schema; sandbox host allowlist), Drive viewer
   and download URLs hit the privacy sign-in wall (tested live). Also confirmed:
   `read_file_text` has a **25 MB extraction cap** (whole VK Mehta unreadable — use
   chunks) and HC Verma Vol-2 is image-only throughout (chunk 003 sample). Owner-side
   OCR paths (Drive → Google Docs OCR, or local `ocrmypdf` re-upload) + the
   fact-verification protocol are specified in `docs/06` §3.2–§3.3. Architecture
   question (JSON vs per-unit static HTML) analyzed with a keep-JSON
   recommendation in the unit-model reference §6; owner decisions pending.
5. **Owner decisions (2026-11-25, via structured Q&A):**
   - **Architecture:** data stays JSON. Owner refinement — *"the preview must feel
     not a template; use HTML, CSS, JS for the UI"* → when §2.3 executes, the
     Study Pack tab must render as a bespoke, per-block-designed page (varied
     card identities, rhythm, semantic markup), never a uniform repeated template
     or raw JSON dump. Full requirement list: unit-model reference §6.
   - **`studyPack` schema:** §2.1 **as proposed** — no `definitions[]`/
     `comparisons[]` additions (Diploma anatomy stays a presentation reference).
   - **Question types:** **MCQ-only** (exam-true); long-form value goes into
     `workedExamples`. No SAQ/LAQ blocks.
   - **OCR:** skipped for now (`docs/06` §3.2); scan-only facts follow the
     fact-verification protocol (`docs/06` §3.3, step 4: owner page-pointer
     confirmation).
   - Still open: 42-unit coverage page (reference doc §5.3).

---

## 0. The Goal in Plain Words

You want the **Learn section** to carry *more study substance per unit* — deeper
explanations, memory hooks, exam checklists, "which book to open for more" — using
**(a)** the 20 reference books in your private Drive vault and **(b)** AI-assisted
authoring. The hard constraint is your own law (`AGENTS.md` §5.2, `docs/06` line 4):

> **The books NEVER enter GitHub, and their words NEVER enter `_data/`.**
> Books are *read-only references*. Everything shipped must be **100% originally
> written** (AI may draft, you review), mathematically verified, and gate-passed.

So this phase is a **content factory + a small UI slot**, not a book scanner.

---

## 1. What the Research Found

### 1.1 Your Drive inventory (*Amendment A* — live-verified 2026-11-25, post-restructure — canonical copy: `docs/06` §2)

Folder: `JELET_2028_Master_Vault/05_Reference_Books_PRIVATE_NO_GITHUB/` (`1Jsb15vIqetNmWuoWf3lI2bZ07yraycb7`).
Zips → **unzipped chapter folders**; large PDFs → **split chunk folders**. Subject-folder IDs unchanged.

| Subfolder | Folder ID | Post-restructure structure |
| :--- | :--- | :--- |
| `05A_Mathematics_Books` | `1yeuV4hnYBprzF0tLr9CFOUaw7wdHaRC0` | `BS_Grewal_…_split pdf/` = 14 chunks + `index.pdf` (M01–M03, M08, M09) · NCERT unzip folders: Class-11 Math `kemh1dd` (19 PDFs; M04/M05/M10/M11), Class-12 P1 `lemh1dd` (10; M01–M02/M07), Class-12 P2 `lemh2dd` (9; M06/M07/M09/M11) |
| `05B_Physics_Books` | `1CgUIqNHsH_SAveBSBCP_a4yaEVs8IBdX` | `Allen_…Ref.pdf` (8.5 MB, formula checks) · `HC_Verma_Vol1.pdf` (4.8 MB; P01–P13) · `HC_Verma_Vol2 split pdf/` (5 chunks; P14–P15 only) · NCERT unzip: `keph1dd` (10; P01–P05), `keph2dd` (9; P06–P13), Class-12 P1 `FEEE_Circuits_Only` `leph1dd` (10; E04/E05), P2 `Optics_Photoelectric` `leph2dd` (8; P14/P15/E06) |
| `05C_Chemistry_Books` | `1pclunmO4Ej3Qr1eTKqz2Biv-6QZbhiwZ` | `Jain_and_Jain_…_Compact.pdf` (13.5 MB; C06/C07) · `Engineering_Chemistry_Full_Reference.pdf` (43 MB) + `split pdf/` (3 chunks; industrial + electrochemistry) · NCERT unzip: `kech1dd` (9; C01–C03), `kech2dd` (5; C04/C08), Class-12 Organic `lech2dd` (7; C08) |
| `05D_FEEE_..._Books` | `1VF2DauLnRw9Zk8gwEpSCPICS39z-FdAe` | `VK_Mehta_….pdf` (43.7 MB) + `split pdf/` (8 chunks) — covers `E06–E08` |
| `05E_JELET_Guidebooks_Private_Ref` | `1z4hgfBSSCN8Wyl6hj_zP1iGzymzjNVMj` | Sarkar PDF (38.5 MB) + split (7 chunks) · General Scan PDF (25.5 MB) + split (2 chunks) · Practice Sets Scan PDF (7.5 MB) |
| `06_My_Notes_and_Formula_Sheets` | `1VbCajps_pAYi_tCFSUowsEUvptYX-B0Y` | **Still empty** — room for your own notes later |

Reading constraints (*Amendment A* — supersede the pre-restructure rules):
* No zips remain in `05_*`; every item is a PDF or PDF folder under the connector's
  size cap. **But "under the cap" ≠ "readable"** — a live smoke test (`docs/06`
  §3.1) found the chunked big books are **image-only scans**.
* **Agent-readable (text layer verified):** all NCERT chapter folders, HC Verma
  Vol-1, Jain & Jain, Engineering Chemistry pack. Allen: verify on first use.
* **Owner-eyes-only (image-only, no text layer):** BS Grewal (incl. its
  `index.pdf`), HC Verma Vol-2, VK Mehta, all `05E` scans — cite them only as
  page/scope pointers the owner confirms offline; never as agent-read fact sources.
* NCERT filenames decode mechanically (`kemh101` = Class 11 Maths Ch. 1; `an` =
  answers; `ps`/`sm` = supplementary) — see the decoder table in `docs/06` §3.
  Confirm chapter titles by opening the PDF before citing (accuracy law).
* `05E` guidebooks: **never** copy questions/keys from them into `_data/papers/`
  (`docs/06` warning) — official WBJEEB booklets remain the only paper source;
  `05E` stays scope-only even though it is now browsable chunk-by-chunk.

### 1.2 Current unit content depth (sample: `_data/units/M01.json`)

Every unit already has: `sections[]` (3) with `proseLatex` + `keyFormulas[]` (5),
`workedExamples[]` (3), `wbjeebTraps[]` (3), `pyqIds[]` (16), `videoLectures[]` (1),
`practiceSetIds[]`. All 42 units are populated (Phase 06). **The gap is not
emptiness — it is depth and study-craft**: no memory hooks, no common-mistakes list,
no exam-day checklist, no "read further" pointers, no concept primer in plain
diploma-level words.

### 1.3 Gate reality-check (important for the schema decision)

`scripts/verify_corpus.py` unit gate (lines ~195–206) currently checks only:
`unitId` match, `pyqIds` present, `sections` present, every `pyqId` exists in papers.
**Unknown extra keys are NOT rejected today.** → Adding an optional `studyPack`
object would pass the gate *as-is*, but the plan below **requires extending the gate**
to validate `studyPack` structure whenever it is present (never trust an unvalidated
addition to `_data/` — that is the whole spirit of the four-gate pipeline).

### 1.4 Why AI assistance is safe here (and where it is not)

| Allowed | Forbidden |
| :--- | :--- |
| AI **drafts original text** (you review before it ships) | AI (or anyone) copying book sentences, solved exercises, or diagram descriptions **verbatim** into `_data/` |
| Facts, formula names, chapter numbers, syllabus scope read from books | Shipping any PDF/ZIP/image from Drive into Git or Pages |
| AI checking *math* via SymPy (existing pipeline) | "Unverified" / "accuracy note" disclaimers in UI (banned by `AGENTS.md` §2.3) |
| Book **titles/authors/chapter names** as "further reading" pointers | Out-of-syllabus topics smuggled in from guidebooks |

---

## 2. The Design Decision — what "more study stuff" becomes

### 2.1 New optional per-unit field: `studyPack` (additive, backward compatible)

Added to `_data/units/<unitId>.json` **only after owner approves this plan**:

| Field | Type | Meaning (all originally written) |
| :--- | :--- | :--- |
| `conceptPrimer[]` | `[{ prdId, heading, proseLatex }]` | 2–4 short "explain it like I'm a 1st-year diploma student" paragraphs, KaTeX-ready, filling gaps between the existing `sections[].proseLatex` |
| `memoryHooks[]` | `[string]` (LaTeX-able) | Mnemonics / one-line recall aids (e.g. odd-order skew-symmetric det = 0) |
| `commonMistakes[]` | `[string]` | Error patterns students actually make — **distinct from `wbjeebTraps[]`**, which are WBJEEB question-design traps |
| `examChecklist[]` | `[string]` | Last-10-minutes / revision-day checks for this unit |
| `furtherReading[]` | `[{ book, author, chapters, note }]` | **Titles + chapter numbers only.** `note` is one original sentence (e.g. "for extra solved matrix drills"). Zero book prose. |
| `provenance` | `{ draftedBy, reviewedBy, reviewedAt }` | Honest chain: `"AI-assisted draft"` → your name/date after review (never claim otherwise) |

**Naming:** keep `prdId` style consistent with existing `formulaId`/`exampleId`
conventions (e.g. `M01-PRD01`, `M01-HOOK01`).

### 2.2 Gate extension (same phase, before any content ships)

Extend `scripts/verify_corpus.py` unit check:
* if `studyPack` present → require known keys only (`conceptPrimer`, `memoryHooks`,
  `commonMistakes`, `examChecklist`, `furtherReading`, `provenance`);
* each `prdId` unique across the unit; `provenance.reviewedBy` non-empty;
* `furtherReading[].book` non-empty and **no file paths / URLs to Drive**;
* reject any `studyPack` on a unit file that would violate the 42-id registry.

### 2.3 UI integration — one new Lesson tab (no new destination)

In `assets/js/views/learn.js` → `renderUnitLesson`:

* Tab list gains `{ id: "study", label: "Study Pack" }` (place **after Workbook**,
  before Formulas — keep existing `validTabs` set logic: add `"study"`).
* Render order inside the tab: Concept Primer → Memory Hooks → Common Mistakes →
  Exam Checklist → Further Reading → provenance footnote
  (`card__meta`: "AI-assisted draft · reviewed by <name> <date>").
* **Empty state** (units without `studyPack` yet — i.e. all of them at first):
  calm card: *"Study Pack for this unit is being authored — every pack is
  originally written and verified before shipping. Meanwhile: Workbook · Formulas ·
  PYQs above."* — never a broken/blank tab.
* Reuse existing components: `.worked-example` for primer cards, `.exam-trap` styling
  for Common Mistakes (amber = caution), `.lesson-formula-card` for hooks,
  `.tiebreak-details` if a checklist is long.
* Query param support: `#/learn/M01?tab=study` works automatically once added to
  `validTabs`.

### 2.4 AI Tutor grounding (sub-step, after first content ships)

`buildGroundTruthSystemPrompt` unit branch (`ai-vault.js`): when
`unit.studyPack` exists, append (optional params — same pattern as Phase 11 Step 2):
`Memory hooks: … | Common mistakes: …` (trimmed, max ~400 chars) so BYOK answers
echo your reviewed wording instead of inventing study tips. **Never** inject
`furtherReading` book content — only your own pack text.

---

## 3. The Content Production Pipeline (per unit — follow exactly)

```text
① Pick unit          ② Read-only reference      ③ Draft ORIGINAL        ④ Verify math
   (batch list §3.4)    from Drive (facts only)     content (AI + you)      (SymPy)
        ↓                      ↓                        ↓                      ↓
⑤ Write JSON  →  ⑥ Run gates  →  ⑦ Owner spot-check & sign-off  →  ⑧ Record evidence
```

**① Pick unit** — use the batch order in §3.4 (high-yield first).

**② Read-only reference (Drive):**
* Open the mapped book(s) from the §1.1 table via the Drive connector
  `read_file_text` (**PDFs only**; never download into the workspace/ repo;
  never read `05E` for content — scope-only at most).
* Extract **facts only**: topic scope, formula names, standard relationships,
  chapter numbering. Work in small `max_chars` windows around the chapter you need.
* BS Grewal (*Amendment A*): **image-only scan** — no text layer even chunked
  (`docs/06` §3.1). Treat as owner-eyes-only; the agent fact-base for maths units
  is NCERT chapter folders + Allen + existing unit formulas.
* NCERT folders + HC Verma Vol-1 + Jain & Jain + Engineering Chemistry pack are
  the verified agent-readable fact base; read small `max_chars` windows only.

**③ Draft ORIGINAL content (AI-assisted):**
* Draft each `studyPack` field **in your own words**, pitched at
  "1st-year diploma → JELET speed" (same voice as existing `sections[].proseLatex`).
* Rule of thumb: if a human could paste it next to a page of the book and see the
  same sentences — **rewrite it**. Formulas themselves are facts (free), but
  *prose, examples, phrasings, trap lists, exercise numbers* are not.
* You (owner) review every field before it is considered real content.

**④ Verify math:** any worked relationship added must pass
`python3 scripts/verify_solutions_sympy.py` (extend its worked-example coverage to
`studyPack` formulas if nontrivial — otherwise keep `studyPack` prose/formula-only,
no new graded steps).

**⑤ Write JSON:** extend the authoring path — prefer a small builder alongside
`scripts/_build/build_units.py` (e.g. `build_units.py` gains a `studyPack` loader
reading from a reviewable Markdown/JSON draft file outside `_data/`), so drafts stay
diff-able and re-runnable. Direct hand-edit is allowed for pilots but must produce
identical schema output.

**⑥ Gates (all four, always):**
```bash
python3 scripts/verify_corpus.py            # + new studyPack validation (§2.2)
python3 scripts/verify_solutions_sympy.py
node scripts/check_tokens_and_links.mjs     # also proves zero PDFs/zips entered Git
node --test "tests/*.test.mjs"
```

**⑦ Owner sign-off** — `AGENTS.md` §5.5: no `_data/` truth change merges without
your review. Record *what was read (book + chapter), what was written, what was
checked* in this phase folder.

**⑧ Evidence file** — one per batch: `docs/phases/phase-13/batch-<units>.md`
(pattern: `phase-03/batch-*.md`).

### 3.4 Batch order (pilot → scale)

| Batch | Units | Why these first | Reference books |
| :---: | :--- | :--- | :--- |
| **Pilot (3)** | `M01` (Matrices), `C03` (Ionic/Chemical Equilibrium), `E05` (AC Fundamentals) | One per major subject; M01 has 16 PYQs (most traffic); E05 matches the UI reference lesson | NCERT 12 Math `lemh1dd` Ch.3–4 / NCERT 11 Chem `kech1dd` Ch.6 / NCERT 12 Phys `leph1dd` circuits chapters + Allen (BS Grewal = owner-eyes-only scan) |
| 1 | `M02`, `M03`, `M07`, `M11` | High-yield maths | BS Grewal (scope), NCERT 12 Math P1/P2 |
| 2 | `P08`, `P12`, `P14`, `P15` | Heat + optics + photoelectric (scoring) | HC Verma Vol1/Vol2, Allen |
| 3 | `C01`, `C04`, `C06`, `C07` | Atomic/redox + industrial chem | Jain & Jain, Engineering Chemistry, NCERT 11 |
| 4 | `E01`–`E04`, `E06`–`E08` | FEEE block | NCERT `leph1dd` circuits chapters (VK Mehta = owner-eyes-only scan) |
| 5 | Remaining units (fill to 42) | — | as mapped in `docs/06` |

Each batch = author → gates → sign-off → `batch-<units>.md` evidence → next.

---

## 4. Work Steps Summary (execution order)

1. **Owner approves** this plan (and the `studyPack` schema in §2.1).
2. Extend `verify_corpus.py` with `studyPack` validation (§2.2) — **before** any content.
3. Add the Lesson **Study Pack** tab + empty state (§2.3) — safe with zero content.
4. Pilot batch: `M01`, `C03`, `E05` — pipeline §3 steps ①–⑧.
5. Owner reviews pilot UI + content voice → adjust template once.
6. Continue batches 1–5 (§3.4), evidence file per batch.
7. After first batch ships: AI-tutor grounding sub-step (§2.4).
8. Close phase: all gates + browser gates + owner sign-off → `phase-13/record.md`.

---

## 5. Acceptance Checklist (Phase 13 close)

- [ ] `verify_corpus.py` rejects malformed `studyPack` (test it: temporarily corrupt
      a pilot unit → gate must exit non-zero → restore)
- [ ] Lesson page: Study Pack tab renders for pilot units; calm empty state for the
      other 39; `?tab=study` deep link works; phone 360 px + desktop both clean
- [ ] Zero copyrighted bytes in Git: `check_tokens_and_links.mjs` green (it fails on
      any `.pdf`/`.zip`-book in tracked files); `.gitignore` still blocks
      `*.pdf`, `*.epub`, `*.7z`
- [ ] Every shipped `studyPack` field is original-prose (owner spot-check per batch)
      and carries `provenance.reviewedBy`
- [ ] Math additions pass `verify_solutions_sympy.py`
- [ ] All four mandatory gates + browser gates green
- [ ] Evidence files `phase-13/batch-*.md` exist for every shipped batch
- [ ] Owner converts this plan → `phase-13/record.md`

## 6. Out of Scope / Never Do

* ❌ Commit, push, or Pages-deploy ANY file from `05_Reference_Books_PRIVATE_NO_GITHUB/`
  (PDFs, zips, scans) — `AGENTS.md` §5.2, `docs/06` line 4.
* ❌ Copy book prose, solved exercises, table data, or diagram descriptions into `_data/`.
* ❌ Take questions/keys from `05E` guidebooks into `_data/papers/` (official WBJEEB
  booklets only — `docs/06` warning).
* ❌ Add a 6th navigation tab or new top-level route (Study Pack lives inside Lesson).
* ❌ Ship any field without owner review; no "unverified" disclaimers in UI.
* ❌ Auto-load anything from Drive at runtime — the app never talks to Google Drive;
  books are used **only during authoring**, offline from the shipped app.
