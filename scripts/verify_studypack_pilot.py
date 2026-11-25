#!/usr/bin/env python3
"""Author-only checks for the three Phase 13 candidates OUTSIDE _data.

Requires SymPy (fails, never silently skips, when absent). This is not a release
command: blank review fields must remain blank, production validation must reject
these drafts, and reference/owner review are separate, still-required checks.
No books are read and no file under _data is written.
"""
import hashlib
import json
from pathlib import Path

import sympy as sp
import verify_corpus as gate

ROOT = Path(__file__).resolve().parents[1]
DRAFTS = ROOT / 'docs/phases/phase-13/drafts'
checks = []


def require(condition, label):
    if not bool(condition):
        raise AssertionError(label)
    checks.append(label)


def zero(expr, label):
    require(sp.simplify(expr) == 0, label)


def matrix_zero(matrix, label):
    require(all(sp.simplify(x) == 0 for x in matrix), label)


def check_drafts():
    """Reuse the unchanged release validator; allow only the TWO review errors."""
    hashes = {}
    for uid in ('M01', 'C03', 'E05'):
        path = DRAFTS / f'{uid}.studyPack.draft.json'
        pack = json.loads(path.read_text())
        require(pack['provenance']['reviewedBy'] == '' and pack['provenance']['reviewedAt'] == '',
                f'{uid}: owner review remains blank')
        gate.errors.clear()
        gate.validate_study_pack(pack, uid)
        expected = {
            f'{uid}: studyPack: reviewedBy must be non-empty',
            f'{uid}: studyPack: reviewedAt must be YYYY-MM-DD',
        }
        require(set(gate.errors) == expected and len(gate.errors) == 2,
                f'{uid}: valid draft structure, rejected for publication pending review')
        for location, text in gate._iter_strings(pack, '$'):
            require(not gate.CONTROL_CHAR_RE.search(text) and not gate.SWALLOWED_NL_RE.search(text),
                    f'{uid}: clean JSON text {location}')
        hashes[uid] = hashlib.sha256(path.read_bytes()).hexdigest()
    gate.errors.clear()
    return hashes


def verify_m01():
    # PRD01 / shape hook: symbolic rectangular matrices, both orders defined.
    A = sp.Matrix(2, 3, sp.symbols('a0:6'))
    B = sp.Matrix(3, 2, sp.symbols('b0:6'))
    require((A * B).shape == (2, 2) and (B * A).shape == (3, 3), 'M01 PRD01: product dimensions')
    zero((A * B)[0, 0] - sum(A[0, k] * B[k, 0] for k in range(3)), 'M01 PRD01: row-column rule')
    # PRD02 / inverse hooks, mistakes and checklist: generic 2x2 identities.
    a, b, c, d = sp.symbols('a b c d')
    M = sp.Matrix([[a, b], [c, d]])
    I = sp.eye(2)
    inv = M.inv()
    matrix_zero(inv * M - I, 'M01 PRD02: left inverse when determinant nonzero')
    matrix_zero(M * inv - I, 'M01 PRD02: right inverse when determinant nonzero')
    N = sp.Matrix([[2, 1], [3, 4]])
    matrix_zero(M * (inv * N) - N, 'M01 PRD02: AX=B solution side')
    matrix_zero((N * inv) * M - N, 'M01 PRD02: XA=B solution side')
    require(N.inv() != N.applyfunc(lambda x: 1/x), 'M01 mistake: entry reciprocals are not inverse')
    singular = sp.diag(1, 0)
    U, V = sp.eye(2), sp.diag(1, 2)
    require(U != V and singular * U == singular * V, 'M01 mistake: singular factor cannot cancel generally')
    require(N.cofactor_matrix().T == N.adjugate() and N.cofactor_matrix() != N.adjugate(),
            'M01 mistake: adjoint requires cofactor transpose')
    # PRD03: all entries symbolic at the maximum in-scope order.
    G = sp.Matrix(3, 3, sp.symbols('g0:9'))
    S, K = (G + G.T)/2, (G - G.T)/2
    matrix_zero(S + K - G, 'M01 PRD03: symmetric-skew decomposition')
    matrix_zero(S.T - S, 'M01 PRD03: symmetric part')
    matrix_zero(K.T + K, 'M01 PRD03: skew part')
    require(all(K[i, i] == 0 for i in range(3)), 'M01 PRD03: skew diagonal zero')
    require(G.T[1, 2] == G[2, 1], 'M01 PRD03: transpose index exchange')
    # PRD04: polynomial identity and inverse rewriting for generic 2x2.
    matrix_zero(M**2 - sp.trace(M)*M + M.det()*I, 'M01 PRD04: Cayley-Hamilton')
    matrix_zero(inv - (sp.trace(M)*I - M)/M.det(), 'M01 PRD04: inverse from Cayley-Hamilton')


def verify_c03():
    # PRD01/checklist: exact original bookkeeping test, not a book exercise.
    va, vb = sp.Rational(15, 1000), sp.Rational(25, 1000)
    ma, mb = sp.Rational(1, 5), sp.Rational(1, 10)
    excess = ma*va - mb*vb
    zero(excess - sp.Rational(1, 2000), 'C03 PRD01: 1:1 neutralization mole balance')
    zero(excess/(va+vb) - sp.Rational(1, 80), 'C03 PRD01: final volume denominator')
    require(excess/va != excess/(va+vb), 'C03 mistake: original volume differs from final volume')
    require(ma*vb != mb*vb, 'C03 mistake: equal volumes need not have equal moles')
    # PRD02: weak acid mass balance/quadratic, and quantified shortcut check.
    Ka, C = sp.symbols('Ka C', positive=True)
    x = (sp.sqrt(Ka**2 + 4*Ka*C) - Ka)/2
    zero(x*x + Ka*x - Ka*C, 'C03 PRD02: positive quadratic root')
    zero((sp.sqrt(Ka*C))**2/C - Ka, 'C03 PRD02: approximate small-ionization law')
    # At exact dissociation fraction alpha, x_approx/x_exact = 1/sqrt(1-alpha).
    alpha = sp.Rational(1, 20)
    require(0 < (1/sp.sqrt(1-alpha)-1).evalf() < sp.Rational(3, 100),
            'C03 PRD02: 5-percent dissociation gives under 3-percent concentration error')
    # A failing shortcut case: Ka=C gives an impossible 100-percent small-x estimate.
    require(sp.sqrt(Ka*C).subs(Ka, C)/C == 1, 'C03 mistake: approximation can fail its fraction test')
    # PRD03 and hooks: log base, sign, scale and ratios.
    def ph(h):
        return -sp.log(h)/sp.log(10)
    zero(ph(sp.Rational(1, 1000))-3, 'C03 PRD03: pH at 10^-3')
    zero(ph(sp.Rational(1, 10000))-4, 'C03 PRD03: pH at 10^-4')
    h, ratio = sp.symbols('h ratio', positive=True)
    zero(sp.expand_log(ph(h*ratio)-ph(h), force=True) + sp.log(ratio)/sp.log(10),
         'C03 PRD03: multiplicative concentration shift')
    require(sp.diff(ph(h), h) < 0, 'C03 checklist: pH decreases as hydrogen concentration increases')
    # PRD04: common-volume cancellation, Henderson-Hasselbalch rearrangement,
    # and post-reaction buffer amounts (subject to stated solution assumptions).
    nbase, nacid, volume = sp.symbols('nbase nacid volume', positive=True)
    zero((nbase/volume)/(nacid/volume) - nbase/nacid, 'C03 PRD04: common-volume ratio cancels')
    hydrogen = Ka*nacid/nbase
    zero(sp.expand_log(ph(hydrogen)-ph(Ka)-sp.log(nbase/nacid)/sp.log(10), force=True),
         'C03 PRD04: buffer logarithm orientation')
    delta = sp.symbols('delta', positive=True)
    zero((nbase-delta)+(nacid+delta)-(nbase+nacid), 'C03 PRD04: acid addition conserves buffer partner total')
    require(sp.factor(sp.diff((nbase-delta)/(nacid+delta), delta)) < 0,
            'C03 PRD04: added acid lowers buffer base-to-acid ratio')


def verify_e05():
    # PRD01: signed average, mean square, RMS, and heating definition.
    theta, phi = sp.symbols('theta phi', real=True)
    peak, R, L, C, omega, v = sp.symbols('peak R L C omega v', positive=True)
    mean = sp.integrate(peak*sp.sin(theta), (theta, 0, 2*sp.pi))/(2*sp.pi)
    ms = sp.integrate((peak*sp.sin(theta))**2, (theta, 0, 2*sp.pi))/(2*sp.pi)
    zero(mean, 'E05 PRD01: signed sine full-cycle average zero')
    zero(ms-peak**2/2, 'E05 PRD01: sine mean square')
    zero(sp.sqrt(ms)-peak/sp.sqrt(2), 'E05 PRD01: sine RMS')
    zero(ms*R-(peak/sp.sqrt(2))**2*R, 'E05 PRD01: equal DC and AC mean heating')
    # PRD02: vL=L di/dt and iC=C dv/dt, with i as the common reference.
    current = peak*sp.sin(theta)
    zero(omega*L*sp.diff(current, theta)-omega*L*peak*sp.sin(theta+sp.pi/2),
         'E05 PRD02: inductor voltage leads current')
    vcap = peak/(omega*C)*sp.sin(theta-sp.pi/2)
    zero(omega*C*sp.diff(vcap, theta)-current, 'E05 PRD02: capacitor voltage lags current')
    net = omega*L - 1/(omega*C)
    Z = R + sp.I*net
    zero(sp.expand_complex(Z*sp.conjugate(Z))-(R**2+net**2), 'E05 PRD02: series impedance magnitude')
    # PRD03: fixed-voltage current maximum follows non-negative net-reactance square.
    omega0 = 1/sp.sqrt(L*C)
    zero(net.subs(omega, omega0), 'E05 PRD03: resonance reactance cancellation')
    zero((v/sp.sqrt(R**2+net**2)).subs(omega, omega0)-v/R, 'E05 PRD03: resonant supply current')
    require(net**2 >= 0, 'E05 PRD03: impedance magnitude at least positive R')
    # PRD04: average v*i with arbitrary phase gives the RMS power formula.
    vpeak, ipeak = sp.symbols('vpeak ipeak', positive=True)
    avgp = sp.integrate(vpeak*sp.sin(theta+phi)*ipeak*sp.sin(theta),
                        (theta, 0, 2*sp.pi))/(2*sp.pi)
    zero(avgp-vpeak*ipeak*sp.cos(phi)/2, 'E05 PRD04: sinusoidal average real power')
    for angle in [sp.pi/2, -sp.pi/2]:
        zero(avgp.subs(phi, angle), f'E05 PRD04: reactive average power at phase {angle}')
    current_rms = v/sp.sqrt(R**2+net**2)
    zero(v*current_rms*net/sp.sqrt(R**2+net**2)-current_rms**2*net,
         'E05 PRD04: reactive power identity')
    require(sp.Rational(1, 1000) == sp.Pow(10, -3) and sp.Rational(1, 1000000) == sp.Pow(10, -6),
            'E05 mistake: milli and micro SI prefixes')
    zero(sp.rad(90)-sp.pi/2, 'E05 mistake: degree-radian conversion')
    # Quality factor omega0*L/R: (1/s)*H/ohm = 1, unlike I^2*X in var.
    zero(omega0*L/R-sp.sqrt(L/C)/R, 'E05 PRD04: quality factor equivalent form')


def main():
    hashes = check_drafts()
    structural = len(checks)
    verify_m01()
    verify_c03()
    verify_e05()
    print(f'PASS: {structural} draft structure/text checks; {len(checks)-structural} mathematical checks (SymPy {sp.__version__}).')
    for uid, digest in hashes.items():
        print(f'{uid} SHA-256 {digest}')
    print('PUBLICATION BLOCKED: reference checks and actual owner review still required. No _data files written.')


if __name__ == '__main__':
    main()
