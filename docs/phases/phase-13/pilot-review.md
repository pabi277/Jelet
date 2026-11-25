# Phase 13 — original pilot candidates for owner review

**Authoring document only — not part of the app corpus.**

These are AI-assisted original candidates. No owner has reviewed or approved
them yet; `reviewedBy` and `reviewedAt` are intentionally empty in each JSON.
Private-reference checks are incomplete because of the access limits recorded
in [the pilot evidence](batch-M01-C03-E05.md). No book prose was retained.

Review the explanation level, mathematical conditions, usefulness of the hooks,
and whether the mistake lists describe student errors rather than question-design
traps. Book pointers are deliberately empty until title, author and chapter
numbers can be confirmed from the actual books.

The JSON files in `drafts/` are the source; regenerate this document with
`python3 scripts/build_studypack_review.py` after changing a draft.

## M01 — Matrices up to Order 3

Source: `drafts/M01.studyPack.draft.json`

SHA-256: `1826a5b81fd37ac6097f0563a14b27e6225c200e6c736042366478551b468ee5`

### Concept Primer

#### M01-PRD01 · Read the dimensions before the numbers

A matrix is a labelled arrangement of numbers, so its dimensions tell you which operations make sense. In a product, a row from the first matrix meets a column from the second. For $A$ of size $2\times3$ and $B$ of size $3\times2$, each such meeting uses three pairs of entries. There are two output rows and two output columns, so $AB$ is $2\times2$. Reversing the order gives a $3\times3$ matrix $BA$: even the output size can change.

#### M01-PRD02 · An inverse undoes an operation, not an entry

For a square matrix, $A^{-1}$ means an operation that undoes multiplication by $A$: $A^{-1}A=AA^{-1}=I$. It does not mean taking the reciprocal of every entry. Before trying to find an inverse, test $\det A\ne0$. For $AX=B$, multiply on the left to obtain $X=A^{-1}B$; for $XA=B$, multiply on the right to obtain $X=BA^{-1}$. The side matters because matrix factors cannot generally be swapped.

#### M01-PRD03 · Transpose separates the shared and opposite parts

Transposing swaps the row and column labels: the entry at $(i,j)$ moves to $(j,i)$. For a real square matrix, pair each entry with its mirror across the diagonal. Their average forms the symmetric part $S=(A+A^T)/2$; their half-difference forms the skew-symmetric part $K=(A-A^T)/2$. They recombine as $A=S+K$. A quick check is $S^T=S$ and $K^T=-K$, so the diagonal of $K$ must vanish.

#### M01-PRD04 · Replace repeated multiplication with a short identity

For a $2\times2$ matrix, write $t=\operatorname{tr}A$ and $d=\det A$. Cayley-Hamilton gives $A^2-tA+dI=O$. This is a rewriting rule: whenever $A^2$ appears, replace it by $tA-dI$. If $d\ne0$, multiplying the identity by $A^{-1}$ gives $A^{-1}=(tI-A)/d$. Keep $I$ beside a scalar constant when forming a matrix polynomial; a scalar alone is not a matrix of the required order.

### Memory Hooks

- Inside dimensions must match; the outside dimensions name the product.
- Undo on the side where the matrix acts: $AX=B\Rightarrow X=A^{-1}B$.
- Transpose: exchange row and column labels, then check the dimensions.
- Average the mirror pair for $S$; half-difference for $K$.

### Common Mistakes

- Taking entry-by-entry reciprocals instead of finding a matrix inverse.
- Building cofactors correctly but forgetting to transpose the cofactor matrix when forming the adjoint.
- Cancelling a factor before checking that it is invertible.
- Writing a scalar constant in a matrix polynomial without the matching identity matrix.

### Exam Checklist

- Write the order of every matrix and check that the requested operation exists.
- Before inversion or cancellation, check $\det A\ne0$.
- For matrix equations, write the side on which the inverse must multiply.
- Check a computed inverse by multiplying with the original matrix and comparing with $I$.
- For a transpose or symmetry result, compare a pair of off-diagonal entries.
- For a $2\times2$ Cayley-Hamilton reduction, recompute trace and determinant before substituting.

### Further Reading

No reading pointers proposed yet; bibliography/reference checks remain open.

### Review decision

- [ ] Original wording and student-friendly voice reviewed.
- [ ] Mathematical assumptions and relationships checked.
- [ ] Mistakes are useful and distinct from the existing WBJEEB trap list.
- [ ] Reference facts and accurate reading pointers checked (or an explicit alternative approved).
- [ ] Approved for publication after the remaining release gates.

Reviewer: **not supplied** · Review date: **not supplied**

---

## C03 — Acids, Bases & Salts

Source: `drafts/C03.studyPack.draft.json`

SHA-256: `51b83db57fc7032fb358be5b935c29b8b09e24b9ebb058ce8d033326afd78dcd`

### Concept Primer

#### C03-PRD01 · Count particles before choosing a pH formula

In an acid-base mixture, first ask what reacts and what remains. For the usual aqueous neutralization step, $\mathrm{H}^++\mathrm{OH}^-\rightarrow\mathrm{H_2O}$ uses one mole of each ion. Convert each supplied solution to reacting moles, allowing for the reaction-specific acid or base factor. Compare these amounts before taking any logarithm. After mixing, a leftover concentration uses the total solution volume, not just the volume of the solution that supplied the leftover ions.

#### C03-PRD02 · Strong and concentrated answer different questions

Concentration tells you how much solute was put into a volume; strength describes its ionization behaviour in the chosen solvent. For an ideal dilute solution of a weak monoprotic acid with initial concentration $C$, neglecting water ionization, let $x$ be the equilibrium hydrogen-ion concentration. Then $K_a=x^2/(C-x)$. Replacing $C-x$ by $C$ gives $x\approx\sqrt{K_aC}$ only when $x$ is small compared with $C$. A useful classroom check is $x/C\le0.05$; if it fails, keep the quadratic rather than forcing the shortcut.

#### C03-PRD03 · The pH scale counts factors, not differences

In the dilute-solution concentration model, $\mathrm{pH}=-\log_{10}[\mathrm{H}^+]$, with concentrations entered numerically in $\mathrm{mol\,L^{-1}}$. Moving from $10^{-3}$ to $10^{-4}$ reduces hydrogen-ion concentration tenfold and raises pH from $3$ to $4$. Equal steps on this scale represent equal concentration ratios, not equal concentration differences. More generally, a concentration change by a factor $r$ changes pH by $-\log_{10}r$. Keep the logarithm until the final step instead of rounding the concentration first.

#### C03-PRD04 · A buffer has two partners with different jobs

An acidic buffer needs appreciable amounts of a weak acid $\mathrm{HA}$ and its conjugate base $\mathrm{A}^-$. Added strong acid consumes some $\mathrm{A}^-$; added strong base consumes some $\mathrm{HA}$. Account for that reaction first. If both partners remain appreciably present and the usual dilute-solution approximations apply, use $\mathrm{pH}\approx\mathrm{p}K_a+\log_{10}(n_{\mathrm{A}^-}/n_{\mathrm{HA}})$: their common final volume cancels in the concentration ratio. Once either partner is exhausted, this two-partner shortcut no longer describes the mixture.

### Memory Hooks

- React first, divide by total volume next, take the logarithm last.
- Strength asks how it ionizes; concentration asks how much is present.
- Ten times more $[\mathrm{H}^+]$ means one pH unit less.
- For an acidic buffer: base partner above acid partner in the ratio.

### Common Mistakes

- Using the original sample volume after two solutions have been mixed.
- Treating equal solution volumes as equal reacting amounts without checking concentration and stoichiometry.
- Using $\sqrt{K_aC}$ without checking the small-ionization assumption.
- Substituting the starting buffer amounts after added acid or base has already consumed one partner.
- Rounding a hydrogen-ion concentration too early and carrying that error into the logarithm.

### Exam Checklist

- Identify whether the task concerns a strong electrolyte, weak acid/base, buffer or neutralization mixture.
- Convert volume to litres when calculating moles from molarity.
- Write the reaction and check its acid/base factor before using equivalent amounts.
- Use final concentrations; for a buffer ratio, confirm both partners survive.
- If using a weak-acid approximation, check the calculated ionization fraction.
- At the end, check that increasing hydrogen-ion concentration would lower the reported pH.

### Further Reading

No reading pointers proposed yet; bibliography/reference checks remain open.

### Review decision

- [ ] Original wording and student-friendly voice reviewed.
- [ ] Mathematical assumptions and relationships checked.
- [ ] Mistakes are useful and distinct from the existing WBJEEB trap list.
- [ ] Reference facts and accurate reading pointers checked (or an explicit alternative approved).
- [ ] Approved for publication after the remaining release gates.

Reviewer: **not supplied** · Review date: **not supplied**

---

## E05 — AC Sources & Circuits

Source: `drafts/E05.studyPack.draft.json`

SHA-256: `ac65fa5db093c36f799803067d05ff1c067dd67c26cc6e27e6e508cf9e32d75c`

### Concept Primer

#### E05-PRD01 · RMS follows heating, not the signed average

In a resistor, instantaneous heating power is $p(t)=i(t)^2R$. Squaring makes both halves of an alternating current contribute positively. RMS is the steady-current magnitude that produces the same average heating: $I_{\mathrm{rms}}=\sqrt{\langle i^2\rangle}$. For a sine wave $i=I_m\sin(\omega t)$, averaging the square over a full cycle gives $I_{\mathrm{rms}}=I_m/\sqrt2$, even though the signed full-cycle average current is zero. Identify the waveform and averaging interval before choosing a conversion factor.

#### E05-PRD02 · Reactance tells you the phase direction

For ideal components in sinusoidal steady state at one frequency, take the current as your reference. A resistor voltage is in phase with that current; an inductor voltage is ahead by a quarter-cycle; a capacitor voltage is behind by a quarter-cycle. In a series RLC circuit these give $Z=R+j(\omega L-1/(\omega C))$. A positive net reactance means an inductive circuit and a lagging current relative to the supply; a negative net reactance means a capacitive circuit and a leading current.

#### E05-PRD03 · Series resonance removes net reactance, not the components

For ideal $L$ and $C$ in series with a positive resistance $R$, resonance occurs at $\omega_0=1/\sqrt{LC}$. The inductor and capacitor still store and return energy, but their reactances cancel in the supply impedance. With a fixed RMS supply voltage, the current is then $V_{\mathrm{rms}}/R$, the largest value as frequency is varied while $R$, $L$ and $C$ stay fixed. This statement is about the series circuit and its steady-state supply current; it is not permission to replace every resonant network by a wire.

#### E05-PRD04 · Separate energy use from current carried

For sinusoidal single-phase operation, apparent power is $S=V_{\mathrm{rms}}I_{\mathrm{rms}}$ in VA, while real power is $P=S\cos\phi$ in W. The phase difference $\phi$ determines what fraction of that voltage-current product becomes average energy transfer. An ideal inductor or capacitor has zero average real power, but it can still carry current. In a series RLC calculation, distinguish reactive power $Q_{\mathrm{reactive}}=I_{\mathrm{rms}}^2(X_L-X_C)$ from quality factor $Q_{\mathrm{quality}}=\omega_0L/R$; they share a letter, not a meaning or a unit.

### Memory Hooks

- RMS: square, average over the stated interval, then take the root.
- For a pure inductor, current lags; for a pure capacitor, current leads.
- Name the reference waveform before saying lead or lag.
- Watts use the power factor; VA uses the RMS voltage-current product.

### Common Mistakes

- Mixing a peak current with an RMS voltage in the same power calculation.
- Entering a phase angle in degrees when the calculator is set to radians, or the reverse.
- Leaving microfarads or millihenries unconverted before substituting into SI formulas.
- Confusing the dimensionless quality factor with reactive power measured in var.
- Assuming zero average real power means zero current in an ideal reactive element.

### Exam Checklist

- Identify the waveform, frequency, averaging interval and whether supplied values are peak or RMS.
- Convert component values to ohms, henries and farads before substitution.
- Write the current or voltage chosen as the phase reference.
- For series RLC, decide whether $X_L-X_C$ is positive, negative or zero.
- Keep real power in W, reactive power in var and apparent power in VA.
- For a resonance result, state the circuit type and the conditions held fixed.

### Further Reading

No reading pointers proposed yet; bibliography/reference checks remain open.

### Review decision

- [ ] Original wording and student-friendly voice reviewed.
- [ ] Mathematical assumptions and relationships checked.
- [ ] Mistakes are useful and distinct from the existing WBJEEB trap list.
- [ ] Reference facts and accurate reading pointers checked (or an explicit alternative approved).
- [ ] Approved for publication after the remaining release gates.

Reviewer: **not supplied** · Review date: **not supplied**

---
