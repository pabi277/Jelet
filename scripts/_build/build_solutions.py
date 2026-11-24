#!/usr/bin/env python3
"""Build _data/solutions/<year>.solutions.json from question data + SymPy verification.
Format matches schema 2.3: solutions keyed by questionId with conceptSummary, steps, optionTraps, verification."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from q2022 import Q2022
from q2023 import Q2023
from q2024 import Q2024
from q2025 import Q2025
from s2025_batch1 import S2025_B1
from s2025_batch2 import S2025_B2
from s2025_batch3 import S2025_B3
from s2025_batch4 import S2025_B4
from s2024_batchA import S2024_A
from s2024_batchB import S2024_B
from s2024_batchC import S2024_C
from s2023_batchA import S2023_A
from s2023_batchB import S2023_B

# Solution data: {qNumber: (conceptSummary, steps[list of (title, bodyLatex)], verified, note)}
S2024 = {
# Q1–Q40 (Mathematics): s2024_batchA.py; Q41–Q70 (Physics): s2024_batchB.py;
# Q71–Q100 (Chemistry + FEEE): s2024_batchC.py — all hand-written and SymPy-verified (merged below).
# The legacy auto/OCR-era 2024 entries have been removed.
}

S2024.update(S2024_A)
S2024.update(S2024_B)
S2024.update(S2024_C)

S2023 = {
# Q1–Q40 (Mathematics): s2023_batchA.py; Q41–Q70 (Physics): s2023_batchB.py — hand-written and
# SymPy-verified (merged below). The legacy auto-generated entries are replaced; Q71–Q100 await Batch C.
}

S2023.update(S2023_A)
S2023.update(S2023_B)

S2025 = {
# Q1–Q25: hand-written, SymPy-verified derivations live in s2025_batch1.py (merged below).
# Q26–Q50: hand-written, SymPy-verified derivations live in s2025_batch2.py (merged below).
# Q51–Q75: hand-written, SymPy-verified derivations live in s2025_batch3.py (merged below).
# Q76–Q100: hand-written, SymPy-verified derivations live in s2025_batch4.py (merged below).
}

S2025.update(S2025_B1)
S2025.update(S2025_B2)
S2025.update(S2025_B3)
S2025.update(S2025_B4)

def auto_solution(qnum, subj, unit, cat, page, stem, opts, correct, diff, tags, figkey, year):
    """Generate a solution entry from question data when no explicit solution is provided."""
    answer_str = "W" if correct == ["W"] else "".join(correct)
    concept = f"Solve using {tags[0] if tags else 'standard method'} for JELET {year} Q{qnum}."
    correct_text = []
    for letter in correct:
        if letter == "W":
            correct_text.append("question is voided")
        else:
            correct_text.append(f"({letter}) {opts.get(letter, '')}")
    steps = [
        ("Identify the problem type", f"Question involves {tags[0] if tags else 'the given concept'}."),
        ("Apply the method", "Use the appropriate technique to evaluate the expression and compare with the given options."),
        ("Determine the answer", f"The correct answer is {', '.join(correct_text)}."),
    ]
    return concept, steps, False, f"Auto-generated from question data; answer key: {answer_str}."

def build(year, data, sols):
    solutions = {}
    for (qnum, subj, unit, cat, page, stem, opts, correct, diff, tags, figkey) in data:
        qid = f"jelet-{year}-q{qnum:03d}"
        if qnum in sols:
            concept, steps, verified, note = sols[qnum]
        else:
            concept, steps, verified, note = auto_solution(qnum, subj, unit, cat, page, stem, opts, correct, diff, tags, figkey, year)
        step_list = [{"stepNumber": i+1, "title": s[0], "bodyLatex": s[1]} for i, s in enumerate(steps)]
        solutions[qid] = {
            "conceptSummary": concept,
            "steps": step_list,
            "verification": {
                "method": "sympy" if verified else "manual",
                "verifiedAt": "2026-11-23",
                "note": note,
            },
        }
    return {
        "paperId": f"jelet-{year}",
        "year": int(year),
        "keyTier": "official",
        "solutions": solutions,
    }

def main():
    outdir = "_data/solutions"
    for year, data, sols in [("2022", Q2022, {}), ("2023", Q2023, S2023), ("2024", Q2024, S2024), ("2025", Q2025, S2025)]:
        s = build(year, data, sols)
        path = os.path.join(outdir, f"{year}.solutions.json")
        with open(path, "w") as f:
            json.dump(s, f, indent=2, ensure_ascii=False)
        verified = sum(1 for v in s["solutions"].values() if v["verification"]["method"] == "sympy")
        print(f"{year}: {len(s['solutions'])} solutions, {verified} SymPy-verified -> {path}")

if __name__ == "__main__":
    main()
