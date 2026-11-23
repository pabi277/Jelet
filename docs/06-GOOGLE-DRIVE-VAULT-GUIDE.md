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

## 2. Complete Organized Inventory Inside `05_Reference_Books_PRIVATE_NO_GITHUB/`

All **20 uploaded reference books** have been sorted, cleaned, and organized into **5 subject subfolders**:

### `05A_Mathematics_Books/` (`1yeuV4hnYBprzF0tLr9CFOUaw7wdHaRC0`)
* **`BS_Grewal_Higher_Engineering_Mathematics.pdf`** (`154.1 MB`) — Covers `M01–M03` (Rank, Eigenvalues, Cayley-Hamilton), `M08` (Partial Diff, Euler's Theorem), `M09` (ODEs). *(Note: Over the Drive connector's `100 MB` single-file download cap—split into Part 1 & Part 2 `<80 MB` each if an agent ever needs to download pages directly).*
* **`NCERT_Class11_Mathematics_Chapters_kemh1dd.zip`** (`36.1 MB`) — Covers `M04` Complex Numbers, `M05` 2D Geometry, `M10` P&C, `M11` Probability.
* **`NCERT_Class12_Mathematics_Part1_Chapters_lemh1dd.zip`** (`17.9 MB`) — Covers `M01–M02` Matrices/Determinants, `M07` Differential Calculus.
* **`NCERT_Class12_Mathematics_Part2_Chapters_lemh2dd.zip`** (`23.8 MB`) — Covers `M06` Vectors, `M07` Integrals, `M09` ODEs, `M11` Conditional Probability/Bayes.

### `05B_Physics_Books/` (`1CgUIqNHsH_SAveBSBCP_a4yaEVs8IBdX`)
* **`HC_Verma_Concepts_of_Physics_Vol1.pdf`** (`4.8 MB`) — Covers `P01–P13` (Mechanics, Rotation, Gravitation, Elasticity, Fluid/Viscosity/Surface Tension, Heat & Thermodynamics) + multi-correct *Objective-II* style.
* **`HC_Verma_Concepts_of_Physics_Vol2.pdf`** (`47.1 MB`) — Use **strictly** for `P14` (Geometrical Optics) & `P15` (Photoelectric Effect); skip Electrostatics/Magnetism in Physics.
* **`Allen_Physics_Formula_and_Theory_Ref.pdf`** (`8.5 MB`, moved from Drive root) — Rapid formula & shortcut verification.
* **`NCERT_Class11_Physics_Part1_Chapters_keph1dd.zip`** (`19.7 MB`) — `P01–P05`.
* **`NCERT_Class11_Physics_Part2_Chapters_keph2dd.zip`** (`13.8 MB`) — `P06–P13`.
* **`NCERT_Class12_Physics_Part1_FEEE_Circuits_Only_leph1dd.zip`** (`22.5 MB`) — Useful **only** for `E04/E05` DC/AC Circuits in FEEE.
* **`NCERT_Class12_Physics_Part2_Optics_Photoelectric_leph2dd.zip`** (`15.7 MB`) — `P14` Ray Optics, `P15` Dual Nature, `E06` Semiconductors.

### `05C_Chemistry_Books/` (`1pclunmO4Ej3Qr1eTKqz2Biv-6QZbhiwZ`)
* **`Jain_and_Jain_Engineering_Chemistry_Compact.pdf`** (`13.5 MB`) — Primary reference for `C06` (Metallurgy, Alloys, Portland Cement, Refractories) & `C07` (Water Hardness, EDTA, Calgon, Permutit, Boiler Troubles).
* **`Engineering_Chemistry_Full_Reference.pdf`** (`43.0 MB`) — Extended industrial & electrochemistry reference.
* **`NCERT_Class11_Chemistry_Part1_Chapters_kech1dd.zip`** (`29.2 MB`) — `C01` Atomic Structure, `C02` Bonding, `C03` Equilibrium/pH/Buffers.
* **`NCERT_Class11_Chemistry_Part2_Chapters_kech2dd.zip`** (`10.4 MB`) — `C04` Redox, `C08` GOC/IUPAC/Isomerism/Hydrocarbons.
* **`NCERT_Class12_Chemistry_Part2_Organic_lech2dd.zip`** (`20.5 MB`) — `C08` Functional Groups & Polymers. *(Optional later addition: `lech1dd.zip` for Class 12 Electrochemistry `C04` & Chemical Kinetics `C05`, though `Engineering_Chemistry` + `Jain_and_Jain` already cover both!)*

### `05D_FEEE_Electrical_Electronics_Books/` (`1VF2DauLnRw9Zk8gwEpSCPICS39z-FdAe`)
* **`VK_Mehta_Principles_of_Electronics.pdf`** (`43.7 MB`) — Covers `E06` (Diodes, Zener, BJT), `E07` (OP-AMP), `E08` (Boolean Algebra & Logic Gates). *(Optional later addition: Basic Electrical Engineering PDF for `E01–E03` Measuring Instruments, Transformers & Motors).*

### `05E_JELET_Guidebooks_Private_Ref/` (`1z4hgfBSSCN8Wyl6hj_zP1iGzymzjNVMj`)
* **`JELET_Guidebook_A_Sarkar_2022_Private_Ref.pdf`** (`38.5 MB`)
* **`JELET_Guidebook_General_Scan_Private_Ref.pdf`** (`25.5 MB`, image scan)
* **`JELET_Practice_Sets_Scan_Private_Ref.pdf`** (`7.5 MB`, image scan)
> **Warning on `05E`:** Market guidebooks often mix legacy pre-2022 topics and occasional key typos. Never copy questions or keys from `05E` into `_data/papers/`—only official WBJEEB `2022–2026` booklets belong in `_data/papers/`.
