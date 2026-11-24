# JELET Study Hub (v3) — Master Pre-Code Blueprint

> **Status:** Pre-Code Architecture & Specification Complete (`0` lines of application code written by design).  
> **Scope:** Official WBJEEB JELET Paper-I (`2022–2026` 120-mark PCM + FEEE syllabus only · `500` verbatim questions · `42` syllabus units · Jadavpur University target focus).  
> **Stack:** Zero-framework-bloat Vanilla ES Modules (`HTML5 + CSS Tokens + JS Modules`) · `100%` Offline PWA · IndexedDB v1 · Vendored KaTeX · Theme-Adaptive SVG Diagrams · CodeC-style BYOK AI Tutor · `₹0` GitHub Pages Hosting.

---

## Why v3 Exists (Lessons from `Jelet-prep` & `Jelet-ultimate-prep`)

| Previous Project | What Worked | Why It Was Retired |
| :--- | :--- | :--- |
| **`Jelet-prep` (v1)** | Clean syllabus explorer, IndexedDB backup envelope, honest provenance tracking | Read-only library (no mock engine), unverified `pyq-md` transcriptions with typos (`2022 Q8`), 72 missing diagrams, 24 optionless figure items, missing 2023 & 2026 |
| **`Jelet-ultimate-prep` (v2)** | Exact rational scoring, `"W"` voided handling, Leitner mistake queue, offline packs | Recycled unverified text forcing an *"Accuracy note: unresolved issues"* disclaimer across the UI; 15–18% of 2024/2025 questions unmarkable due to missing figures; 41/42 Learn chapters empty; 260 out-of-syllabus `2017–2021` questions; cluttered audit meta-pages |
| **`Diploma-3rd-sem` & `CodeC`** | Immediate student utility (Countdown, Streak, Roadmap Hero, Workbooks/Suggestions, zero-build Termux/CodeC workflow, transparent BYOK AI) | Serves as the direct architectural & UX foundation for **JELET Study Hub v3** |

**v3 Core Promise:** **Zero unverified text. Zero missing diagrams. Zero empty syllabus units. Zero fake statistics. Zero backend cost.** Every single question (`100/100` per paper across `2022–2026`), every SVG diagram, every answer key, and every SymPy-checked worked solution is 100% verified before shipping.

---

## Complete Documentation Map

Read these documents in order before writing a single line of code:

1. **[`AGENTS.md`](./AGENTS.md)** — Non-negotiable engineering, accuracy, UI, privacy, and testing laws for human contributors and coding agents.
2. **[`prompt.md`](./prompt.md)** — Reusable master handoff prompt to start each implementation phase cleanly without context drift.
3. **[`docs/01-PRODUCT-AND-EXAM-SPEC.md`](./docs/01-PRODUCT-AND-EXAM-SPEC.md)** — Official WBJEEB JELET Paper-I rules (`2022–2026`), exact `1/12`-mark integer scoring math, 9-step tie-breaker order, complete **42-unit canonical syllabus registry (`M01–M11`, `P01–P15`, `C01–C08`, `E01–E08`)**, and Jadavpur University lateral-entry eligibility & cutoff benchmarks.
4. **[`docs/02-UI-UX-DESIGN-SYSTEM.md`](./docs/02-UI-UX-DESIGN-SYSTEM.md)** — Complete **Phone-First Modern Web** design token specification (`tokens.css` incl. AMOLED dark mode), primary **`360px–430px` Phone UX** (`5-tab` bottom bar + `82dvh` OMR & AI bottom sheets) scaling cleanly via `min-width` to Tablet & Desktop (`240px` left rail), and screen-by-screen functional specs.
5. **[`docs/03-DATA-SCHEMA-AND-100-ACCURACY.md`](./docs/03-DATA-SCHEMA-AND-100-ACCURACY.md)** — Canonical `_data/` JSON schemas, official WBJEEB PDF URL & SHA-256 provenance registry (+ Google Drive / owner-supplied `2026` ingestion slot), SVG diagram reconstruction spec, 4-Gate Python/`SymPy` verification pipeline, IndexedDB v1 schema, and signed JSON backup format.
6. **[`docs/04-CODEC-AI-TUTOR-SPEC.md`](./docs/04-CODEC-AI-TUTOR-SPEC.md)** — Complete BYOK AI Tutor specification ported from `CodeC` (Phases 76–96): Gemini/Groq browser client, isolated key storage, one-time user agreement, `"Check prompt before sending"` preview, grounded official-key context injection, and anti-hallucination guardrails.
7. **[`docs/05-PHASE-ROADMAP-AND-GATES.md`](./docs/05-PHASE-ROADMAP-AND-GATES.md)** — Staged implementation roadmap (`Phase 00` → `Phase 10`), entry/exit acceptance gates, automated test requirements, and local preview instructions for Android (`CodeC` / `Termux`) and desktop.
8. **[`docs/06-GOOGLE-DRIVE-VAULT-GUIDE.md`](./docs/06-GOOGLE-DRIVE-VAULT-GUIDE.md)** — Organized `JELET_2028_Master_Vault/` Google Drive inventory (`00`–`06` + `05A`–`05E` reference books) and the **Strict GitHub Copyright Boundary** (`Step 0` copies ONLY Markdown specs + UI references into Git; zero copyrighted books/PDFs ever go to GitHub).
9. **[`docs/07-JELET-2026-FORENSIC-AUDIT.md`](./docs/07-JELET-2026-FORENSIC-AUDIT.md)** — Complete `Set A ↔ B ↔ C ↔ D` mapping table (`Q1–Q100`) and the 3 mandatory WBJEEB Final-Key overrides for `JELET 2026`.
10. **[`docs/references/ui-v3/README.md`](./docs/references/ui-v3/README.md)** — Complete **13-screen visual reference pack** (**Tier 1 Primary:** `10` Phone-First screens `01`–`07` & `11`–`13`; **Tier 2 Secondary:** `3` Desktop progressive-enhancement screens `08`–`10`) with an explicit audit table of **what to implement vs. mockup quirks never to copy**.
11. **[`docs/references/UI-REFERENCE-PROMPTS.md`](./docs/references/UI-REFERENCE-PROMPTS.md)** — Super-detailed, consistent copy-paste prompts (**Phone-First `9:19.5` Master Prefix & Prompts first**, plus AMOLED Dark Mode & Desktop expansion) for generating additional UI reference screens anytime.

---

## Running & Deploying

The app is a **zero-build, 100% static, installable offline PWA**. Preview it
locally with:

```bash
python3 -m http.server 8000   # then open http://localhost:8000/
```

It deploys to **any static host** (GitHub Pages, Netlify, Vercel, Cloudflare
Pages, S3, Termux) — see **[`DEPLOY.md`](./DEPLOY.md)** for per-host steps,
the hash-routing subpath note, and the installable-PWA / Service Worker
requirements.

---

## Planned Repository Structure (When Code Starts in Phase 01)

```text
/
├── index.html                    ← App entry / Today dashboard (works on subpath /<repo-name>/)
├── manifest.webmanifest          ← Installable PWA manifest (standalone, theme-color #0F6E66)
├── sw.js                         ← Staged atomic Service Worker (offline shell + KaTeX + opted-in paper packs)
├── offline.html                  ← Graceful offline fallback
├── assets/
│   ├── css/
│   │   ├── tokens.css            ← Single source of truth for colors, spacing, radii, typography, z-index
│   │   ├── shell.css             ← Responsive Modern Web left-rail + Mobile 5-tab bottom bar + drawers
│   │   └── components.css        ← Cards, badges, OMR palette, math blocks, SVG figure frames, AI sheet
│   ├── js/
│   │   ├── app.js                ← Router, theme controller, shell hydration
│   │   ├── db/                   ← Versioned IndexedDB v1 + BroadcastChannel sync + JSON backup/restore
│   │   ├── engine/               ← Exact 1/12-mark scoring engine, timer, OMR state machine, Leitner queue
│   │   ├── views/                ← today.js, learn.js, lesson.js, practice.js, exam.js, results.js, papers.js, you.js
│   │   └── ai/                   ← CodeC-style BYOK Gemini/Groq client, prompt preview, grounded injector
│   ├── vendor/katex/             ← Vendored KaTeX JS + CSS + WOFF2 fonts (100% offline math rendering)
│   └── icons/                    ← Unified stroke-width SVG icon spritesheet + PWA icons
├── _data/                        ← Immutable, CI-gated verified exam & curriculum JSON brain
│   ├── manifest.json             ← Dataset version, SHA-256 hashes, paper & subject counts
│   ├── syllabus-2026.json        ← Canonical 42 units (M01–M11, P01–P15, C01–C08, E01–E08) + JU cutoffs
│   ├── units/                    ← 42 unit workbooks (formulas, worked examples, WBJEEB traps, curated YouTube videoLectures[], PYQ/Booster links)
│   ├── papers/                   ← 2022.json, 2023.json, 2024.json, 2025.json, 2026.json (strictly official WBJEEB 100/100 Qs)
│   ├── practice-sets/            ← Modular original SymPy-verified Booster Packs & 100-Q JU Mock Sets (drop-in extensible anytime)
│   ├── solutions/                ← SymPy-verified step-by-step derivations + option-trap explanations (for both PYQs & Practice Sets)
│   └── figures/                  ← Theme-adaptive verified SVGs for every diagram/circuit/structure question
├── scripts/                      ← Offline authoring & CI verification scripts (never shipped to Pages)
│   ├── verify_corpus.py          ← Gate 1–4 validator (schema, 100-Q count, SVG existence, key parity)
│   ├── verify_solutions_sympy.py ← Symbolic/numerical proof of derived keys & worked examples
│   └── check_tokens_and_links.mjs ← Zero hardcoded hex, zero broken anchors/routes, relative-path check
├── tests/                        ← Unit tests (scoring, DB migrations, backup) + Playwright headless checks
└── docs/                         ← This complete specification & phase evidence records
```