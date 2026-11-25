# `docs/phases/` — Execution Index (Plans & Records)

This folder is the **single source of truth for "what to do next"** in JELET Study Hub (v3).
Two kinds of documents live here:

| Kind | File | Meaning |
| :--- | :--- | :--- |
| **Record** | `phase-NN/record.md` | Work **already done, verified and gated** (Phase 01 → 11). |
| **Plan** | `phase-NN/plan.md` | Work **researched and specified but NOT yet written as code**. Execute step-by-step, then write the matching `record.md`. |

---

## Phase Map

| Phase | Name | Status | Document |
| :---: | :--- | :---: | :--- |
| 01 | Tokens, App Shell & IndexedDB Core | ✅ Done | `phase-01/record.md` |
| 02–03 | Official corpus extraction (2022–2025) | ✅ Done | `phase-03/batch-*.md` |
| 04 | Exact 1/12-mark exam engine & OMR runner | ✅ Done | `phase-04/record.md` |
| 05 | Results, practice sets engine, Leitner queue | ✅ Done | `phase-05/record.md` |
| 06 | 42-unit workbooks + YouTube facade | ✅ Done | `phase-06/record.md` |
| 07 | Today dashboard, adaptive routing, mistakes | ✅ Done | `phase-07/record.md` |
| 08 | BYOK AI Doubt Tutor | ✅ Done | `phase-08/record.md` |
| 09 | Offline PWA + encrypted sync | ✅ Done | `phase-09/record.md` |
| 10 | Accessibility, zoom, device QA, release | ✅ Done | `phase-10/record.md` |
| **11** | **AI Tutor: Option Detection, Section Context & History** (+ 1 blocking bug fix) | ✅ Done | `phase-11/record.md` |
| **12** | **Phone UI Compaction: Today & You/Settings (disclosure pattern)** | ✅ Done | **`phase-12/record.md`** |
| **13** | **Learn Enrichment from Private Reference Books (AI-assisted, copyright-safe)** | 📋 Researched — awaiting execution · plan **amended 2026-11-25** (vault restructure + unit-model reference; docs-only, not executing) | **`phase-13/plan.md`** |
| **14** | **AI Tutor Dedicated Phase: Request Governor (rate limits & token budget) + Sheet UI Rebuild + AI Settings** | 📋 Researched — awaiting owner go-ahead · docs-only, zero code · **owner decisions incorporated 2026-11-25** (settings-in-You only · 70 s retry law · NVIDIA provider · `gemini-3.1-flash-lite` default · preview OFF · suggestions hidden during generation · history as 70%-width drawer with search) · research: `docs/09-AI-PHASE-RESEARCH-AUDIT.md` | **`phase-14/plan.md`** |
| 14+ | Practice-set content expansion (legacy "Phase 11+" row of `docs/05`) | ⏳ Not started | (owner renumbers on approval — see note below) |

> **Roadmap alignment note:** `docs/05-PHASE-ROADMAP-AND-GATES.md` §1 currently labels
> content expansion as "Phase `11+`". The three new plans above take numbers 11–13.
> When the owner approves these plans, update that table so the content row becomes
> **Phase 14+**. (Only the repository owner amends `docs/` specification files — `AGENTS.md` §5.5.)

---

## Recommended Execution Order

```text
Phase 11  (AI tutor + blocking results bug)   ← fixes a broken flagship flow first
   ↓
Phase 12  (phone UI compaction)               ← independent, can run in parallel with 11
   ↓
Phase 13  (learn content from books)          ← slowest; owner sign-off required per batch
   ↓
Phase 14  (AI governor + sheet UI + settings) ← slices 14A → 14B → 14C; docs-only until owner go-ahead
```

* Phases 11 and 12 touch disjoint files (`ai-tutor.js`/`results.js` vs `today.js`/`you.js`)
  and can be worked in either order or in parallel.
* Phase 13 changes `_data/` truth files — `AGENTS.md` §5.5 requires **owner sign-off +
  verification evidence in this folder before any merge**.

---

## Gates Every Phase Must Pass Before Its `record.md` Is Written

Run from the repository root (all four are mandatory — `AGENTS.md` §5.4):

```bash
python3 scripts/verify_corpus.py
python3 scripts/verify_solutions_sympy.py
node scripts/check_tokens_and_links.mjs
node --test "tests/*.test.mjs"
```

Plus the browser gates when UI changed (need external Puppeteer tooling, see
`phase-10/record.md` for setup):

```bash
node scripts/check_responsive.mjs     # 360 / 390 / 414 / 1440 px, zero overflow
node scripts/check_community.mjs      # mobile+desktop routes, 200% zoom, offline
```

Each `plan.md` ends with its own **acceptance checklist** — every box must be ticked
(and the commands above green) before converting the plan into a `record.md`.

---

## Research Basis for the Three Plans

All three plans derive from the full-repository research audit
[`docs/08-RESEARCH-FEATURE-AND-UI-REFINEMENT-PROPOSALS.md`](../../08-RESEARCH-FEATURE-AND-UI-REFINEMENT-PROPOSALS.md)
plus a live Google Drive inventory of the private reference-book vault (2026-11-25).
No application code has been written for Phases 11–13 — specification only.

**2026-11-25 research refresh (docs-only, owner-directed):** the owner restructured
`05_Reference_Books_PRIVATE_NO_GITHUB/` (NCERT zips → unzipped chapter folders; large
PDFs → ≤ ~20 MB chunks — every book now under the connector's size cap) and selected
the sister repo's per-unit anatomy as the target model for unit study content.
A live readability smoke test (`docs/06` §3.1) found the chunked big books are
image-only scans: **agent-readable = NCERT chapters + HC Verma Vol-1 + Jain & Jain +
Engineering-Chemistry pack; BS Grewal / HCV Vol-2 / VK Mehta / `05E` = owner-eyes-only.**
The unit-model reference is
[`docs/references/DIPLOMA-3RD-SEM-UNIT-SYSTEM-REFERENCE.md`](../../references/DIPLOMA-3RD-SEM-UNIT-SYSTEM-REFERENCE.md).
`phase-13/plan.md` carries **Amendment A** with these facts; its execution remains
blocked on owner sign-off, and per owner direction no code is written for it now.
**Owner decisions (2026-11-25):** data stays JSON (UI must feel bespoke, not
templated — reference doc §6); `studyPack` schema as proposed; MCQ-only; OCR
skipped for now (scan-only facts via owner page-pointer confirmation).
