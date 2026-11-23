# Super-Detailed UI Reference Prompts — Phone-First Primary (`UI-REFERENCE-PROMPTS.md`)

Because **JELET Study Hub (v3)** is **Phone-First (`360px–430px` portrait primary)**, always use **Part 1 (Phone-First `9:19.5` Master Prefix + Screen Prompts)** first whenever generating new reference screens. Part 2 provides the matching Desktop (`16:10`) progressive-enhancement prefix when needed.

---

## Part 1: Phone-First Modern Web Prompts (`9:19.5` Portrait — PRIMARY)

Always copy the **Master Phone-First Style-Lock Prefix** below first, then paste any Phone Screen Block right after it:

### Master Phone-First Style-Lock Prefix (Copy First)
```text
High-resolution vertical smartphone web application UI screenshot (9:19.5 portrait mobile viewport, flat crisp edge-to-edge full-bleed mobile interface with ZERO outer hardware phone bezel, ZERO iPhone notch/Dynamic Island, and ZERO fake 9:41 status bar). Product: "JELET Study Hub". Phone-first minimalist academic PWA aesthetic: cool alabaster background (#F6F8F8), pure white rounded cards (#FFFFFF) with 1px hairline border (#E2EBEA) and soft subtle elevation, deep emerald-teal primary accent (#0F6E66), soft mint selection fill (#E0F2F0), primary slate-black text (#0F172A), secondary muted slate (#475569). Typography: clean geometric sans-serif (Inter, 16px comfortable mobile reading size), tabular monospace (JetBrains Mono) for timers/marks/numbers, crisp mobile-fitted LaTeX math equations with zero horizontal clipping. Generous 48px thumb-friendly tap targets, authentic West Bengal WBJEEB JELET engineering content, zero gibberish text.
```

---

### Phone Prompt P1 — `AMOLED Dark Mode` Phone Today Dashboard (`/`)
*(Replace the light color sentence in the Prefix with AMOLED dark tokens, or copy this standalone complete prompt:)*
```text
High-resolution vertical smartphone web application UI screenshot in sleek AMOLED DARK MODE (9:19.5 portrait mobile viewport, flat full-bleed interface, zero hardware phone bezel, zero fake status bar). Product: "JELET Study Hub". Phone-first dark tokens: true obsidian-teal AMOLED background (#070C0C), elevated dark slate cards (#101919) with crisp 1px borders (#1E302F), luminous emerald-teal accent (#22A89B), crisp off-white text (#ECF4F3), muted slate (#9BB0AE). Top compact mobile header: "JELET Study Hub" with glowing teal pill "Target JU · 2028" and flame badge "12d". Hero card in rich dark emerald gradient (#0B3834 to #115E57) showing left column "CONTINUE · Unit M01 Matrices & Rank · 65%" with white pill button "Resume", and right column circular progress ring "25:00 Focus Timer" with "Start" pill. Below: 3 compact quick-action chips ("AI Doubt", "42 Formulas", "Daily 10-Q"), a single-row card "Mistake Queue · 6 PYQs due today >", and a 2x2 mobile subject grid ("Mathematics 50m", "Physics 35m", "Chemistry 25m", "FEEE 10m") with glowing pastel-tinted dark icons and progress bars. Fixed bottom 5-tab mobile navigation bar ("Today" active in #22A89B, "Learn", "Practice", "Papers", "You"). WCAG AAA contrast, zero gibberish.
```

### Phone Prompt P2 — Phone `Category-II Multi-Correct` Exam Question (`/exam`)
```text
Top sticky 52px mobile exam bar: back arrow, "JELET 2025 · Paper I", mint monospace timer pill "01:42:15", and solid #0F6E66 pill "OMR 34/100". Below it, horizontal swipeable subject pills ("Maths 40" active in #0F6E66, "Physics 30", "Chem 20", "FEEE 10"). Main white mobile question card: header "Question 34 of 100", chips "M01 · Matrices" and amber-tinted badge "Category II · +2 Marks · Partial 2×(c/C) · 0 Neg". Compact mint helper banner: "Multi-correct: select 1 or more options. Zero wrong picks = proportional partial credit." Crisp math stem: "Let A be a 3x3 real orthogonal matrix with det(A) = -1. Which of the following statements are necessarily true?" Four tall 52px thumb-friendly option cards A, B, C, D using rounded CHECKBOXES instead of radio circles: Option A ("λ = -1 is an eigenvalue of A") checked in solid #0F6E66 with #E0F2F0 mint card fill; Option B unchecked; Option C ("A transpose equals A inverse") checked in solid #0F6E66 with #E0F2F0 mint card fill; Option D unchecked. Sticky bottom thumb bar with 3 buttons: "Mark Review", "Previous", and solid #0F6E66 "Save & Next".
```

### Phone Prompt P3 — Phone `Learn` Expanded Unit List (`M01–M11`) (`/learn`)
```text
Sticky mobile top header "Learn · 42 Official Units" with search bar "Search 42 units, formulas, eigenvalues..." and horizontal filter chips ("All 42" active in #0F6E66, "High Weightage", "Studying (5)", "Mastered (12)"). Expanded subject card for "Mathematics · 11 Units · 40 Qs · 50 Marks" featuring an emerald left vertical stripe and clean tappable mobile unit rows: "M01 · Matrices up to Order 3 (16 PYQs · Mastered)", "M02 · Determinants & Cramer's Rule (12 PYQs · Studying)", "M03 · Eigenvalues & Cayley-Hamilton (14 PYQs · High Weight)", "M04 · Complex Numbers & De Moivre (9 PYQs)", "M08 · Partial Differentiation & Euler's Theorem (11 PYQs)". Below, collapsed cards for "Physics (15 Units · 35 Marks)", "Chemistry (8 Units · 25 Marks)", and "FEEE (8 Units · 10 Marks)". Floating #0F6E66 pill button "✦ Ask AI Tutor" above the fixed 5-tab bottom navigation bar ("Today", "Learn" active, "Practice", "Papers", "You").
```

### Phone Prompt P4 — Phone `Formula Sheet & Quick Revision` Card View (`/formulas`)
```text
Compact sticky mobile header: back arrow, title "42-Unit Rapid Formula Sheets", subject filter pills ("Maths" active in #0F6E66, "Physics", "Chem", "FEEE"), and bookmark filter icon. Stacked crisp mobile formula cards optimized for narrow phone screens: Card 1 "M01 & M03 · Matrix & Eigenvalue Identities" showing 3 clean gray rounded LaTeX blocks ("sum of eigenvalues = tr(A)", "product of eigenvalues = det(A)", "det(kA) = k^n det(A)  [Order n trap!]") with small teal chip "✦ Ask AI"; Card 2 "M08 · Homogeneous Function (Euler's Theorem)" showing crisp LaTeX "x (df/dx) + y (df/dy) = n * f" and mint shortcut note "Exam Shortcut: Check degree n = deg(Num) - deg(Den) in 5 seconds". Sticky bottom button "Drill 10 Formula PYQs >".
```

### Phone Prompt P5 — Phone `Verified Papers Library (2022–2026)` (`/papers`)
```text
Header "Papers" with subtitle "500 Verbatim Questions · 100% SVG Diagrams Restored". Sticky search input "Search inside 2022–2026 papers..." and swipeable pills ("All 5" active in #0F6E66, "2026", "2025", "2024", "2023", "2022", "Bookmarked"). Five clean stacked mobile paper cards newest-first: "JELET 2026 · Paper I", "JELET 2025 · Paper I", "JELET 2024 · Paper I", "JELET 2023 · Paper I", and "JELET 2022 · Paper I". Each card shows "100 Qs · 120 Marks · 2h", green pill "✔ 100/100 Verified Key", best score chip ("Best: 92.25/120"), bookmark icon, and two compact thumb buttons ("Read & Key" outline, "Start Mock" solid #0F6E66). Fixed 5-tab bottom bar with "Papers" active in #0F6E66.
```

### Phone Prompt P6 — Phone `CodeC "Before You Ask" One-Time AI Consent` Sheet
```text
Mobile Lesson screen softly dimmed in background. Rising from bottom is a clean rounded white Bottom Sheet titled "✦ Before You Ask AI Tutor" with subtitle "CodeC Local-First BYOK Privacy Contract". Inside, 4 concise icon-bullet rows: (1) Shield icon: "Study companion, grounded strictly on official WBJEEB keys & SymPy solutions"; (2) Key icon: "Your own Gemini/Groq API key — stored locally on your phone, zero middleman server"; (3) Eye icon: "Full transparency — inspect the exact prompt payload before sending"; (4) Check icon: "Honest stats — mid-question hints mark that item Assisted so Independent Accuracy stays pure." Full-width solid #0F6E66 button at bottom: "I Understand — Open AI Tutor".
```

---

## Part 2: Desktop Progressive-Enhancement Prefix (`16:10` — SECONDARY)

Only use this prefix when testing how a Phone-First screen expands at `@media (min-width: 1024px)`:

```text
High-resolution modern desktop web application UI screenshot (16:10 widescreen viewport, flat full-bleed interface with zero laptop bezel and zero browser window bar). Product: "JELET Study Hub". Progressive desktop expansion of the Phone-First design system: cool alabaster canvas (#F6F8F8), pure white cards (#FFFFFF) with 1px borders (#E2EBEA), deep emerald-teal accent (#0F6E66), Inter + JetBrains Mono + LaTeX math typography, and a 240px left vertical navigation rail ("Today", "Learn", "Practice", "Papers", "You & AI", plus bottom "Dark Mode" switch) replacing the mobile bottom tab bar.
```
