#!/usr/bin/env python3
"""build_study_packs.py — Phase 13 studyPack applier.

Merges every draft in `scripts/_build/study_packs/<unitId>.json` onto the
matching shipped unit file `_data/units/<unitId>.json`, touching ONLY the
`studyPack` key (all other keys are preserved in their original order, so the
diff between runs shows exactly the study-pack delta).

Idempotent: running twice produces byte-identical files.

Usage:
    python3 scripts/_build/build_study_packs.py            # apply all drafts
    python3 scripts/_build/build_study_packs.py M01 C03    # apply specific units

Then always run the four gates (plan §3 step ⑥):
    python3 scripts/verify_corpus.py
    python3 scripts/verify_solutions_sympy.py
    node scripts/check_tokens_and_links.mjs
    node --test "tests/*.test.mjs"
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from study_pack_loader import load_study_pack_drafts, write_unit_json

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main(argv):
    requested = set(argv)
    drafts = load_study_pack_drafts()
    if not drafts:
        print("No study pack drafts found.")
        return 0

    units_dir = os.path.join(ROOT, "_data", "units")
    applied = 0
    for unit_id in sorted(drafts):
        if requested and unit_id not in requested:
            continue
        unit_path = os.path.join(units_dir, f"{unit_id}.json")
        if not os.path.exists(unit_path):
            print(f"✗ SKIP {unit_id}: no unit file at {os.path.relpath(unit_path, ROOT)}")
            continue
        with open(unit_path, "r", encoding="utf-8") as fh:
            unit = json.load(fh)
        if unit.get("unitId") != unit_id:
            raise SystemExit(f"{unit_id}: unit file unitId {unit.get('unitId')!r} mismatch")
        pack = drafts[unit_id]
        unit["studyPack"] = pack
        write_unit_json(unit, units_dir)
        applied += 1
        print(
            f"✓ {unit_id}: studyPack applied "
            f"(primer {len(pack.get('conceptPrimer', []))}, hooks {len(pack.get('memoryHooks', []))}, "
            f"mistakes {len(pack.get('commonMistakes', []))}, checklist {len(pack.get('examChecklist', []))}, "
            f"reading {len(pack.get('furtherReading', []))})"
        )
    print(f"Applied {applied} study pack(s) from drafts.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
