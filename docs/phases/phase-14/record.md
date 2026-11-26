# Phase 14 — implementation record

## Status and decisions

The 14A governor, 14B sheet and 14C settings/security work are implemented and
passed the gates listed below. On 2026-11-25 the owner delegated technical
choices for cross-tab pacing, auto-seeding and streaming and requested key
encryption. The implementation uses atomic IndexedDB reservations, offline
seeds, true SSE streaming and optional passphrase protection. The earlier
in-sheet settings acceptance wording in plan §4.8 is superseded by the owner's
You-only settings decision; pinned browsing is tested instead.

No real provider credentials were used in the automated checks: provider
compatibility, quotas, catalog availability and CORS can change. Provider
fixtures exercise the real request builders, parsers and browser flows, but are
not a live-service certification.

## 14A — governor

- All quota reservations and ledger mutations use an IndexedDB read/write
  transaction, so simultaneous tabs serialize instead of reading the same quota
  slot. A two-tab simultaneous-reservation browser fixture verifies one send is
  permitted and the other is paced, without lost ledger counts. The governor and
  usage metadata remain device-local and excluded from sync.
- If shared IndexedDB is unavailable or a governor transaction fails in a
  browser, live sends fail closed and the Offline Corpus remains available;
  separate in-memory tabs cannot safely enforce a shared quota. Storage
  fallback also handles the initial transition to in-memory mode correctly.
- Explicit live asks, retries and continuations are governed. An 8-token Test
  Connection is explicitly exempt per the plan. The 70-second recovery window,
  45-second provider timeout, bounded retries, usage capture and 70-second
  Retry-After cutoff have deterministic tests. Keys and question text never
  enter the governor record.
- Opening a question/formula or starting a new contextual chat seeds an offline
  corpus explanation even with a saved key. This deliberate delegated decision
  supersedes the earlier queued-BYOK auto-seed wording: it avoids an unexpected
  live request or quota spend. A browser fetch spy verifies this behavior.
- NVIDIA's proposed `meta/llama-3.3-70b-instruct` free endpoint was listed as
  deprecated at https://build.nvidia.com/meta/llama-3_3-70b-instruct . The
  selected catalog-listed free default is
  `nvidia/nemotron-3.5-lightning-30b-a3b`:
  https://build.nvidia.com/nvidia/nemotron-3.5-lightning-30b-a3b . Availability
  can change; no live provider key was used.

## 14B — tutor sheet and streaming

- The shell, thread and composer stay mounted during generation; drafts, focus,
  scroll and searchable history survive. Pacing/retry/quota/auth/network and
  storage/offline cards, fallback, Continue, Copy and Regenerate are covered.
  Suggestions hide through the generation lifecycle. Focus traps, Escape,
  scrim, drawer search/restore, touch swipe, desktop pin and mock lock have
  browser fixtures, including phone widths and desktop 200% text.
- Live tutor requests use Gemini SSE or OpenAI-compatible `stream: true`. UTF-8
  chunks append to a single live bubble. Stop, closing the sheet, interrupted
  streams and grace-window cutoff retain received text as an incomplete reply
  with Continue. A stream interrupted after emitting text falls back rather than
  silently repeating the already visible text. Reduced motion does not disable
  streaming. A non-SSE JSON provider response uses the existing reveal fallback.
- Each request/continuation is separately built and governed; when enabled, the
  preview is the exact body transmitted. Unit fixtures cover split SSE frames,
  all four providers, partial Stop, usage and continuation; a browser fixture
  verifies text appears before completion, Stop and exact preview/send bytes.

## 14C — settings and key protection

- The You card provides curated models with availability caveats, bounded
  generation controls, English/Bengali/Hinglish/Simple English and a local
  usage dashboard. Offline question replies preserve verified English math.
- Fresh vaults use Gemini `gemini-3.1-flash-lite` and preview OFF; saved provider,
  model and preview choices are retained with a dismissible upgrade notice.
  `AGENTS.md` §4.3 and `docs/04` §§2.3/4 carry the owner's 2026-11-25 amendment.
- The user can protect an existing or newly entered API key with AES-GCM and a
  passphrase-derived PBKDF2-SHA256 key (random salt and nonce). Only ciphertext
  is stored in the isolated localStorage vault. Unlock is per tab and only in
  memory until lock or reload; settings writes never serialize the unlocked
  key. Existing plaintext vaults remain unchanged until protection is selected.
  Forgotten passphrases cannot be recovered; clearing/re-entering the API key is
  the recovery path. Encryption does not defend against malicious same-origin
  code while the vault is unlocked. Keys and passphrases never enter IndexedDB,
  backups or sync.
- Tests cover encryption, incorrect passphrase, authenticated tampering,
  replacement, locking, reload, per-tab unlock isolation, plaintext absence and
  settings preservation. UI makes the unprotected state and tradeoffs explicit.

## Verification

- `node --test tests/*.test.mjs`: 161 passing.
- `python3 scripts/verify_corpus.py`: pass (400 questions, 42 units, 109 figures).
- `PYTHONPATH=/tmp/jelet-sympy python3 scripts/verify_solutions_sympy.py`: pass,
  including independent SymPy verification.
- `node scripts/check_tokens_and_links.mjs`: pass.
- `JELET_PW_ROOT=/tmp/jelet-pw node scripts/check_responsive.mjs`: 43/43 pass.
- `JELET_PW_ROOT=/tmp/jelet-pw node scripts/check_community.mjs`: 56 checks pass,
  zero console errors, including live-stream, encryption, no-storage, offline
  seed and simultaneous cross-tab fixtures.

No `_data/` or `scoring.js` changes. The timed-mock lock, immutable grounding,
local vault isolation and offline fallback remain in force. No PR or merge.

### Follow-up: NVIDIA browser connectivity and chat presentation (2026-11-25)

- Reworked the phone-first tutor conversation and composer, with escaped rich
  text and math formatting; added distinct NVIDIA network/CORS, auth and model
  diagnostics. Browser network failures alone do not prove CORS or validate a key.
- With owner approval, added an **optional loopback-only** Termux server that
  serves the app and relays NVIDIA POSTs exclusively to NVIDIA over HTTPS. It
  does not log or persist keys or prompts. Static/hosted deployments and other
  providers remain direct; request preview remains the exact transmitted body.
- Verification: 166 Node tests and 4 Python relay tests pass; token/link and
  corpus checks pass (400 questions, 42 units, 109 figures); independent SymPy
  re-verification passes for 400 solutions; responsive audit 43/43 and community
  audit 58 pass with zero console errors. A real Chromium browser exercised
  loopback relay streaming against a **mocked** NVIDIA upstream. No real NVIDIA
  key or live NVIDIA inference was tested.

### Follow-up: multiple keys and compact chat (2026-11-26)

- Added per-provider key collections with Auto/manual selection in You & AI and
  the chat composer. Auto switches within the same provider and model only on
  authentication, quota or rate-limit failures, before partial output, subject
  to the existing two-retry/70-second budget and provider-wide governor. It
  remembers the last successful key; manual mode never auto-switches.
- Migrates legacy single-key vaults, including old encrypted envelopes; optional
  passphrase encryption covers the entire key ring. Protected additions/removals
  require the passphrase. No keys are stored in IndexedDB, backups or sync.
- Refined the empty conversation and composer using the supplied mobile reference;
  suggestions start collapsed. Test Connection uses only the selected starting key.
- Verification: 172 Node tests, 4 local-relay tests, token/link, corpus and SymPy
  checks passed; responsive audit 43/43 and community audit 61 checks passed.
  Browser fixtures tested auto/manual selection, credential switching and exact
  preview bodies against a mocked provider, not real NVIDIA credentials.

### Follow-up: NVIDIA diagnostics and consent-based Gemini fallback

- The user reported Test Connection failing with an authentication/access error;
  no credential or exact HTTP status was supplied. The test now names the key
  label and route, distinguishes relay-generated errors from forwarded responses
  when the updated relay is running, and treats NVIDIA 403 as an access/permission
  issue rather than proof of key expiration. No real NVIDIA key was tested.
- On a failed NVIDIA tutor request the user may choose Try Gemini, review the
  exact Gemini request, then explicitly confirm or cancel. The default Gemini
  model and a saved, unlocked Gemini key are used; no provider switch occurs
  automatically or changes the saved provider. The fresh manual request is
  independently governed and preserves the original grounding and prior history.
- Verification: 173 Node tests, 5 local relay tests, token/link, corpus and
  independent SymPy checks pass; responsive audit 43/43 and community audit 66
  pass. Browser fixtures cover selected-key diagnostics, cancellation, missing
  or changed Gemini keys, explicit consent, exact body and provider quota ledgers;
  they use mocked provider responses, not live credentials.

### Follow-up: compact tutor controls

- Moved the full tutor context into an initially collapsed region toggled by an
  accessible information icon in the tutor header. Question key and origin
  information remain available; Escape closes the region without closing chat.
- Replaced the full-width Latest button with a centered floating arrow, and
  aligned Suggestions and the key/model selector in one composer toolbar with
  Send/Stop beside the input. Suggestions remain hidden during generation.
- Gemini key labels now show the current Gemini provider model in both You & AI
  and chat. This is a display of the shared selected model, not a new per-key
  model assignment.
- Verification: 173 Node tests, 5 relay tests, token/link, corpus and SymPy gates
  pass; responsive audit 43/43 and community audit 69 checks pass. Browser
  coverage includes context disclosure, keyboard dismissal, centered latest
  control, compact composer alignment, current Gemini model labels, and the
  earlier explicit-consent fallback.
