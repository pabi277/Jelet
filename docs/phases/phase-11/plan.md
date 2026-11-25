# Phase 11 PLAN — AI Tutor That Actually Knows You: Option Detection, Section Context & History

> **Status:** 📋 Research complete · **zero code written** · awaiting owner go-ahead.
> **Previous:** Phase 10 (done) · **Next:** Phase 12 (`phase-12/plan.md`) ·
> **Research basis:** `docs/08-RESEARCH-FEATURE-AND-UI-REFINEMENT-PROPOSALS.md` + direct
> source audit of `assets/js/views/ai-tutor.js` and all 12 call sites (2026-11-25).
> **Roadmap note:** takes number 11; legacy content row in `docs/05` becomes 14+ on approval.

---

## 0. The Goal in Plain Words

The AI Tutor sheet already exists and is well-built, but three things are wrong from
the student's point of view:

1. **"I answered B, but the AI doesn't know I picked B."** — The student's selected
   option is passed by every screen, yet the tutor reads a *different field name*,
   so it always sees "no selection". (Bug — one root cause, four symptoms.)
2. **"The AI doesn't know where I am."** — Opened from a lesson section, a drill, or
   a mock result, the tutor gets the same generic context. It should know the page,
   the lesson section, and (optionally) your past attempts on that question.
3. **"Every time I close it, the conversation is gone."** — There is no history at
   all. The tutor must remember past conversations per question/unit and let you
   reopen or clear them.

Plus **one blocking unrelated bug** found in the same audit (Step 0 below): the
Results page crashes for every timed mock. Fix it first — it is one line.

---

## 1. What the Research Found (Evidence)

### 1.1 Bug A — the student's option never reaches the AI

**Root cause:** callers pass `studentSelected` / `studentOutcome` / `studentScoreText`,
but the tutor only reads `selected` / `scoreResult`. **No caller ever sets those two
fields**, so they are always empty.

| Caller (where "Ask AI" is pressed) | Line | What it passes | What the tutor reads |
| :--- | :---: | :--- | :--- |
| Practice runner — solution block | `practice.js:981` | `studentSelected`, `studentOutcome` | `activeContext.selected` (`ai-tutor.js:331,350,614`) → **always `[]`** |
| Practice runner — hint button | `practice.js:1045` | `studentSelected` | same → **always `[]`** |
| Practice runner — previous answer | `practice.js:1077` | `studentSelected` (prior pick) | same → **always `[]`** |
| Results — solution block | `results.js:485` | `studentSelected`, `studentOutcome`, `studentScoreText` | same → **always `[]`** |
| Results — "Ask AI Tutor" button | `results.js:540` | same | same → **always `[]`** |
| Learn — unit PYQ reveal / Papers reader | `learn.js:736`, `papers.js:438` | *(no selection — correct, reader mode)* | — |

**Four visible symptoms, all from the same root cause:**

1. **Offline corpus reply never diagnoses the mistake.**
   `buildOfflineCorpusReply` reads `context.selected` (`ai-tutor.js:53`). Empty →
   it falls into the generic *"Verified Answer Key: (C)"* branch instead of
   *"✗ You selected (B), the key is (C)…"*.
2. **Context card hides the choice.** `ai-tutor.js:331-333` shows
   *"Reviewing question"* instead of *"Your choice: (B)"*.
3. **Auto-seed picks the wrong opener.** `ai-tutor.js:297-302` only seeds
   *"Why was my option wrong?"* when `activeContext.selected` is non-empty —
   it never is, so it always seeds the neutral *"Show verified step-by-step breakdown"*.
4. **The BYOK model is told "None".** Both system-prompt builders receive
   `studentSelected: activeContext.selected || []` (`ai-tutor.js:350-353` offline
   preview path, `ai-tutor.js:614-617` live path) → the prompt line
   *"Student's Selected Option(s): None"* (`ai-vault.js`, question branch) is wrong.

**Why tests missed it:** unit tests cover `buildOfflineCorpusReply` with explicit
`context.selected`, and browser fixtures never asserted the prompt/context-card text
for a real Results/Practice click path.

### 1.2 Gap B — no notion of "which section / which page"

* No `openAiTutor(...)` call passes any origin/page label (all 12 call sites audited).
* `buildGroundTruthSystemPrompt` (`ai-vault.js:148`) accepts only
  `question, solution, unit, formula, paperTitle, studentSelected, studentOutcome,
  studentScoreText, languageMode` — **no origin, no lesson-section**.
* In the lesson Workbook, the *"Explain this step"* buttons (`learn.js:502`) know the
  section (`sec.heading`) but do not pass it.

### 1.3 Gap C — no history at all

* `openTutor` does `chatHistory = []` on **every open** (`ai-tutor.js:287`).
* `chatHistory` is a plain in-memory array (`ai-tutor.js:258`) — never persisted,
  no history UI, no way to revisit or clear past conversations.

### 1.4 Step-0 blocker found in the same audit (unrelated to AI)

* **P0 — Results page crashes for every timed mock.**
  `results.js` calls `formatDurationClock(...)` at **lines 259, 262, 267** but its
  `../core/ui.js` import block (**lines 43–52**) does not include it (export exists at
  `ui.js:27`). `stats.js:457` attaches analytics to every submission and
  `analytics.time.captured` is true whenever the exam runner recorded `questionTimes`
  (`stats.js:574`) → `ReferenceError` while building the DOM → the view rejects →
  screen stuck on *"Loading Result Analysis…"*. Practice drills render fine (no
  question times), which is why fixtures missed it.

---

## 2. Work Steps (do in this order)

### Step 0 — Unblock the flagship flow (tiny, do first)

| # | File | Change | How to verify |
| :-: | :--- | :--- | :--- |
| 0.1 | `assets/js/views/results.js` | Add `formatDurationClock` to the import from `../core/ui.js` (block at lines 43–52). | Start a 2h mock from Papers → answer a few → Submit → Results renders the **Time Analysis** block without console errors. |
| 0.2 | (test) | Add a browser-gate fixture attempt with `analytics.time.captured: true` (extend `scripts/check_community.mjs` results fixture) so this can never regress silently. | Gate passes; deleting the import again would fail it. |

### Step 1 — Make the tutor see the student's option (Bug A)

**Approach:** introduce one pure normalizer function and call it at the single entry
point (`openTutor`). Never touch the 6 callers' field names — both naming styles must
be accepted forever (defensive, cheap).

**1a. New file `assets/js/core/tutor-context.js`** (pure, Node-testable, no DOM):

| Export | Responsibility |
| :--- | :--- |
| `normalizeTutorContext(ctx)` | Returns a new context object with **canonical fields**: `selected` (array), `scoreResult` (`{outcome, twelfths?, …}` or `null`), `studentScoreText` (string), plus passthrough of `origin`, `section`, `mode`, `question`, `solution`, `unit`, `formula`, `paperTitle`, `manifest`. |
| `tutorContextKey(ctx)` | Stable string key for history (see Step 3): `q:<questionId>` → `f:<unitId>:<formulaId>` → `u:<unitId>` → `g:<origin or "general">` (first match wins). |

**Normalization rules (exact, in priority order):**

1. `selected` = `ctx.selected` if it is an array, else `ctx.studentSelected` if it is
   an array, else `[]`.
2. `scoreResult`:
   * if `ctx.scoreResult` exists → keep it;
   * else if `question` and `selected` is non-empty → compute with
     `scoreQuestion(question, selected)` (already exported by `core/scoring.js`);
     if the caller also passed `studentOutcome`, **the caller's outcome wins**
     (it is the recorded attempt truth — override the computed `outcome`, keep the
     computed `twelfths`);
   * else if `ctx.studentOutcome` exists → `{ outcome: ctx.studentOutcome }`
     (no `twelfths` — fine, nothing needs it when there is no selection);
   * else → `null`.
3. `studentScoreText` = `ctx.studentScoreText` if non-empty, else
   `formatTwelfths(scoreResult.twelfths, { signed: true })` when `twelfths` is a
   number, else `""`.

**1b. Wire it in `assets/js/views/ai-tutor.js` → `openTutor(ctx)`:**
first line of context handling: `activeContext = normalizeTutorContext(ctx)` instead of
`{ ...ctx }` (after the timed-mock integrity lock). Everything downstream already reads
the canonical names — no other logic changes.

**Acceptance for Step 1 (all four symptoms must flip):**

| # | Check | Expected after fix |
| :-: | :--- | :--- |
| 1 | Open a wrong answer in **Practice Runner → Solution → Ask AI** (offline mode) | Reply starts with **"✗ Mistake Diagnosis: You selected (B)…"** (offline path, `ai-tutor.js:53+`) |
| 2 | Same open — look at the context card | **"Your choice: (B)"** instead of "Reviewing question" (`ai-tutor.js:331`) |
| 3 | Same open — first auto-seeded message | **"Why was my option wrong?"** (`ai-tutor.js:301`) |
| 4 | With a BYOK key + "Preview prompt before sending" ON | Prompt line reads **"Student's Selected Option(s): B (Outcome: incorrect, Score: −0.25)"** — not "None" (`ai-vault.js` question branch) |
| 5 | Results page → expanded item → Ask AI | Same as 1–4, with `studentScoreText` preserved verbatim |

### Step 2 — Full section/page context (Gap B)

**2a. Every call site passes an `origin` label** (plain string, human-readable):

| File:line (current) | Add `origin:` |
| :--- | :--- |
| `today.js:531` | `"Today Dashboard"` |
| `learn.js:244` | `"Learn Explorer"` |
| `learn.js:502` (Explain this step) | `"Unit Lesson"` **plus `section: sec.heading`** |
| `learn.js:651` (unit formulas tab) | `"Unit Formula Sheet"` |
| `learn.js:736` (unit PYQ reveal) | `"Unit PYQs"` |
| `learn.js:995` (global formula sheet) | `"Formula Sheet"` |
| `practice.js:981`, `1045`, `1077` | `"Practice Runner"` |
| `results.js:485`, `540` | `"Results Review"` |
| `papers.js:438` | `"Papers Reader"` |

**2b. Prompt injection — `assets/js/core/ai-vault.js` → `buildGroundTruthSystemPrompt`:**
add two **optional** parameters (default `""`, fully backward compatible):
`origin` and `sectionHeading`. Append one line to whichever branch is used:
`Opened from: <origin>` and, when present, `Lesson section: <sectionHeading>`.
Both call sites in `ai-tutor.js` (line ~350 preview path and line ~614 live path) pass
`origin: activeContext.origin` and `sectionHeading: activeContext.section`.

**2c. Context card display — `ai-tutor.js` `renderTutorBody`:**
extend the `contextMeta` line with ` · From ${origin}` and, when present,
` · § ${section}`. (No layout change — one text line.)

**2d. (Optional, recommended) attempt-history enrichment:**
when a `question` context exists, load `getQuestionStatsMap()` (from `core/stats.js`)
and append to `contextMeta`:
` · ${attemptsCount} prior attempt(s) · last ${lastOutcome}`.
Honest local data only; `0 prior attempts` shows nothing extra.

### Step 2 checklist
- [ ] 12 call sites updated (table above — grep `openAiTutor({` to confirm none missed)
- [ ] Prompt shows origin in preview JSON (byte-exact preview still matches body —
      `docs/04` invariant: change the **builder**, never the preview separately)
- [ ] Context card shows origin + section on phone (360 px) without wrapping oddly

### Step 3 — Dedicated conversation history (Gap C)

**3a. Storage design (device-local, zero sync, zero backend):**

| Aspect | Decision & why |
| :--- | :--- |
| Where | **IndexedDB meta store, separate record** `{ key: "aiHistory", sessions: {…}, order: [ … ] }` — same access pattern as the existing `benchmark` meta record (`db.get("meta", "benchmark")` / `db.put(...)`, see `views/benchmark.js`). **Do not** put it inside the `app` record (`getMeta/setMeta`) — keeps the sync payload small. |
| Why it never syncs | `sanitizeForSync` only projects meta records whose key is `"app"` or the tombstone key (`sync.js`, `sanitizeForSync`). A record named `aiHistory` is **automatically excluded** from every sync payload. Additionally add `"aiHistory"` to `SYNC_LOCAL_META_KEYS` (`sync.js:66`) so outbox marker filtering skips it too. Existing test `tests/sync.test.mjs:531` only asserts `sync`/`syncOutbox` are in and `app`/tombstone are out — it stays green. |
| Why the sheet will not close/flicker | Every IndexedDB write broadcasts `{ store: "meta", type: "mutate" }` (`indexeddb.js`, `broadcast`). `app.js`'s `onSync` handler only re-renders on `type === "sync-applied" | "replace"` — `mutate` just re-applies the theme. **Safe.** |
| Backup | `exportBackup` collects all stores → history rides along in the **signed local** `.json` backup. Acceptable: messages only, **never API keys** (the vault is separate `localStorage` and untouched). |
| Degradation | Wrap every read/write in try/catch — in memory-mode (IndexedDB blocked) history simply does not persist; tutor works exactly as today. |

**3b. Caps & shape:**

* `MAX_SESSIONS = 12` — evict least-recently-updated beyond that.
* `MAX_MESSAGES_PER_SESSION = 30` — keep the newest 30 messages of a session.
* Per session store: `title` (e.g. `JELET 2025 · Q42 · Unit P08` or `Unit M01 · Matrices` or
  `General · Today Dashboard`), `updatedAt` (ISO), `messages[]`
  (`{ role: "user"|"assistant", text, source, at }` — same shape as `chatHistory`),
  and a **minimal rehydratable context**:
  `{ mode, questionId, unitId, formulaId, origin, section, paperTitle, selected, studentOutcome, studentScoreText }`.
  **Never** store the full question/unit objects (they are re-fetched by id — saves space).

**3c. Behavior:**

1. **Open** → compute `tutorContextKey(activeContext)`; if a stored session exists →
   restore `chatHistory` from it and **skip the auto-seed** (today `openTutor`
   always seeds — seeding must only happen for genuinely new threads).
2. **New thread** → key exists but user taps *New chat* → clear that session's
   messages, then seed normally.
3. **Persist** → after **every** `handleAsk` completes (four paths: offline, BYOK
   success, abort, error-fallback) and on `closeTutor()`; write via
   `db.put("meta", { key: "aiHistory", sessions, order })` inside try/catch.
4. **Restore on rehydration** (history row tap): ids →
   `getQuestionIndex().get(questionId)` → `loadSolutionForQuestion(q)` →
   `loadUnit(unitId)` → find formula by `formulaId` across
   `unit.sections[].keyFormulas` / `unit.notes[].keyFormulas` → then `openTutor(...)`
   with the restored messages.

**3d. UI spec (inside the AI sheet only — no new routes, no 6th tab):**

| Element | Spec |
| :--- | :--- |
| History button | Header row of `#aiSheet`, beside the mode badge: `icon-layers`, `aria-label="Conversation history"`, `aria-expanded` toggles. |
| History panel | Replaces the chat thread area while open: rows of **title · relative time · last-message snippet (1 line)**; tap row → open that conversation; each row has a small **delete (×)** control; footer: **"Clear all history"** (confirm via `showToast`-style inline confirm or second tap). |
| New chat button | In history panel header: clears current session only. |
| Empty state | *"No past conversations yet — ask about any question or unit and it will be remembered here (stored only on this device)."* |
| Privacy line | One `card__meta` line: *"Stored only on this device · never synced · API keys never included."* |

### Step 4 — Tests

| Test | File | Cases |
| :--- | :--- | :--- |
| Normalizer (pure) | **new** `tests/tutor-context.test.mjs` | `studentSelected`→`selected`; `studentOutcome` passthrough + caller-outcome-wins; `studentScoreText` preserved; no-selection → `scoreResult` null; `scoreQuestion` computed when only selection given; `tutorContextKey` priority (`q` > `f` > `u` > `g`). |
| Prompt builder | extend `tests/ai-vault.test.mjs` | `origin`/`sectionHeading` optional → absent by default; present lines appear exactly once; preview `bodyString` still byte-equals what `buildAiRequestPayload` sends. |
| History record hygiene | extend `tests/sync.test.mjs` (or tutor-context test) | `SYNC_LOCAL_META_KEYS` includes `aiHistory`; `sanitizeForSync` drops an `aiHistory` meta record even if present. |
| Regression for Step 0 | browser gate (`check_community.mjs`) | results fixture with `analytics.time.captured: true` renders Time Analysis. |

---

## 3. Acceptance Checklist (Phase 11 close)

- [ ] Step 0.1–0.2 done — timed-mock Results renders Time Analysis, no console error
- [ ] Symptom checks 1–5 in Step 1 all pass on a real phone-width viewport (360 px)
- [ ] All 12 call sites pass `origin` (grep-verified); lesson Explain passes `section`
- [ ] Prompt preview (byte-exact) contains the new context lines; `docs/04` invariant holds
- [ ] History: ask → close sheet → reopen same question → thread restored, no duplicate seed
- [ ] History: delete row, clear all, empty state all work; caps enforced (≤12 sessions, ≤30 msgs)
- [ ] History record absent from sync payload (test) and absent from API keys (impossible by design)
- [ ] Memory-mode degradation: with IndexedDB blocked, tutor still works, no uncaught errors
- [ ] All four mandatory gates green:
  `verify_corpus.py` · `verify_solutions_sympy.py` · `check_tokens_and_links.mjs` · `node --test "tests/*.test.mjs"`
- [ ] Browser gates green: `check_responsive.mjs` · `check_community.mjs`
- [ ] Owner review → convert this plan into `phase-11/record.md` (evidence: commits, gate outputs)

## 4. Out of Scope (do NOT do in this phase)

* No streaming responses, no new AI providers, no chat "export" file formats.
* No persistence of prompts to any server; no analytics of conversations.
* No changes to the **timed-mock integrity lock** (`ai-tutor.js` exam-route guard).
* No changes to `_data/` truth files.
* No API key / vault changes (`jelet_ai_vault_v1` stays isolated).
* No 6th navigation tab — history lives inside the existing sheet.
