# `docs/phases/` — Execution Index (Plans & Records)

This folder is the **single source of truth for "what to do next"** in JELET Study Hub (v3).
Two kinds of documents live here:

| Kind | File | Meaning |
| :--- | :--- | :--- |
| **Record** | `phase-NN/record.md` | Work **already done, verified and gated** (Phase 01 → 10). |
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
| **11** | **AI Tutor: Option Detection, Section Context & History** (+ 1 blocking bug fix) | 📋 Researched — awaiting execution | **`phase-11/plan.md`** |
| **12** | **Phone UI Compaction: Today & You/Settings (disclosure pattern)** | 📋 Researched — awaiting execution | **`phase-12/plan.md`** |
| **13** | **Learn Enrichment from Private Reference Books (AI-assisted, copyright-safe)** | 📋 Researched — awaiting execution | **`phase-13/plan.md`** |
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
