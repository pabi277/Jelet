#!/usr/bin/env python3
"""Build _data/manifest.json aggregating all corpus artifacts."""
import json, os

KEY_REF = {
    "2022": {"keyTier": "verified-derived", "keyDocumentRef": "Independent solve of the official 2022 Set-A booklet + SymPy re-derivation of all 100 items (_a22/_b22/_c22); no WBJEEB 2022 key archived", "examDate": "2022-07-10"},
    "2023": {"keyTier": "official", "keyDocumentRef": "JEEB/Reg-267/23 (03-08-2023)", "examDate": "2023-07-16"},
    "2024": {"keyTier": "official", "keyDocumentRef": "WBE/Ex-71 (01-08-2024)", "examDate": "2024-07-14"},
    "2025": {"keyTier": "official", "keyDocumentRef": "JEEB/Reg-171/25 (16-11-2025)", "examDate": "2025-10-18"},
}
VOIDED = {"2022": [7], "2023": [6, 46, 88, 94], "2024": [49, 58], "2025": [41, 79, 84]}

papers = []
total_markable = 0
for year in ["2022", "2023", "2024", "2025"]:
    ref = KEY_REF[year]
    voided = VOIDED[year]
    markable = 100 - len(voided)
    total_markable += markable
    papers.append({
        "paperId": f"jelet-{year}",
        "year": int(year),
        "title": f"JELET {year} · Paper I",
        "examDate": ref["examDate"],
        "durationMinutes": 120,
        "maxMarks": 120,
        "maxTwelfths": 1440,
        "questionCount": 100,
        "voidedQuestions": voided,
        "keyTier": ref["keyTier"],
        "keyDocumentRef": ref["keyDocumentRef"],
        "bookletSeries": "A",
        "officialPdfSha256": None,
        "dataFile": f"./_data/papers/{year}.json",
        "solutionsFile": f"./_data/solutions/{year}.solutions.json",
        "packBytesEstimate": 420000,
    })

units = [
    {"unitId": u, "subjectId": s, "officialCode": c, "title": t}
    for (u, s, c, t, *_ ) in [
        ("M01","MATH","Math-A","Matrices up to Order 3"),
        ("M02","MATH","Math-B","Determinants up to Order 3"),
        ("M03","MATH","Math-C","Complex Numbers"),
        ("M04","MATH","Math-D","Co-ordinate Geometry (2D)"),
        ("M05","MATH","Math-E","Vector Algebra"),
        ("M06","MATH","Math-F","Differential Calculus"),
        ("M07","MATH","Math-G","Application of Derivative"),
        ("M08","MATH","Math-H","Partial Differentiation"),
        ("M09","MATH","Math-I","Integral Calculus"),
        ("M10","MATH","Math-J","Ordinary Differential Equations"),
        ("M11","MATH","Math-K","Probability"),
        ("P01","PHYS","Phys-A","Units, Dimensions & Measurement"),
        ("P02","PHYS","Phys-B","Kinematics"),
        ("P03","PHYS","Phys-C","Laws of Motion"),
        ("P04","PHYS","Phys-D","Work, Power & Energy"),
        ("P05","PHYS","Phys-E","Gravitation"),
        ("P06","PHYS","Phys-F","Elasticity"),
        ("P07","PHYS","Phys-G","Surface Tension"),
        ("P08","PHYS","Phys-H","Fluid Mechanics / Hydrostatics"),
        ("P09","PHYS","Phys-I","Thermal Expansion of Solids"),
        ("P10","PHYS","Phys-J","Transmission of Heat"),
        ("P11","PHYS","Phys-K","Thermodynamics"),
        ("P12","PHYS","Phys-L","Reflection of Light"),
        ("P13","PHYS","Phys-M","Refraction of Light"),
        ("P14","PHYS","Phys-N","Lens"),
        ("P15","PHYS","Phys-O","Photoelectricity"),
        ("C01","CHEM","Chem-A","Atomic Structure"),
        ("C02","CHEM","Chem-B","Chemical Bonding"),
        ("C03","CHEM","Chem-C","Acids, Bases & Salts"),
        ("C04","CHEM","Chem-D","Oxidation, Reduction & Electrochemistry"),
        ("C05","CHEM","Chem-E","Chemical Equilibrium"),
        ("C06","CHEM","Chem-F","Metallurgy"),
        ("C07","CHEM","Chem-G","Water"),
        ("C08","CHEM","Chem-H","Organic Chemistry"),
        ("E01","FEEE","FEEE-A","Electrical Components & Measuring Instruments"),
        ("E02","FEEE","FEEE-B","Transformers"),
        ("E03","FEEE","FEEE-C","Electrical Machines"),
        ("E04","FEEE","FEEE-D","DC Sources & Circuits"),
        ("E05","FEEE","FEEE-E","AC Sources & Circuits"),
        ("E06","FEEE","FEEE-F","Basic Semiconductor Devices"),
        ("E07","FEEE","FEEE-G","Analog Circuits (OP-AMP)"),
        ("E08","FEEE","FEEE-H","Digital Electronics"),
    ]
]

manifest = {
    "schemaVersion": "3.0.0",
    "generatedAt": "2026-11-23T00:00:00Z",
    "syllabusBulletinRef": "WBJEEB JELET-2026 Information Bulletin (2026-03-18)",
    "totals": {
        "papers": 4,
        "questions": 400,
        "markableQuestions": total_markable,
        "unmarkableQuestions": 400 - total_markable,
        "units": 42,
    },
    "papers": papers,
    "units": units,
    "practiceSets": [],
}

outdir = "_data"
path = os.path.join(outdir, "manifest.json")
with open(path, "w") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)
print(f"Manifest written: {path}")
print(f"  papers: {manifest['totals']['papers']}, questions: {manifest['totals']['questions']}")
print(f"  markable: {manifest['totals']['markableQuestions']}, voided: {manifest['totals']['unmarkableQuestions']}")
print(f"  units: {manifest['totals']['units']}")
