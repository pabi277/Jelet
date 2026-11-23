#!/usr/bin/env python3
"""Build _data/papers/<year>.json from the reconstructed question data.
Validates every question against the official WBJEEB Final Answer Key."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from q2024 import Q2024
from q2025 import Q2025

SECTIONS = {
    "MATH": {"title": "Mathematics", "qStart": 1, "qEnd": 40, "cat1Range": [1, 30], "cat2Range": [31, 40], "maxMarks": 50},
    "PHYS": {"title": "Physics", "qStart": 41, "qEnd": 70, "cat1Range": [41, 65], "cat2Range": [66, 70], "maxMarks": 35},
    "CHEM": {"title": "Chemistry", "qStart": 71, "qEnd": 90, "cat1Range": [71, 85], "cat2Range": [86, 90], "maxMarks": 25},
    "FEEE": {"title": "Fundamentals of Electrical & Electronics Engineering", "qStart": 91, "qEnd": 100, "cat1Range": [91, 100], "cat2Range": None, "maxMarks": 10},
}
KEY_REF = {
    "2024": {"keyTier": "official", "keyDocumentRef": "WBE/Ex-71 (01-08-2024)"},
    "2025": {"keyTier": "official", "keyDocumentRef": "JEEB/Reg-171/25 (16-11-2025)"},
}
# Official answer keys (parsed from PDFs)
ANSWERS = {
"2024": {1:"A",2:"C",3:"A",4:"C",5:"B",6:"B",7:"B",8:"B",9:"B",10:"B",11:"B",12:"B",13:"B",14:"A",15:"C",16:"D",17:"B",18:"B",19:"B",20:"A",21:"C",22:"C",23:"D",24:"D",25:"B",26:"B",27:"A",28:"A",29:"C",30:"B",31:"ABC",32:"AB",33:"AB",34:"AD",35:"CD",36:"AC",37:"D",38:"C",39:"ABCD",40:"BC",41:"B",42:"A",43:"B",44:"A",45:"B",46:"D",47:"B",48:"B",49:"W",50:"A",51:"D",52:"A",53:"D",54:"A",55:"C",56:"A",57:"C",58:"W",59:"C",60:"A",61:"A",62:"D",63:"B",64:"D",65:"A",66:"B",67:"BC",68:"A",69:"C",70:"A",71:"C",72:"A",73:"C",74:"C",75:"A",76:"D",77:"B",78:"D",79:"C",80:"D",81:"B",82:"B",83:"D",84:"A",85:"B",86:"AD",87:"BCD",88:"BC",89:"CD",90:"AC",91:"D",92:"B",93:"B",94:"C",95:"C",96:"B",97:"B",98:"D",99:"A",100:"C"},
"2025": {1:"D",2:"C",3:"A",4:"B",5:"A",6:"A",7:"D",8:"D",9:"C",10:"B",11:"C",12:"C",13:"B",14:"B",15:"C",16:"B",17:"A",18:"A",19:"B",20:"C",21:"B",22:"D",23:"A",24:"C",25:"D",26:"A",27:"B",28:"C",29:"A",30:"B",31:"ABCD",32:"BCD",33:"AD",34:"AD",35:"ABCD",36:"BD",37:"AD",38:"AB",39:"AC",40:"B",41:"W",42:"B",43:"C",44:"C",45:"C",46:"B",47:"C",48:"C",49:"C",50:"A",51:"A",52:"A",53:"D",54:"B",55:"A",56:"D",57:"D",58:"B",59:"A",60:"D",61:"A",62:"D",63:"C",64:"B",65:"A",66:"D",67:"CD",68:"BD",69:"BCD",70:"BCD",71:"D",72:"B",73:"C",74:"C",75:"B",76:"A",77:"C",78:"C",79:"W",80:"D",81:"A",82:"C",83:"A",84:"W",85:"B",86:"AD",87:"CD",88:"ABC",89:"B",90:"BD",91:"A",92:"B",93:"D",94:"A",95:"B",96:"A",97:"D",98:"B",99:"B",100:"B"},
}

def build(year, data):
    answers = ANSWERS[year]
    sections = []
    for sid in ["MATH","PHYS","CHEM","FEEE"]:
        sections.append({"subjectId": sid, "title": SECTIONS[sid]["title"],
                         "qStart": SECTIONS[sid]["qStart"], "qEnd": SECTIONS[sid]["qEnd"],
                         "cat1Range": SECTIONS[sid]["cat1Range"], "cat2Range": SECTIONS[sid]["cat2Range"],
                         "maxMarks": SECTIONS[sid]["maxMarks"]})
    questions = []
    voided = []
    for (qnum, subj, unit, cat, page, stem, opts, correct, diff, tags, figkey) in data:
        qid = f"jelet-{year}-q{qnum:03d}"
        key_ans = answers[qnum]
        # validate
        correct_sorted = sorted(correct) if correct != ["W"] else ["W"]
        key_sorted = sorted(key_ans) if key_ans != "W" else ["W"]
        if correct_sorted != key_sorted:
            print(f"  !! MISMATCH {year} Q{qnum}: data={correct} key={key_ans}")
        if qnum in ([49,58] if year=="2024" else [41,79,84]):
            voided.append(qnum)
        # twelfths
        if correct == ["W"]:
            full_t = 12 if cat == 1 else 24; neg_t = 3 if cat == 1 else 0; status = "voided"; correct_out = ["W"]
        else:
            full_t = 12 if cat == 1 else 24
            neg_t = 3 if cat == 1 else 0
            status = "active"; correct_out = correct
        opt_list = [{"id": k, "latex": v, "figure": None} for k, v in opts.items()]
        stem_fig = None
        if figkey:
            stem_fig = {"src": f"./_data/figures/{year}/{figkey}.svg", "alt": f"Figure for JELET {year} Q{qnum}", "width": 420, "height": 220, "themeAdaptive": True}
        questions.append({
            "id": qid, "qNumber": qnum, "subjectId": subj, "unitId": unit,
            "category": cat, "fullTwelfths": full_t, "negativeTwelfths": neg_t,
            "pdfPage": page, "stemLatex": stem, "stemFigure": stem_fig,
            "options": opt_list,
            "key": {"status": status, "correct": correct_out, "keyTier": "official",
                    "sourceRef": f"{KEY_REF[year]['keyDocumentRef']} (Set A, Q{qnum})"},
            "difficulty": diff, "tags": tags,
        })
    paper = {
        "paperId": f"jelet-{year}", "year": int(year), "bookletSeries": "A",
        "sections": sections, "questions": questions,
    }
    return paper, voided

def main():
    outdir = "_data/papers"
    manifest_papers = []
    total_q = 0
    for year, data in [("2024", Q2024), ("2025", Q2025)]:
        paper, voided = build(year, data)
        path = os.path.join(outdir, f"{year}.json")
        with open(path, "w") as f:
            json.dump(paper, f, indent=2, ensure_ascii=False)
        # verify count
        assert len(paper["questions"]) == 100, f"{year} has {len(paper['questions'])} questions"
        total_q += 100
        manifest_papers.append({
            "paperId": f"jelet-{year}", "year": int(year),
            "title": f"JELET {year} · Paper I",
            "examDate": f"{year}-10-18" if year=="2025" else "2024-07-14",
            "durationMinutes": 120, "maxMarks": 120, "maxTwelfths": 1440,
            "questionCount": 100, "voidedQuestions": voided,
            "keyTier": "official", "keyDocumentRef": KEY_REF[year]["keyDocumentRef"],
            "bookletSeries": "A",
            "dataFile": f"./_data/papers/{year}.json",
            "solutionsFile": f"./_data/solutions/{year}.solutions.json",
            "packBytesEstimate": 420000,
        })
        print(f"{year}: {len(paper['questions'])} questions, voided={voided} -> {path}")
    print(f"\nTotal questions: {total_q}")

if __name__ == "__main__":
    main()
