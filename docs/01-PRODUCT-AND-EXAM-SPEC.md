# 01 — Product & Official JELET Exam Specification (`2022–2026`)

> **Authoritative Sources:** WBJEEB Official JELET-2025 & JELET-2026 Information Bulletins, WBJEEB JELET-2026 E-Counselling Notification (`WBE/EX-57/2026`, dated `25-08-2026`), and Official WBJEEB Opening-Closing Rank (OR-CR) & Seat Matrix Publications (`2023–2026`).

---

## 1. Target Learner & Product Mission

* **Primary Persona:** West Bengal Polytechnic Diploma student (e.g., APC Ray Polytechnic CST, 3rd–6th Semester) targeting a **Top-15 General Merit Rank (GMR)** in WBJEEB JELET for lateral-entry admission into **2nd Year (3rd Semester) B.E./B.Tech at Jadavpur University (JU)**.
* **Core Pedagogical Problem Solved:** Engineering Diploma students only study Mathematics, Applied Physics, Applied Chemistry, and FEEE in **1st Year (Semesters 1 & 2)**. In Semesters 3–6, their coursework shifts entirely to branch subjects (e.g., C, Python, DSA, COA, OS, DBMS for CST), which carry **0 marks** in JELET.
* **Product Loop:**
  1. **Learn (`42 Units`):** Revise crisp, diploma-to-JELET bridged formulas, worked examples, and WBJEEB option traps.
  2. **Drill (`Topic Practice`):** Solve verified PYQs (`2022–2026`) mapped to that exact unit—either **Independently** (counts toward true accuracy) or **With Assistance** (hints/formulas/AI Tutor unlocked, tracked separately).
  3. **Rehearse (`Full 2-Hour Timed OMR Mock`):** Sit full 100-question, 120-mark papers with real Category-I & Category-II OMR rules and printable OMR sheet support.
  4. **Diagnose & Retain (`Results + Leitner Queue + AI Tutor`):** Inspect exact rational scores, negative-mark bleed, JU cutoff safety band, 9-step tie-breaker metrics, and spaced-repetition mistake reviews.

---

## 2. Official JELET Paper-I Structure (`2022–2026` Pattern)

* **Conducting Body:** West Bengal Joint Entrance Examinations Board (WBJEEB)
* **Paper:** Paper-I (for Diploma in Engineering/Technology, B.Sc., D.Voc., B.Voc.)
* **Mode & Medium:** Offline OMR (Pen & Paper, black/blue ballpoint pen), **English only**
* **Duration:** **120 Minutes (2 Hours)**, single annual session (`11:00 AM – 1:00 PM`), no sectional time lock

| Section Order | Subject | Booklet Q Range | Category-I Qs *(1 Mark, −¼ Neg)* | Category-II Qs *(2 Marks, 0 Neg, Partial)* | Total Questions | Total Marks | Weightage |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **Mathematics** | `Q1 – Q40` | 30 (`Q1–Q30`) | 10 (`Q31–Q40`) | **40** | **50** | **41.67%** |
| **2** | **Physics** | `Q41 – Q70` | 25 (`Q41–Q65`) | 5 (`Q66–Q70`) | **30** | **35** | **29.17%** |
| **3** | **Chemistry** | `Q71 – Q90` | 15 (`Q71–Q85`) | 5 (`Q86–Q90`) | **20** | **25** | **20.83%** |
| **4** | **Fundamentals of Electrical & Electronics Engg. (FEEE)** | `Q91 – Q100` | 10 (`Q91–Q100`) | 0 (`—`) | **10** | **10** | **8.33%** |
| **Total** | **All 4 Subjects** | **`Q1 – Q100`** | **80** | **20** | **100** | **120** | **100.0%** |

*(Note: Individual year papers must store each question's exact `category` (`1` or `2`) from the booklet header, as earlier years like 2022 verify exact category ranges per booklet section.)*

---

## 3. Exact `1/12`-Mark Integer Scoring Specification (Zero Float Drift)

Why `1/12`? Category-I deducts `1/4` mark, while Category-II awards `2 × (c / C)` where the total number of correct options `C` can be `1, 2, 3, or 4`. When `C = 3` and `c = 1`, the official score is `2/3` mark (`0.6666...`). Since `LCM(1, 2, 3, 4) = 12`, **every possible JELET question score and total score is an exact integer multiple of `1/12` mark (`twelfths`)**:

* **`1 Full Mark = 12 twelfths`**
* **`Maximum Paper Score = 120 Marks = 1,440 twelfths`**

### 3.1 Per-Question Scoring Function

Let `selected ⊆ {"A","B","C","D"}` be the user's chosen set of options, and `key` be the official answer record:

1. **Board-Voided / Withdrawn Question (`key.status === "voided"`, published by WBJEEB as `"W"`):**
   * Regardless of whether the candidate attempted the question or left it blank, WBJEEB awards full marks to all candidates:
   * Category-I voided: **`+12` twelfths (`+1.00` mark)**
   * Category-II voided: **`+24` twelfths (`+2.00` marks)**
   * Outcome state: `"voided_awarded"` (never counted as a user mistake or negative mark).

2. **Category-I Question (`key.correct` has exactly `1` option, full marks = `12` twelfths):**
   * `selected.size === 0` → **`0` twelfths** (`"unattempted"`)
   * `selected.size === 1 && selected.has(key.correct[0])` → **`+12` twelfths (`+1.00`)** (`"correct"`)
   * `selected.size > 1` (multiple bubbles darkened on OMR, even if one is right) OR wrong single option → **`-3` twelfths (`-0.25`)** (`"incorrect"`, contributes `3` twelfths to negative-mark tally).

3. **Category-II Question (`key.correct` has `C` options where `1 ≤ C ≤ 4`, full marks = `24` twelfths):**
   * Let `c = |selected ∩ key.correct|` and `w = |selected \ key.correct|`.
   * `selected.size === 0` → **`0` twelfths** (`"unattempted"`)
   * `w > 0` (one or more incorrect options marked, even if some correct options are also marked) → **`0` twelfths (`0.00`)** (`"incorrect"`, `0` negative penalty)
   * `w === 0 && c === C` (all correct options marked, zero wrong) → **`+24` twelfths (`+2.00`)** (`"correct"`)
   * `w === 0 && 0 < c < C` (strict subset of correct options marked, zero wrong) → **`+(24 * c) / C` twelfths** (`"partial"`):
     * `C = 2, c = 1` → `+12` twelfths (`+1.00`)
     * `C = 3, c = 1` → `+8` twelfths (`+0.67`, exact `2/3`)
     * `C = 3, c = 2` → `+16` twelfths (`+1.33`, exact `4/3`)
     * `C = 4, c = 1` → `+6` twelfths (`+0.50`)
     * `C = 4, c = 2` → `+12` twelfths (`+1.00`)
     * `C = 4, c = 3` → `+18` twelfths (`+1.50`)

### 3.2 Official WBJEEB 9-Step Tie-Breaking Vector

Every submitted full-paper mock computes and displays the candidate's **Tie-Break Vector** (Section `2.7` of WBJEEB JELET-2026 Information Bulletin) so students learn discipline against blind guessing:

1. **Less total negative marks** across the whole paper (`totalNegativeTwelfths` ascending)
2. **More positive marks in Mathematics** (`mathPositiveTwelfths` descending)
3. **Less negative marks in Mathematics** (`mathNegativeTwelfths` ascending)
4. **More positive marks in Physics** (`physPositiveTwelfths` descending)
5. **Less negative marks in Physics** (`physNegativeTwelfths` ascending)
6. **More positive marks in Chemistry** (`chemPositiveTwelfths` descending)
7. **Less negative marks in Chemistry** (`chemNegativeTwelfths` ascending)
8. **More positive marks in FEEE** (`feeePositiveTwelfths` descending)
9. **Less negative marks in FEEE** (`feeeNegativeTwelfths` ascending)

---

## 4. Jadavpur University (JU) Lateral Entry Benchmarks & Eligibility Rules

Used by the **JU Target Tracker** on `Today`, `Results`, and `You` (strictly factual, sourced from WBJEEB 2024–2026 notifications):

### 4.1 Hard Eligibility Rules for Jadavpur University
* **Domicile:** West Bengal Domicile (`Proforma A1` or `Proforma B`) is mandatory for **ALL** JU lateral-entry seats, including General/Open seats.
* **Diploma Aggregate Cutoff (`JELET-2026 E-Counselling Notification §2.0`):**
  * **General & General-EWS:** `≥ 60%` aggregate marks (or equivalent CGPA)
  * **OBC-A / OBC-B:** `≥ 54%` aggregate marks
  * **SC / ST / PwD:** `≥ 45%` aggregate marks
  * **CGPA Conversion Rule:** Council formula if printed on marksheet; otherwise WBJEEB default `Percentage = (CGPA − 0.75) × 10` on a 10-point scale (or sum of obtained marks ÷ sum of full marks across semesters).
  * **Ineligible Streams for JU:** `B.Sc.`, `B.Voc.`, and `D.Voc.` candidates are **not eligible** for Jadavpur University lateral entry—only AICTE-approved Engineering/Technology Diploma holders compete for JU B.E./B.Tech lateral seats.

### 4.2 Historical JU Seat Matrix & Closing GMR Benchmarks (`2024–2026`)

| JU Department | Campus | Approx. Total JELET Seats | Open (HS) Closing GMR Range | SC (HS) Closing GMR Range | Safe Target Score (out of 120) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Computer Science & Engg. (CSE)** | Jadavpur Main | **9** *(~4 Open)* | **GMR 2 – 10** *(up to ~28 in spot/later rounds)* | **GMR 25 – 69** | **92 – 102+ Marks** |
| **Information Technology (IT)** | Salt Lake | **9** *(~4 Open)* | **GMR 10 – 29** *(up to ~52)* | **GMR 53 – 138** | **85 – 94+ Marks** |
| **Electronics & Telecomm. (ETCE)** | Jadavpur Main | **8** | **GMR 7 – 25** *(up to ~75)* | **GMR 74 – 271** | **84 – 92+ Marks** |
| **Instrumentation & Electronics (IEE)** | Salt Lake | **5** | **GMR 12 – 31** | **GMR 74 – 118** | **82 – 90+ Marks** |
| **Electrical Engineering (EE)** | Jadavpur Main | **16** | **GMR 3 – 38** | **GMR 64 – 204** | **80 – 90+ Marks** |
| **Mechanical / Civil / Chemical** | Jadavpur Main | **17 / 17 / 12** | **GMR 19 – 144** | **GMR 138 – 431** | **70 – 82+ Marks** |

*(UI Honesty Rule: Never display a fake simulated rank like `Rank 142/12,540`. Always display the user's exact score alongside the documented **JU Historical Benchmark Band** above, clearly labelled as historical reference ranges because actual GMR shifts yearly with paper difficulty.)*

---

## 5. Canonical 42-Unit Syllabus Registry (`Appendix-5`, JELET-2026 Bulletin)

Every syllabus unit across the entire codebase MUST use these exact immutable IDs (`M01–M11`, `P01–P15`, `C01–C08`, `E01–E08`):

### Subject 1: Mathematics (`MATH` · 11 Units · 40 Qs · 50 Marks)
| Unit ID | Official Code | Official Unit Title | Official Subtopics (Verbatim Coverage Scope) |
| :---: | :---: | :--- | :--- |
| `M01` | `Math-A` | **Matrices up to Order 3** | Matrix definition & order; rectangular, square, row, column, upper/lower triangular, diagonal, scalar, identity, null; equality, addition, subtraction, scalar & matrix multiplication; transpose, symmetric & skew-symmetric; singular/non-singular, adjoint & inverse (order 3); eigenvalues (up to order 3); Cayley-Hamilton theorem statement & inverse application; diagonalization. |
| `M02` | `Math-B` | **Determinants up to Order 3** | Expansion of order 2 & 3 determinants; minors & cofactors; elementary properties & problems; Cramer's Rule (up to 3 unknowns); rank of matrix up to order 3; homogeneous & non-homogeneous linear systems (consistency & solutions). |
| `M03` | `Math-C` | **Complex Numbers** | Cartesian, polar & exponential forms; modulus, amplitude & conjugate; algebra of complex numbers; cube roots of unity ($\omega$) & properties; De Moivre's theorem (statement & problems). |
| `M04` | `Math-D` | **Co-ordinate Geometry (2D)** | Polar coordinates & relation to Cartesian; 2D conic sections (circle, parabola, ellipse, hyperbola) — definitions, standard properties, tangents & normals. |
| `M05` | `Math-E` | **Vector Algebra** | Position vector & section/ratio formula; rectangular resolution; addition, subtraction, scalar multiplication; dot product (work done, projection); cross product (vector area, moment of force); scalar & vector triple products & geometrical interpretation; linear combination, dependence & independence of 3 vectors. |
| `M06` | `Math-F` | **Differential Calculus** | Function of one variable, domain & range, periodic & standard functions; limits, standard limits, continuity & types of discontinuity; 1st & 2nd order derivatives; Rolle's Theorem & Lagrange's Mean Value Theorem; indeterminate forms & L'Hospital's rule. |
| `M07` | `Math-G` | **Application of Derivative** | Geometric meaning of derivative (tangents/normals/subtangent); rate measurement; maxima & minima of one-variable functions. |
| `M08` | `Math-H` | **Partial Differentiation** | Definition, meaning & evaluation of partial derivatives; homogeneous functions of 2 variables; Euler's theorem (1st order, without proof) & problems. |
| `M09` | `Math-I` | **Integral Calculus** | Indefinite integration (standard forms, substitution, integration by parts, partial fractions); definite integrals & properties; area of bounded planar regions. |
| `M10` | `Math-J` | **Ordinary Differential Equations** | Order & degree; 1st-order 1st-degree ODEs (variable separable, homogeneous, exact, linear $dy/dx + Py = Q$); 1st-order higher-degree ODEs; linear 2nd-order ODEs with constant coefficients — Complementary Function (C.F.) & Particular Integral (P.I.) for polynomial, $e^{ax}$, $\sin ax$, $\cos ax$, and $e^{ax}V(x)$. |
| `M11` | `Math-K` | **Probability** | Random experiment, sample space, events (impossible, mutually exclusive, exhaustive, equally likely); classical probability; total probability, compound/conditional probability & Bayes' Theorem. |

### Subject 2: Physics (`PHYS` · 15 Units · 30 Qs · 35 Marks)
| Unit ID | Official Code | Official Unit Title | Official Subtopics (Verbatim Coverage Scope) |
| :---: | :---: | :--- | :--- |
| `P01` | `Phys-A` | **Units, Dimensions & Measurement** | CGS, MKS, SI units; dimensions & dimensional analysis; measurement errors, accuracy, precision, resolution, significant figures. |
| `P02` | `Phys-B` | **Kinematics** | Speed, velocity, acceleration; uniform/non-uniform, rectilinear & circular motion; position-time & velocity-time graphs; vector resolution, composition & scalar multiplication. |
| `P03` | `Phys-C` | **Laws of Motion** | Newton's laws; force, momentum, inertia, moment of inertia, impulse, couple, moment; equilibrium conditions; conservation of momentum; centripetal/centrifugal forces; angular displacement/velocity/acceleration/momentum & torque; static/dynamic friction, angle of repose, banking of roads. |
| `P04` | `Phys-D` | **Work, Power & Energy** | Definitions, units & measures; kinetic & potential energy; work-energy theorem & conservation of mechanical energy. |
| `P05` | `Phys-E` | **Gravitation** | Universal law of gravitation; variation of $g$ on, above & below Earth's surface; gravitational potential energy; vertical linear, vertical circular & projectile motion. |
| `P06` | `Phys-F` | **Elasticity** | Elastic & plastic bodies, deforming/restoring forces; stress-strain curve, Hooke's law; Young's ($Y$), Bulk ($K$), Rigidity ($\eta$) moduli, Poisson's ratio ($\sigma$) & exact inter-relations; elastic potential energy. |
| `P07` | `Phys-G` | **Surface Tension** | Cohesive/adhesive forces; surface tension & surface energy; angle of contact; droplets & soap bubbles; capillarity, meniscus shape & jurin/capillary rise formula; effect of impurity & temperature. |
| `P08` | `Phys-H` | **Fluid Mechanics / Hydrostatics** | Pascal's law & hydraulic lift; buoyancy, Archimedes' principle & floating equilibrium; streamline vs. turbulent flow, Reynolds/critical velocity; continuity equation & Bernoulli's theorem; viscosity, velocity gradient, Stokes' law, terminal velocity & temperature dependence. |
| `P09` | `Phys-I` | **Thermal Expansion of Solids** | Linear ($\alpha$), superficial/areal ($\beta$), cubical/volume ($\gamma$) expansion & relations; variation of density with temperature. |
| `P10` | `Phys-J` | **Transmission of Heat** | Conduction, convection & radiation; coefficient of thermal conductivity ($K$) — formula, dimensions, SI units & slab problems. |
| `P11` | `Phys-K` | **Thermodynamics** | Thermal equilibrium, calorimetry & Zeroth law; heat, work & internal energy; First law of thermodynamics; $C_p$, $C_v$, Mayer's relation & $\gamma$; isothermal, isobaric, isochoric & adiabatic processes. |
| `P12` | `Phys-L` | **Reflection of Light** | Plane mirror reflection laws, image characteristics, deviation & number of images in inclined mirrors. |
| `P13` | `Phys-M` | **Refraction of Light** | Plane-surface refraction, Snell's law, refractive index & light speed in media; Total Internal Reflection (TIR), critical angle & optical fibre numerical aperture/acceptance angle. |
| `P14` | `Phys-N` | **Lens** | Convex & concave thin lenses; image formation, lens formula ($1/v - 1/u = 1/f$) & lens-maker relation; power of a lens in air & immersed in media; equivalent focal length & power of two thin lenses in contact. |
| `P15` | `Phys-O` | **Photoelectricity** | Photoemission, work function ($\phi_0$), threshold frequency ($\nu_0$), stopping potential ($V_0$); variation of photocurrent with intensity & frequency; photon momentum/energy & Einstein's photoelectric equation; solar photovoltaic cell principle & uses. |

### Subject 3: Chemistry (`CHEM` · 8 Units · 20 Qs · 25 Marks)
| Unit ID | Official Code | Official Unit Title | Official Subtopics (Verbatim Coverage Scope) |
| :---: | :---: | :--- | :--- |
| `C01` | `Chem-A` | **Atomic Structure** | Bohr model, de Broglie wavelength, quantum numbers ($n, l, m, s$), orbits vs. orbitals; Aufbau principle, Pauli exclusion, Hund's rule & electronic configurations (incl. Cr, Cu exceptions); atomic/mass number, isotopes, isotones, isobars; $sp^3, sp^2, sp$ hybridization & molecular geometry. |
| `C02` | `Chem-B` | **Chemical Bonding** | Electrovalent (ionic), covalent & coordinate bonds; H-bonding in $\text{HF}$, water & ice density anomaly; crystalline vs. amorphous solids; ionic, covalent & molecular crystals; tetrahedral covalent bonding in $\text{C, Si, Ge}$. |
| `C03` | `Chem-C` | **Acids, Bases & Salts** | Avogadro number, mole concept, weight-volume stoichiometry; Arrhenius & Lewis acids/bases; acidity, basicity, neutralization & salt hydrolysis; equivalent weights; normality, molarity, molality, formality, % strength; primary/secondary standards; $\text{pH}$ scale, acid-base indicators, buffer solutions, solubility product ($K_{sp}$) & common-ion effect in group analysis. |
| `C04` | `Chem-D` | **Oxidation, Reduction & Electrochemistry** | Electronic redox concept, oxidation number & ion-electron balancing; redox titrations; Arrhenius electrolytic dissociation, Faraday's 1st & 2nd laws, electrolysis of $\text{CuSO}_4$ with $\text{Pt}$ vs. $\text{Cu}$ electrodes; electroplating, electro-refining, electrotyping; electrochemical series, dry cell & lead-acid storage battery. |
| `C05` | `Chem-E` | **Chemical Equilibrium** | Reversible/irreversible & exothermic/endothermic reactions; $K_p, K_c$ & Le Chatelier's principle; industrial conditions & catalysts for Haber ($\text{NH}_3$), Ostwald ($\text{HNO}_3$) & Contact ($\text{H}_2\text{SO}_4$) processes; catalysis types. |
| `C06` | `Chem-F` | **Metallurgy** | Minerals, ores, gangue, flux, slag; extraction principles of **Iron, Copper & Aluminium**; alloys — exact composition & uses of Brass, Bronze, German Silver, Duralumin, Nichrome, Bell metal, Gun metal, Monel metal, Alnico, Dutch metal, Babbitt metal, Stainless steel, Amalgams; cast iron, wrought iron, sponge iron & alloy steels. |
| `C07` | `Chem-G` | **Water** | Soft vs. hard water, soap action; temporary (bicarbonate) vs. permanent ($\text{Ca/Mg}$ chloride/sulphate) hardness; $\text{ppm / mg L}^{-1} \text{ CaCO}_3$ equivalent calculations; **EDTA complexometric titration**; softening by Permutit (zeolite), Ion-exchange resin, Phosphate conditioning & Calgon treatment. |
| `C08` | `Chem-H` | **Organic Chemistry** | Classification, homologous series, functional groups, structural/geometrical isomerism & IUPAC nomenclature; preparation & properties of **Methane, Ethylene, Acetylene**; **Methylated spirit, Rectified spirit, Power alcohol, Proof spirit**; uses of **Benzene, Naphthalene & Phenol**. |

### Subject 4: Fundamentals of Electrical & Electronics Engg. (`FEEE` · 8 Units · 10 Qs · 10 Marks)
| Unit ID | Official Code | Official Unit Title | Official Subtopics (Verbatim Coverage Scope) |
| :---: | :---: | :--- | :--- |
| `E01` | `FEEE-A` | **Electrical Components & Measuring Instruments** | Passive R, L, C elements; **PMMC** (moving coil, DC only) & **MI** (moving iron, AC/DC) operating principles, damping/controlling torques; ammeter shunt & voltmeter multiplier range extension; **Wheatstone bridge** balance. |
| `E02` | `FEEE-B` | **Transformers** | Faraday's EMF equation, construction, core $B\text{-}H$ hysteresis loop; transformation ratio; ideal & practical equivalent circuits; iron (core) vs. copper ($I^2R$) losses, condition for maximum efficiency, voltage regulation; **auto-transformer** copper saving. |
| `E03` | `FEEE-C` | **Electrical Machines** | Motor types & applications; rotating magnetic field (RMF) & synchronous speed ($N_s = 120f/P$); construction, back-EMF, torque-speed curves & speed control of **DC motors** (shunt, series, compound) and **1-phase induction motors**. |
| `E04` | `FEEE-D` | **DC Sources & Circuits** | Ideal/practical voltage & current sources & source transformation; **KCL, KVL, Superposition, Thevenin's & Norton's theorems**, maximum power transfer; branch voltage/current analysis; transient time-domain $RC$ & $RL$ charging/discharging time constants ($\tau = RC, L/R$). |
| `E05` | `FEEE-E` | **AC Sources & Circuits** | Peak, average, RMS values, form factor & peak factor; complex, exponential & phasor representation; series/parallel **RLC circuits**, impedance triangle, resonance & Q-factor; active ($VI\cos\phi$), reactive ($VI\sin\phi$) & apparent ($VI$) power, power factor; 3-phase **Star ($\text{Y}$) & Delta ($\Delta$)** line/phase voltage-current relations. |
| `E06` | `FEEE-F` | **Basic Semiconductor Devices** | Energy band diagrams (conductor, insulator, semiconductor, $E_g$); intrinsic vs. extrinsic ($N$-type, $P$-type) semiconductors; $P\text{-}N$ junction diode (forward/reverse bias, Zener); **PNP & NPN BJT** ($I_E = I_B + I_C$, $\alpha, \beta$ relations), **MOSFET & CMOS** fundamentals. |
| `E07` | `FEEE-G` | **Analog Circuits (OP-AMP)** | Ideal vs. practical **OP-AMP** characteristics; **virtual ground / virtual short**; closed-loop gain & circuits for **inverting amplifier, non-inverting amplifier, voltage follower, summing adder, subtractor, integrator & differentiator**. |
| `E08` | `FEEE-H` | **Digital Electronics** | **Boolean Algebra** laws & De Morgan's theorems; truth tables, symbols & universal-gate realizations for **AND, OR, NOT, NAND, NOR, EX-OR, EX-NOR** & combinational gate networks. |
