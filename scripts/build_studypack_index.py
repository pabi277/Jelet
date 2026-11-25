#!/usr/bin/env python3
"""Derive the lightweight Learn search index. Run only after owner review.

Does not read books, produce prose, or certify mathematics/review authenticity.
"""
import json
from pathlib import Path
import verify_corpus as gate

units = Path(gate.DATA) / "units"
packs = {}
for path in sorted(units.glob("*.json")):
    if path.name == "studypack-index.json":
        continue
    doc = json.loads(path.read_text())
    sidecar = path.name.endswith(".studyPack.json")
    uid = path.name.removesuffix(".studyPack.json") if sidecar else path.stem
    if sidecar or (isinstance(doc, dict) and "studyPack" in doc):
        pack = doc if sidecar else doc["studyPack"]
        gate.check(uid not in packs, f"{uid}: duplicate inline/sidecar pack")
        gate.validate_study_pack(pack, uid)
        packs[uid] = pack
if gate.errors:
    raise SystemExit("\n".join(gate.errors))
index = {uid: gate.study_pack_search_text(pack) for uid, pack in sorted(packs.items())}
(units / "studypack-index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")
print(f"Indexed {len(index)} reviewed study packs")
