# Phase 12 PLAN — Phone UI Compaction: Today & You/Settings (the "Disclosure Row" Pattern)

> **Status:** 📋 Research complete · **zero code written** · awaiting owner go-ahead.
> **Previous:** Phase 11 (`phase-11/plan.md`) · **Next:** Phase 13 (`phase-13/plan.md`) ·
> **Research basis:** full source read of `today.js` (671 lines) & `you.js` (1,083 lines)
> + `docs/08` audit §5.1/§5.12 (2026-11-25).
> **Owner complaint being solved:** *"Overall UI is good but now everything is extended
> for phone UI — that's bad, for example the settings and today page."*

---

## 0. The Goal in Plain Words

On a phone, **Today** and **You (Settings)** are endless vertical scrolls: every
section is always expanded, so the screen you actually need (hero, quick actions,
the AI key switch) is buried under everything else. The fix is the standard mobile
settings pattern:

> **Show one tappable status row per section. Tap to expand. Phone = collapsed by
> default. Desktop = expanded by default (it has room).**

Nothing is deleted — every card, metric and button stays exactly as it is today.
We only change *when it is visible*. Rich desktop (≥768 px / ≥1024 px) keeps the
current full layout automatically.

---

## 1. What the Research Found (Evidence)

### 1.1 Today page — current phone order (`assets/js/views/today.js` template, lines ~127–292)

| # | Section | Line (template start) | Problem on phone |
| :-: | :--- | :---: | :--- |
| 1 | Greeting + streak | 130 | fine |
| 2 | Desktop 4-tile stat strip (`today-desktop-stats`) | 142 | already `display:none` on phone ✅ |
| 3 | **Mock History card** | 162 | sits **above the hero** — pushes the main action down |
| 4 | **Focus Hero (resume + Pomodoro)** | 186 | should be first meaningful card |
| 5 | Quick Actions (AI / Formulas / Daily 10) | 226 | fine |
| 6 | Spaced Mistake Notebook strip | 249 | fine (it's a compact strip) |
| 7 | **Weak Areas** (empty state or breakdown cards) | 273 | long when populated (top-3 + subject meters + per-unit details) |
| 8 | **Your Subjects 2×2 grid** | 282–292 | long-ish; useful but secondary |

Total phone scroll ≈ 8 screens on a fresh device, more once insights populate.

### 1.2 You/Settings page — current order (`assets/js/views/you.js` template, lines ~136–560)

| # | Section | id / line | Lines of DOM (approx) | Dynamic status already available? |
| :-: | :--- | :--- | :-: | :--- |
| 1 | Privacy lock banner | `138` | small | — (keep always visible) |
| 2 | Study readiness | `youReadinessSection` `144` | ~60 | ✅ `readiness.*` |
| 3 | Mock history + trends | `youMockHistorySection` `208` | ~75 | ✅ `mockHistory.*` |
| 4 | JU Target & CGPA check | `288` | ~50 | ✅ `profile.diplomaCgpa` + `renderCgpaStatus()` |
| 5 | Codec BYOK AI vault | `340` | ~55 | ✅ `readAiVault()` + `syncAiVaultDom()` |
| 6 | My Activity tiles | `399` | ~20 | ✅ `snapshot.savedBookmarks.length` etc. |
| 7 | Preferences / Offline / Backup | `423` | ~55 | ✅ theme, offline cache state |
| 8 | Encrypted sync | `youSyncSection` `477` | ~65 | ✅ `renderSyncStatus()` already writes a pill |
| 9 | Contribute + benchmark + study buddies | `538` + mounts | ~100+ | ✅ counts where relevant |

≈ **1,100 lines of template** → 10+ phone screens of scroll before you reach the
backup button. The AI vault (the whole point of the "You & AI" tab) is screen 5.

### 1.3 Patterns already available in the codebase (reuse, don't reinvent)

* Native `<details>/<summary>` already used: `.tiebreak-details` (results tie-breaker,
  sync disclosures) — semantics + keyboard + screen-reader support for free.
* `matchMedia("(min-width: 768px)")` / `(min-width: 1024px)` — same breakpoints the
  shell already uses (`shell.css`).
* Honest status values for every summary line are **already computed** on both pages
  (see tables above) — summaries never invent data (AGENTS §4.2).

---

## 2. The Design Decision: `.disclose` Disclosure Row

One new shared pattern in `components.css`, used by both pages:

```text
┌──────────────────────────────────────────────┐
│ ▸ Mock History        3 mocks · best 96/120  │  ← summary row (48px+, tappable)
├──────────────────────────────────────────────┤
│   …existing card markup, untouched…          │  ← visible only when open
└──────────────────────────────────────────────┘
```

**Rules (all mandatory):**

1. Markup = `<details class="disclose">` wrapping the **existing section markup
   unchanged** (ids, classes, inner bindings all keep working). Above it,
   `<summary class="disclose__summary">` containing:
   * `.disclose__title` — section name (plain text),
   * `.disclose__status` — one honest live status line (may carry an id for updates),
   * chevron via CSS `::after` (rotates when open).
2. **No interactive elements inside `<summary>`** (no links/buttons — tapping a link
   inside a summary would toggle the disclosure; all CTAs stay in the content).
3. Phone default = **collapsed**; on mount, if
   `matchMedia("(min-width: 768px)").matches` (Today) or `(min-width: 1024px)` (You)
   → set `open` on every `.disclose`. Desktop keeps today's full layout.
4. Tokens only — colors/spacing/radius from `tokens.css` (gate:
   `check_tokens_and_links.mjs`). Min tap height `var(--tap-min)` (48 px).
5. `prefers-reduced-motion: reduce` → no chevron rotation transition.
6. Native `<details>` semantics — no custom ARIA needed; do **not** add
   `aria-expanded` manually (the platform exposes it).
7. Summary text must be short enough for 360 px (one line + ellipsis if needed;
   full value remains inside the opened card).

---

## 3. Work Steps

### Step 0 — Two one-line visual fixes from the audit (do with this phase)

| # | File:line | Change | Verify |
| :-: | :--- | :--- | :--- |
| 0.1 | `index.html:29` | Theme-toggle initial SVG `#icon-timer` → `#icon-moon` (JS swaps to sun/moon after boot; today there is a timer-icon flash). | First paint shows moon icon in light mode. |
| 0.2 | `learn.js:208` | Subject card copy `"40 Qs · 50 Marks · Units revised"` (dangling words) → `"40 Qs · 50 Marks · 11 Units"` (the meter row below already shows `revised / total`). | Learn page reads cleanly; no lost info. |

### Step 1 — Today page restructure (`assets/js/views/today.js`)

**1a. New phone order** (move blocks in the template; keep every id):

```text
1. Greeting + streak row            (unchanged)
2. Desktop stat strip               (unchanged — hidden on phone)
3. Focus Hero (resume + Pomodoro)   ← moved UP from position 4
4. Quick Actions                    (unchanged)
5. Mistake Notebook strip           (unchanged)
6. <details.disclose> Mock History            (id #todayMockHistoryCard preserved)
7. <details.disclose> Weak Areas              (id #todayWeakAreasSection preserved)
8. <details.disclose> Your Subjects           (grid id #todaySubjectsGrid preserved)
```

**1b. Summary lines (honest, computed from data already in scope):**

| Disclosure | `.disclose__status` content (source) |
| :--- | :--- |
| Mock History | `mockHistory.empty` → `"No mocks yet"`; else `` `${count} mocks · best ${formatTwelfths(bests.bestScore.totalTwelfths)}/120` `` |
| Weak Areas | `!weakAreas.hasEnoughData` → `"Practice to generate insights"`; else `` `${topWeakUnits.length} focus unit(s) · worst ${top}%` `` |
| Your Subjects | `` `${totalRevised}/42 units revised` `` (`totalRevisedUnits` already computed for the hero) |

**1c. Desktop:** on mount, `if (matchMedia("(min-width: 768px)").matches)` set
`open = true` on the three disclosures → desktop layout visually identical to today.

**1d. Bindings that must keep working (ids preserved — verify each):**
`#todayMockHistoryCard` content ids (`#todayMockHistoryCard` itself), weak-area
slots (`#todayWeakAreasSlot`, `#weakAreasEmptyState`, `.js-drill-weak-unit`),
`#todaySubjectsGrid` cards, all hero/pomodoro/quick-action/mistake handlers.
Collapsed `<details>` keeps children in the DOM → listeners bound at mount stay valid.

**1e. What NOT to change:** hero design, Pomodoro logic, empty states, desktop
stat strip, `data-immersive` behavior, and every computed metric.

### Step 2 — You/Settings restructure (`assets/js/views/you.js`)

**2a. Wrap these eight blocks** (banner stays unwrapped, always visible) — each becomes
`<details class="disclose">` + summary, **existing section markup untouched inside**:

| Wrap this existing block | id to keep | Summary title | Summary status source (already computed) |
| :--- | :--- | :--- | :--- |
| Readiness section | `youReadinessSection` | `Study readiness` | `hasEnoughData ? "${estimatePct}% · ${stageLabel}" : "Need more attempts"` |
| Mock history section | `youMockHistorySection` | `Mock history` | `empty ? "No mocks yet" : "${count} mocks · best …/120"` |
| JU Target & CGPA | *(add `id="youJuSection"`)* | `JU Target & CGPA` | `cgpa === "" ? "Not set" : "${percentage}% · ${eligible ? "Eligible" : "Below cutoff"}"` — updated inside existing `renderCgpaStatus()` |
| Codec BYOK AI vault | *(add `id="youAiSection"`)* | `AI Tutor (BYOK)` | from `syncAiVaultDom()`: `hasKey ? "${providerLabel} · Key saved" : "Offline corpus mode"` |
| My Activity | *(add `id="youActivitySection"`)* | `My Activity` | `` `${savedBookmarks.length} bookmarks · ${recentlyVisitedUnits.length} recent units` `` |
| Preferences / Offline / Backup | *(add `id="youPrefsSection"`)* | `Preferences & backup` | `theme === "dark" ? "AMOLED on" : "Light mode"` (+ offline pack state if already cached) |
| Encrypted sync | `youSyncSection` | `Cloud sync` | updated inside existing `renderSyncStatus()`: `Off / Locked / Pending N / Up to date` |
| Community (Contribute + benchmark + study buddies) | `youContributeSection` inside | `Community (optional)` | static: `"Open source · optional"` |

**2b. Community container:** create one empty
`<div id="youCommunitySlot" class="stack-m">` **inside** the community disclosure,
then call `mountBenchmark(youCommunitySlot, …)` and `mountStudyBuddies(youCommunitySlot, …)`
instead of `root` (their signatures only append — passing a container is safe).

**2c. Order on the page (after wrapping):** keep the current source order for minimal
diff — but with everything collapsed the first phone screen becomes: privacy banner +
8 status rows, i.e. a proper settings home. *(Optional stretch, only if trivial:
move the AI-vault disclosure directly under the banner — it is the tab's headline
feature. Reordering is safe because each block is self-contained.)*

**2d. Desktop:** `matchMedia("(min-width: 1024px)")` → open all disclosures on mount
(You page treats ≥1024 as desktop; tablet 768–1023 stays collapsed like a phone —
matches the "settings" mental model).

**2e. Dynamic status updates** (one-line additions inside functions that already run):
`renderCgpaStatus()` → also set `#sumJU`; `syncAiVaultDom()` → `#sumAI`;
`renderSyncStatus()` → `#sumSync`; activity counts → `#sumActivity`
(re-rendered whenever `renderActivityDrawer` runs; also set once at mount).
**Never compute a status that isn't already derived from real data.**

**2f. What NOT to change:** every input, toggle, handler, and the sync/AI/backup
logic — this phase only wraps and reorders visibility.

### Step 3 — CSS (`assets/css/components.css`)

Add a `.disclose` block (spec — implement exactly this behavior, tokens only):

| Selector | Behavior |
| :--- | :--- |
| `.disclose` | transparent container, no border (the inner card keeps its own `.card` look) |
| `.disclose__summary` | flex row: title (semibold, `--text-primary`) · status (`--text-muted`, `--fs-caption`, flex-shrink, ellipsis) · chevron `::after`; `min-height: var(--tap-min)`; `cursor: pointer`; `list-style: none`; `padding: var(--space-xs) 0`; focus-visible follows global ring |
| `.disclose__summary::-webkit-details-marker` | `display: none` |
| `.disclose[open] > .disclose__summary::after` | chevron rotated 180° (transition `transform .15s ease`) |
| `.disclose > .disclose__summary + *` | `margin-top: var(--space-xs)` (breathing room before the card) |
| `@media (prefers-reduced-motion: reduce)` | chevron transition `none` |

### Step 4 — Verification (phone-first is the whole point)

| Check | Where | Pass criteria |
| :--- | :--- | :--- |
| Fresh device, 360×800 | Today | First screen = greeting + hero + quick actions; Mock/Weak/Subjects collapsed; tap each row expands with correct honest status |
| Fresh device, 360×800 | You | First screen = banner + 8 rows; every row expands; empty states intact (`0`, `—`, "Need more attempts") |
| Populated device (attempt data) | both | Status lines show real numbers matching the opened cards |
| 1440×900 | both | All disclosures open — layout visually identical to pre-phase |
| Dark (AMOLED) | both | Row hover/active + chevron use tokens only; no raw hex (gate) |
| 200% text zoom | both | Status line ellipsizes, no overlap, no horizontal scroll |
| TalkBack/VoiceOver | both | Summary announced as collapsed/expanded button; content reachable when expanded |
| Keyboard | both | Tab reaches summary, Enter/Space toggles, focus ring visible |

---

## 4. Acceptance Checklist (Phase 12 close)

- [ ] Today phone: new section order live; three disclosures; ids/bindings intact
      (Pomodoro ticks, Daily-10 launches, drill buttons, subject links all work)
- [ ] You phone: eight disclosures; all dynamic status lines update live
      (change theme → Preferences row updates; save AI key → AI row updates;
      enable sync → Sync row updates)
- [ ] Community disclosure mounts benchmark + study buddies inside it (no double render)
- [ ] Desktop ≥768 / ≥1024: everything open — pixel-comparable to current layout
- [ ] Step 0.1 (theme icon) and 0.2 (Learn copy) fixed
- [ ] All four mandatory gates green
      (`verify_corpus.py` · `verify_solutions_sympy.py` · `check_tokens_and_links.mjs` · `node --test`)
- [ ] Browser gates green (`check_responsive.mjs` · `check_community.mjs`)
- [ ] Owner review → convert to `phase-12/record.md`

## 5. Out of Scope

* No changes to Practice/Papers/Lesson/Exam layouts (the `.disclose` pattern is
  reusable later — but ship it only on Today + You in this phase).
* No new routes, no 6th tab, no layout changes ≥768 px beyond open-by-default.
* No metric changes — every summary number comes from data already computed.
* No redesign of the hero, AI sheet, or exam runner (immersive modes untouched).
