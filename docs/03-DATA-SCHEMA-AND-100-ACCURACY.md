# 03 — Data Schema, IndexedDB Storage & 100%-Accuracy Pipeline

> **Core Rule:** `_data/` is the immutable, build-verified knowledge base. If a single question lacks verbatim PDF verification, four valid options (or figure options), an existing SVG diagram (when referenced), a `unitId` in the 42-unit registry, or a verified solution, `scripts/verify_corpus.py` exits non-zero and blocks release.

---

## 1. Official WBJEEB Source Registry (`2022–2026`)

| Paper ID | Exam Year | Official WBJEEB Booklet PDF & Final Answer Key PDF | Booklet Series | Total Qs | Total Marks | Key Tier |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| `jelet-2026` | `2026` | Booklet: Owner-supplied Official JELET-2026 Paper-I PDF (`13 Jun 2026`) · Final Key (`JEEB/Reg-96/26`, `13-07-2026`): `https://cdnbbsr.s3waas.gov.in/s3d2a27e83d429f0dcae6b937cf440aeb1/uploads/2026/07/20260713755039688.pdf` | `Set A` | `100` | `120` | `"official"` |
| `jelet-2025` | `2025` | Booklet: `https://cdnbbsr.s3waas.gov.in/s3d2a27e83d429f0dcae6b937cf440aeb1/uploads/2025/12/202512161802442791.pdf` · Final Key (`JEEB/Reg-171/25`, `16-11-2025`): `https://cdnbbsr.s3waas.gov.in/s3d2a27e83d429f0dcae6b937cf440aeb1/uploads/2025/11/202511162064778225.pdf` | `Set A` | `100` | `120` | `"official"` |
| `jelet-2024` | `2024` | Booklet: `https://cdnbbsr.s3waas.gov.in/s3d2a27e83d429f0dcae6b937cf440aeb1/uploads/2024/12/2024120234.pdf` · Final Key (`WBE/Ex-71`, `01-08-2024`): `https://cdnbbsr.s3waas.gov.in/s3d2a27e83d429f0dcae6b937cf440aeb1/uploads/2024/08/2024080190.pdf` | `Set A` | `100` | `120` | `"official"` |
| `jelet-2023` | `2023` | Booklet: `https://cdnbbsr.s3waas.gov.in/s3d2a27e83d429f0dcae6b937cf440aeb1/uploads/2023/11/2023111575-2.pdf` · Final Key (`JEEB/Reg-267/23`, `03-08-2023`): `https://cdnbbsr.s3waas.gov.in/s3d2a27e83d429f0dcae6b937cf440aeb1/uploads/2024/01/2024013028.pdf` | `Set A` | `100` | `120` | `"official"` |
| `jelet-2022` | `2022` | Booklet: `https://cdnbbsr.s3waas.gov.in/s3d2a27e83d429f0dcae6b937cf440aeb1/uploads/2023/11/2023111591-3.pdf` · Dual-Solver + SymPy-Verified Complete Key | `Set A` | `100` | `120` | `"verified-derived"` |

---

## 2. Canonical `_data/` JSON Schemas

### 2.1 Master Dataset Manifest (`_data/manifest.json`)

```json
{
  "schemaVersion": "3.0.0",
  "generatedAt": "2026-11-23T00:00:00Z",
  "syllabusBulletinRef": "WBJEEB JELET-2026 Information Bulletin (2026-03-18)",
  "totals": {
    "papers": 5,
    "questions": 500,
    "markableQuestions": 500,
    "unmarkableQuestions": 0,
    "units": 42
  },
  "papers": [
    {
      "paperId": "jelet-2025",
      "year": 2025,
      "title": "JELET 2025 · Paper I",
      "examDate": "2025-10-18",
      "durationMinutes": 120,
      "maxMarks": 120,
      "maxTwelfths": 1440,
      "questionCount": 100,
      "voidedQuestions": [41, 79, 84],
      "keyTier": "official",
      "keyDocumentRef": "JEEB/Reg-171/25",
      "bookletSeries": "A",
      "officialPdfSha256": "<64-hex-sha256>",
      "dataFile": "./_data/papers/2025.json",
      "solutionsFile": "./_data/solutions/2025.solutions.json",
      "packBytesEstimate": 420000
    }
  ]
}
```

### 2.2 Paper & Question Schema (`_data/papers/<year>.json`)

Every question has a globally immutable ID `jelet-<year>-q<001..100>`:

```json
{
  "paperId": "jelet-2025",
  "year": 2025,
  "bookletSeries": "A",
  "sections": [
    { "subjectId": "MATH", "title": "Mathematics", "qStart": 1, "qEnd": 40, "cat1Range": [1, 30], "cat2Range": [31, 40], "maxMarks": 50 },
    { "subjectId": "PHYS", "title": "Physics", "qStart": 41, "qEnd": 70, "cat1Range": [41, 65], "cat2Range": [66, 70], "maxMarks": 35 },
    { "subjectId": "CHEM", "title": "Chemistry", "qStart": 71, "qEnd": 90, "cat1Range": [71, 85], "cat2Range": [86, 90], "maxMarks": 25 },
    { "subjectId": "FEEE", "title": "Fundamentals of Electrical & Electronics Engineering", "qStart": 91, "qEnd": 100, "cat1Range": [91, 100], "cat2Range": null, "maxMarks": 10 }
  ],
  "questions": [
    {
      "id": "jelet-2025-q001",
      "qNumber": 1,
      "subjectId": "MATH",
      "unitId": "M03",
      "category": 1,
      "fullTwelfths": 12,
      "negativeTwelfths": 3,
      "pdfPage": 3,
      "stemLatex": "Let $Z$ be a complex number such that $Z^4 - Z^3 + 2Z^2 - Z + 1 = 0$. Then the value of $|Z|$ is",
      "stemFigure": null,
      "options": [
        { "id": "A", "latex": "$\\dfrac{1}{4}$", "figure": null },
        { "id": "B", "latex": "$\\dfrac{1}{2}$", "figure": null },
        { "id": "C", "latex": "$\\dfrac{3}{4}$", "figure": null },
        { "id": "D", "latex": "$1$", "figure": null }
      ],
      "key": {
        "status": "active",
        "correct": ["D"],
        "keyTier": "official",
        "sourceRef": "JEEB/Reg-171/25 (Set A, Q1)"
      },
      "difficulty": "medium",
      "tags": ["complex-modulus", "reciprocal-polynomial", "roots-of-unity"]
    }
  ]
}
```

* **Figure Representation (`stemFigure` or `options[i].figure`):**
  ```json
  {
    "src": "./_data/figures/2025/q094-stem.svg",
    "alt": "Wheatstone bridge with 2 ohm, 3 ohm, 4 ohm, and 6 ohm arms and a 5 ohm central galvanometer resistor connected across a 10 V DC source",
    "width": 420,
    "height": 220,
    "themeAdaptive": true
  }
  ```
  *SVG Rule:* All figure SVGs MUST use `currentColor` for primary strokes/labels and CSS custom property fallbacks (`var(--brand-primary, #0F6E66)`) for highlighted currents/vectors so they invert cleanly in Dark Mode without ugly white JPEG boxes!

### 2.3 SymPy-Verified Solution Schema (`_data/solutions/<year>.solutions.json`)

Kept in a separate lazy-loaded JSON per year so launching a timed mock doesn't download solution prose until submission (and prevents casual DOM inspection during Independent mocks):

```json
{
  "paperId": "jelet-2025",
  "solutions": {
    "jelet-2025-q001": {
      "conceptSummary": "Factorize the quartic by grouping symmetric reciprocal terms or testing $|Z|=1$.",
      "steps": [
        {
          "stepNumber": 1,
          "title": "Group terms to expose common quadratic factors",
          "bodyLatex": "$Z^4 - Z^3 + 2Z^2 - Z + 1 = (Z^4 + Z^2) + (Z^2 + 1) - Z(Z^2 + 1) = (Z^2 + 1)(Z^2 - Z + 1) = 0$."
        },
        {
          "stepNumber": 2,
          "title": "Evaluate modulus of roots of each quadratic factor",
          "bodyLatex": "Either $Z^2 + 1 = 0 \\implies Z = \\pm i \\implies |Z| = 1$, or $Z^2 - Z + 1 = 0 \\implies Z = -\\omega, -\\omega^2 \\implies |Z| = 1$."
        }
      ],
      "optionTraps": {
        "B": "Common guess from misreading the coefficient 2 as a scale factor on roots."
      },
      "verification": {
        "method": "sympy",
        "scriptId": "verify_2025_q001",
        "verifiedAt": "2026-11-23"
      }
    }
  }
}
```

### 2.4 Unit Lesson & Workbook Schema (`_data/units/<unitId>.json`)

All **42 files** (`M01.json` through `E08.json`) follow one consistent schema:

```json
{
  "unitId": "M01",
  "subjectId": "MATH",
  "officialCode": "Math-A",
  "title": "Matrices up to Order 3",
  "estimatedMinutes": 35,
  "examFrequency": "high",
  "pyqIds": ["jelet-2025-q002", "jelet-2025-q003", "jelet-2025-q021"],
  "sections": [
    {
      "anchor": "types-and-transpose",
      "heading": "1. Symmetric, Skew-Symmetric & Orthogonal Properties",
      "proseLatex": "For any square matrix $A$, $A = \\frac{1}{2}(A + A^T) + \\frac{1}{2}(A - A^T)$...",
      "keyFormulas": [
        {
          "formulaId": "M01-F01",
          "label": "Commutator of Symmetric Matrices",
          "latex": "A^T = A,\\; B^T = B \\implies (AB - BA)^T = -(AB - BA) \\text{ (Skew-symmetric)}",
          "aiExplainContext": "Prove step-by-step using transpose reversal law (AB)^T = B^T A^T."
        }
      ]
    }
  ],
  "workedExamples": [
    {
      "exampleId": "M01-EX01",
      "problemLatex": "If $A = \\begin{bmatrix} 1 & 2 \\\\ 3 & 5 \\end{bmatrix}$, evaluate $|A^{2009} - 5A^{2008}|$.",
      "stepsLatex": [
        "Factor out $A^{2008}$: $|A^{2008}(A - 5I)| = |A|^{2008} \\cdot |A - 5I|$.",
        "Compute $|A| = 5 - 6 = -1$, so $(-1)^{2008} = +1$.",
        "Compute $A - 5I = \\begin{bmatrix} -4 & 2 \\\\ 3 & 0 \\end{bmatrix} \\implies |A - 5I| = 0 - 6 = -6$."
      ],
      "answerLatex": "$-6$"
    }
  ],
  "wbjeebTraps": [
    "Scalar determinant trap: $|kA| = k^n |A|$ where $n$ is matrix order ($n=3 \\implies k^3|A|$, NOT $k|A|$!).",
    "Odd-order skew-symmetric determinant is ALWAYS 0; even-order is a non-negative perfect square."
  ],
  "videoLectures": [
    {
      "videoId": "dQw4w9WgXcQ",
      "title": "Matrices Rank, Eigenvalues & Cayley-Hamilton One-Shot for JELET",
      "channelName": "Your Personal Teacher",
      "language": "bn",
      "durationMinutes": 48,
      "startSeconds": 65,
      "scopeNote": "Covers Symmetric/Skew-Symmetric, Orthogonal Matrices & Rank shortcuts."
    }
  ],
  "practiceSetIds": ["boost-M01"]
}
```

> **YouTube Facade & Offline Law (`videoLectures[]`):**
> 1. **Zero Auto-Iframe Load:** Never mount a third-party `<iframe>` on page load (saves mobile data, preserves local-first privacy, and prevents offline console errors). Render a static facade card first (`Title`, `Channel`, `Language: Bengali / English / Hindi`, `Duration`, `Watched ✔` toggle).
> 2. **Dual Phone-First Actions:** (a) **`▶ Watch Inside App`** mounts `https://www.youtube-nocookie.com/embed/{videoId}?start={startSeconds}&rel=0` on tap when `navigator.onLine === true`; (b) **`↗ Open in YouTube App`** opens `https://youtu.be/{videoId}?t={startSeconds}` directly in the native Android YouTube app (`2x` speed / background / saved offline). When `navigator.onLine === false`, display a calm offline pill with zero broken frames.
> 3. **Verified Live Links:** `scripts/verify_corpus.py` validates non-empty `videoId` (`11`-char ID) and optional oEmbed `HTTP 200` reachability during authoring.

### 2.5 Extensible Practice Question Sets Schema (`_data/practice-sets/<setId>.json`)

To let you add **unlimited extra practice sets later** (Unit Boosters, Sectional Drills, and Full 100-Q JU Ranker Mocks) **without ever polluting official WBJEEB PYQ statistics**, practice sets live in `_data/practice-sets/` and are indexed in `_data/manifest.json` (`practiceSets: [...]`):

```json
{
  "setId": "boost-M01",
  "sourceType": "curated-practice",
  "setKind": "unit-booster",
  "title": "M01 · Matrices & Rank High-Yield Booster Set",
  "subjectIds": ["MATH"],
  "unitIds": ["M01"],
  "questionCount": 20,
  "maxTwelfths": 300,
  "recommendedMinutes": 25,
  "authoringNote": "100% originally authored & SymPy-verified JELET-pattern questions (15 Cat-I + 5 Cat-II). Zero copied textbook items.",
  "questions": [
    {
      "id": "prac-boost-M01-q001",
      "qNumber": 1,
      "sourceType": "curated-practice",
      "subjectId": "MATH",
      "unitId": "M01",
      "category": 2,
      "fullTwelfths": 24,
      "negativeTwelfths": 0,
      "stemLatex": "Let $A$ be a $3 \\times 3$ real orthogonal matrix with $\\det(A) = -1$. Which of the following statements are necessarily true?",
      "stemFigure": null,
      "options": [
        { "id": "A", "latex": "$\\lambda = -1$ is an eigenvalue of $A$", "figure": null },
        { "id": "B", "latex": "$\\det(A + I_3) = 0$", "figure": null },
        { "id": "C", "latex": "$A^T = -A^{-1}$", "figure": null },
        { "id": "D", "latex": "$\\operatorname{rank}(A) = 3$", "figure": null }
      ],
      "key": {
        "status": "active",
        "correct": ["A", "B", "D"],
        "keyTier": "sympy-verified-original",
        "sourceRef": "Original SymPy-Verified Practice Item (verify_prac_M01_q001)"
      },
      "difficulty": "hard",
      "tags": ["orthogonal-matrix", "eigenvalues", "category-2"]
    }
  ]
}
```
* Companion worked solutions live in `_data/solutions/practice-<setId>.solutions.json` using the exact same schema as `2.3`.
* **Zero-Code Extensibility:** Dropping a new `<setId>.json` + `<setId>.solutions.json` and adding one metadata entry to `_data/manifest.json` (`practiceSets[]`) automatically exposes that set inside **`Practice` (`/practice`)**, **`Unit Lesson` (`/learn/:unitId`)**, and the **Mistake Queue**—while keeping `Papers` (`/papers`) and `Official PYQs Practiced (/500)` strictly reserved for genuine WBJEEB papers!

---

## 3. The 4-Gate 100%-Accuracy Pipeline (`scripts/`)

Before any paper or unit enters `main`, two offline Python scripts verify mathematical and textual truth:

1. **Gate 1 — Official PDF Page Rendering & Verbatim Diff:**
   * Render official WBJEEB PDF pages at `300 DPI` using `PyMuPDF` (`fitz`).
   * Verify `qNumber` (`1..100`), `category` (`1` vs `2`), stem equations, and all 4 options word-for-word against the official `Set A` PDF.
2. **Gate 2 — Complete SVG Diagram Coverage (`0` Missing Figures):**
   * `verify_corpus.py` scans stems and options for visual references (`"shown below"`, `"figure"`, `"circuit"`, `"graph"`, `"diagram"`, `"bridge"`, `"following gate"`) AND checks every `figure.src` file on disk, verifying valid XML, `viewBox`, and `alt` text.
3. **Gate 3 — Key & `SymPy` Mathematical Proof (`scripts/verify_solutions_sympy.py`):**
   * Every Calculus, Algebra, Matrix, Determinant, Vector, ODE, Probability, Physics numerical, Stoichiometry/pH/Faraday, and KCL/KVL/OP-AMP/Boolean question has a deterministic Python assertion in `verify_solutions_sympy.py` confirming that the step-by-step derivation evaluates **exactly** to the keyed option(s) (and for Category-II, tests **all 4 options `A, B, C, D` individually** so multi-correct truths are never missed!).
4. **Gate 4 — Referential Integrity & KaTeX Parse Check:**
   * Compile every `stemLatex`, `options[].latex`, and unit `latex` string through `katex.renderToString(..., { throwOnError: true })` during validation—**0 malformed LaTeX strings can ever ship**.

---

## 4. Client Storage Architecture (`IndexedDB: jelet_hub_v1`)

### 4.1 Object Stores

| Store Name | Key Path | Indexes | Contents |
| :--- | :--- | :--- | :--- |
| `meta` | `key` | — | Schema version, profile (`name`, `targetYear`, `category`, `diplomaCgpa`, `examDate`), theme, roadmap cursor, Pomodoro state |
| `sessions` | `sessionId` | `status`, `updatedAt` | In-progress (unsubmitted) mocks & drills: remaining timer ms, current Q index, `responses` map (`qId → ["A","C"]`), `markedForReview` set |
| `attempts` | `attemptId` | `paperId`, `mode`, `submittedAt` | **Immutable** submitted results: `mode` (`"independent"` vs `"assisted"`), `totalTwelfths`, `tieBreakVector`, per-question outcomes |
| `questionStats` | `questionId` | `sourceType`, `unitId`, `leitnerBox`, `nextReviewAt` | Per-question independent attempts (`sourceType: "official-pyq" \| "curated-practice"`), last outcome, Leitner box (`0..4`), next review timestamp |
| `unitProgress` | `unitId` | `status`, `updatedAt` | `status` (`"unstarted" \| "studying" \| "revised"`), `watchedVideoIds[]`, scroll resume anchor, last visited timestamp |
| `bookmarksNotes` | `targetId` | `type`, `updatedAt` | User bookmarks (question or unit) + plain-text personal study notes |

*(Security Isolation: The BYOK AI key NEVER touches `jelet_hub_v1`. It lives in its own isolated key `jelet_ai_vault_v1` so backup exports can never leak an API key!)*

### 4.2 Multi-Tab Sync & Signed Backup Envelope
* **Multi-Tab Safety:** A `BroadcastChannel("jelet_hub_sync")` notifies sibling tabs whenever `meta`, `bookmarksNotes`, `unitProgress`, or `attempts` mutate so two open tabs never clobber each other.
* **Backup Envelope (`jelet-study-backup-v1.json`):**
  * Contains `envelopeVersion: 1`, `exportedAt`, `appVersion`, `sha256Checksum` (Web Crypto `SHA-256` over canonicalized payload), and stores (`meta`, `attempts`, `questionStats`, `unitProgress`, `bookmarksNotes`).
  * Import supports two explicit modes with a diff preview modal before committing:
    1. **Deterministic Merge (Default):** Unions `attempts`, keeps newer `updatedAt` on notes/unit status, recomputes `questionStats` & streaks cleanly.
    2. **Full Replace:** Saves an automatic pre-replace recovery snapshot first, requires typed `"REPLACE"` confirmation, and swaps stores atomically inside a single IndexedDB transaction.
