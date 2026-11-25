import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import katex from '../assets/vendor/katex/katex.mjs';
import { renderLatex } from '../assets/js/core/math.js';

function strings(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

for (const uid of ['M01', 'C03', 'E05']) {
  test(`${uid} authoring candidate has honest blank review and valid offline KaTeX`, () => {
    const pack = JSON.parse(readFileSync(new URL(`../docs/phases/phase-13/drafts/${uid}.studyPack.draft.json`, import.meta.url)));
    assert.equal(pack.provenance.draftedBy, 'AI-assisted draft');
    assert.equal(pack.provenance.reviewedBy, '');
    assert.equal(pack.provenance.reviewedAt, '');
    assert.equal(pack.conceptPrimer.length, 4);
    let expressions = 0;
    for (const text of strings(pack)) {
      assert.equal((text.match(/(?<!\\)\$/g) || []).length % 2, 0, 'balanced dollar delimiters');
      assert.doesNotMatch(text, /[\x00-\x08\x0b\x0c\x0e-\x1f\t\r]/);
      assert.doesNotMatch(renderLatex(text), /katex-error/);
      for (const match of text.matchAll(/\$\$([\s\S]+?)\$\$|\$((?:\\.|[^$\\])+)\$/g)) {
        assert.doesNotThrow(() => katex.renderToString(match[1] ?? match[2], { throwOnError: true, trust: false, strict: 'error' }));
        expressions++;
      }
    }
    assert.ok(expressions >= 10, 'substantive math is parsed, not silently treated as prose');
  });
}

test('Owner review document is reproducible from the candidate JSON, with no approvals added', () => {
  assert.match(execFileSync('python3', ['scripts/build_studypack_review.py', '--check'], {
    cwd: new URL('../', import.meta.url), encoding: 'utf8',
  }), /PASS/);
});
