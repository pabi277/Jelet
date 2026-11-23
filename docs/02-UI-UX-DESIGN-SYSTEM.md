# 02 — Phone-First Modern Web UI/UX Design System & Screen Spec

> **Primary Design Target:** **Phone-First Modern Web PWA (`360px–430px` portrait Android/iOS — e.g., Samsung Galaxy A35 Chrome & standalone PWA)**, anchored by **10 Phone-First visual references (`01`–`07` & `11`–`13`)** and progressively enhanced via `min-width` media queries up to Desktop (`08`–`10`).

---

## 1. Core Design Philosophy (Phone-First by Default)

1. **Phone-First CSS Law (`base = phone`, `min-width` only):**
   * Base styles in `shell.css` and `components.css` target **`360px–430px` portrait phones** first—never write desktop-first CSS that gets squished down with `max-width` patches.
   * **Phone Primary (`<768px` — Screens `01`–`07`, `11`–`13`):** Dynamic viewport height (`100dvh`), `env(safe-area-inset-top/bottom)` padding, thumb-zone fixed `64px` **5-tab bottom navigation bar**, sticky bottom primary CTAs, horizontal snap-scroll filter pills (`scroll-snap-type: x proximity`), and smooth slide-up **Bottom Sheets (`82dvh` max)** with drag handles for the **100-Q OMR Palette (`11`)** and **CodeC AI Doubt Tutor (`12`)**.
   * **Tablet (`@media (min-width: 768px)`):** Bottom bar transitions cleanly into a `72px` left icon rail; bottom sheets become `380px` right slide-over drawers; subject cards arrange in a 2-column grid.
   * **Desktop Companion (`@media (min-width: 1024px)` — Screens `08`–`10`):** Expands into a `240px` left navigation rail, `max-width: 1280px` Bento workspace, split-screen Exam Runner (`Question` left + `OMR Grid` right), and docked `400px` right `AI Doubt Tutor` panel.
2. **Calm Academic Precision + AMOLED Dark Mode:**
   * Cool alabaster canvas (`#F6F8F8`), crisp white surfaces (`#FFFFFF`), thin `1px` borders (`#E2EBEA`), and deep emerald-teal brand (`#0F6E66`) in Light Mode—paired with battery-saving **AMOLED-friendly Dark Mode (`#070C0C` canvas, `#101919` cards, `#22A89B` teal)** for late-night phone study (`Screen 13`).
3. **Zero Clutter:** Strictly **5 global tabs**:
   * **`Today`** (`/`) · **`Learn`** (`/learn`) · **`Practice`** (`/practice`) · **`Papers`** (`/papers`) · **`You`** (`/you`, titled `You & AI` inside the screen header).

---

## 2. Canonical CSS Design Tokens (`assets/css/tokens.css`)

Every stylesheet MUST consume only these tokens (zero raw hex values in component stylesheets):

### 2.1 Color Palette (Light Mode Default + AMOLED-Friendly Dark Mode)

| Token Name | Light Mode Value | Dark Mode Value (`[data-theme="dark"]`) | Semantic Usage |
| :--- | :---: | :---: | :--- |
| `--bg-canvas` | `#F6F8F8` | `#070C0C` | Phone page background (AMOLED friendly in dark) |
| `--bg-surface` | `#FFFFFF` | `#101919` | Cards, bottom nav bar, bottom sheets, desktop rail |
| `--bg-surface-subtle` | `#EEF4F3` | `#172424` | Math equation blocks, unselected pills, secondary boxes |
| `--bg-hero-gradient` | `linear-gradient(135deg, #0B4F4A 0%, #12786F 100%)` | `linear-gradient(135deg, #0B3834 0%, #115E57 100%)` | Today Focus Hero card (`07`, `08`) |
| `--bg-worked-example` | `#EAF6F4` | `#112927` | Worked Example callout card (`05`) |
| `--brand-primary` | `#0F6E66` | `#22A89B` | Primary CTAs, active tab/pill, progress ring |
| `--brand-primary-hover` | `#0B5650` | `#2CC0B2` | Active/pressed touch state & desktop hover |
| `--brand-tint` | `#E0F2F0` | `#143330` | Selected option card fill (`09`, `11`), active chips |
| `--text-primary` | `#0F172A` | `#ECF4F3` | Headings, question stems, primary stats |
| `--text-secondary` | `#475569` | `#9BB0AE` | Subtitles, metadata, secondary labels |
| `--text-muted` | `#64748B` | `#6E8583` | Captions, inactive bottom-nav icons |
| `--text-on-brand` | `#FFFFFF` | `#051312` | Text/icons inside `--brand-primary` buttons |
| `--border-subtle` | `#E2EBEA` | `#1E302F` | Default `1px` card & row dividers |
| `--border-strong` | `#C5D6D4` | `#2F4A48` | Unselected radio/checkbox option borders (`11`) |
| `--status-correct-bg` / `fg` | `#DCFCE7` / `#15803D` | `#12301F` / `#4ADE80` | Correct badge, Official Key lock banner (`12`, `13`) |
| `--status-partial-bg` / `fg` | `#FEF3C7` / `#B45309` | `#35270E` / `#FBBF24` | Category-II Partial credit, Exam Trap box (`12`) |
| `--status-wrong-bg` / `fg` | `#FEE2E2` / `#B91C1C` | `#361518` / `#F87171` | Incorrect (`-0.25` / `0`) badge (`03`, `10`) |
| `--status-review-bg` / `fg` | `#EDE9FE` / `#6D28D9` | `#271B3D` / `#C4B5FD` | Marked-for-Review OMR state (`11`) & Voided `"W"` chip |

### 2.2 Subject Identity Accents (`06-learn-subjects.png` & `07-today-dashboard.png`)

| Subject | Badge Tint (`bg`) | Left Stripe / Bar (`fg`) | Canonical Icon | Official Weight |
| :--- | :---: | :---: | :--- | :--- |
| **Mathematics** | `#DCFCE7` (Dark: `#133323`) | `#10B981` | `√x` or `π` | `40 Qs · 50 Marks` |
| **Physics** | `#E0F2FE` (Dark: `#122B3D`) | `#0284C7` | Atom | `30 Qs · 35 Marks` |
| **Chemistry** | `#FEF3C7` (Dark: `#362811`) | `#D97706` | Conical Flask | `20 Qs · 25 Marks` |
| **FEEE** | `#F3E8FF` (Dark: `#2A1B3D`) | `#7C3AED` | IC Chip | `10 Qs · 10 Marks` |

### 2.3 Phone-First Typography, Touch Targets & Math Ergonomics

* **Font Sizes (Fluid `clamp()` tuned for `360px` readability without pinch-zoom):**
  * Question Stem & Lesson Prose: `16px` (`1rem`), line-height `1.6` (prevents iOS/Android input auto-zoom and avoids eye strain on phone).
  * Option Card Text: `15.5px` (`0.96875rem`), line-height `1.45`.
  * Section Heading: `clamp(1.25rem, 4vw, 1.625rem)`, `font-weight: 700`.
  * Monospace Timers, OMR Cells & Marks: `'JetBrains Mono', ui-monospace, monospace` with mandatory `font-variant-numeric: tabular-nums`.
* **Thumb-Zone Touch Targets:**
  * Option rows (`A–D`), primary CTAs, and bottom-nav tabs: minimum **`48px` height** (`12px–16px` vertical padding, `8px` gap between adjacent option rows so fast thumb taps never mis-click).
  * OMR Palette number buttons (`Screen 11`): minimum **`40px × 40px`** (`7` or `8` columns on `390px–430px`, `6` columns on `320px–359px` via `grid-template-columns: repeat(auto-fill, minmax(40px, 1fr))`).
* **Phone Math & SVG Diagram Containment:**
  * Display KaTeX blocks sit inside `.math-scroll { overflow-x: auto; max-width: 100%; -webkit-overflow-scrolling: touch; }` so `3×3` matrices and long integrals scroll smoothly inside their gray pill (`05`, `12`) and **never** cause page-level horizontal scroll.
  * SVG circuit/ray diagrams (`11`) render crisp `currentColor` strokes inside a `max-width: 100%` rounded frame with **tap-to-zoom fullscreen pinch modal** on phones.

---

## 3. Screen-by-Screen Specification (Phone-First → Desktop Expansion)

### Screen 1: `Today` Dashboard (`/`) — *Phone Primary: `07-today-dashboard.png` · Desktop: `08-modern-web-dashboard.png`*
* **Phone Layout (`<768px`):**
  * **Compact Header:** App title + `JELET 2028 · Target JU` pill + compact streak flame chip (`🔥 N`).
  * **Emerald-Teal Hero Card (`07`):** Left stack shows **Resume Active Mock/Lesson** OR **Today's Roadmap Unit** (`Unit M01 · Matrices`) with white pill CTA **`▶ Resume`**; right column houses the circular **`25:00` Focus Timer** (`Start / Pause / Reset`, timestamp-persisted).
  * **Horizontal Quick Actions Row (`07`):** Swipeable/3-up cards: `🤖 AI Doubt` · `📄 Formulas` · `⚡ Daily 10-Q`.
  * **Spaced Repetition Strip (`07`):** `↻ Mistake Queue · N Questions due today >` (computed live from Leitner IndexedDB store).
  * **2×2 Compact Subject Grid (`07`):** `Mathematics`, `Physics`, `Chemistry`, `FEEE` with real unit/PYQ mastery bars (`0%` on fresh install).
* **Desktop Expansion (`≥1024px` — `08`):** Expands top metrics into the 4-tile stat strip (`Streak`, `Verified PYQs /500`, `Mock Best /120`, `Mistake Queue`) above the wider Hero card and 2×2 detailed subject cards.

### Screen 2: `Learn` 42-Unit Explorer (`/learn`) — *Phone Primary: `06-learn-subjects.png`*
* **Phone Layout (`<768px`):**
  * Sticky search bar (`Search 42 units, formulas, topics...`) + filter sheet button (`Studying / Mastered / High Weightage`).
  * 4 full-width stacked subject cards with **colored left vertical accent stripes** (`06`), showing **exact official JELET-2026 unit counts** (`0/11` Maths, `0/15` Physics, `0/8` Chemistry, `0/8` FEEE). Tapping expands or navigates cleanly into the unit list (`M01–E08`) with PYQ count pills.
  * Floating **`✦ Ask AI Tutor`** pill anchored `16px` above the bottom navigation bar (`06`).
* **Desktop Expansion (`≥1024px`):** 2-column Bento grid with inline expandable unit tables.

### Screen 3: `Unit Lesson, Video Lectures & Workbook` (`/learn/:unitId`) — *Phone Primary: `05-lesson.png`*
* **Phone Layout (`<768px`):**
  * Hide bottom 5-tab bar while inside a deep lesson so the **Sticky Bottom Action Bar** (`Practise this topic (N PYQs + Booster) >` + `Mark Revised`) gets full thumb focus (`05`).
  * Top compact bar: `←` back, Unit Title (`E05 · Alternating Currents`), quick pill tabs (`Workbook` · `Videos (N)` · `Practice`), bookmark ribbon.
  * Clean single-column workbook:
    1. **Concise Theory + KaTeX Equations** with inline **`✦ Explain this step`** chip (`05`),
    2. **Mint-tinted `💡 Worked Example` Card** (`05`),
    3. **Warm Amber `⚠ WBJEEB Trap` Callout**,
    4. **Curated Free YouTube Video Lectures (`videoLectures[]`):** Zero-tracking click-to-load facade cards showing lecture title, educator/channel, language badge (`Bengali` / `English` / `Hindi`), duration, `Watched ✔` checkbox, **`▶ Watch Inside App`** (`youtube-nocookie.com` `16:9` player on tap when online), and **`↗ Open in YouTube App`** deep-link (calm offline notice when `navigator.onLine === false`).
* **Desktop Expansion (`≥1024px`):** Centered `740px` reading/video column + sticky right outline card.

### Screen 4: `Practice` Arena (`/practice`) — *Phone Primary: `04-practice-options.png`*
* **Phone Layout (`<768px`):**
  * **Top Segmented Pill Toggle (`04`):** **`Independent`** (exam rules) vs **`With assistance`** (hints + AI).
  * **Question Source Filter Chips:** `Official PYQs (2022–2026)` · `Practice Sets (Boosters & Mocks)` · `Combined`.
  * **5 Thumb-Friendly Stacked Action Cards (`04`):**
    1. **`⚡ Topic Drill`** (filter by Subject, Units `M01–E08`, and Source `PYQs / Practice Sets / Both`)
    2. **`🎯 Category-II Multi-Correct Mastery`** (dedicated partial-credit trainer across PYQs + Practice Sets)
    3. **`📚 Extra Practice Question Sets`** (Unit Booster Packs `boost-M01..E08`, Sectional Speed Sets, and Full 100-Q Original JU Ranker Mocks from `_data/practice-sets/` — built extensible so new JSON packs drop in anytime with zero UI code edits!)
    4. **`📄 Exam-Style Paper`** (full 2-hour 100-Q OMR simulation)
    5. **`↻ Spaced Mistake Queue`** (replaces mockup's non-existent *"Live Study Room"*)

### Screen 5: `Live Exam & OMR Runner` (`/exam/:sessionId`) — *Phone Primary: `11-phone-live-exam-omr.png` · Desktop: `09-live-exam-omr-runner.png`*
* **Phone Layout (`<768px` — `11`):**
  * **Row 1 (Sticky `52px` Header):** Pause/Exit arrow `←`, compact paper title, tabular mint timer pill (`01:18:42`), and solid `#0F6E66` **`OMR 48/100`** pill button.
  * **Row 2 (Sticky `44px` Strip):** Horizontal swipeable subject pills (`Maths 40`, `Physics 30`, `Chem 20`, `FEEE 10`) jumping directly to `Q1`, `Q41`, `Q71`, `Q91`.
  * **Scrollable Question Body:** `Question N of 100`, `Unit` + `Cat I (+1/-0.25)` or `Cat II (+2/Partial)` chips, stem, tap-to-zoom SVG circuit/diagram (`11`), and `48px+` full-width option cards (`A–D` radio for Cat-I, checkboxes for Cat-II) + inline `Clear choice` link when answered.
  * **Sticky Thumb Bottom Bar (`11`):** `🔖 Mark Review` · `Previous` · solid `#0F6E66` **`Save & Next`**.
  * **Slide-Up OMR Bottom Sheet (`11`):** Tapping `OMR 48/100` (or swiping up) opens a smooth rounded bottom sheet (`Question Palette · 100 Qs`) with drag handle, status counts (`Answered`, `Review`, `Left`), responsive sequential `1..100` grid, and `Submit Paper` CTA.
* **Desktop Expansion (`≥1024px` — `09`):** `Question Palette` stays permanently docked in a `320px` right column; keyboard shortcuts (`A–D`/`1–4`, `M`, `Backspace`, `←/→`) active.

### Screen 6: `Results, Solutions & CodeC AI Tutor` (`/results/:attemptId`) — *Phone Primary: `03-practice-results.png` & `12-phone-codec-ai-tutor.png` · Desktop: `10-codec-ai-tutor-and-results.png`*
* **Phone Layout (`<768px` — `03` & `12`):**
  * **Score Ring Hero:** Exact `twelfths`-formatted score (`92.25 / 120`) + **JU Historical Cutoff Band** pill (`JU CSE Safe Zone`) + expandable 4-metric & 9-step tie-breaker accordion.
  * **Filter Chips & Review Stack (`03`):** Horizontal chips (`All / Correct / Partial / Incorrect / Unattempted / Voided W`), stacked question cards expanding into full SymPy-verified steps + **`✦ Ask AI Tutor`**.
  * **CodeC AI Doubt Tutor Bottom Sheet (`12`):** Slides up to `82dvh` over the dimmed review screen with drag handle, green **`🔒 Grounded on Official WBJEEB Key & SymPy Solution`** banner, collapsible **`▸ Check prompt before sending (Local BYOK · No Server)`** preview, mobile-fitted KaTeX steps, amber **`⚠ Exam Trap`** box, swipeable chips (`Explain step 2`, `Similar PYQ`, `Explain in Bengali`), and bottom input bar.
* **Desktop Expansion (`≥1024px` — `10`):** Results scroll on the left (`62%` width) while the `AI Doubt Tutor` docks cleanly as a `400px` right panel.

### Screen 7: `Papers` Verified Library (`/papers`) — *Phone Primary: `02-papers-library.png`*
* **Phone Layout (`<768px` — `02` cleaned):**
  * Sticky search input (`Search across 500 PYQs...`) + horizontal swipeable filter pills (`All`, `2026`, `2025`, `2024`, `2023`, `2022`, `Bookmarked`, `Cat-II`).
  * 5 clean stacked paper cards (`JELET 2026` → `JELET 2022`), each showing `100 Qs · 120 Marks`, green `✔ Full Verified Key` pill, bookmark ribbon, best score, and quick-launch buttons (`2h Mock` / `Read & Keys`).

### Screen 8: `You & AI` Local Vault (`/you`) — *Phone Primary: `13-phone-you-ai-and-ju-hub.png` & `01-settings.png`*
* **Phone Layout (`<768px` — `13` & `01`):**
  * Top mint privacy lock banner (`🔒 100% Local-First on Your Phone · API key never enters backups`).
  * **Card 1 — `JU Target & Diploma CGPA Check` (`13`):** Target year/branch selector + WBSCTE CGPA input (`9.35` → `86.0% WBJEEB Equiv · JU Eligible ✔`).
  * **Card 2 — `CodeC BYOK AI Tutor` (`13`):** Provider selector (`Google Gemini` free key default), masked key (`AIza••••7xQ`), `Test Connection`, `Clear Key`, and **`Preview prompt before sending`** toggle.
  * **Card 3 — `Preferences, Activity & Offline Pack` (`01` + `13`):** `AMOLED Dark Mode` switch, `Saved Bookmarks` & `Mistake Queue` tiles, explicit opt-in `Offline Papers 2022–2026 (~3.8 MB)` download button, `Export Signed Backup (.json)`, and `Import Backup`.
