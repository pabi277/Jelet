# Phase 14 PLAN — AI Tutor Dedicated Phase: Request Governor, Sheet UI Rebuild & AI Settings

> **Status:** execution in progress; see `record.md` for implemented behavior and gates.
> **2026-11-25 execution decisions:** owner delegated technical choices for
> concurrency, auto-seeding and streaming and requested key encryption. Use
> atomic IndexedDB reservations (fail closed to offline when unavailable),
> offline auto-seeds, real SSE streaming, and optional passphrase-protected keys.
> **Previous:** Phase 13 (Learn enrichment — owner-blocked, unrelated) ·
> **Research basis:** [`docs/09-AI-PHASE-RESEARCH-AUDIT.md`](../../09-AI-PHASE-RESEARCH-AUDIT.md)
> (line-level audit of all 6 AI modules + 12 call sites, Nov 2026) + live provider
> rate-limit literature (Gemini Dec-2025 cuts, Groq TPM/TPD, OpenRouter `:free` caps).
> **Roadmap note:** takes number 14 (next free slot). On approval, `docs/05` legacy
> content row stays 14+ → becomes 15+ (owner-only edit, AGENTS §5.5).
> **Slices:** 14A Request Governor & Token Budget → 14B Tutor Sheet UI Rebuild →
> 14C AI Settings & Transparency. 14B and 14C are independent of each other; 14A first.
> **Owner decisions incorporated (2026-11-25, this revision):** ALL AI settings live
> ONLY in `#/you` (phone space — the sheet is chat + history only) · when a reply
> ends on token/rate limits, retry inside a **1 min 10 s (70 s)** grace window
> before the exchange is cut to Offline Corpus · **NVIDIA NIM** added as 4th
> provider (free `nvapi-` keys) · Gemini default model → **`gemini-3.1-flash-lite`** ·
> prompt preview ("Check prompt before sending") defaults **OFF**.

---

## 0. The Goal in Plain Words

The AI Tutor's brain (ground-truth injection, offline corpus fallback, vault
isolation) is excellent and stays untouched. Three things around it are broken:

1. **"The tutor spends my free quota without asking."** Opening a question fires a
   live request; nothing throttles, nothing counts, nothing retries sensibly. Free
   tiers in 2026 are brutal: Groq 70B ≈ 12k tokens/min and 100k tokens/day,
   OpenRouter `:free` = 50 requests/day **and failed attempts count**, and even the
   new owner-chosen default `gemini-3.1-flash-lite` (free readings 500–1,500 RPD)
   needs pacing while the auto-seed fires on open.
2. **"The sheet fights me while I use it."** The whole sheet DOM is torn down every
   22 ms during the typewriter reveal (KaTeX re-rendered for every bubble, focus
   killed, drafts wiped), errors are pasted as chat text with no retry/offline
   actions, long derivations truncate silently with no Continue button, and the
   promised streaming never shipped.
3. **"I can't see or change anything about the AI."** No in-sheet provider/model
   switch, no generation settings, no "requests left today", no usage dashboard, no
   Hinglish/Simple English — everything lives on `#/you`, and changing it abandons
   the conversation.

**Preserve absolutely (AGENTS §4 + docs/04):** zero-server BYOK, vault isolation &
backup exclusion, byte-exact preview invariant, Ground-Truth Lock, timed-mock lock,
one-time welcome agreement, offline-first corpus fallback, token-only theming,
phone-first CSS, no build step.

---

## 1. What the Research Found (One-Line Evidence per Symptom)

| Symptom | Root cause (file : line) |
| :-- | :-- |
| Opening 6–10 questions/min ⇒ guaranteed 429 on free Gemini | auto-seed fires BYOK when key exists (`ai-tutor.js:633–644`); no governor anywhere |
| "Rate limit" and "wrong key" look identical to the student | HTTP status + headers discarded after `res.ok` (`ai-vault.js:339–351`); error pasted into bubble (`ai-tutor.js:1092–1097`) |
| Groq dies after ~25–60 grounded asks/day despite "1,000 RPD" | token-blind design: full solution injected + count-only 8-turn trim (`ai-vault.js:266`) vs Groq 12k TPM / 100k TPD |
| Long derivations stop mid-step | `finishReason`/`finish_reason` never read; `maxOutputTokens` hardcoded 1024 (`ai-vault.js:279,307–308`); docs/04 §4 "Continue" button missing |
| Sheet janks & input dies during reply reveal | whole-sheet `innerHTML` rebuild per 22 ms tick incl. per-bubble KaTeX (`ai-tutor.js:381–395, 655, 743–745`) |
| Draft lost on chip tap / language toggle | composer rebuilt empty on every render (no value restore) |
| Hang forever on a stalled provider | no fetch timeout; manual Stop is the only exit |
| Test Connection burns ~128× spec'd quota | spec says `maxOutputTokens: 8` (docs/04 §2.3); code routes through 1024-token builder (`ai-vault.js:353–368`) |
| "How much free quota is left?" unanswerable | `usageMetadata`/`usage` discarded; no daily counters stored |
| Screen readers never hear replies | chat thread has no `aria-live`; no focus trap in `aria-modal` sheet |
| Model/provider change abandons the doubt | settings exist only on `#/you` (`you.js:206–264`) |

---

## 2. Slice 14A — Request Governor & Token Budget (logic-first, minimal UI)

### 2.1 New pure module `assets/js/core/ai-governor.js`

Node-testable, no DOM. All state device-local under a new **meta** record
(`aiGovernor`), added to `SYNC_LOCAL_META_KEYS` so it never syncs (same pattern as
`aiHistory`, phase 11).

1. **Rate-window limiter** `canSendNow(provider, now)` / `recordSend(provider, now)`:
   * Per-provider config table `PROVIDER_LIMITS` (conservative free-tier defaults,
     overridable in the vault later via 14C). Gemini numbers target the new
     **`gemini-3.1-flash-lite` default** (published free readings: 10–30 RPM,
     500–1,500 RPD — paced at the conservative floor):
     `gemini { minGapMs: 6000, rpm: 10, dailyWarn: 50, dailyMax: 100 }`,
     `groq { minGapMs: 3000, rpm: 30, dailyWarn: 40, dailyMax: 80 }`,
     `openrouter { minGapMs: 3000, rpm: 20, dailyWarn: 40, dailyMax: 48 }`
     (OpenRouter hard-max stays below the 50/day cap because **failed attempts count**),
     `nvidia { minGapMs: 2000, rpm: 40, dailyWarn: 100, dailyMax: 200 }`
     (NVIDIA NIM publishes ~40 RPM per model, best-effort, credit-based evaluation
     tier — soft daily defaults; research: `docs/09` §6.4).
   * **Owner retry law (2026-11-25):** one visible grace window
     `RETRY_WINDOW_MS = 70000` (1 min 10 s) governs every recovery wait — per-minute
     rate-limit retries, 5xx retries, and token-limit auto-continue all live inside
     it with a live countdown. When the window expires, the **live exchange is cut**
     and the Offline Corpus reply is shown (stored chat history is never deleted).
   * Sliding 60 s window of send timestamps + per-local-day counter
     (`YYYY-MM-DD` in device locale), reset at local midnight.
   * Verdict enum: `ok` · `min-gap (retryInMs)` · `rpm (retryInMs)` · `daily-warn` ·
     `daily-block`.
2. **Token estimator** `estimateTokens(text)`: chars/4 baseline + KaTeX-aware
   adjustment + per-message overhead; `trimHistoryByBudget(history, systemPrompt,
   tokenBudget)` shrinks turns oldest-first until estimated prompt fits budget
   (Gemini 8k, Groq 8k — comfortably inside their TPM caps — OpenRouter 6k), keeping
   **at least the last 2 turns**, floor of 2, cap of 8 (spec docs/04 §4).
3. **429/error classifier** `classifyProviderError(status, bodyText, headers)` →
   `per-minute` (429 + rate-limit message or `Retry-After` present) · `daily-quota`
   (429 + quota/daily language, Gemini `quota_exceeded`) · `auth` (401/403) ·
   `bad-request` (400) · `server` (5xx/408) · `network` (TypeError/abort) · `unknown`.
   Parses `Retry-After` (seconds or HTTP-date).
4. **Backoff policy** pure `nextRetryMs(attempt, classifierResult, retryAfterHeader)`:
   exponential 2^n s capped 60 s ± 10 % jitter; **zero retries** for `auth`,
   `bad-request`, `daily-quota` (provider guidance; OpenRouter burns RPD on
   failures). Max 2 automatic retries, only for `per-minute` and `server`.
5. **Daily usage ledger** pure helpers `recordUsage(ledger, { provider, day, requests,
   promptTokens, outputTokens })` / `getTodaySummary(ledger, provider, now)`.

### 2.2 Wire the governor into `ai-vault.js` + `ai-tutor.js` (behavior)

1. **Gate every BYOK send** (`handleAsk`, auto-seed, chips): call `canSendNow` first.
   * `min-gap`/`rpm` → show "Free-tier pacing: next ask in Ns" state (14B renders it).
     Auto-seeds use Offline Corpus instead of sending or queuing a BYOK request
     (delegated decision, 2026-11-25); explicit asks remain governor-gated.
   * `daily-warn` → send, but surface "≈N paid-free asks left today" hint.
   * `daily-block` → **no request**; straight to the quota state card with
     Retry-at-midnight / Offline-corpus / Change-model actions.
2. **Timeout:** wrap `sendBuiltAiRequest` fetch in a 45 s race (AbortController +
   timer); timeout → classified as `network`, falls back to corpus reply.
3. **Retry loop (owner law):** for `per-minute`/`server` failures, retry
   automatically inside the **70 s grace window** (`RETRY_WINDOW_MS`), honoring
   `Retry-After` and the backoff curve; the countdown card (14B) shows the wait.
   For a reply truncated by the output-token limit, an automatic **Continue**
   request fires inside the same window. When the window expires, cut the live
   exchange → classified error state + Offline Corpus fallback (chat history kept).
   `auth` / `bad-request` / `daily-quota` still never retry (pointless or burns RPD).
4. **Usage capture:** read Gemini `usageMetadata` (`promptTokenCount`,
   `candidatesTokenCount`, `totalTokenCount`) and OpenAI-compat `usage`
   (`prompt_tokens`, `completion_tokens`) after every response, `recordUsage` into
   the ledger (best-effort, never blocks the reply).
5. **Truncation detection:** read Gemini `candidates[0].finishReason` and
   OpenAI-compat `choices[0].finish_reason`; when `MAX_TOKENS`/`length`, an
   automatic **Continue** request ("continue exactly where you stopped", fresh
   byte-exact preview per docs/04 §4) fires inside the 70 s grace window; if the
   window is spent, a manual **Continue** chip remains on the bubble instead of a
   silent stop.
6. **Size-aware history:** replace `history.slice(-8)` with
   `trimHistoryByBudget(...)` (keeps the 8-turn cap, adds the token ceiling).
7. **Spec-exact Test Connection:** `testAiConnection` builds its payload with
   `maxOutputTokens/max_tokens: 8` + "Reply with OK" (docs/04 §2.3), bypassing the
   chat generationConfig; rate-limiter exempt (flagged as test ping).
8. **Token hint data:** return `{ text, usage, truncated, providerLatencyMs }` from
   the send path so 14B/14C can render "~1.2k tokens · 3.4 s" and the "0 tokens
   offline" corpus hint (docs/08 §5.13.6).
9. **Add the NVIDIA NIM provider (`nvidia`) to `ai-vault.js`:** new
   `AI_PROVIDERS.nvidia` entry (label "NVIDIA NIM (Free)", proposed default model
   `meta/llama-3.3-70b-instruct` — final curated IDs confirmed against the live
   build.nvidia.com catalog at execution, since the free catalog rotates), endpoint
   `https://integrate.api.nvidia.com/v1/chat/completions` added to
   `KNOWN_ENDPOINT_ORIGINS`, reusing the existing OpenAI-compatible payload path
   unchanged (byte-exact preview guaranteed). Keys are `nvapi-…` from
   build.nvidia.com (free developer signup, phone verification, no card) and
   **expire after 6 months** — auth-error diagnostics must say so.

### 2.3 Tests (`tests/ai-governor.test.mjs`)

* Limiter: min-gap verdict + retryInMs math; 60 s sliding window; local-midnight
  daily reset; warn vs block thresholds; per-provider config isolation.
* Estimator: monotonicity, KaTeX-heavy text, budget-trim keeps last 2 turns, never
  exceeds 8 turns, floor behavior on empty history.
* Classifier: fixture bodies/headers per provider → correct bucket incl.
  `Retry-After` seconds & HTTP-date forms; Gemini `quota_exceeded` → `daily-quota`.
* Backoff: exponential cap, jitter bounds, zero-retry buckets.
* Ledger: same-day merge, midnight rollover, corrupt-record recovery.
* Retry window: 70 s cap math — backoff steps + `Retry-After` honored inside the
  window; expiry produces the cut-to-offline verdict, never a further retry;
  truncation-continue draws from the same window.
* NVIDIA: `buildAiRequestPayload` routes `provider: "nvidia"` through the
  OpenAI-compatible body with the `integrate.api.nvidia.com` endpoint; endpoint
  allowlist accepts it; unknown-provider error text lists all four providers.
* Regression: `ai-vault.test.mjs` byte-exact preview tests stay green; vault still
  never in backup/sync (extend `sync.test.mjs` with `aiGovernor` meta exclusion).

### 2.4 14A acceptance gate

- [ ] All new unit tests green; full `node --test tests/*.test.mjs` green.
- [ ] With a fake 429 (dev-only override), second send within 60 s shows pacing
      state and does **not** hit `fetch` (spy-verified in unit test).
- [ ] `daily-block` produces zero network calls.
- [ ] Test Connection request body parses with `maxOutputTokens: 8` (Gemini) /
      `max_tokens: 8` (OpenAI-compat).
- [ ] NVIDIA payload builds and passes the endpoint allowlist; preview body stays
      byte-exact for all four providers.
- [ ] Forced per-minute 429 with `Retry-After: 70` stays inside one grace window;
      expiry produces the cut-to-offline verdict, not a retry.
- [ ] Byte-exact preview invariant re-verified for normal chat payloads
      (preview body `===` sent body) after the trim-history change.
- [ ] `check_tokens_and_links.mjs` green (no raw hex, relative paths).

---

## 3. Slice 14B — Tutor Sheet UI Rebuild (render-layer only)

> No request-law changes; consumes 14A's verdicts/ledger. Pure DOM/CSS rework of
> `renderTutorBody` + thread.

### 3.1 Incremental rendering (fixes P5, P6)

1. **Render tree split** inside `ai-tutor.js`: build the static shell (context card,
   preview, suggestions, composer, thread container) **once per open**; subsequent
   updates touch only the parts that changed:
   * `appendMessage(msg)` — new bubble appended to `#aiChatThread` (LaTeX rendered
     once, at append).
   * `updateTypingBubble(revealed)` — mutates **only** the in-progress bubble's
     innerHTML during the typewriter tick (no sibling re-render, no listener churn,
     composer untouched → focus + draft survive).
   * `renderComposerState()` — toggles Ask/Stop/disabled only.
   * Full `renderTutorBody` remains **only** for open/history-mode/welcome changes.
2. **Draft preservation:** composer is never torn down during typing/ticks; keep its
   value across the remaining full re-renders (read before rebuild, restore after).
3. **Scroll etiquette:** auto-scroll only when the user is already at (or near) the
   bottom (≥ 90 %); a " ↓ Latest" jump chip appears when scrolled up.
4. **Reduced motion:** existing `prefers-reduced-motion` path stays instant-append.

### 3.1a Suggestions get out of the way during generation (owner directive, 2026-11-25)

Owner report: the Suggestions/chips row *"is always sticky even when an answer was
being generated"* — it hogs phone space exactly when the answer needs it. Fix:

* The chips row **auto-hides** for the entire generation lifecycle: thinking dots,
  typewriter reveal, live streaming, and any retry/grace-window countdown. The
  composer + state cards keep that space.
* When the reply finishes (or the exchange is cut to Offline Corpus), chips return
  in their previous manual toggle state (open on a fresh thread, collapsed once a
  reply exists — current rule unchanged for idle states).
* The manual collapse toggle keeps working while idle; during generation the
  toggle is simply absent with the row (nothing to collapse).
* Regression fixture: while the typewriter is mid-reveal, `#aiChipsRow` is hidden
  and the thread occupies the freed height; after finalize, chips reappear per the
  idle rule.

### 3.2 State cards for errors / pacing / quota (fixes P7, consumes 14A)

Replace raw-error-in-bubble with typed inline cards (token-styled, `role="status"`,
`aria-live="polite"` wrapper on the thread):

* **Pacing card** (min-gap/RPM): "Free-tier pacing — next ask in Ns" + disabled
  composer countdown (auto-clears).
* **Retry / grace-window card** (per-minute, server, or token-limit continuation):
  live **70 s countdown** — "Retrying in Ns · falls back to Offline Corpus at 0" —
  with a manual "Use Offline Corpus now" shortcut; at 0 the live exchange is cut and
  the corpus reply renders (owner law, §2.1). Chat history is never deleted.
* **Daily quota card** (daily-quota / `daily-block`): "Free daily quota used up —
  resets at midnight · Offline Corpus answers anything today · Open AI settings"
  (link-out to `#/you` — the sheet has no settings controls, §4.1).
* **Auth card** (401/403): "Key looks invalid or expired — Check key in You & AI"
  (link-out; NVIDIA copy adds: free `nvapi-` keys expire after 6 months — renew at
  build.nvidia.com).
* **Network/timeout card**: "Couldn't reach provider — Offline answer shown · Retry".
* All cards may carry a small "AI settings →" **link-out** that closes the sheet and
  navigates to `#/you`. The sheet itself renders **zero** settings controls
  (owner decision: phone space — the sheet is chat + history only).
* Every card keeps the corpus fallback answer visible below (offline-first law).

### 3.3 Truncation Continue + per-message actions (fixes P8, P11)

1. Truncated reply (14A flag) renders a **Continue ▸** chip inside the bubble meta.
2. Each assistant bubble gets a **Copy** button (plain markdown text — docs/08 F6)
   and a **Regenerate** action (re-sends the prior user turn, governor-gated);
   clipboard via `navigator.clipboard` with toast fallback.

### 3.4 Accessibility (fixes A7)

* `#aiChatThread` gets `aria-live="polite"` + `role="log"`; typing bubble announced
  once via a visually-hidden status node (not per-tick).
* Focus trap within the sheet (Tab cycles sheet → composer; Esc closes; focus
  returns to the opener) — reuses the docs/08 cross-cutting focus-trap pattern.

### 3.4a History drawer — chat-app sidebar (owner directive, 2026-11-25; supersedes Phase 11's in-thread panel)

Owner report: history should behave *"like any chat bot — click, open ~70% of
screen, find history"* instead of replacing the chat thread in place. Rebuild:

* **Trigger:** the existing header `icon-layers` button slides in a **left sidebar
  drawer** over the thread — width `70%` of the sheet/screen on phones
  (clamped `min 280px · max 360px`), full sheet height, with a dimming scrim.
  The open conversation, draft, and generation state stay untouched underneath
  (drawer is an overlay; closing it resumes exactly where the student was — even
  mid-typewriter).
* **Find history:** a **search input** at the drawer top instantly filters sessions
  client-side by title + last-message snippet (case-insensitive, debounced-free —
  ≤ 12 sessions); empty-query shows all (current LRU order); no-match shows an
  honest empty state. Below it: **New chat**, session rows (title · relative time ·
  snippet · per-row delete — all existing Phase 11 data, zero schema change),
  **Clear all**, and the privacy line.
* **Open a session:** tap → drawer slides out → thread restores via the existing
  id-rehydration path (no duplicate auto-seed).
* **Desktop ≥1024px:** the docked tutor panel gains a **second column** — history
  docks beside the thread (no scrim, no overlay); the same search + rows.
* **Phone overlay a11y:** drawer is `role="dialog" aria-modal="true"`
  aria-labelled "Conversation history"; focus moves to the search field on open,
  is trapped inside, returns to the `icon-layers` button on close; Esc and scrim
  tap both close; toggle button carries `aria-expanded`. Sheet-level focus trap
  (§3.4) yields to the drawer while it is open.
* **CSS:** token-driven drawer/scrim styles (no raw hex, `min-width` queries only),
  `prefers-reduced-motion` → instant show/hide instead of the slide.
* **Keyboard-fit interplay:** drawer sits above the composer within the sheet; the
  visual-viewport keyboard fit logic is untouched.

### 3.5 Streaming (delegated decision: enable, 2026-11-25)

* If approved: Gemini `:streamGenerateContent?alt=sse` and OpenAI-compat
  `stream: true` in `sendBuiltAiRequest` (SSE parse via `ReadableStream` reader;
  Groq/OpenRouter are OpenAI-compatible). The byte-exact preview shows the **exact
  request that will be sent** (same body either way — invariant preserved; tested).
  Chunks append into the same typing bubble; **Stop keeps partial text** (marks it
  "(stopped)") instead of discarding; streaming disabled under
  `prefers-reduced-motion`? — no, reduced-motion affects the *reveal*, not the
  transport; streaming simply replaces the simulated typewriter for live text.
* If deferred: keep simulated reveal (now cheap thanks to 3.1) — decision recorded
  in the record.

### 3.6 Polish (fixes A8)

* Badge naming unified: sheet badge initial "Corpus Tutor · Offline" everywhere.
* Phantom-draft preview: preview area only renders once a real draft/message exists.
* New chips: "Explain in simpler words", "Give me a similar PYQ" (corpus-answerable
  via unit PYQ list), per docs/08 §5.13.5.
* Desktop ≥1024px: **Pin** toggle keeps the docked panel open while browsing
  results (docs/08 §5.13.4); sheet drag-handle gains swipe-down-to-dismiss
  (docs/08 §5.13.3) with `prefers-reduced-motion` fallback to instant close.
* Hint line under composer: `0 tokens · offline corpus` (no key) /
  `~1.2k tokens this ask · 3 left before pacing` (key) — docs/08 §5.13.6.

### 3.7 Tests

* `tests/ai-tutor-render.test.mjs`: jsdom-free DOM assertions via the existing
  headless browser gates instead — extend `scripts/check_community.mjs` fixture:
  * typing a draft → tap chip → draft still in input (P6 regression test);
  * forced 429 fixture → pacing card text present, zero console errors;
  * Copy button writes via clipboard stub; Regenerate re-sends prior turn;
  * thread `aria-live` attribute asserted;
  * **suggestions lifecycle (owner directive):** `#aiChipsRow` hidden while the
    typewriter/retry countdown is active, restored after finalize per idle rule;
  * **history drawer (owner directive):** layers button → drawer visible at ~70%
    sheet width with search field focused; typing a filter narrows rows; Esc and
    scrim close it; opening a session restores the thread with no duplicate
    auto-seed; `aria-expanded` toggles on the button; zero console errors.
* `check_responsive.mjs` re-run: 360/390/414/1440 zero overflow with the new cards.

### 3.8 14B acceptance gate

- [ ] Zero whole-sheet rebuilds during a reply reveal (per-tick update touches only
      the typing bubble — verified by instrumented browser check).
- [ ] Draft survives: chip tap, EN/বাংলা switch, suggestions toggle, reply reveal.
- [ ] All six state cards reachable via fixture overrides; each offers Offline
      Corpus path; zero console errors.
- [ ] Truncated fixture shows Continue chip; continued turn builds fresh preview.
- [ ] Thread has `aria-live="polite"`; focus trapped; Esc closes; focus returns.
- [ ] Suggestions row auto-hides for the whole generation lifecycle and restores
      on idle (owner directive); history opens as a ~70% slide-in sidebar with
      working search, Esc/scrim close, and no-duplicate session restore (owner
      directive).
- [ ] All four mandatory repo gates + `check_responsive` + `check_community` green.

---

## 4. Slice 14C — AI Settings & Transparency

### 4.1 Settings stay ONLY in `#/you` (owner decision — supersedes the research idea)

The research audit proposed an in-sheet settings popover; **the owner rejected it
(2026-11-25): on a phone, sheet space is for chat + history only.** All AI controls
(provider, model, key, generation settings, language, preview toggle, usage
dashboard) live exclusively in the `#/you` AI card. The sheet gains **no** settings
UI — the only escape hatches are the contextual "AI settings →" link-outs inside
error/auth/quota state cards (§3.2), which close the sheet and open `#/you`. The
persisted EN/বাংলা segmented control is also a setting, so it **moves to `#/you`**
too; the "বাংলায় বলো" preset chip stays in the sheet as a per-message instruction
(not a setting change).

### 4.2 Curated model lists + free-tier metadata (fixes C4)

Static per-provider list in `ai-vault.js` (offline-safe, no network catalog):
`gemini: gemini-3.1-flash-lite (NEW DEFAULT — free readings 10–30 RPM · 500–1,500
RPD · 1M context) · gemini-2.5-flash-lite (high free RPD) · gemini-2.5-flash (⚠ 2026
readings as low as 20 RPD — pick only if 3.1-lite is unavailable to you)`;
`groq: llama-3.3-70b-versatile (default) · llama-3.1-8b-instant (loose limits)`;
`openrouter:` a couple of stable `:free` IDs; **`nvidia:` `meta/llama-3.3-70b-instruct`
(proposed default) + one Nemotron option — final IDs confirmed against the live
build.nvidia.com catalog at execution**. Each entry carries a `freeTierNote` shown
under the select. Custom free-text input stays (power users) with a "test after
save" nudge. Completeness note: Gemini's free tier is unavailable in EU/UK/CH
(irrelevant for the India-based student audience).

### 4.3 Generation settings (fixes C2)

Vault additions (defaults preserve today's behavior): `temperature` (0–1, default 0.2),
`maxOutputTokens` (256–4096, default 1024 — owner question #4 may change default),
`historyTurns` (2–8, default 8). Rendered in `#/you` AI card with honest captions
("higher = richer answers = more of your free quota"). `buildAiRequestPayload` reads
them; ranges clamped; preview stays byte-exact.

### 4.3a Vault defaults & spec amendments (owner-authorized 2026-11-25)

1. `previewPrompt` default flips **true → false**: the "Check prompt before sending"
   preview ships OFF; the toggle remains in `#/you`; when ON it stays byte-exact
   (invariant untouched). This amends `docs/04` §2.3/§4 and `AGENTS.md` §4.3
   ("Always render…") — recorded in the phase record with the owner's 2026-11-25
   decision as authority (AGENTS §5.5 owner-amendment path), and those spec lines
   are updated in the same merge.
2. Gemini default model `gemini-2.5-flash` → **`gemini-3.1-flash-lite`** in
   `AI_PROVIDERS.gemini.defaultModel` + `DEFAULT_VAULT` (research-validated, docs/09
   §6.4: the old default's 2026 free readings fell to 20–250 RPD; 3.1 Flash-Lite
   reads 500–1,500 RPD). The `docs/04` §2.3 default-model line is updated in the
   same merge.
3. Fresh vaults only — a saved vault keeps its stored provider/model/preview values
   (no silent swap under an existing key); a one-time "new free-tier default
   available" notice appears instead.

### 4.4 Language modes (fixes C3 — relocated per owner decision)

Language moves to the `#/you` AI card (owner rule: settings live there) and gains
two modes: English · বাংলা · Hinglish · Simple English (docs/04 §1.2 scope). The
in-sheet persisted EN/বাংলা segmented control is removed with it; the
"বাংলায় বলো" chip stays as a per-message instruction. `languageMode` strings flow
into the system prompt's Preferred Language line unchanged; offline corpus replies
gain simple-word and Hinglish templates for the question branch (best-effort,
corpus text stays English math).

### 4.5 Usage & quota dashboard (fixes C5)

New `#/you` AI-card section "Free-tier usage (this device)": per-provider
requests-today vs warn/max, approx tokens-today (ledger), last error + classification,
local-midnight reset note, and the pacing/budget rules in plain words — rows for all
four providers (Gemini · Groq · OpenRouter · NVIDIA NIM). Privacy line: counters
live only on this device, never synced, never contain question content.

### 4.6 Passphrase wrap (owner requested, 2026-11-25)

If approved: optional AES-GCM passphrase wrap of `jelet_ai_vault_v1` via WebCrypto
("Remember on this device" toggle; session-unlock prompt when unwrapped key absent).
If deferred: recorded in the phase record as owner-accepted risk (docs/04 §2.1 marks
it optional).

### 4.7 Tests & gates

* `tests/ai-settings.test.mjs`: clamping, defaults-preserved behavior, curated list
  rendering flags (incl. NVIDIA), prompt Preferred-Language line for all four modes,
  usage dashboard sums from ledger fixtures.
* Vault defaults: fresh vault → `previewPrompt === false` and Gemini default
  `gemini-3.1-flash-lite`; a saved vault keeps its stored values (upgrade-safety);
  `ai-vault.test.mjs` assertions updated to the new defaults.
* Extend `check_community.mjs`: settings popover changes model → preview badge
  updates; dashboard renders after ledger fixture seed.

### 4.8 14C acceptance gate

- [ ] Settings in You change model/provider without losing a pinned conversation or draft (supersedes the earlier in-sheet wording).
- [ ] Generation settings clamp + byte-exact preview green.
- [ ] Four language modes render correct prompt lines; offline replies still work.
- [ ] Usage dashboard shows ledger numbers exactly; zero sync of governor/vault.
- [ ] Fresh vault: preview OFF + `gemini-3.1-flash-lite` default; saved vaults keep
      stored values (upgrade-safety test green).
- [ ] All mandatory gates green; record written (incl. the docs/04 + AGENTS §4.3
      amendment note citing the owner's 2026-11-25 decision).

---

## 5. Executed-Nothing Commitment

This plan is docs-only. No `assets/`, `index.html`, `sw.js`, `_data/`, scoring, or
gate files were modified for it. On owner approval, execution order is
**14A → 14B → 14C** with the four mandatory repo gates plus the two browser gates
after every slice, and a `record.md` per the phase-map law. The owner's
2026-11-25 decisions (settings-in-`#/you` · 70 s retry-before-cut law · NVIDIA NIM
provider · `gemini-3.1-flash-lite` default · preview OFF) are incorporated above.
This paragraph described the original pre-execution questions. Streaming and
auto-seed choices were delegated by the owner and key encryption requested on
2026-11-25. Conservative budget values and 1024 output tokens remain the chosen
defaults; see `record.md` for current execution and limitations.
