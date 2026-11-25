"""study_pack_loader.py — Phase 13 studyPack draft loader.

Study Packs are authored as reviewable, diff-able JSON drafts OUTSIDE `_data/`
(one file per unit in `scripts/_build/study_packs/<unitId>.json`), then merged
onto the shipped unit files by `build_study_packs.py` (or any future rebuild
path) — docs/phases/phase-13/plan.md §3 step ⑤.

Draft file shape:
    {"unitId": "M01", "studyPack": { ...schema per plan §2.1... }}

NOTE (important, recorded 2026-11-25): `build_units.py` is STALE relative to the
shipped unit files — the shipped JSONs carry a `practiceQuestions[]` key that
`build_units.py` does not generate, so a full `build_units.py` re-run would
destroy data. Do NOT regenerate units from it; apply study packs only through
`build_study_packs.py`, which surgically touches only the `studyPack` key and
preserves every other key byte-for-byte (indent 2, ensure_ascii=False, trailing
newline).
"""
import glob
import json
import os

_DRAFT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "study_packs")


def draft_dir():
    return _DRAFT_DIR


def load_study_pack_drafts():
    """Return {unitId: studyPack} for every draft in scripts/_build/study_packs/.

    Raises on malformed drafts (missing unitId mismatch, missing studyPack) so a
    bad draft can never silently pass through the pipeline.
    """
    drafts = {}
    for path in sorted(glob.glob(os.path.join(_DRAFT_DIR, "*.json"))):
        unit_id = os.path.splitext(os.path.basename(path))[0]
        with open(path, "r", encoding="utf-8") as fh:
            doc = json.load(fh)
        if doc.get("unitId") != unit_id:
            raise ValueError(f"{path}: unitId {doc.get('unitId')!r} != filename stem {unit_id!r}")
        if not isinstance(doc.get("studyPack"), dict):
            raise ValueError(f"{path}: missing non-empty 'studyPack' object")
        drafts[unit_id] = doc["studyPack"]
    return drafts


def attach_study_pack(unit_data, drafts):
    """Attach the unit's draft studyPack (if any) onto a unit dict (in place)."""
    draft = drafts.get(unit_data.get("unitId"))
    if draft is not None:
        unit_data["studyPack"] = draft
    return unit_data


def write_unit_json(unit_data, units_dir):
    """Serialize a unit dict exactly the way the shipped unit files are formatted."""
    path = os.path.join(units_dir, f"{unit_data['unitId']}.json")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(json.dumps(unit_data, indent=2, ensure_ascii=False) + "\n")
    return path
