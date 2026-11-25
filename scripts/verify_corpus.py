#!/usr/bin/env python3
"""Gate 1: verify_corpus.py — Validate the Phase 03 official PDF corpus (2022-2025).

Checks:
  1. Manifest structure and totals
  2. Each paper has exactly 100 questions
  3. Every question has required fields per schema
  4. Answer keys match the official WBJEEB Final Answer Key
  5. All figure references resolve to existing SVG files
  6. All unit references resolve to existing unit files
  7. Twelfths values are correct for category
  8. Voided questions are properly marked
  9. No control characters in any parsed (json.loads) string value across
     _data/**/*.json — catches LaTeX commands whose leading backslash was
     swallowed by a Python escape (e.g. "\\vec" -> VT + "ec", "\\tan" -> TAB + "an",
     "\\begin" -> BS + "egin", "\\alpha" -> BEL + "lpha", "\\frac" -> FF + "rac").
 10. No orphaned figure SVGs (every SVG is referenced by a stem or option figure).
 11. Unit mapping consistency: each question appears in exactly one unit's pyqIds,
     equal to its own unitId.
 12. Phase 13 `studyPack` validation: every unit file carrying the optional
     `studyPack` block must use known keys only, well-formed primer/reading/
     provenance entries, unit-wide-unique `prdId`s, a non-empty provenance
     chain, and further-reading pointers that stay title/chapter-only (no URLs,
     file paths, or Drive references). Every `_data/units/*.json` file must also
     belong to the 42-id manifest registry — an orphan unit file may never
     carry a studyPack.

Exit code 0 = all gates pass, 1 = failure.
"""
import xml.etree.ElementTree as ET
import glob, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "_data")

# Answer keys (2023-2025 from official WBJEEB PDFs; 2022 derived via Dual-solver + SymPy)
ANSWERS = {
"2022": {1:"A",2:"A",3:"C",4:"B",5:"B",6:"D",7:"W",8:"A",9:"C",10:"B",11:"B",12:"A",13:"B",14:"C",15:"C",16:"C",17:"D",18:"A",19:"A",20:"D",21:"D",22:"B",23:"C",24:"D",25:"D",26:"C",27:"B",28:"C",29:"A",30:"C",31:"AB",32:"AB",33:"AC",34:"AC",35:"BC",36:"ABD",37:"AD",38:"CD",39:"AB",40:"AC",41:"C",42:"A",43:"D",44:"A",45:"C",46:"B",47:"D",48:"D",49:"D",50:"A",51:"B",52:"B",53:"A",54:"B",55:"D",56:"C",57:"B",58:"B",59:"C",60:"D",61:"C",62:"C",63:"B",64:"C",65:"B",66:"ABD",67:"AB",68:"ABD",69:"ABCD",70:"B",71:"B",72:"A",73:"A",74:"C",75:"A",76:"A",77:"C",78:"D",79:"A",80:"A",81:"A",82:"B",83:"A",84:"B",85:"D",86:"CD",87:"A",88:"AB",89:"CD",90:"BCD",91:"B",92:"A",93:"A",94:"A",95:"D",96:"B",97:"C",98:"C",99:"B",100:"B"},
"2023": {1:"D",2:"D",3:"C",4:"A",5:"A",6:"W",7:"A",8:"D",9:"D",10:"C",11:"B",12:"B",13:"D",14:"C",15:"A",16:"B",17:"D",18:"C",19:"A",20:"A",21:"B",22:"C",23:"A",24:"A",25:"D",26:"C",27:"D",28:"A",29:"B",30:"A",31:"AC",32:"BD",33:"A",34:"D",35:"B",36:"AC",37:"BC",38:"BD",39:"BC",40:"ACD",41:"A",42:"D",43:"B",44:"C",45:"B",46:"W",47:"B",48:"B",49:"B",50:"A",51:"B",52:"D",53:"B",54:"D",55:"B",56:"C",57:"D",58:"A",59:"B",60:"A",61:"D",62:"A",63:"A",64:"D",65:"A",66:"ACD",67:"BD",68:"ACD",69:"AC",70:"ACD",71:"A",72:"C",73:"B",74:"C",75:"D",76:"C",77:"D",78:"C",79:"A",80:"C",81:"C",82:"A",83:"C",84:"A",85:"D",86:"AC",87:"BC",88:"W",89:"CD",90:"ABC",91:"B",92:"B",93:"A",94:"W",95:"A",96:"A",97:"A",98:"C",99:"B",100:"B"},
"2024": {1:"A",2:"C",3:"A",4:"C",5:"B",6:"B",7:"B",8:"B",9:"B",10:"B",11:"B",12:"B",13:"B",14:"A",15:"C",16:"D",17:"B",18:"B",19:"B",20:"A",21:"C",22:"C",23:"D",24:"D",25:"B",26:"B",27:"A",28:"A",29:"C",30:"B",31:"ABC",32:"AB",33:"AB",34:"AD",35:"CD",36:"AC",37:"D",38:"C",39:"ABCD",40:"BC",41:"B",42:"A",43:"B",44:"A",45:"B",46:"D",47:"B",48:"B",49:"W",50:"A",51:"D",52:"A",53:"D",54:"A",55:"C",56:"A",57:"C",58:"W",59:"C",60:"A",61:"A",62:"D",63:"B",64:"D",65:"A",66:"B",67:"BC",68:"A",69:"C",70:"A",71:"C",72:"A",73:"C",74:"C",75:"A",76:"D",77:"B",78:"D",79:"C",80:"D",81:"B",82:"B",83:"D",84:"A",85:"B",86:"AD",87:"BCD",88:"BC",89:"CD",90:"AC",91:"D",92:"B",93:"B",94:"C",95:"C",96:"B",97:"B",98:"D",99:"A",100:"C"},
"2025": {1:"D",2:"C",3:"A",4:"B",5:"A",6:"A",7:"D",8:"D",9:"C",10:"B",11:"C",12:"C",13:"B",14:"B",15:"C",16:"B",17:"A",18:"A",19:"B",20:"C",21:"B",22:"D",23:"A",24:"C",25:"D",26:"A",27:"B",28:"C",29:"A",30:"B",31:"ABCD",32:"BCD",33:"AD",34:"AD",35:"ABCD",36:"BD",37:"AD",38:"AB",39:"AC",40:"B",41:"W",42:"B",43:"C",44:"C",45:"C",46:"B",47:"C",48:"C",49:"C",50:"A",51:"A",52:"A",53:"D",54:"B",55:"A",56:"D",57:"D",58:"B",59:"A",60:"D",61:"A",62:"D",63:"C",64:"B",65:"A",66:"D",67:"CD",68:"BD",69:"BCD",70:"BCD",71:"D",72:"B",73:"C",74:"C",75:"B",76:"A",77:"C",78:"C",79:"W",80:"D",81:"A",82:"C",83:"A",84:"W",85:"B",86:"AD",87:"CD",88:"ABC",89:"B",90:"BD",91:"A",92:"B",93:"D",94:"A",95:"B",96:"A",97:"D",98:"B",99:"B",100:"B"},
}

VOIDED = {"2022": {7}, "2023": {6, 46, 88, 94}, "2024": {49, 58}, "2025": {41, 79, 84}}

REQUIRED_Q_FIELDS = {"id", "qNumber", "subjectId", "unitId", "category",
                     "fullTwelfths", "negativeTwelfths", "pdfPage",
                     "stemLatex", "options", "key", "difficulty", "tags"}

# ---------------------------------------------------------------------------
# Phase 13: optional per-unit `studyPack` schema (docs/phases/phase-13/plan.md
# §2.1 / §2.2). Additive and backward compatible: absent = no checks; present =
# strictly validated (never trust an unvalidated addition to _data/).
# ---------------------------------------------------------------------------
STUDY_PACK_KEYS = {"conceptPrimer", "memoryHooks", "commonMistakes",
                   "examChecklist", "furtherReading", "provenance"}
STUDY_PACK_PRIMER_KEYS = {"prdId", "heading", "proseLatex"}
STUDY_PACK_READING_KEYS = {"book", "author", "chapters", "note"}
STUDY_PACK_PROVENANCE_KEYS = {"draftedBy", "reviewedBy", "reviewedAt"}
# furtherReading must stay a title/chapter pointer only: no URLs, no Drive
# links or folder/file IDs, no local file paths, no book file extensions
# (Zero-Copyright GitHub Law, AGENTS.md §5.2).
STUDY_PACK_SOURCE_RE = re.compile(
    r"(?i)(https?://|www\.|drive\.google|docs\.google|\.pdf\b|\.zip\b|\.epub\b"
    r"|\.7z\b|[A-Za-z]:[\\/]|/[A-Za-z0-9_\-]+[\\/])"
)

errors = []
warnings = []

def check(cond, msg):
    if not cond:
        errors.append(msg)

def load_json(path):
    with open(path, "r") as f:
        return json.load(f)

# Control characters that must never appear in a parsed JSON string value.
CONTROL_CHAR_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\t]")
# A CR anywhere, or a LF glued to a letter, means "\right" / "\neq" / "\nu"
# lost its backslash to a Python "\r" / "\n" escape.
SWALLOWED_NL_RE = re.compile(r"\r|\n(?=[A-Za-z])")

def _iter_strings(node, path):
    if isinstance(node, dict):
        for k, v in node.items():
            yield from _iter_strings(v, f"{path}.{k}")
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from _iter_strings(v, f"{path}[{i}]")
    elif isinstance(node, str):
        yield path, node

def check_control_chars():
    """Gate 9: parse every _data/**/*.json with json.loads and reject control chars."""
    files = sorted(glob.glob(os.path.join(DATA, "**", "*.json"), recursive=True))
    hits = 0
    for path in files:
        rel = os.path.relpath(path, ROOT)
        with open(path, "r", encoding="utf-8") as fh:
            doc = json.loads(fh.read())
        for jpath, text in _iter_strings(doc, "$"):
            for rx in (CONTROL_CHAR_RE, SWALLOWED_NL_RE):
                for m in rx.finditer(text):
                    hits += 1
                    ctx = text[max(0, m.start() - 12):m.end() + 12]
                    check(False, f"{rel}: control char {m.group()!r} at {jpath}: {ctx!r}")
    print(f"✓ Control chars: {hits} found across {len(files)} JSON files (json.loads-parsed)")

def _require_str(value, label, unit_id):
    check(isinstance(value, str) and value.strip(),
          f"{unit_id}: studyPack {label} must be a non-empty string")


def validate_study_pack(unit_id, unit):
    """Gate 12 (Phase 13 §2.2): validate the optional per-unit studyPack block."""
    sp = unit.get("studyPack")
    if sp is None:
        return
    check(isinstance(sp, dict), f"{unit_id}: studyPack must be an object")
    if not isinstance(sp, dict):
        return
    unknown = sorted(set(sp) - STUDY_PACK_KEYS)
    missing = sorted(STUDY_PACK_KEYS - set(sp))
    check(not unknown, f"{unit_id}: studyPack has unknown key(s) {unknown} (allowed: {sorted(STUDY_PACK_KEYS)})")
    check(not missing, f"{unit_id}: studyPack is missing key(s) {missing}")

    # conceptPrimer: 2-4 items, exact key set, prdId obeys <unitId>-PRDnn and is
    # unique across the unit (catches copy-paste drift between batch-authored packs).
    primer = sp.get("conceptPrimer")
    prd_ids = []
    if isinstance(primer, list) and 2 <= len(primer) <= 4:
        for i, item in enumerate(primer):
            ok = isinstance(item, dict) and set(item) == STUDY_PACK_PRIMER_KEYS
            check(ok, f"{unit_id}: studyPack.conceptPrimer[{i}] must have exactly {sorted(STUDY_PACK_PRIMER_KEYS)}")
            if ok:
                for field in ("prdId", "heading", "proseLatex"):
                    _require_str(item[field], f"conceptPrimer[{i}].{field}", unit_id)
                prd = item.get("prdId")
                if isinstance(prd, str):
                    check(bool(re.fullmatch(rf"{re.escape(unit_id)}-PRD\d{{2}}", prd)),
                          f"{unit_id}: primer prdId {prd!r} does not match the {unit_id}-PRDnn convention")
                    prd_ids.append(prd)
    else:
        check(False, f"{unit_id}: studyPack.conceptPrimer must be a list of 2-4 primer items")
    dupes = sorted({p for p in prd_ids if prd_ids.count(p) > 1})
    check(not dupes, f"{unit_id}: duplicate studyPack prdId(s) {dupes}")

    # memoryHooks / commonMistakes / examChecklist: flat lists of short strings.
    for list_key in ("memoryHooks", "commonMistakes", "examChecklist"):
        value = sp.get(list_key)
        ok = isinstance(value, list) and 2 <= len(value) <= 12 and all(
            isinstance(v, str) and v.strip() for v in value
        )
        check(ok, f"{unit_id}: studyPack.{list_key} must be a list of 2-12 non-empty strings")

    # furtherReading: 1-6 pointers, exact key set, no URL/path/Drive leakage.
    reading = sp.get("furtherReading")
    if isinstance(reading, list) and 1 <= len(reading) <= 6:
        for i, item in enumerate(reading):
            ok = isinstance(item, dict) and set(item) == STUDY_PACK_READING_KEYS
            check(ok, f"{unit_id}: studyPack.furtherReading[{i}] must have exactly {sorted(STUDY_PACK_READING_KEYS)}")
            if ok:
                for field in ("book", "author", "chapters", "note"):
                    _require_str(item[field], f"furtherReading[{i}].{field}", unit_id)
                    if isinstance(item[field], str):
                        check(not STUDY_PACK_SOURCE_RE.search(item[field]),
                              f"{unit_id}: furtherReading[{i}].{field} looks like a URL, file path or Drive pointer — book titles and chapter numbers only")
    else:
        check(False, f"{unit_id}: studyPack.furtherReading must be a list of 1-6 reading pointers")

    # provenance: honest chain, nothing blank.
    prov = sp.get("provenance")
    ok = isinstance(prov, dict) and set(prov) == STUDY_PACK_PROVENANCE_KEYS
    check(ok, f"{unit_id}: studyPack.provenance must have exactly {sorted(STUDY_PACK_PROVENANCE_KEYS)}")
    if ok:
        for field in ("draftedBy", "reviewedBy", "reviewedAt"):
            _require_str(prov[field], f"provenance.{field}", unit_id)


def main():
    # 1. Manifest
    manifest_path = os.path.join(DATA, "manifest.json")
    if not os.path.exists(manifest_path):
        print("FAIL: manifest.json not found")
        sys.exit(1)
    manifest = load_json(manifest_path)
    check(manifest.get("schemaVersion") == "3.0.0", "Manifest schemaVersion != 3.0.0")
    totals = manifest.get("totals", {})
    check(totals.get("papers") == 4, f"Manifest totals.papers = {totals.get('papers')}, expected 4")
    check(totals.get("questions") == 400, f"Manifest totals.questions = {totals.get('questions')}, expected 400")
    check(totals.get("units") == 42, f"Manifest totals.units = {totals.get('units')}, expected 42")
    print(f"✓ Manifest: {totals.get('papers')} papers, {totals.get('questions')} questions, {totals.get('units')} units")

    # 2-7. Papers
    all_qids = set()
    for paper_entry in manifest.get("papers", []):
        year = str(paper_entry["year"])
        paper_path = os.path.join(ROOT, paper_entry["dataFile"])
        if not os.path.exists(paper_path):
            check(False, f"Paper file missing: {paper_entry['dataFile']}")
            continue
        paper = load_json(paper_path)
        questions = paper.get("questions", [])
        check(len(questions) == 100, f"{year}: {len(questions)} questions, expected 100")
        print(f"✓ {year}: {len(questions)} questions")

        for q in questions:
            qid = q.get("id", "")
            qnum = q.get("qNumber", 0)
            all_qids.add(qid)

            # Field presence
            missing = REQUIRED_Q_FIELDS - set(q.keys())
            check(not missing, f"{qid}: missing fields {missing}")

            # Answer key match
            key = q.get("key", {})
            key_status = key.get("status", "")
            correct = key.get("correct", [])
            expected = ANSWERS[year][qnum]

            is_voided = qnum in VOIDED[year]
            check(key_status == "voided" if is_voided else key_status == "active",
                  f"{qid}: key.status = {key_status}, expected {'voided' if is_voided else 'active'}")

            if is_voided:
                check(correct == ["W"], f"{qid}: voided question correct = {correct}, expected ['W']")
            else:
                check(sorted(correct) == sorted(expected),
                      f"{qid}: answer mismatch — data={correct}, key={expected}")

            # Twelfths
            cat = q.get("category", 1)
            expected_ft = 12 if cat == 1 else 24
            expected_nt = 3 if cat == 1 else 0
            check(q.get("fullTwelfths") == expected_ft,
                  f"{qid}: fullTwelfths = {q.get('fullTwelfths')}, expected {expected_ft}")
            check(q.get("negativeTwelfths") == expected_nt,
                  f"{qid}: negativeTwelfths = {q.get('negativeTwelfths')}, expected {expected_nt}")

            # Options
            opts = q.get("options", [])
            check(len(opts) == 4, f"{qid}: {len(opts)} options, expected 4")
            opt_ids = [o.get("id") for o in opts]
            check(opt_ids == ["A", "B", "C", "D"], f"{qid}: option ids = {opt_ids}")
            for o in opts:
                check("latex" in o, f"{qid}: option {o.get('id')} missing latex")

            # Figure references
            stem_fig = q.get("stemFigure")
            if stem_fig:
                fig_src = stem_fig.get("src", "")
                fig_path = os.path.join(ROOT, fig_src)
                check(os.path.exists(fig_path), f"{qid}: figure file missing: {fig_src}")
            # Per-option figures (graphical options): file must exist, be well-formed,
            # carry alt text and use theme tokens only (no raw hex colours).
            for o in opts:
                ofig = o.get("figure")
                if not ofig:
                    continue
                osrc = ofig.get("src", "")
                opath = os.path.join(ROOT, osrc)
                check(bool(ofig.get("alt")), f"{qid}: option {o.get('id')} figure missing alt text")
                if not os.path.exists(opath):
                    check(False, f"{qid}: option {o.get('id')} figure file missing: {osrc}")
                    continue
                svg_text = open(opath, encoding="utf-8").read()
                try:
                    ET.fromstring(svg_text)
                except ET.ParseError as e:
                    check(False, f"{qid}: option {o.get('id')} figure is not valid XML: {e}")
                check("viewBox" in svg_text, f"{qid}: option {o.get('id')} figure lacks viewBox")
                check(not re.search(r"#[0-9a-fA-F]{3,8}\b", svg_text),
                      f"{qid}: option {o.get('id')} figure contains raw hex colour")

        # Count markable
        markable = sum(1 for q in questions if q.get("key", {}).get("status") == "active")
        print(f"  → markable: {markable}, voided: {100 - markable}")

    # 3. Unit files
    unit_count = 0
    study_pack_units = []
    for unit_meta in manifest.get("units", []):
        unit_id = unit_meta["unitId"]
        unit_path = os.path.join(DATA, "units", f"{unit_id}.json")
        if not os.path.exists(unit_path):
            check(False, f"Unit file missing: {unit_path}")
            continue
        unit_count += 1
        unit = load_json(unit_path)
        check(unit.get("unitId") == unit_id, f"{unit_id}: unitId mismatch")
        check("pyqIds" in unit, f"{unit_id}: missing pyqIds")
        check("sections" in unit, f"{unit_id}: missing sections")
        # Validate pyqIds exist
        for pid in unit.get("pyqIds", []):
            check(pid in all_qids, f"{unit_id}: pyqId {pid} not found in papers")
        # Gate 12: optional studyPack block (validated only when present)
        validate_study_pack(unit_id, unit)
        if unit.get("studyPack") is not None:
            study_pack_units.append(unit_id)
    print(f"✓ Units: {unit_count}/42 files present")
    if study_pack_units:
        print(f"✓ Study Packs: {len(study_pack_units)}/42 validated ({', '.join(study_pack_units)})")

    # 3b. Unit-file registry: every JSON under _data/units must belong to the
    #     42-id manifest registry — an orphan/stray unit file must never carry
    #     a studyPack (or any truth) outside the canonical set.
    manifest_unit_ids = {u.get("unitId") for u in manifest.get("units", [])}
    for unit_path in sorted(glob.glob(os.path.join(DATA, "units", "*.json"))):
        stem = os.path.splitext(os.path.basename(unit_path))[0]
        check(stem in manifest_unit_ids,
              f"Unit file {os.path.relpath(unit_path, ROOT)} is not in the 42-unit manifest registry")


    # 4. Solutions
    for paper_entry in manifest.get("papers", []):
        year = str(paper_entry["year"])
        sol_path = os.path.join(ROOT, paper_entry["solutionsFile"])
        if not os.path.exists(sol_path):
            check(False, f"Solutions file missing: {paper_entry['solutionsFile']}")
            continue
        sol = load_json(sol_path)
        sols = sol.get("solutions", {})
        check(len(sols) == 100, f"{year}: {len(sols)} solutions, expected 100")
        for qid, s in sols.items():
            check(qid in all_qids, f"{year}: solution for unknown qid {qid}")
            check("conceptSummary" in s, f"{qid}: missing conceptSummary")
            check("steps" in s, f"{qid}: missing steps")
            check("verification" in s, f"{qid}: missing verification")
        print(f"✓ {year} solutions: {len(sols)} entries")

    # 9. Control characters in parsed JSON strings
    check_control_chars()

    # 5. Figure count
    fig_count = 0
    for year_dir in ["2022", "2023", "2024", "2025"]:
        fig_dir = os.path.join(DATA, "figures", year_dir)
        if os.path.isdir(fig_dir):
            fig_count += len([f for f in os.listdir(fig_dir) if f.endswith(".svg")])
    print(f"✓ Figures: {fig_count} SVG files")

    # 10. Orphaned figures: every SVG on disk must be referenced by a stemFigure
    #     or an options[i].figure (stale answer-spoiler stems must be deleted).
    referenced = set()
    for paper_path in glob.glob(os.path.join(DATA, "papers", "*.json")):
        for q in load_json(paper_path).get("questions", []):
            figs = [q.get("stemFigure")] + [o.get("figure") for o in q.get("options", [])]
            for fg in figs:
                if fg and fg.get("src"):
                    referenced.add(os.path.normpath(os.path.join(ROOT, fg["src"])))
    on_disk = {os.path.normpath(p) for p in glob.glob(os.path.join(DATA, "figures", "*", "*.svg"))}
    orphans = sorted(os.path.relpath(p, ROOT) for p in on_disk - referenced)
    check(not orphans, f"Orphaned figure SVG(s) not referenced by any question: {orphans}")
    if not orphans:
        print(f"✓ Orphaned figures: 0 (all {len(on_disk)} SVGs referenced)")

    # 11. Unit mapping consistency: every question is listed in exactly one unit's
    #     pyqIds, and that unit is the question's own unitId (catches a paper unitId
    #     remap that was not propagated to _data/units, or vice versa).
    q_unit = {}
    for paper_path in glob.glob(os.path.join(DATA, "papers", "*.json")):
        for q in load_json(paper_path).get("questions", []):
            q_unit[q["id"]] = q.get("unitId")
    listed = {}
    for unit_path in glob.glob(os.path.join(DATA, "units", "*.json")):
        u = load_json(unit_path)
        for pid in u.get("pyqIds", []):
            listed.setdefault(pid, []).append(u.get("unitId"))
    multi = sorted(p for p, us in listed.items() if len(us) > 1)
    wrong = sorted((p, us[0], q_unit.get(p)) for p, us in listed.items() if len(us) == 1 and q_unit.get(p) != us[0])
    unlisted = sorted(p for p in q_unit if p not in listed)
    check(not multi, f"Question(s) listed in more than one unit: {multi[:10]}")
    check(not wrong, f"Unit pyqIds disagree with paper unitId (qid, unit file, paper unitId): {wrong[:10]}")
    check(not unlisted, f"Question(s) not listed in any unit's pyqIds: {unlisted[:10]}")
    if not (multi or wrong or unlisted):
        print(f"✓ Unit mapping: {len(q_unit)} questions, each in exactly its own unit's pyqIds")

    # Report
    print()
    if errors:
        print(f"❌ verify_corpus FAILED: {len(errors)} error(s)")
        for e in errors:
            print(f"   - {e}")
        sys.exit(1)
    else:
        print(f"✅ verify_corpus PASSED: all {len(all_qids)} questions validated, {fig_count} figures, {unit_count} units, solutions complete.")
        sys.exit(0)

if __name__ == "__main__":
    main()
