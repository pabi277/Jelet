"""Synthetic infrastructure fixtures only — not reviewed study content."""
import json
import tempfile
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("gate", Path(__file__).resolve().parents[1] / "scripts/verify_corpus.py")
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def fixture():
    return {
        "conceptPrimer": [{"prdId": f"M01-PRD0{i}", "heading": "Fixture heading", "proseLatex": "Synthetic fixture."} for i in (1, 2)],
        "memoryHooks": ["Synthetic hook."], "commonMistakes": ["Synthetic mistake."],
        "examChecklist": ["Synthetic check."], "furtherReading": [],
        "provenance": {"draftedBy": "AI-assisted draft", "reviewedBy": "Test fixture only", "reviewedAt": "2026-11-25"},
    }


class StudyPackGateTests(unittest.TestCase):
    def validate(self, pack, uid="M01"):
        gate.errors.clear()
        gate.validate_study_pack(pack, uid)
        return list(gate.errors)

    def test_valid(self):
        self.assertEqual(self.validate(fixture()), [])

    def test_malformed(self):
        for key, value in [("unknown", True), ("memoryHooks", "not an array"),
                           ("conceptPrimer", [None, None]), ("provenance", None),
                           ("commonMistakes", [3]), ("examChecklist", [])]:
            with self.subTest(key=key):
                pack = fixture()
                pack[key] = value
                self.assertTrue(self.validate(pack))
        self.assertTrue(self.validate(None))

    def test_ids_and_review(self):
        pack = fixture()
        pack["conceptPrimer"][1]["prdId"] = "M01-PRD01"
        self.assertTrue(any("duplicate" in e for e in self.validate(pack)))
        self.assertTrue(self.validate(fixture(), "M12"))
        for key, value in [("reviewedBy", " "), ("reviewedAt", "2026-02-30"),
                           ("draftedBy", "Owner authored")]:
            pack = fixture()
            pack["provenance"][key] = value
            self.assertTrue(self.validate(pack))

    def test_reading_no_paths_or_urls(self):
        for book in ["", "private_refs/book.pdf", "C:\\book", "https://drive.google.com/book", "book.epub", "../book"]:
            pack = fixture()
            pack["furtherReading"] = [{"book": book, "author": "Synthetic author", "chapters": "1–2, 4", "note": "Synthetic note."}]
            self.assertTrue(self.validate(pack), book)

    def test_search_text(self):
        text = gate.study_pack_search_text(fixture())
        for word in ["memory hook", "common mistake", "exam checklist", "fixture heading", "check"]:
            self.assertIn(word, text)
        self.assertNotIn("Test fixture only", text)

    def test_sidecar_registry_index_and_duplicate(self):
        original_data = gate.DATA
        manifest = {"units": [{"unitId": uid} for uid in sorted(gate.CANONICAL_UNITS)]}
        try:
            with tempfile.TemporaryDirectory() as tmp:
                gate.DATA = tmp
                units = Path(tmp) / "units"
                units.mkdir()
                pack = fixture()
                sidecar = units / "M01.studyPack.json"
                index = units / "studypack-index.json"
                sidecar.write_text(json.dumps(pack))
                index.write_text(json.dumps({"M01": gate.study_pack_search_text(pack)}))
                def run():
                    gate.errors.clear()
                    gate.check_study_packs(manifest)
                    return list(gate.errors)
                self.assertEqual(run(), [])
                index.write_text("{}")
                self.assertTrue(any("stale/invalid" in e for e in run()))
                index.write_text(json.dumps({"M01": gate.study_pack_search_text(pack)}))
                (units / "M01.json").write_text(json.dumps({"studyPack": pack}))
                self.assertTrue(any("duplicate" in e for e in run()))
                (units / "M01.json").unlink()
                sidecar.rename(units / "M12.studyPack.json")
                self.assertTrue(any("42-id registry" in e for e in run()))
        finally:
            gate.DATA = original_data
            gate.errors.clear()


if __name__ == "__main__":
    unittest.main()
