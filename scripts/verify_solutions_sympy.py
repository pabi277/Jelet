#!/usr/bin/env python3
"""Gate 2: verify_solutions_sympy.py — Validate SymPy-verified solutions.

Checks:
  1. All solutions have a verification block
  2. SymPy-verified solutions have method="sympy" and a verification note
  3. For math questions flagged as SymPy-verified, attempt independent
     SymPy re-verification of key mathematical claims where feasible
  4. Report coverage statistics

Exit code 0 = all gates pass, 1 = failure.
"""
import json, os, sys

try:
    import sympy
    from sympy import symbols, diff, sin, cos, tan, atan, sqrt, simplify, Eq, solve, Matrix, expand, sin as spsin
    HAS_SYMPY = True
except ImportError:
    HAS_SYMPY = False

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "_data")

errors = []

def load_json(path):
    with open(path, "r") as f:
        return json.load(f)

def sympy_verify_2024_q20():
    """Verify 2024 Q20: u = atan(x/y), du/dx - du/dy = (x+y)/(x²+y²) = option A."""
    if not HAS_SYMPY:
        return None, "sympy not available"
    x, y = sympy.symbols("x y", positive=True)
    u = sympy.atan(x / y)
    expr = sympy.diff(u, x) - sympy.diff(u, y)
    simplified = sympy.simplify(expr)
    expected = (x + y) / (x**2 + y**2)
    match = sympy.simplify(simplified - expected) == 0
    return match, f"du/dx - du/dy = {simplified}, matches (x+y)/(x²+y²): {match}"

def sympy_verify_2024_q22():
    """Verify 2024 Q22: determinant condition gives r=2."""
    if not HAS_SYMPY:
        return None, "sympy not available"
    r = sympy.symbols("r")
    det = sympy.Matrix([[2*r, -2, 3], [1, r, 2], [2, 0, r]]).det()
    det = sympy.expand(det)
    roots = sympy.solve(det, r)
    real_roots = [root for root in roots if root.is_real]
    return 2 in real_roots, f"det = {det}, real roots: {real_roots}, r=2 in roots: {2 in real_roots}"

def sympy_verify_2024_q37():
    """Verify 2024 Q37: pq=1/12, (1-p)(1-q)=1/2 → p+q=7/12, roots 1/3, 1/4."""
    if not HAS_SYMPY:
        return None, "sympy not available"
    p = sympy.symbols("p")
    # From pq=1/12 and p+q=7/12: q = 7/12 - p, p(7/12-p)=1/12
    q = sympy.Rational(7, 12) - p
    eq = p * q - sympy.Rational(1, 12)
    roots = sympy.solve(eq, p)
    return set(roots) == {sympy.Rational(1, 3), sympy.Rational(1, 4)}, f"roots: {roots}"

def sympy_verify_2025_q4():
    """Verify 2025 Q4: (K+1)(K+3)-8K = (K-1)(K-3), K=3 gives inconsistent system."""
    if not HAS_SYMPY:
        return None, "sympy not available"
    K = sympy.symbols("K")
    det = sympy.expand((K+1)*(K+3) - 8*K)
    factored = sympy.factor(det)
    roots = sympy.solve(det, K)
    return roots == [1, 3], f"det = {factored}, roots: {roots}"

def sympy_verify_2025_q22():
    """Verify 2025 Q22: same determinant as 2024 Q22."""
    return sympy_verify_2024_q22()

def sympy_verify_2025_q59():
    """Verify 2025 Q59: SHM T = 2π√((x₁²-x₂²)/(v₂²-v₁²))."""
    if not HAS_SYMPY:
        return None, "sympy not available"
    x1, x2, v1, v2, w = symbols("x1 x2 v1 v2 w", positive=True)
    # v² = ω²(A²-x²) → v2²-v1² = ω²(x1²-x2²)
    # ω² = (v2²-v1²)/(x1²-x2²), T = 2π/ω
    omega_sq = (v2**2 - v1**2) / (x1**2 - x2**2)
    T = 2 * sympy.pi / sympy.sqrt(omega_sq)
    T_simplified = sympy.simplify(T)
    expected = 2 * sympy.pi * sympy.sqrt((x1**2 - x2**2) / (v2**2 - v1**2))
    # 1/sqrt(a/b) = sqrt(b/a); check via squared equivalence to avoid simplification gaps
    match = sympy.simplify(T_simplified**2 - expected**2) == 0
    return match, f"T = {T_simplified}, matches expected form: {match}"

def main():
    if not HAS_SYMPY:
        print("⚠️  sympy not installed — skipping independent SymPy re-verification")
        print("   Still validating solution structure and coverage statistics.\n")

    total_solutions = 0
    sympy_verified = 0
    manual_verified = 0
    struct_errors = 0

    for year in ["2022", "2023", "2024", "2025"]:
        sol_path = os.path.join(DATA, "solutions", f"{year}.solutions.json")
        if not os.path.exists(sol_path):
            errors.append(f"Solutions file missing: {sol_path}")
            continue
        sol = load_json(sol_path)
        sols = sol.get("solutions", {})
        for qid, s in sols.items():
            total_solutions += 1
            if "verification" not in s:
                struct_errors += 1
                errors.append(f"{qid}: missing verification block")
                continue
            v = s["verification"]
            if v.get("method") == "sympy":
                sympy_verified += 1
            else:
                manual_verified += 1
            if not v.get("verifiedAt"):
                struct_errors += 1
                errors.append(f"{qid}: missing verifiedAt")
            if not v.get("note"):
                struct_errors += 1
                errors.append(f"{qid}: missing verification note")

    print(f"✓ Solution coverage: {total_solutions} total")
    print(f"  SymPy-verified: {sympy_verified} ({100*sympy_verified//total_solutions}%)")
    print(f"  Manually verified: {manual_verified} ({100*manual_verified//total_solutions}%)")

    # Independent SymPy re-verification of select questions
    if HAS_SYMPY:
        print("\n🔬 Independent SymPy re-verification:")
        tests = [
            ("2024 Q20", "jelet-2024-q020", sympy_verify_2024_q20),
            ("2024 Q22", "jelet-2024-q022", sympy_verify_2024_q22),
            ("2024 Q37", "jelet-2024-q037", sympy_verify_2024_q37),
            ("2025 Q4", "jelet-2025-q004", sympy_verify_2025_q4),
            ("2025 Q22", "jelet-2025-q022", sympy_verify_2025_q22),
            ("2025 Q59", "jelet-2025-q059", sympy_verify_2025_q59),
        ]
        for label, qid, test_func in tests:
            result, note = test_func()
            if result is None:
                print(f"  ⚠️  {label}: {note}")
            elif result:
                print(f"  ✅ {label}: PASS — {note}")
            else:
                print(f"  ❌ {label}: FAIL — {note}")
                errors.append(f"{label}: SymPy re-verification failed — {note}")

    # Check structural errors
    if struct_errors:
        errors.append(f"{struct_errors} structural solution errors")

    print()
    if errors:
        print(f"❌ verify_solutions_sympy FAILED: {len(errors)} error(s)")
        for e in errors:
            print(f"   - {e}")
        sys.exit(1)
    else:
        print(f"✅ verify_solutions_sympy PASSED: {total_solutions} solutions validated, {sympy_verified} SymPy-verified.")
        sys.exit(0)

if __name__ == "__main__":
    main()
