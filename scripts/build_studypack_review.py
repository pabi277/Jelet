#!/usr/bin/env python3
"""Render the original pilot candidates as an owner-readable review document.

No books, runtime content, provenance approvals or _data files are written.
Use --check to detect a stale review document without changing it.
"""
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
PHASE = ROOT / 'docs/phases/phase-13'
OUTPUT = PHASE / 'pilot-review.md'


def render():
    lines = [
        '# Phase 13 — original pilot candidates for owner review', '',
        '**Authoring document only — not part of the app corpus.**', '',
        'These are AI-assisted original candidates. No owner has reviewed or approved',
        'them yet; `reviewedBy` and `reviewedAt` are intentionally empty in each JSON.',
        'Private-reference checks are incomplete because of the access limits recorded',
        'in [the pilot evidence](batch-M01-C03-E05.md). No book prose was retained.', '',
        'Review the explanation level, mathematical conditions, usefulness of the hooks,',
        'and whether the mistake lists describe student errors rather than question-design',
        'traps. Book pointers are deliberately empty until title, author and chapter',
        'numbers can be confirmed from the actual books.', '',
        'The JSON files in `drafts/` are the source; regenerate this document with',
        '`python3 scripts/build_studypack_review.py` after changing a draft.', '',
    ]
    for uid in ('M01', 'C03', 'E05'):
        source = PHASE / 'drafts' / f'{uid}.studyPack.draft.json'
        pack = json.loads(source.read_text())
        title = json.loads((ROOT / '_data/units' / f'{uid}.json').read_text())['title']
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        lines += [f'## {uid} — {title}', '', f'Source: `drafts/{source.name}`', '',
                  f'SHA-256: `{digest}`', '', '### Concept Primer', '']
        for p in pack['conceptPrimer']:
            lines += [f'#### {p["prdId"]} · {p["heading"]}', '', p['proseLatex'], '']
        for field, heading in [('memoryHooks', 'Memory Hooks'), ('commonMistakes', 'Common Mistakes'),
                               ('examChecklist', 'Exam Checklist')]:
            lines += [f'### {heading}', '']
            lines += [f'- {item}' for item in pack[field]]
            lines.append('')
        lines += ['### Further Reading', '',
                  'No reading pointers proposed yet; bibliography/reference checks remain open.', '',
                  '### Review decision', '',
                  '- [ ] Original wording and student-friendly voice reviewed.',
                  '- [ ] Mathematical assumptions and relationships checked.',
                  '- [ ] Mistakes are useful and distinct from the existing WBJEEB trap list.',
                  '- [ ] Reference facts and accurate reading pointers checked (or an explicit alternative approved).',
                  '- [ ] Approved for publication after the remaining release gates.', '',
                  'Reviewer: **not supplied** · Review date: **not supplied**', '', '---', '']
    return '\n'.join(lines)


def main():
    content = render()
    if '--check' in sys.argv:
        if not OUTPUT.exists() or OUTPUT.read_text() != content:
            raise SystemExit('Stale pilot-review.md: run scripts/build_studypack_review.py')
        print('PASS: pilot review document matches all three draft hashes and text.')
    else:
        OUTPUT.write_text(content)
        print('Wrote docs/phases/phase-13/pilot-review.md (authoring only).')


if __name__ == '__main__':
    main()
