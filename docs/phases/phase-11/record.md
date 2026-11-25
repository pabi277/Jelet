# Phase 11 Record — AI Tutor That Actually Knows You: Option Detection, Section Context & History

**Date:** 2026-11-25 (UTC)
**Branch:** `arena/f99389eb-jelet`
**Base:** `0e6635b52eb65c45bf88b5882538eb40be5afeff`
**Status:** Complete; all mandatory + browser gates green. Awaiting owner review/sign-off before any PR/merge.

## Build order and delivered slices

Executed `docs/phases/phase-11/plan.md` step-by-step. The AI Tutor sheet, its
ground-truth prompt builder and the results/practice/learn/papers/today call
sites were audited against the plan before implementation. No `_data/` truth
files, scoring, or timed-mock integrity lock were touched.

1. **Step 0 — Unblocked the flagship flow (blocking bug fix).**
   - `assets/js/views/results.js`: added the missing `formatDurationClock` to the
     `../core/ui.js` import. It was used at three Time Analysis render points but
     never imported, so **every timed-mock Results view threw a `ReferenceError`**
     and the screen stayed on *"Loading Result Analysis…"* (practice drills
     rendered fine, which is why fixtures missed it).
   - `scripts/check_community.mjs`: the results fixture now attaches real
     `computeMockAnalytics(...)` with a captured `questionTimes` map
     (`analytics.time.captured: true`) and asserts the **Time Analysis** block
     renders. Deleting the import again now fails the browser gate (regression
     covered, not just fixed).

2. **Step 1 — Tutor now sees the student's option (Bug A, one root cause).**
   - New pure module `assets/js/core/tutor-context.js`:
     - `normalizeTutorContext(ctx)` → canonical `selected` / `scoreResult` /
       `studentScoreText` + passthrough of `origin`, `section`, `mode`,
       `question`, `solution`, `unit`, `formula`, `paperTitle`, `manifest`.
       Accepts both naming styles forever (`selected` or `studentSelected`);
       derives `scoreResult` via `scoreQuestion` when only a selection is given,
       lets a recorded `studentOutcome` win over the computed outcome (keeping
       the exact computed `twelfths`), and derives `studentScoreText` from
       twelfths when not supplied verbatim.
     - `tutorContextKey(ctx)` → stable history key with priority
       `q:<questionId>` → `f:<unitId>:<formulaId>` → `u:<unitId>` → `g:<origin|"general">`.
   - `assets/js/views/ai-tutor.js`: `openTutor` now calls
     `normalizeTutorContext(ctx)` at the single entry point. No caller field
     names were changed. All four visible symptoms flip:
     offline reply leads with **"✗ Mistake Diagnosis: You selected (B)…"**, the
     context card shows **"Your choice: (B)"**, the auto-seed picks
     **"Why was my option wrong?"** for a wrong pick, and the BYOK prompt reads
     **"Student's Selected Option(s): B (Outcome: …, Score: …)"** instead of "None".

3. **Step 2 — Full section/page context (Gap B).**
   - All **12 `openAiTutor(...)` call sites** now pass a plain-string `origin`
     (grep-verified): Today Dashboard, Learn Explorer, Unit Lesson (+ `section:
     sec.heading`), Unit Formula Sheet, Unit PYQs, Formula Sheet, Practice Runner
     (×3), Results Review (×2), Papers Reader.
   - `assets/js/core/ai-vault.js`: `buildGroundTruthSystemPrompt` gained optional
     `origin` / `sectionHeading` params (default `""`, fully backward compatible).
     Each branch appends exactly one `Opened from: <origin>` line and, when
     present, one `Lesson section: <sectionHeading>` line. Both `ai-tutor.js`
     call sites (preview + live) pass them.
   - Context card: `renderTutorBody` appends ` · From <origin>` and, when
     present, ` · § <section>` to the `contextMeta` line (one text line, no
     layout change).
   - Optional attempt-history enrichment: for a question context, the card also
     shows ` · N prior attempt(s) · last <outcome>` from
     `getQuestionStatsMap()` — honest local data only; 0 attempts shows nothing.

4. **Step 3 — Dedicated conversation history (Gap C).**
   - New `assets/js/db/ai-history.js`: device-local IndexedDB **meta** record
     `{ key: "aiHistory", sessions: {…}, order: […] }` (separate from the `app`
     record so the sync payload stays small). Pure helpers: `sessionTitle`,
     `sessionContext` (ids only — full objects are re-fetched), `upsertSession`
     (caps `MAX_SESSIONS = 12` LRU + `MAX_MESSAGES_PER_SESSION = 30` newest),
     `deleteSession`, `clearHistory`, `listSessions`, plus best-effort
     `loadAiHistory` / `persistAiHistory` (never throw; memory-mode degrades to
     no persistence).
   - `assets/js/db/sync.js`: added `"aiHistory"` to `SYNC_LOCAL_META_KEYS`.
     `sanitizeForSync` only projects `app`/`syncTombs`, so the record is
     automatically excluded from every sync payload and outbox marker.
   - `assets/js/views/ai-tutor.js`:
     - `openTutor` computes `tutorContextKey`, restores a stored conversation
       when one exists, and **skips the auto-seed** for restored threads.
     - Persists after **every** `handleAsk` path (offline, BYOK success, abort,
       error-fallback) and on `closeTutor()`.
     - History UI inside the sheet (no new route, no 6th tab): header
       `icon-layers` button (`aria-label="Conversation history"`,
       `aria-expanded` toggles); panel replaces the chat thread with rows of
       **title · relative time · last-message snippet**; tap row → reopen (ids
       re-fetched via `getQuestionIndex`/`loadUnit`/`loadSolutionForQuestion`/
       formula lookup); per-row delete (×); **New chat** (clears current
       session, re-seeds); **Clear all history**; empty state; privacy line
       *"Stored only on this device · never synced · API keys never included."*
   - `assets/css/components.css`: token-driven, mobile-first history-panel styles
     (no hardcoded colors, `min-width` only).
   - `index.html`: history button added to the AI sheet header.
   - `sw.js`: precache list extended with `tutor-context.js` and `ai-history.js`
     (PWA offline gate).

5. **Step 4 — Tests.**
   - New `tests/tutor-context.test.mjs` (10 cases): normalizer naming styles,
     caller-outcome-wins, verbatim score text, no-selection → null,
     `scoreQuestion` derivation, `tutorContextKey` priority, and `ai-history`
     pure hygiene (titles, id-only context, message trimming, LRU eviction,
     delete/clear/list ordering).
   - `tests/ai-vault.test.mjs` (+2): `origin`/`sectionHeading` optional (absent
     by default), present lines appear exactly once, preview `bodyString` stays
     byte-equal to the sent payload, and the unit branch carries the origin line.
   - `tests/sync.test.mjs` (+2 assertions): `aiHistory` is in
     `SYNC_LOCAL_META_KEYS`; `sanitizeForSync` drops an `aiHistory` meta record
     even if present.

## Verification evidence

| Final gate | Command | Result |
| --- | --- | --- |
| Unit/integrity + endpoint tests | `node --test "tests/*.test.mjs"` | **120/120 PASS**, 0 failures/skips (102 → 120; +18 new) |
| Corpus | `python3 scripts/verify_corpus.py` | **PASS** — 400 questions, 4 papers, 42 units, 109 SVGs |
| SymPy verification | `python3 scripts/verify_solutions_sympy.py` | **PASS** — 400 solutions, 400 SymPy-verified (independent SymPy re-verification skipped: SymPy not installed in this sandbox; structure/coverage validated) |
| Tokens/paths/links/copyright | `node scripts/check_tokens_and_links.mjs` | **PASS** — zero raw hex, root asset paths, broken links or copyrighted files (315 files scanned) |
| Responsive regression | `node scripts/check_responsive.mjs` | **43/43 PASS** — 360/390/414/1440; zero horizontal overflow or console errors |
| Community browser regression | `node scripts/check_community.mjs` | **23 checks PASS** — zero console/page errors; includes the new timed-mock Time Analysis fixture assertion |

Browser tooling installed outside the repo in `/tmp/pwtool`
(`puppeteer-core@23`, `@sparticuz/chromium@133.0.0`); run with
`JELET_PW_ROOT=/tmp/pwtool`.

**AI Tutor end-to-end smoke (ad-hoc, real Results flow, 390×844):** opened the
tutor from a wrong-answer Results item and confirmed, with zero console errors:
context card shows **"Your choice: (B)"** and **"From Results Review"**; the
offline reply leads with **"You selected (B)"**; the history panel lists the
session with the privacy line; reopening a conversation restores its 2 messages
with **no duplicate auto-seed**; closing and reopening the same question keeps
the restored thread. This also caught and fixed a real runtime bug during
implementation — the composer-form submit listener was attached even while the
history panel had replaced the composer (`$("#aiComposerForm", wrap)?.addEventListener`
guard), which would have thrown on opening the history panel.

## Preserved invariants and scope limits

- Frozen corpus/gates and `scoring.js` have **zero diffs** against the base.
  Integer 1/12-mark arithmetic is unchanged; no exam content was authored/modified.
- The **timed-mock integrity lock** (`ai-tutor.js` exam-route guard) is
  unchanged; the AI Tutor remains locked during `#/exam/`.
- Five global destinations, hash routing, relative-subpath assets, figure
  tokens, installable/offline PWA and local-first default remain unchanged.
- **Privacy:** history is a device-local IndexedDB meta record — never synced
  (`sanitizeForSync` + `SYNC_LOCAL_META_KEYS`), never in backup API-key scope,
  and the BYOK vault (`jelet_ai_vault_v1`) is untouched. History stores only
  ids + messages; full question/unit objects are re-fetched by id.
- **Degradation:** every history read/write is best-effort. In memory-mode
  (IndexedDB blocked) the tutor works exactly as before and history simply does
  not persist.
- No streaming, no new providers, no chat export, no server persistence, no
  analytics of conversations, no 6th navigation tab, no `_data/` changes.
- No PR opened, no merge/push performed, no branch switch. Owner review/sign-off
  remains required before any PR/merge.

---

## Follow-up (Phase 11b) — AI Chat UX: typewriter, non-sticky suggestions, keyboard-aware layout

**Date:** 2026-11-25 (UTC) · **Same branch/base** as Phase 11.
**Status:** Complete; all gates re-run green. Awaiting owner review/sign-off
before any PR/merge (per `AGENTS.md` §5.5).

### Owner complaints solved

1. **"The reply always comes at once… I want the thinking bubble then a
   word-by-word typing feel."** → Assistant replies now **reveal word-by-word**
   (typewriter) after the thinking indicator, on **every** reply path: offline
   corpus reply, BYOK success reply, abort ("Generation stopped.") and the
   offline-fallback error reply.
2. **"The suggestions are good but always sticky on phone UI — bad space
   management."** → The preset suggestion chips are now a **collapsible row**
   with a "Suggestions" toggle. They **collapse by default** once a reply
   exists (seeded or restored) so they no longer permanently consume phone
   space; tap to expand.
3. **"When typing, the typing space stays under the keyboard."** → The AI
   sheet now **fits itself to the `visualViewport`** while open on phone/tablet,
   so the composer stays pinned **above** the on-screen IME keyboard. Desktop
   (≥1024px) is left untouched.

### Implementation

- `assets/js/views/ai-tutor.js`
  - New state: `thinking`, `typing`, `suggestionsOpen`.
  - New helpers: `prefersReducedMotion`, `clearThinking`, `cancelTyping`,
    `commitTyping`, `finalizeTyping`, `startTyping` (word-by-word reveal,
    bounded to ~30 ticks, collapses instantly under reduced-motion), and the
    keyboard-fit trio `fitSheetForKeyboard` / `startKeyboardFit` /
    `stopKeyboardFit` (driven by `visualViewport` `resize`+`scroll`).
  - `handleAsk`: offline path shows a thinking bubble during compute then
    types the reply; BYOK shows the thinking bubble, then types the success,
    abort, or fallback reply. The full text is committed to `chatHistory` and
    persisted **only** when the reveal completes (so byte-exact preview and
    history persistence always see the complete message).
  - `renderTutorBody`: renders the thinking bubble (three pulsing dots) or the
    in-progress typewriter bubble (with a blinking cursor) while a reply is
    in flight; the preset chips are now a `.ai-suggestions` block with a
    `#aiSuggestionsToggle` (`aria-expanded`) wrapping the `#aiChipsRow`.
  - `openTutor`: starts keyboard-fit; sets `suggestionsOpen` **before** the
    auto-seed so a thread that will end up with a reply starts with chips
    collapsed. `closeTutor` commits any in-flight typing, then stops
    keyboard-fit.
- `assets/css/components.css`: thinking-dots animation, typewriter cursor
  blink, suggestions-toggle styling, and `.ai-sheet--keyboard .ai-tutor-wrap`
  fills the fitted body; all animations respect `prefers-reduced-motion`.

### Acceptance / verification (all green)

- `node --test "tests/*.test.mjs"` — **120/120 PASS**.
- `check_tokens_and_links.mjs` — PASS (316 files).
- `check_responsive.mjs` — **43/43** (360/390/414 + 1440).
- `check_community.mjs` — **23/23**.
- `verify_corpus.py` — PASS.
- Ad-hoc browser smokes (mobile 390×844 + desktop 1440×900): typewriter
  thinking+cursor states observed during a live reply, suggestions toggle
  collapses/expands, keyboard-fit sets inline height + class on mobile and is
  correctly **skipped** on desktop, zero console errors.

### Scope limits (Phase 11b)

- AI-sheet UX only. No corpus/scoring/data changes, no new providers, no
  history/sync behavior changes. Existing Phase 11 invariants (frozen corpus,
  timed-mock lock, privacy, offline degradation) remain intact.
