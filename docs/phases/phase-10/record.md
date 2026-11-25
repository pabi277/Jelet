# Phase 10 Record — JELET Study Hub v3: Community & Sharing

**Date:** 2026-11-25 (UTC)  
**Branch:** `arena/1fb76bb7-jelet`  
**Base:** `f24c12bff815797a762c379a1c89e2f8b0eb1d28`  
**Status:** Complete; optional benchmark service remains unconfigured by default.

## Build order and delivered slices

Read the Phase 09 handoff, AGENTS.md, approved UI guidance and existing results,
You, Today, stats, charts and sync integration points before implementation.
The checked-in architecture documents, approved reference files and strict
.gitignore were already materialized; no blueprint or frozen content was replaced.
Confirmed order: local SVG sharing → anonymous benchmark → local study-buddy
invites → OSS note and verification. Small commits on the assigned branch:

1. **`32f38a1` — Local SVG mock result cards.**
   - `core/share-result.js` builds a strict allowlisted representation; no attempt
     object serialization. Only independent full mocks expose the sharing UI.
   - Results → **Share** generates an in-app SVG preview and **Download SVG card**.
     No server, upload, external font/image or native-share dependency.
   - Default **score + accuracy only**: formatted marks, exact integer twelfths,
     accuracy. An unchecked **Full breakdown** checkbox explicitly adds canonical
     paper label, recorded time (or not recorded), pairwise mock accuracy trend and
     available section scores. Switching off removes those fields from the actual
     download representation, not just the visible UI.
   - Trend reuses `computeReadinessEstimate().mockTrend` for the selected mock and
     its immediately previous independent full mock (±5 accuracy points). Later
     attempts are not used. No previous mock → insufficient, not a fabricated trend.
   - No profile/name, custom attempt title, answer, submission timestamp, session ID
     or API key. The SVG says **Study result · JELET Study Hub** and **Not an official
     WBJEEB document**; colors are resolved from figure tokens for standalone use.

2. **`3e95423` — Anonymous benchmark client + provider contract.**
   - `core/benchmark.js`, `views/benchmark.js`: explicit endpoint save, Load, per-mock
     contribution toggle and Submit on results and You (latest independent mock).
     No endpoint configured → honest unconfigured state; no automatic fetch, seeded
     data, default endpoint, background upload or offline queue.
   - Identity-free POST body **only `{marks, accuracy, paperYear}`**; canonical
     official paper, valid twelfth score and valid accuracy required. No client
     identifiers, name, email, profile or API keys. Contribution requires both a
     toggle and action. Receipts are local only and guard accidental repeat sends.
   - GET validates current UTC Monday-start week, snapshot timestamp, exact score
     frequency bins, unique bin keys, valid ranges and matching submission total.
     Empty/stale/malformed/unavailable aggregates produce no percentile. No
     percentile inferred from a mean. Comparisons count strictly lower scores;
     tied and higher scores are reported separately, with real sample count.
   - Honest limitations: self-reported submissions ≠ verified scores, unique
     students or a representative population. No official or predicted exam rank.
   - HTTPS (loopback HTTP for local development), credential/query-free base URLs,
     `credentials: omit`, `referrerPolicy: no-referrer`, redirect rejection,
     12-second timeout, no-store and no automatic retry. Service worker bypasses
     no-store GETs, including same-origin aggregates. HTTP/connection/uncertain
     acknowledgement failures are surfaced without fake fallback data.
   - Benchmark configuration and receipts are outside encrypted sync scope.
     An edited but unsaved URL cannot silently send to the previously saved one.

3. **`49e7d24` — Local Study buddies.**
   - `core/study-groups.js`, `views/study-buddies.js`: create locally, prepare/copy
     UTF-8/base64url fragment invite, preview before **Join locally**, edit focus
     topics/unit plan locally, leave locally. Clipboard-denied fallback selects
     the link for manual copy. Opening/decoding is not a join or upload.
   - Invite allowlist: version, random group invite ID (not a person/device ID),
     group name, shared topic, up to 10 peer-provided focus topics and 42 canonical
     unit IDs. Unicode works; malformed/oversized/unknown-version links fail safely.
     Repeat joins do not duplicate groups or overwrite local edits.
   - No fabricated member list/presence. Topic entries are explicitly peer-provided,
     not a verified roster. No backend collaboration implied. Users share updated
     invites manually; existing members preserve local copies on rejoin.
   - State is `meta/app.studyGroups`, per-device unless explicitly encrypted-synced
     or backed up. Existing whole-app-record LWW sync semantics apply, not group
     collaboration. Never share one's sync passphrase with buddies.
   - Invites are readable/forwardable, not encrypted/revocable/access-controlled.
     UI warns not to enter names or private information. Maximum 30 local groups.

4. **`05fcc74` — Optional durable benchmark endpoint adapter.**
   - Added `scripts/benchmark_server.py`, standard-library Python/SQLite, as a
     runnable provider-independent reference for the shared append-only store.
     Not shipped into the static app or required for local study.
   - Starts empty. Strict exact-field validation, 512-byte body limit, CORS,
     durable append before 201 acknowledgement, server receipt-time UTC week
     aggregation, exact twelfth histogram; no event-list/update/delete API.
     SQLite triggers also prevent UPDATE/DELETE. No request/body/IP access logging
     or identifying database columns. Databases are gitignored.
   - Operators still need HTTPS, private persistent storage, disabled proxy logs
     and resource/rate controls. No Sybil-proof or network-anonymity claim.
     API anonymity does not hide connection metadata from a provider.

5. **Final polish / informational OSS note / evidence (this commit).**
   - You → **Contribute** links to `https://github.com/pabi277/Jelet`; verified
     contributions and improvements welcome, informational only, no submission
     form, no mandatory participation or data transfer. New controls retain
     48px token-based tap targets and responsive wrapping.
   - Additional corrupted-count guard, receipt feedback and endpoint-edit privacy
     guard; complete `DEPLOY.md` contracts/operations/sharing/group limitations.

## Verification evidence

Full corpus + SymPy + token/link + test suite and headless responsive/route checks
were run after every slice (including the optional adapter). Counts progressed
**83 → 91 → 95 → 100 → 102**, preserving the original 79 tests. No skipped tests.

| Final gate | Command | Result |
| --- | --- | --- |
| Unit/integrity + endpoint tests | `node --test tests/*.test.mjs` | **102/102 PASS**, 0 failures/skips |
| Corpus | `python3 scripts/verify_corpus.py` | **PASS** — 400 questions, 4 papers, 42 units, 109 SVGs |
| SymPy verification | `python3 scripts/verify_solutions_sympy.py` | **PASS** — 400 solutions, 400 SymPy-verified; independent re-verification executed with SymPy installed |
| Tokens/paths/links/copyright | `node scripts/check_tokens_and_links.mjs` | **PASS** — zero raw hex, root asset paths, broken links or copyrighted files |
| Existing responsive regression | `node scripts/check_responsive.mjs` | **43/43 PASS** — 360/390/414/1440; zero horizontal overflow or console errors |
| Community browser regression | `node scripts/check_community.mjs` | **23 checks PASS** — zero console/page errors; mobile/desktop routes, explicit benchmark E2E, two-context invites, 200% text and offline |
| Frozen-file diff | `git diff f24c12b -- _data/papers/ _data/solutions/ scripts/_build/ 'scripts/verify_*' assets/js/core/scoring.js` | **Empty** |

Browser coverage (`scripts/check_community.mjs`):
- `#/`, literal `#/results` (existing fallback), a real `#/results/browser-test`
  fixture, `#/you`, `#/papers` at **360×800** and **1440×900**.
- Share preview generation, privacy toggle on/off, standalone SVG text assertions.
- Zero benchmark traffic from route loads or endpoint-save. Unsaved-endpoint guard;
  explicit Load returns an actual empty aggregate; toggle + action sends exactly
  three fields; subsequent Load counts the submitted event, shows ties, and local
  receipt prevents accidental repeat. Cookies and referrer absent on the wire.
- Fresh separate browser context opens an invite without saving it; explicit join
  saves the unit plan; repeat join preserves one local group; malformed invite is
  rejected without console errors. Local group creation/editing/sharing checked.
- **200% root text sizing** and mobile overflow checks on Today, populated Results,
  You and Papers. Offline reloads of all four work from SW/IndexedDB; SVG sharing
  still generates, benchmark reports Offline without a request, group plan editing
  still works locally.

Test-only synthetic inputs and the in-memory/browser test endpoint are isolated
from the app. The real adapter integration tests use temporary SQLite files outside
the checkout, initially empty, and delete them on completion. They verify invalid
payload rejection, append persistence across restart, no identity columns/logs,
SQL append-only triggers, and exclusion of previous/next-week receipt events.
No fixture becomes a production community submission or default UI statistic.

Tooling: browser dependencies installed outside the repo in `/tmp/pwtool`
(`puppeteer-core`, `@sparticuz/chromium@133.0.0`); SymPy in `/tmp/jelet-py`.
For reproduction, set `JELET_PW_ROOT` if tooling is elsewhere and use a Python
interpreter with SymPy installed for the independent verification gate. No mandatory
bundler, package manifest, runtime dependency or generated dataset was introduced.

## Preserved invariants and scope limits

- Frozen corpus/gates and `scoring.js` have **zero diffs** against the base.
  Integer 1/12-mark arithmetic is unchanged; no exam content was authored/modified.
- Five global destinations, hash routing, relative-subpath assets, figure tokens,
  installable/offline PWA and local-first default remain unchanged.
- All community networking is optional; saving config, viewing pages, sharing SVGs,
  generating/decoding invites and local plans require no community backend.
- No fake ranks, seeded submissions, inferred-from-mean percentiles, live member
  counts or fabricated trends. No personal profile or API key in share/benchmark
  payloads. API vault isolation and existing encrypted sync remain intact.
- Shared score distributions inherently expose exact frequencies, especially with
  small cohorts; the count is explicit. Operator privacy/retention/logging policies
  matter. Anonymous public submissions are not globally deduplicated or fraud-proof.
- No PR opened, no merge/push performed, and no branch switch. Owner review/sign-off
  remains required before any PR/merge.
