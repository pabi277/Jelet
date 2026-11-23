# Reusable Master Continuation Prompt (`prompt.md`)

Copy and paste the prompt block below when starting a new coding session (or handing a phase to an AI coding agent) so the session inherits the full architecture without guessing.

---

```markdown
You are implementing **JELET Study Hub (v3)** — a 100%-accurate, **Phone-First** offline Modern Web PWA for West Bengal Diploma Engineering students preparing for WBJEEB JELET Paper-I (targeting Jadavpur University).

### Mandatory Pre-Read Before Writing Any Code
Read these specification files in full before proposing or editing any file:
1. `AGENTS.md` — Non-negotiable curriculum, accuracy, Phone-First CSS (`min-width` only), UI token, privacy, and BYOK AI laws.
2. `docs/01-PRODUCT-AND-EXAM-SPEC.md` — Official JELET 2022–2026 pattern, 1/12-mark exact integer scoring, 9-step tie-breakers, all 42 canonical syllabus units (`M01–M11`, `P01–P15`, `C01–C08`, `E01–E08`), and JU cutoff benchmarks.
3. `docs/02-UI-UX-DESIGN-SYSTEM.md` & `docs/references/ui-v3/README.md` — Design tokens (`#0F6E66` emerald-teal + AMOLED dark mode `#070C0C`), **Phone-First (`360px–430px` primary — Screens `01`–`07` & `11`–`13`)** scaling up via `min-width` to Desktop (`≥1024px` — Screens `08`–`10`), adopting visual polish while rejecting mockup-only artifacts.
4. `docs/03-DATA-SCHEMA-AND-100-ACCURACY.md` — `_data/` JSON schemas, SVG figure requirements, SymPy proof gates, IndexedDB v1 schema, and backup envelope.
5. `docs/04-CODEC-AI-TUTOR-SPEC.md` — CodeC-style BYOK AI Tutor (isolated key storage, one-time agreement, "Check prompt before sending" preview, grounded official-key injection).
6. `docs/05-PHASE-ROADMAP-AND-GATES.md`, `docs/06-GOOGLE-DRIVE-VAULT-GUIDE.md` & `docs/07-JELET-2026-FORENSIC-AUDIT.md` — Phase roadmap, Google Drive vault inventory, and 2026 forensic rules.

### Hard Constraints for Every Turn
- **Step 0 (Mandatory First Work Before Writing Any Code):** If starting in a fresh workspace/repo, your **very first action** MUST be copying the complete architecture docs (`README.md`, `AGENTS.md`, `prompt.md`, `docs/01`–`07`) and UI reference pack (`docs/references/UI-REFERENCE-PROMPTS.md` + `docs/references/ui-v3/01`–`13` & `README.md`) into the repository + writing `.gitignore` BEFORE creating any app code.
- **Zero Copyrighted Files on GitHub:** NEVER copy, commit, or deploy ANY textbook PDF, NCERT `.zip`, coaching sheet, or guidebook from Google Drive (`05_Reference_Books_PRIVATE_NO_GITHUB/*` or raw `.pdf` files) into the Git repository. Use reference books strictly as private read-only verification in `.cache/` (untracked) and write 100% original prose, worked examples, and SVGs.
- **Scope & Two-Tier Question Bank:** Strictly `2022–2026` Paper-I (PCM + FEEE, 100 Qs, 120 Marks — zero `2017–2021` old syllabus). Keep official WBJEEB papers in `_data/papers/` (`sourceType: "official-pyq"`) and build the extensible `_data/practice-sets/` loader (`sourceType: "curated-practice"`) from Day 1 so extra Unit Booster & 100-Q Mock JSON packs drop in seamlessly now and later.
- **Curated YouTube Video Learning:** Support `videoLectures[]` inside all 42 unit workbooks using a zero-tracking click-to-load `youtube-nocookie.com` facade + native YouTube deep-link + `Watched ✔` IndexedDB tracking + clean offline state (never auto-mount third-party iframes on page load).
- **100% Accuracy:** Zero placeholder questions, zero missing diagrams, zero unverified keys, zero "accuracy disclaimer" banners, zero floating-point score drift (use integer `twelfths`, where `1 mark = 12 twelfths`).
- **Stack:** Zero-bundler Vanilla ES Modules (`HTML + CSS Custom Properties + JS Modules`) runnable directly via `python3 -m http.server 8000` (for Android Termux / CodeC Web Preview) and deployable as static files to GitHub Pages under any `/<repo>/` subpath.
- **Honest Metrics:** Never hardcode fake streaks, completion percentages, or simulated ranks (`142/12,540`). Derive every user stat from IndexedDB (`jelet_hub_v1`) and compare mock scores only against documented historical WBJEEB/JU cutoffs.

### Current Assignment
Execute **Phase [XX]: [Phase Title]** from `docs/05-PHASE-ROADMAP-AND-GATES.md`:
1. Confirm entry conditions and list the exact files you will create or touch.
2. Implement only the scoped phase deliverables cleanly using `assets/css/tokens.css` primitives.
3. Run all applicable verification scripts (`verify_corpus.py`, `verify_solutions_sympy.py`, `check_tokens_and_links.mjs`, and headless mobile `360×800` + desktop `1440×900` checks).
4. Write the phase evidence record under `docs/phases/phase-XX/record.md` and stop for owner QA before merging.
```
