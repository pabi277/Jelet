# 09 — AI Tutor Dedicated Phase: Research Audit & Findings (Docs-Only)

> **Purpose:** Full research audit of the Codec AI Tutor subsystem (UI · rate limits &
> token budget · settings) to justify and scope a **dedicated AI phase**. This document
> is **research only — zero application code is proposed as written or executed here**.
> The executable sibling plan lives at [`docs/phases/phase-14/plan.md`](./phases/phase-14/plan.md)
> and awaits owner approval, exactly like the Phase 11–13 precedent.
>
> **Date:** 2026-11-25 · **Branch:** `arena/d1878858-jelet` · **Baseline:** `f4d44c7` (PR #18 merge),
> `node --test tests/*.test.mjs` → **all green (0 failures)** on this checkout.
> **Method:** Line-level audit of all 6 AI-related modules + every `openAiTutor()` call
> site + CSS/HTML sheet + tests + the live provider rate-limit literature (Nov 2026).

---

## 1. Current AI Subsystem Map (As-Is)

| File | LOC | Responsibility |
| :-- | --: | :-- |
| `assets/js/views/ai-tutor.js` | 1,101 | Tutor sheet UI: offline corpus replies, BYOK chat, typewriter reveal, history panel, keyboard fit |
| `assets/js/core/ai-vault.js` | 369 | Isolated key vault (`jelet_ai_vault_v1`), provider registry, ground-truth system prompt, request builder, `fetch()` executor, connection test |
| `assets/js/core/tutor-context.js` | 107 | Context normalizer + stable per-context history key (Phase 11) |
| `assets/js/db/ai-history.js` | 163 | Device-local conversation history (12 sessions LRU × 30 msgs, IndexedDB meta, never synced) |
| `assets/js/views/you.js` (AI card) | ~120 | Only settings surface: provider select, default/custom model, key save/test/clear, preview toggle |
| `assets/css/components.css` (`.ai-*`) | ~300 | Sheet, bubbles, history, thinking dots, suggestions styles |
| `index.html` (sheet skeleton) | 20 | Header (badge, history btn, close), empty body |
| `sw.js` | 3 lines | Precaches `ai-vault.js`, `tutor-context.js`, `ai-history.js` |

**Request path today (BYOK):** `handleAsk()` → `buildGroundTruthSystemPrompt()` (injects
verified question/solution/unit ground truth) → `buildAiRequestPayload()` (hardcodes
`temperature 0.2`, `maxOutputTokens 1024`, last 8 history turns) → `sendBuiltAiRequest()`
(one non-streaming `POST`, no retry, no timeout, no usage read) → typewriter reveal →
persist session. **Fallback path:** any failure → offline corpus reply with the error
string pasted into the bubble.

**Entry points:** 12 `openAiTutor()` call sites (Today, Learn explorer, Unit lesson ×3,
Formula sheet, Practice runner ×3, Results ×2, Papers reader). Practice's hint button
correctly flags the attempt `Assisted` (`practice.js:945–950`). Timed-mock lock holds
(`ai-tutor.js:577–581`).

---

## 2. Invariants That MUST Survive Any AI Phase (AGENTS.md §4 + docs/04)

1. **Zero server, zero shared key, zero proxy** — browser `fetch()` straight to the
   provider; BYOK only; keys never leave the device (`AGENTS.md` §4.3).
2. **Vault isolation** — `jelet_ai_vault_v1` never enters IndexedDB backups or sync
   (tested: `tests/ai-vault.test.mjs`, `tests/db-backup.test.mjs`).
3. **Byte-exact preview invariant** — strings shown in "Check prompt before sending"
   are byte-for-byte the request body sent (tested, `ai-vault.test.mjs:88–96`).
4. **Ground-Truth Lock** — every question/lesson call injects official key + marking
   rule + verified steps with a do-not-contradict system instruction.
5. **Timed-mock integrity lock** — tutor hard-locked on `#/exam/`.
6. **Offline-first** — everything works with no key; the corpus tutor is the fallback
   for every failure mode.
7. **One-time "Before you ask" agreement** (version-gated) before first BYOK call.
8. **Token-only theming, phone-first CSS, `min-width`, no 6th nav tab, no build step.**

---

## 3. Track A — UI/UX Findings (Severity-ranked)

### A1 · Full-sheet DOM teardown on every state change — **High**
`renderTutorBody()` (`ai-tutor.js:655`) rebuilds `body.innerHTML` **and re-attaches all
listeners** on: every open, every send, every reply state change, language switch,
suggestions toggle, history open/close. During the typewriter reveal it runs **every
~22 ms** via `setInterval` (`ai-tutor.js:381–395`):

* **Focus destruction:** any draft being typed is orphaned mid-reveal; tapping the
  input during a reply reveal loses focus within one tick.
* **O(n²) rendering cost:** each tick re-runs `renderLatex` (KaTeX) for **every stored
  bubble** (`ai-tutor.js:843–862`). A 30-message session → ~900 LaTeX re-renders per
  second of reveal on a low-end Android — visible jank and battery drain.
* **Scroll fights:** `thread.scrollTop = thread.scrollHeight` per tick fights user
  scroll-back to read earlier steps.

### A2 · Draft loss on routine interactions — **High**
The composer `<input>` is recreated empty on every re-render (no value restore).
Concrete loss scenarios: typing a follow-up while the previous reply is revealing;
tapping a preset chip; toggling EN/বাংলা; collapsing Suggestions. The draft is gone.

### A3 · Errors are pasted into a chat bubble — **High (directly feeds the rate-limit ask)**
On BYOK failure, `handleAsk` string-interpolates the raw provider error into the next
bubble with the offline fallback (`ai-tutor.js:1092–1097`). There is **no distinct UI
state** for: 429 rate-limit vs daily-quota-exhausted vs invalid key vs network drop.
No retry button, no "retry in Ns" countdown, no "switch to Offline mode" action, no
quiet-hours hint. The one-size error message `ai-vault.js:340–344` cannot distinguish
quota classes because HTTP status/headers are discarded after `res.ok` check.

### A4 · Simulated streaming only; no true streaming — **Medium-High**
`sendBuiltAiRequest` (`ai-vault.js:325–338`) waits for the **entire** JSON response.
The typewriter fountains text only *after* full arrival, so perceived latency = full
network time (multi-second on grounded prompts) with only a dots bubble. Note:
`docs/05` Phase 08's deliverable explicitly says *"Gemini/Groq direct streaming
client"* and `docs/04` §4 says *"Streaming & Abort"* — **this was specified but never
built** (abort works, streaming doesn't). A mid-stream `Stop` today discards all
partial output; there is no "keep what arrived".

### A5 · Response truncation is silent; the spec'd "Continue" button is missing — **Medium-High**
`docs/04` §4 promises: *"If truncated by token cap, a Continue button builds a fresh
preview rather than silently re-firing."* Not implemented: `finishReason` (Gemini) /
`finish_reason` (OpenAI-compat) are never inspected (`ai-vault.js:339–351`). With
`maxOutputTokens: 1024` hardcoded, a long derivation silently ends mid-step.

### A6 · No per-message affordances — **Medium**
No copy-response button (docs/08 F6 + §5.13.2), no regenerate, no edit-and-resend,
no per-bubble delete from history.

### A7 · Accessibility gaps in the sheet — **Medium**
* Chat thread has **no `aria-live` region** — new replies are invisible to screen
  readers (grep: every other dynamic surface has `aria-live="polite"`; the AI sheet
  does not).
* Sheet is `role="dialog" aria-modal="true"` but has **no focus trap / focus return**
  (already on the docs/08 cross-cutting list) — keyboard users tab behind the overlay.

### A9 · Suggestions row persists during generation — **Medium (owner-reported, 2026-11-25)**
The preset-chip row is always visible — including while a reply is being generated
(`ai-tutor.js:775–787` renders chips unconditionally whenever history is closed;
only a manual toggle collapses them, `ai-tutor.js:1008–1012`). On a phone it
occupies composer-adjacent space exactly when the answer needs the room.
**Fix (owner directive):** auto-hide chips for the whole generation lifecycle
(thinking / reveal / streaming / retry countdown), restore on idle per the current
fresh-thread rule. → Phase 14B §3.1a.

### A10 · History replaces the chat instead of a chat-app drawer — **Medium (owner-reported, 2026-11-25)**
Phase 11's history panel swaps into the thread area (`ai-tutor.js:684–731`), so
opening history throws away the visible conversation — unlike every mainstream
chat app's slide-in sidebar. **Fix (owner directive):** left drawer over the chat
(~70% screen width, scrim, Esc/scrim close) with a **search field** to find past
sessions; docked second column on desktop ≥1024px; same Phase 11 data, zero schema
change. → Phase 14B §3.4a.

### A8 · Minor / cosmetic
* Header badge ships as "Corpus Verified" (`index.html:57`) but renders as
  "Corpus Tutor · Offline" (`ai-tutor.js:665–669`) — two names for one state.
* "Live JSON preview" shows a payload for the phantom draft `\"Explain step by step\"`
  (default param, `ai-tutor.js:655`) until the user types — the previewed request is
  not one that would actually be sent from that state (empty submit is a no-op at
  `ai-tutor.js:1040`). Spirit-of-invariant wart, not a violation of the byte rule.
* Missing chips already spec'd in docs/08 §5.13.5 ("Explain in simpler words",
  "Give me a similar PYQ"); no desktop pin-toggle (§5.13.4); no drag-to-dismiss
  (§5.13.3); no "0 tokens used offline" cost hint (§5.13.6).

---

## 4. Track B — Rate Limits & Token Budget Findings (Severity-ranked)

### B1 · Nothing throttles the client; the auto-seed spends quota silently — **High**
With a saved key, merely **opening** a question's tutor fires a live BYOK request
(the auto-seed at `ai-tutor.js:633–644` only forces offline-first when **no** key
exists). Browsing 6–10 questions in a minute = 6–10 requests → guaranteed 429 on
free tiers (see §6: Gemini free Flash is ~10 RPM, with 2026 readings as low as 5 RPM).
There is no per-provider RPM limiter, no minimum-gap, no daily budget awareness.

### B2 · No retry policy; blind retries would burn daily quota — **High**
Zero handling of 429/5xx: no exponential backoff, no `Retry-After` parsing, no
distinction between **per-minute** limits (retryable with backoff) and **daily**
quota (retrying is pure waste). OpenRouter-specific hazard: **failed attempts count
toward the 50/day free cap** — any auto-retry logic added naively would eat the
student's daily budget. Provider guidance (Google) is: retry only 429/408/5xx with
exponential backoff + jitter; never 400/401/403.

### B3 · No request timeout — **Medium-High**
`fetch()` has no timeout; a hung provider connection leaves the thinking bubble
forever (manual Stop is the only exit, `ai-tutor.js:1043–1048`). Needs a hard cap
(e.g. 45 s) with graceful degradation to the corpus reply.

### B4 · No token budgeting of prompt or history — **High for Groq, Medium for Gemini**
* System prompt injects the **full verified solution** (every step, traps, marking
  rule) on every call — a grounded JELET question prompt is realistically ~1.5–4k
  tokens. Groq free `llama-3.3-70b-versatile` allows only **12,000 TPM** and
  **100,000 tokens/day** → roughly **25–60 grounded requests/day** before TPD lockout,
  and ~3–8 requests/minute before TPM lockout as history grows.
* History is trimmed by **count only** (`history.slice(-8)`, `ai-vault.js:266`) — 8
  long turns can triple the prompt size with no size cap. There is no estimator, no
  `countTokens` pre-flight (Gemini offers one), no per-provider TPM-aware trimming.

### B5 · Usage data is fetched and then thrown away — **Medium**
Gemini responses carry `usageMetadata` (`promptTokenCount/candidatesTokenCount/totalTokenCount`);
OpenAI-compat responses carry `usage`. Both are discarded (`ai-vault.js:345–351`). No
daily request/token counters are stored anywhere, so "how much of my free tier did I
use today?" is unanswerable — and cannot drive a limiter.

### B6 · Generation caps hardcoded; Test Connection violates its own spec — **Medium**
* `temperature: 0.2`, `maxOutputTokens/max_tokens: 1024`, 8 history turns — all
  hardcoded (`ai-vault.js:279, 307–308, 266`), none user-visible (also Track C).
* `docs/04` §2.3 specifies Test Connection = `maxOutputTokens: 8` + "Reply with OK".
  The code **comments** that spec (`ai-vault.js:353`) but `testAiConnection()` routes
  through `buildAiRequestPayload`, which hardcodes 1024 — so the "minimal" test can
  burn ~128× the spec'd output quota per tap.

---

## 5. Track C — Settings & Transparency Findings

| # | Finding | Evidence | Severity |
| :-- | :-- | :-- | :-- |
| C1 | All settings live only on `#/you`; changing provider/model mid-doubt abandons the sheet | `you.js:206–264`; tutor has no settings control | Medium |
| C2 | No generation settings (temperature / max output tokens / history depth) — invisible & fixed | `ai-vault.js:266,279,307–308` | Medium |
| C3 | Language modes: spec promises **Bengali / Hinglish / Simple English** (docs/04 §1.2); UI ships EN/বাংলা only | `ai-tutor.js:751–755` | Low-Med |
| C4 | Custom model is raw free text — typos surface only at send time as a raw provider error; no curated per-provider model list (offline-safe) | `you.js:238–242` | Medium |
| C5 | No usage/quota dashboard in You & AI (requests today, approx tokens today, last error, reset hint) | absent | Medium |
| C6 | Optional AES-GCM passphrase wrap for shared lab PCs (docs/04 §2.1 "optionally wrapped… + Remember toggle") never built — key sits plaintext in `localStorage` | absent | Low (explicit spec-optional) |
| C7 | Good bones to keep: masked key line, Test Connection with latency, Clear Key, preview switch, honest "Offline Corpus Mode" pill | `you.js:216–264` | Keep |

---

## 6. External Research — Provider Free-Tier Reality (Nov 2025 → Nov 2026)

### 6.1 Google Gemini (default provider)

Google **cut free-tier quotas in December 2025**, and 2026 readings vary because
Google states free limits are *"not guaranteed"* and visible per-project in AI Studio:

| Model (free tier) | RPM | TPM | RPD | Source readings |
| :-- | --: | --: | --: | :-- |
| `gemini-2.5-flash` (current default) | 10 (readings as low as **5**) | 250,000 | **250** (one Oct-2026 reading: **20**) | [yingtu Jan-2026](https://yingtu.ai/en/blog/google-gemini-api-free-tier) · [fastgptplus Dec-2025](https://fastgptplus.com/en/posts/gemini-advanced-rate-limit) · [aifreeapi Nov-2026](https://www.aifreeapi.com/en/posts/google-gemini-api-free-tier) |
| `gemini-2.5-flash-lite` | 15–30 | 250k–1M | **1,000** | same three sources |
| `gemini-2.5-pro` | 5 | 250k | 100 (cut from 250; "~10" per one reading) | fastgptplus · yingtu |

**Implications for JELET:** the *default* model's free tier may allow as few as
~20–250 requests **per day** and ~5–10 per minute. An app that fires a request on
every tutor-open **will** 429 in a normal study session. Flash-Lite is the
volume-friendly free model and belongs in the curated model list. Google's own 429
taxonomy: `rate_limit_exceeded` (per-minute/second → backoff-retry) vs
`quota_exceeded` (daily → wait for reset, never hot-retry); honor `Retry-After`;
retry only 429/408/5xx ([inventivehq](https://inventivehq.com/knowledge-base/gemini/gemini-429-resource-exhausted),
[theneuralbase](https://theneuralbase.com/gemini-api/learn/advanced/rate-limit-handling-in-async/)).
Gemini also offers a `countTokens` endpoint for pre-flight budgeting (unused today).

### 6.2 Groq (optional fast provider)

| Model (free, org-level) | RPM | TPM | RPD | TPD |
| :-- | --: | --: | --: | --: |
| `llama-3.3-70b-versatile` (current default) | 30 | **12,000** | 1,000 | **100,000** |

Sources: [grizzlypeak Mar-2026](https://www.grizzlypeaksoftware.com/articles/p/groq-api-free-tier-limits-in-2026-what-you-actually-get-uwysd6mb) · [eesel Jun-2026](https://www.eesel.ai/blog/groq-pricing) · [ampm Oct-2026](https://ampm-aiops.com/en/guides/groq-faq-2026/) · [prismix](https://prismix.dev/guides/groq-guide).

**Implications:** Groq's binding constraint is **tokens**, not requests. Our grounded
system prompts (~1.5–4k tokens) + 8-turn history can exhaust 12k TPM in ~3–8 turns,
and 100k TPD in **~25–60 grounded requests/day** — far below the marketing "1,000
requests/day". Responses expose `x-ratelimit-remaining-*` + reset headers we could
read live (currently ignored). Prompt-cached tokens don't count against limits
(relevant: our system prompt is highly cacheable per-question).

### 6.3 OpenRouter (optional)

| Account (`:free` model IDs) | RPM | RPD |
| :-- | --: | --: |
| Lifetime credits < $10 | 20 | **50** |
| Lifetime credits ≥ $10 | 20 | 1,000 |

Sources: [requesty Nov-2026](https://www.requesty.ai/blog/openrouter-free-models) · [maximem Oct-2026](https://www.maximem.ai/blog/openrouter-pricing-2026) · [experientiallabs Nov-2026](https://www.experientiallabs.ai/blog/what-is-openrouter).

**Implications:** 50/day standard free tier is the tightest daily cap of the three
providers, and **failed attempts count toward it** — auto-retry on OpenRouter must be
forbidden by default. A "daily-cap 429" vs "upstream 429" distinction exists in their
error shapes.

### 6.4 NVIDIA NIM (new provider — owner-directed addition, 2026-11-25)

The owner asked for **NVIDIA free API keys** as a fourth provider. Researched facts:

* **Endpoint:** `https://integrate.api.nvidia.com/v1` — fully **OpenAI-compatible**
  chat completions, so the existing Groq/OpenRouter payload path is reused verbatim
  (byte-exact preview survives untouched).
* **Keys:** build.nvidia.com — free developer signup (phone verification, no card),
  key prefix `nvapi-`, **valid 6 months** (renewable from the dashboard).
* **Free tier:** up to **~40 requests/minute per model** (best-effort ceiling; real
  throttling can land below it), credit-based evaluation tier (≈1,000 signup credits
  per one 2026 source; another reading documents no per-token billing — NVIDIA
  positions it as evaluation-only, not production). No published daily request cap.
* **Catalog:** ~46–100+ open models (Llama 3.3 70B, Nemotron 3, Qwen 3, DeepSeek,
  Mistral, GPT-OSS, Gemma…) — model IDs rotate, so the curated list is confirmed
  against the live catalog at execution time.

Sources: [itsfreeai](https://itsfree.ai/provider/nvidia-nim/) · [freellms](https://www.freellms.org/providers/nvidia-nim) · [jaesolshin](https://jaesolshin.com/posts/nvidia-nim-api/) · [getupdated](https://www.getupdated.in/blogs/nvidia-free-api-key-guide-2026.html).

**Implications:** the most generous RPM of the four providers but an **undefined
daily/credit budget** → the governor treats NVIDIA with soft daily defaults and the
auth card must mention 6-month key expiry (new key-lifecycle requirement).

Also verified for the owner's default-model directive: **`gemini-3.1-flash-lite`**
exists (1M context) with free-tier readings of 10 RPM / 500 RPD
([scriptbyai Oct-2026](https://www.scriptbyai.com/gemini-api-free-tier-limits/)) up
to 30 RPM / 1,500 RPD
([ayautomate Jul-2026](https://www.ayautomate.com/free-models/google-gemini-gemini-3-1-flash-lite))
— a major upgrade over `gemini-2.5-flash`'s 2026 readings (20–250 RPD). The owner's
choice is research-validated; the governor paces at the conservative floor.

### 6.5 Cross-provider design conclusions

1. **A per-provider client-side governor is non-optional**: min-gap between requests
   (≥ 6 s for Gemini free; 2 s for NVIDIA), RPM window, and a local daily budget
   with a visible "N requests left today" hint.
2. **Token budgeting is a first-class requirement** (Groq TPD 100k; Gemini TPM fine but
   RPD brutal): estimate prompt size before send; trim history by estimated size, not
   just count; optionally use Gemini `countTokens` when online.
3. **429 classifier**: parse status + provider error code/headers → three buckets:
   *per-minute (auto-retry w/ backoff honoring `Retry-After`)* · *daily (no retry;
   offer offline mode / cheaper model)* · *key/auth (send to settings)*.
4. **Offline corpus fallback must remain the universal safety net** (already true).
5. **Key-lifecycle UX:** NVIDIA free keys expire after 6 months — the auth card and
   the You & AI diagnostic must say so (unique to NVIDIA among the four providers).

---

## 7. Consolidated Problem Register (Priority Order)

| # | Problem | Track | Severity | Phase slice |
| :-: | :-- | :-: | :-: | :-: |
| P1 | No rate-limit governor; auto-seed spends quota on open | B | 🔴 High | 14A |
| P2 | No 429/quota classification, no backoff/Retry-After, no timeout | B | 🔴 High | 14A |
| P3 | No token budgeting (size-blind 8-turn history; Groq TPM/TPD) | B | 🔴 High | 14A |
| P4 | Usage data discarded; no daily counters / "left today" hint | B | 🟠 Med-High | 14A |
| P5 | Full-sheet re-render per 22 ms tick; O(n²) KaTeX; focus loss | A | 🔴 High | 14B |
| P6 | Draft lost on re-render (chips/lang/toggle/reveal) | A | 🔴 High | 14B |
| P7 | Errors rendered as chat text; no retry/offline-switch actions | A+B | 🔴 High | 14B |
| P8 | Silent truncation at 1024; spec'd "Continue" missing | A+B | 🟠 Med-High | 14A+14B |
| P9 | No true streaming (docs/05 Phase 08 promised it); Stop discards partials | A | 🟠 Medium | 14B (owner call) |
| P10 | Test Connection burns 1024-token config vs spec'd 8 | B | 🟠 Medium | 14A |
| P11 | No per-message copy/regenerate | A | 🟠 Medium | 14B |
| C1–C5 | Settings consolidated on `#/you` only; no in-sheet quick switch; no curated model lists; no generation settings; no usage dashboard; EN/BN only | C | 🟠 Medium | 14C |
| A7 | No `aria-live` on thread; no focus trap in sheet | A | 🟠 Medium | 14B |
| A9 | Suggestions row sticky during generation (owner-reported) | A | 🟠 Medium | 14B |
| A10 | History is thread-replacing, not a chat-app drawer with search (owner-reported) | A | 🟠 Medium | 14B |
| A8 | Cosmetic: badge naming, phantom-draft preview, missing spec'd chips/pin/drag | A | 🟢 Low | 14B/14C |

---

## 8. Recommended Phase Shape (For Owner Decision)

**One dedicated phase, three independent slices, strict preserve-list (§2):**

* **Phase 14A — Request Governor & Token Budget** (pure logic + minimal status UI):
  per-provider limiter (min-gap + RPM + daily budget), 429/5xx classifier with
  backoff + `Retry-After`, hard request timeout, token estimator + size-aware history
  trim, usage capture (`usageMetadata`/`usage`) into device-local daily counters,
  truncation detection + Continue, spec-exact Test Connection (8 tokens).
* **Phase 14B — Tutor Sheet UI Rebuild** (render-layer only; no request-law changes):
  append-only thread rendering (no per-tick whole-sheet teardown), stable composer +
  draft preservation, dedicated error/quota/rate-limit state cards with
  Retry / Offline-switch actions and countdown, copy + regenerate per bubble,
  `aria-live` + focus trap, truncation Continue button (UI half of P8),
  token/usage hint line, docs/08 §5.13 chips/pin/drag polish.
  *Owner decision embedded:* adopt true SSE streaming (Gemini `streamGenerateContent`,
  OpenAI-compat `stream: true`) with partial-keep on Stop — preview invariant stays
  byte-exact either way — or defer streaming and keep the improved simulated reveal.
* **Phase 14C — AI Settings & Transparency** (owner-revised 2026-11-25: ALL settings
  in `#/you` only — the sheet stays chat + history; zero in-sheet controls):
  curated per-provider model lists (Gemini default → `gemini-3.1-flash-lite`,
  new **NVIDIA NIM** provider); generation settings (temperature / max output
  tokens / history depth with safe ranges); language modes (+ Hinglish, Simple
  English per docs/04 §1.2, relocated to `#/you`); You & AI usage dashboard
  (requests & approx tokens today, per provider, last error, reset hint);
  prompt-preview default flipped OFF (owner decision; toggle stays in `#/you`);
  passphrase-wrap decision recorded.

Slice order 14A → 14B → 14C (B and C are independent of each other; A first because
P1–P4 are the correctness core and B's error states consume A's classifier).

**Owner decisions (2026-11-25 — incorporated into `phase-14/plan.md`):**

| Decision | Effect on the plan |
| :-- | :-- |
| All AI settings live in `#/you` only (phone space; sheet = chat + history) | 14C in-sheet popover dropped → contextual link-outs in error cards only; in-sheet EN/বাংলা toggle moves to `#/you` |
| Retry when a reply ends on token limits; wait 1 min 10 s before cutting the full chat | 14A `RETRY_WINDOW_MS = 70 000` governs rate-limit retries + truncation auto-continue with a live countdown; expiry → Offline Corpus fallback (history never deleted) |
| Add NVIDIA free API keys as a provider | New `nvidia` provider — NVIDIA NIM, `integrate.api.nvidia.com/v1`, OpenAI-compatible, ~40 RPM best-effort, credit-based, `nvapi-` keys expire in 6 months |
| Gemini mode default → `gemini-3.1-flash-lite` | `AI_PROVIDERS.gemini.defaultModel` + `DEFAULT_VAULT` change; governor paced to its conservative floor (10 RPM / 500 RPD reading) |
| Prompt preview ("Check prompt before sending") default OFF | `previewPrompt` default flips; toggle remains in `#/you`; docs/04 §2.3/§4 + AGENTS.md §4.3 lines amended at execution with this decision as authority |
| Suggestions must not stay sticky while an answer is generating | 14B §3.1a: chips auto-hide through the whole generation lifecycle, restore on idle |
| History becomes a chat-app sidebar — tap opens ~70% of screen, find history | 14B §3.4a: slide-in drawer (70% width, scrim, Esc/scrim close) + client-side session search; docked column on desktop; supersedes Phase 11's in-thread panel (data unchanged) |

The executable step-by-step plan with file-level changes and acceptance gates is
[`docs/phases/phase-14/plan.md`](./phases/phase-14/plan.md) — **not executed**, per the
Phase 11–13 precedent (plan first, owner go-ahead, then code).

---

## 9. Open Questions for the Owner (Updated After the 2026-11-25 Decisions)

**Resolved by the owner (2026-11-25):** all AI settings in `#/you` · 70 s
retry-before-cut law · NVIDIA NIM provider added · Gemini default
`gemini-3.1-flash-lite` · prompt preview default OFF. Still open:

1. **Streaming:** adopt real SSE streaming now (14B) or defer? (Real streaming is the
   single biggest perceived-latency win; simulated reveal stays as reduced-motion path.)
2. **Auto-seed on open:** keep the instant grounded reply when a key exists (spends
   quota silently), or make the first ask an explicit tap / default to corpus mode
   even with a key (recommended: explicit tap when a daily budget is running low)?
3. **Daily budget defaults** per provider for the local governor (proposed: Gemini 20
   warn / 40 hard with per-model override once curated lists land; Groq 40; OpenRouter 40)?
4. **`maxOutputTokens` default:** keep 1024 (cheap) or raise default to 2048 with a
   budget warning (long derivations currently truncate)?
5. **Passphrase-wrapped key storage (docs/04 §2.1 optional):** build in 14C or record
   as accepted-deferred?
6. **Phase number:** 14 is the next free slot (`docs/phases/README.md` map) — confirm
   before any `docs/05` table edit (owner-only per AGENTS §5.5).

---

## 10. Evidence Index (file : line)

| Claim | Where |
| :-- | :-- |
| Hardcoded temperature/maxOutputTokens (Gemini) | `ai-vault.js:279` |
| Hardcoded max_tokens (Groq/OpenRouter) | `ai-vault.js:307–308` |
| Count-only 8-turn history cap | `ai-vault.js:266` |
| Single non-streaming POST; no retry/timeout; generic error string | `ai-vault.js:325–351` |
| Connection test uses full 1024-token payload despite spec comment | `ai-vault.js:353–368` |
| Whole-sheet rebuild + listener re-attach | `ai-tutor.js:655` (function), `743–745` (`body.innerHTML = ""`) |
| 22 ms typewriter interval re-rendering everything | `ai-tutor.js:381–395` |
| Per-bubble LaTeX re-render each tick | `ai-tutor.js:843–862` |
| Composer input rebuilt without value restore | `ai-tutor.js:993–998` (form in template), `1029–1035` (submit) |
| Raw error interpolated into bubble + fallback | `ai-tutor.js:1092–1097` |
| Auto-seed fires BYOK request on open when key exists | `ai-tutor.js:633–644` |
| Truncation/finishReason/usage never read | absent from `ai-vault.js` (grep-verified) |
| No `aria-live` in AI sheet | grep: only `app.js`, `ui.js` toast, `exam.js`, `you.js` have it |
| Badge naming mismatch | `index.html:57` vs `ai-tutor.js:665–669` |
| Settings only on `#/you` | `you.js:206–264` |
| EN/বাংলা only | `ai-tutor.js:751–755` |
| Assisted-flag on AI hint (working, keep) | `practice.js:945–950` |
| Timed-mock lock (working, keep) | `ai-tutor.js:577–581` |
| History caps 12×30, never synced (working, keep) | `ai-history.js:31–32`, phase-11 record |
| Baseline suite green on this checkout | `node --test tests/*.test.mjs` → 0 failures |

*No `_data/`, scoring, or gate files were touched for this research. Docs-only change.*
