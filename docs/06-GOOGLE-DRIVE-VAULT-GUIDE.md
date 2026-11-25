# 06 — Organized Google Drive Vault Inventory & GitHub Copyright Boundary

> **Master Drive Folder:** `JELET_2028_Master_Vault` (`1m-6gw0iBKw70uY6NayiBtl1Bld6lYFlt`)  
> **NON-NEGOTIABLE COPYRIGHT BOUNDARY:** Only folder **`00_v3_Blueprint_and_UI_Refs/`** (our original Markdown specs, `prompt.md`, `AGENTS.md`, and 13 UI reference PNGs) gets copied into the GitHub repository in **Step 0**. **ZERO PDFs, ZERO `.zip` books, ZERO coaching sheets, and ZERO files from `05_Reference_Books_PRIVATE_NO_GITHUB/` may EVER be committed to Git or deployed to GitHub Pages!**

---

## 1. GitHub Safe vs. Private-Only Boundary Table

| Drive Folder | Drive Folder ID | Allowed in GitHub Repo? | Exact Usage During Coding |
| :--- | :--- | :---: | :--- |
| **`00_v3_Blueprint_and_UI_Refs/`** | `1U68IB2ZMpl_rWAqN37rXa2SChT1XZDLB` | **YES (`Step 0` Mandatory Copy)** | Copy `100%` of these `.md` specs + `ui-v3-references/` (`1ZCNPK3lhfb-HhpSytiaj2S_2n-hvl08-`) into the repo **first** before writing any code. |
| **`01_Official_WBJEEB_Rules/`** | `1FZloPQhiONdqyWbu2FgwqqeQnHX47K0M` | **NO (Keep in `.cache/` only)** | Read locally to verify syllabus units, tie-breakers, and JU eligibility rules. |
| **`02_Official_PYQ_Booklets/`** | `1X0mUIwxxMpJ19h5GEKzYbovrM4tq-SSM` | **NO raw PDFs in Git** | Extract structured `_data/papers/2022.json`–`2026.json` & clean vector SVGs (`_data/figures/`); keep raw PDFs in untracked `.cache/`. |
| **`03_Official_Final_Answer_Keys/`** | `15aTgQ8rE5CRoBQKrM_lCMRAyN2iMqeUl` | **NO raw PDFs in Git** | Cross-verify official `Set A` keys & `"W"` voided items in `scripts/verify_corpus.py`. |
| **`04_WBSCTE_Polytechnic_Base/`** | `1uTcD_1J4b1Yb5NLxM3aMl0Z-MJPpNdIv` | **NO (Keep in `.cache/` only)** | Align unit workbooks (`_data/units/`) with WBSCTE Sem 1 & Sem 2 depth. |
| **`05_Reference_Books_PRIVATE_NO_GITHUB/`** *(Red Folder)* | `1Jsb15vIqetNmWuoWf3lI2bZ07yraycb7` | **STRICTLY FORBIDDEN ON GITHUB** | **Private study & concept-verification only.** Author `100%` original prose, original worked examples, and original SVGs—never copy textbook text/exercises/diagrams. |
| **`06_My_Notes_and_Formula_Sheets/`** | `1VbCajps_pAYi_tCFSUowsEUvptYX-B0Y` | **NO raw scans in Git** | Read your personal notes (`M01..E08`) to enrich originally written `_data/units/*.json` workbooks. |

---

## 2. Live Inventory of `05_Reference_Books_PRIVATE_NO_GITHUB/` (restructured 2026-11-25)

> **2026-11-25 restructure (owner-verified live via the Drive connector):** every
> NCERT `.zip` has been **unzipped** into a chapter folder (one PDF per chapter),
> and every large single-file PDF has been **split** into numbered
> `NNN_<book>_split_NNN.pdf` chunks of ≈ ≤ 20 MB. This removes the **size**
> constraints ("BS Grewal 154 MB exceeds the 100 MB download cap"; zips unreadable
> as binaries) — **but size is not the same as readability**: several chunked books
> are image-only scans with no text layer. See the live readability audit in §3.1
> before planning any `read_file_text` session. The copyright boundary in §1 did
> not move.

Folder: `1Jsb15vIqetNmWuoWf3lI2bZ07yraycb7` → 5 subject subfolders (subject-folder IDs unchanged):

### `05A_Mathematics_Books/` (`1yeuV4hnYBprzF0tLr9CFOUaw7wdHaRC0`)

| Item | Structure (2026-11-25) | Drive ID | Covers |
| :--- | :--- | :--- | :--- |
| `BS_Grewal_Higher_Engineering_Mathematics pdf/` | **Split folder** — 14 chunks `001…014_…_split_NNN.pdf` (3.1–12.8 MB each) + `index.pdf` (271 KB TOC). *(The original 154 MB single PDF is gone — chunks + index only.)* | `1AkrTaxAhHywMMw5J7ZIeWX0hdRDjQSUo` | `M01–M03` (Rank, Eigenvalues, Cayley-Hamilton), `M08` (Partial Diff, Euler's Theorem), `M09` (ODEs) |
| `NCERT_Class11_Mathematics_Chapters_kemh1dd unzip/` | **Chapter folder** — 19 PDFs: `kemh101–114` (14 chapters) + `kemh1a1`, `kemh1a2`, `kemh1an`, `kemh1ps`, `kemh1sm` (answers/supplementary) | `1a8HOQmZu4s3chkZzQToexu0ycWUeAd6j` | `M04` Complex Numbers, `M05` 2D Geometry, `M10` P&C, `M11` Probability |
| `NCERT_Class12_Mathematics_Part1_Chapters_lemh1dd unzip/` | 10 PDFs: `lemh101–106` (6 chapters) + `lemh1a1`, `lemh1a2`, `lemh1an`, `lemh1ps` | `13BKV4444-KXHKWogjwZxeteataKPWMGI` | `M01–M02` Matrices/Determinants, `M07` Differential Calculus |
| `NCERT_Class12_Mathematics_Part2_Chapters_lemh2dd unzip/` | 9 PDFs: `lemh201–207` (7 chapters) + `lemh2an`, `lemh2ps` | `1BfI3rOccEw2WZpDPTA9NnKtZTzGzxUw5` | `M06` Vectors, `M07` Integrals, `M09` ODEs, `M11` Conditional Probability/Bayes |

### `05B_Physics_Books/` (`1CgUIqNHsH_SAveBSBCP_a4yaEVs8IBdX`)

| Item | Structure (2026-11-25) | Drive ID | Covers |
| :--- | :--- | :--- | :--- |
| `Allen_Physics_Formula_and_Theory_Ref.pdf` | Whole PDF (8.5 MB) — moved from Drive root | `1-waei0mex2vleZyY3ly5ktdffFhBPQzE` | Rapid formula & shortcut verification (all units) |
| `HC_Verma_Concepts_of_Physics_Vol1.pdf` | Whole PDF (4.8 MB) | `1u8frtlsMfUJoyOvDX-A7FbyTwnbIQsDw` | `P01–P13` (Mechanics, Rotation, Gravitation, Elasticity, Fluids, Heat & Thermodynamics) + multi-correct *Objective-II* style |
| `HC_Verma_Concepts_of_Physics_Vol2 split pdf/` | **Split folder** — 5 chunks `001…005_…_split_NNN.pdf` (8.0–10.6 MB each) | `151VObd6BD7UpUgk-3pD6XezVF6ixGwXp` | Use **strictly** for `P14` (Geometrical Optics) & `P15` (Photoelectric Effect); skip Electrostatics/Magnetism in Physics |
| `NCERT_Class11_Physics_Part1_Chapters_keph1dd unzip/` | 10 PDFs: `keph101–107` (7 chapters) + `keph1a1`, `keph1an`, `keph1ps` | `1kJ-f9Zqv8QQ627iFiHURdYy9OWd7q9J7` | `P01–P05` |
| `NCERT_Class11_Physics_Part2_Chapters_keph2dd unzip/` | 9 PDFs: `keph201–207` (7 chapters) + `keph2an`, `keph2ps` | `17-Vp2fNbx3YknA39R6UZK7iVPsApq4AO` | `P06–P13` |
| `NCERT_Class12_Physics_Part1_FEEE_Circuits_Only_leph1dd unzip/` | 10 PDFs: `leph101–108` (full Part-1 chapter set, 8 chapters) + `leph1an`, `leph1ps` — *the folder keeps its `Circuits_Only` name but contains all of Part 1; `E04/E05` authors should target the Current-Electricity and Alternating-Current chapters (confirm on open)* | `1W_vgphxDMrCU8A1zKvyAdJM7_1UugPS0` | `E04/E05` DC/AC Circuits in FEEE |
| `NCERT_Class12_Physics_Part2_Optics_Photoelectric_leph2dd unzip/` | 8 PDFs: `leph201–206` (6 chapters) + `leph2an`, `leph2ps` | `1qNrmvTGyfx6bKlyOaKA_s35ePQaTQBY1` | `P14` Ray Optics, `P15` Dual Nature, `E06` Semiconductors |

### `05C_Chemistry_Books/` (`1pclunmO4Ej3Qr1eTKqz2Biv-6QZbhiwZ`)

| Item | Structure (2026-11-25) | Drive ID | Covers |
| :--- | :--- | :--- | :--- |
| `Jain_and_Jain_Engineering_Chemistry_Compact.pdf` | Whole PDF (13.5 MB) | `1d37kc2mAMiU9TyfH1E4xZjHQMOHh8kSC` | Primary reference for `C06` (Metallurgy, Alloys, Portland Cement, Refractories) & `C07` (Water Hardness, EDTA, Calgon, Permutit, Boiler Troubles) |
| `Engineering_Chemistry_Full_Reference.pdf` + `Engineering_Chemistry_Full_Reference split pdf/` | Whole PDF (43.0 MB) **plus** split folder — 3 chunks `001–003` (5.2–19.3 MB each) | file `1LzakMbaj310QDCIbrQNYZWs2UAD1fBsm` · folder `1utOy3ZE2USj0zf7hBoy8MMhYh64UD387` | Extended industrial & electrochemistry reference |
| `NCERT_Class11_Chemistry_Part1_Chapters_kech1dd unzip/` | 9 PDFs: `kech101–106` (6 chapters) + `kech1a1`, `kech1an`, `kech1ps` | `1dVBJ06HngFaVtMgOGp9ZyZH6ap_pO8xD` | `C01` Atomic Structure, `C02` Bonding, `C03` Equilibrium/pH/Buffers |
| `NCERT_Class11_Chemistry_Part2_Chapters_kech2dd unzip/` | 5 PDFs: `kech201–203` (3 chapters) + `kech2an`, `kech2ps` | `1UP1FI_o_TycG-uVbY11x220rhlSWO3k4` | `C04` Redox, `C08` GOC/IUPAC/Isomerism/Hydrocarbons |
| `NCERT_Class12_Chemistry_Part2_Organic_lech2dd unzip/` | 7 PDFs: `lech201–205` (5 chapters) + `lech2an`, `lech2ps` | `1lsUduRqXMq3WxeZGaTvDdHAL_gBPZEij` | `C08` Functional Groups & Polymers. *(Optional later addition: `lech1dd` for Class 12 Electrochemistry `C04` & Chemical Kinetics `C05` — `Engineering_Chemistry` + `Jain_and_Jain` already cover both.)* |

### `05D_FEEE_Electrical_Electronics_Books/` (`1VF2DauLnRw9Zk8gwEpSCPICS39z-FdAe`)

| Item | Structure (2026-11-25) | Drive ID | Covers |
| :--- | :--- | :--- | :--- |
| `VK_Mehta_Principles_of_Electronics.pdf` + `VK_Mehta_Principles_of_Electronics split pdf/` | Whole PDF (43.7 MB) **plus** split folder — 8 chunks `001–008` (4.7–6.8 MB each) | file `1Go6xJDqBfbBfi1tt4gPEtSprMq2sG2-C` · folder `1HZlbL8MXvYCIPoyiQwkO9vhlCZGojVla` | `E06` (Diodes, Zener, BJT), `E07` (OP-AMP), `E08` (Boolean Algebra & Logic Gates). *(Optional later addition: Basic Electrical Engineering PDF for `E01–E03`.)* |

### `05E_JELET_Guidebooks_Private_Ref/` (`1z4hgfBSSCN8Wyl6hj_zP1iGzymzjNVMj`)

| Item | Structure (2026-11-25) | Drive ID |
| :--- | :--- | :--- |
| `JELET_Guidebook_A_Sarkar_2022_Private_Ref.pdf` + `…split pdf/` | Whole PDF (38.5 MB) **plus** split folder — 7 chunks `001–007` (1.0–9.4 MB each) | file `1RjnNgBo6C7XiW8DKGEe-LC2-HYA4nTFP` · folder `1ZNCmcBgeHUi8bwzVKtGMmCPcfsTI4bN-` |
| `JELET_Guidebook_General_Scan_Private_Ref.pdf` + `…split pdf/` | Whole PDF (25.5 MB, image scan) **plus** split folder — 2 chunks (≈ 12.6 MB each) | file `1Ut-D1QAB6Qe82_toXXPHHX-W_3B98kXo` · folder `1QVttRJME6UH3Fm8CysPWkN_auKvIQSt9` |
| `JELET_Practice_Sets_Scan_Private_Ref.pdf` | Whole PDF (7.5 MB, image scan) | `1ulpCuaMeKjlHe1x5zSAnW4PAfsGffZKR` |

> **Warning on `05E` (unchanged):** Market guidebooks often mix legacy pre-2022 topics
> and occasional key typos. Never copy questions or keys from `05E` into
> `_data/papers/` — only official WBJEEB `2022–2026` booklets belong in `_data/papers/`.
> The split copies make the scans *browsable*, not *source-approved*: `05E` stays
> scope-only reference.

## 3. Reading Playbook for Agent Sessions (rules as of 2026-11-25)

1. **PDFs only, via `read_file_text`.** Navigate with `list_files` on the folder IDs
   above; **never** download any book into the workspace or repo (§1 boundary).
   Note the connector's **25 MB per-file extraction cap**: whole PDFs above it
   (VK Mehta 43.7 MB, Engineering Chemistry 43 MB) must be read through their
   chunk copies — all shipped chunks are ≤ ~20 MB and therefore readable.
2. **NCERT filename decoder** (mechanical — decode from the filename, then confirm
   the title by opening the PDF before citing it, per the `AGENTS.md` §2 accuracy law):
   | Filename part | Meaning |
   | :--- | :--- |
   | `ke` / `le` prefix | Class 11 / Class 12 edition textbook code |
   | `mh` / `ph` / `ch` | Mathematics / Physics / Chemistry |
   | `…1dd` / `…2dd` | Part 1 / Part 2 of the edition |
   | `…101`, `…102`, … | Chapter number = last two digits (`kemh101` = Class 11 Maths Chapter 1) |
   | `…an` | Answers |
   | `…a1`, `…a2` | Answers part 1 / 2 |
   | `…ps`, `…sm` | Supplementary material |
3. **Split books:** chunk numbers are sequential page ranges; chunk boundaries can
   cut a chapter — open the neighbouring chunk if a section is truncated mid-way.
   *(BS Grewal's shipped `index.pdf` is itself image-only — see §3.1 — so its
   chunk page-ranges must be located by opening chunks, or offline by the owner.)*
4. **Originals kept alongside chunks** for Allen (8.5 MB), HC Verma Vol-1 (4.8 MB),
   Jain & Jain (13.5 MB), Engineering Chemistry (43 MB), VK Mehta (43.7 MB) and all
   three `05E` scans — all under the connector's 100 MB cap. For the 25–44 MB scans,
   prefer the chunk copies to keep extraction windows small.
5. **`06_My_Notes_and_Formula_Sheets/`** (`1VbCajps_pAYi_tCFSUowsEUvptYX-B0Y`) is
   **still empty** (verified 2026-11-25) — reserved for the owner's own notes over
   the unit map `M01..E08`.
6. **The boundary does not move:** chunking and unzipping change *access*, not
   copyright. Zero files from this folder (whole, chunked, or extracted text) ever
   enter Git; `_data/` ships only 100% originally written content. Two vault copies
   carry third-party blogspot watermarks (BS Grewal, Jain & Jain) — another reason
   they stay fact-checking references only, never sources of shipped prose.
7. **Model the unit content wants:** the owner's chosen unit-content shape is the
   sister repo's per-unit anatomy — documented with a JELET mapping in
   [`docs/references/DIPLOMA-3RD-SEM-UNIT-SYSTEM-REFERENCE.md`](references/DIPLOMA-3RD-SEM-UNIT-SYSTEM-REFERENCE.md).

### 3.1 Verified readability audit (live `read_file_text` smoke test, 2026-11-25)

| Book / set | Sample tested | Text layer | How agents can use it |
| :--- | :--- | :---: | :--- |
| **All 10 NCERT chapter folders** | `lemh101` (Cl-12 Maths Ch.1), `kech101` (Cl-11 Chem Ch.1) | ✅ Clean | Direct `read_file_text`; same NCERT e-book pipeline for every folder |
| **HC Verma Vol-1** (whole PDF) | Title/foreword pages | ✅ Clean | Direct `read_file_text`, whole book under cap |
| **Jain & Jain Compact** | Front matter | ✅ (watermark + glyph artifacts) | Readable; strip watermark noise, treat numbers carefully |
| **Engineering Chemistry Full Reference** | Chunk 001 | ✅ Clean | Readable — *provenance note: it is a B.Tech institute course-pack (Annamacharya Inst. of Technology & Sciences, Kadapa), not the commercial textbook of the same name* |
| **BS Grewal** (14 chunks + `index.pdf`) | `index.pdf`, chunk 001, chunk 010 | ❌ Image-only (chunk 001 carries only watermark text) | Owner's eyes / offline OCR only — **not** agent-readable |
| **HC Verma Vol-2** (5 chunks) | Chunks 001 & 003 | ❌ Image-only | Owner's eyes only |
| **VK Mehta** (whole + 8 chunks) | Chunk 001 | ❌ Image-only | Owner's eyes only |
| **`05E` Sarkar / General Scan / Practice Sets** | One chunk or whole each | ❌ Image-only | Owner's eyes only (scope-only anyway per the `05E` warning) |
| **Allen Physics Formula Ref** | — | ❓ Unverified | The connector app itself errored on this file across 4 attempts (2026-11-25) — retest when the app recovers, before first real use |

**Operational consequence:** for authoring fact-bases, the agent-readable reference
set is **NCERT chapters + HC Verma Vol-1 + Jain & Jain + the Engineering-Chemistry
pack (+ Allen, once verified)**. BS Grewal, HC Verma Vol-2, VK Mehta and `05E`
remain **owner-eyes-only scans** — useful for the owner to check scope/formulas
offline, and for page-number citations the owner can confirm manually, but not
sources an agent session can read through the connector.

### 3.2 Download-then-OCR & direct page-view routes — tested 2026-11-25, verdicts

The owner asked to try **download → OCR** and **viewing the PDF pages directly**
for the image-only scans. Every agent-side route was tested or ruled out by the
tooling contract; none reaches the file bytes in this environment:

1. **`download_file` cannot hand bytes to the sandbox.** Its input schema exposes
   only `file_id` / `acknowledge_abuse` / `supports_all_drives` (no
   `return_download_url` field), so the binary comes back as base64 *in the model
   context* — there is no path from a connector result into a workspace file, and
   the sandbox's outbound hosts are allowlisted (github/npm/pypi only), so a signed
   Google URL cannot be fetched with `curl` either.
2. **`fetch_page` on Drive URLs hits the sign-in wall.** Tested live on both the
   viewer URL (`drive.google.com/file/d/<id>/view`) and a direct
   `uc?export=download&id=…` URL for BS Grewal's `index.pdf`: both redirect to
   Google sign-in because the vault is **private — and must stay private** (§1).
   Even if shared, `fetch_page` returns markdown text, not page images.
3. **Rendering pages to images needs the PDF bytes in the workspace** (blocked by
   route 1), so agent visual reading of the scans is unavailable.

**Working OCR paths — owner-side, both cheap:**

- **Drive built-in OCR (recommended — zero software):** in Drive, right-click a
  scanned PDF → **Open with Google Docs**. Google OCRs it into an editable Doc;
  park that Doc in the same vault folder and agents can read it natively
  (`export_file` / `read_file_text` handle Google Docs). OCR quality on dense math
  is imperfect but fine for fact-checking scope, formula names and page numbers.
- **Local OCR + re-upload:** `ocrmypdf --skip-text in.pdf out.pdf` (or tesseract)
  on the owner's machine, then re-upload the text-layer PDF under the same name —
  `read_file_text` then works directly.

Either way, **re-run the §3.1 smoke test on the new copy and update the matrix
before citing it**.

**Owner decision (2026-11-25): skip OCR for now.** Authoring proceeds with the
agent-readable set (§3.1); facts that exist only in the image-only scans follow
the §3.3 step-4 rule (page pointer → owner confirms offline). The two OCR paths
above stay documented here for whenever the owner wants those books agent-readable.

### 3.3 Fact-verification protocol (the north star — owner restated 2026-11-25)

The owner's goal, verbatim in spirit: *"I don't want the PDFs really — I just want
every information written in the website to be 100% true and exam relevant."* The
vault exists to **verify** content, never to supply it. Per fact that goes into
`_data/`:

1. **Locate** it in an agent-readable reference (§3.1 matrix) — or in the unit's
   own existing formula/PYQ corpus (2022–2026 papers already in `_data/`).
2. **Record** the source (book + chapter/page) in the phase evidence file.
3. **Cross-check** against a second independent source (corpus, NCERT, or a
   standard relationship) — math additionally passes the SymPy gate.
4. **Scan-only facts** (BS Grewal / HCV Vol-2 / VK Mehta / `05E`): leave a page
   pointer for the owner to confirm — or wait until an OCR copy exists (§3.2).
   Never ship an unconfirmed fact.
5. **Ship only originally-written wording** (`AGENTS.md` §5.2); exam-relevance is
   guaranteed by mapping every claim to the unit's canonical syllabus scope
   (`docs/01` registry) and its PYQ evidence (`pyqIds`).

