import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildGroundTruthSystemPrompt } from '../assets/js/core/ai-vault.js';

const fixture = {
  conceptPrimer: [{ prdId: 'M01-PRD01', heading: 'Synthetic primer', proseLatex: 'Synthetic prose' }],
  memoryHooks: ['Synthetic hook'], commonMistakes: ['Synthetic mistake'], examChecklist: ['Synthetic check'],
  furtherReading: [{ book: 'DO NOT INJECT THIS BOOK', author: 'Fixture', chapters: '1', note: 'DO NOT INJECT THIS NOTE' }],
  provenance: { draftedBy: 'AI-assisted draft', reviewedBy: 'Test fixture only', reviewedAt: '2026-11-25' },
};

async function loader() {
  // Fresh module caches for each test, with no package/build changes needed.
  const source = readFileSync(new URL('../assets/js/core/data-loader.js', import.meta.url), 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Math.random()}`);
}

test('Study Packs: lean list, lazy/deduplicated fetch, shared tutor cache, safe absent/unknown units', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(url);
    if (url.endsWith('manifest.json')) return Response.json({ units: [{ unitId: 'M01' }, { unitId: 'C03' }] });
    if (url.endsWith('studypack-index.json')) return Response.json({ M01: 'Synthetic primer memory hook common mistake exam checklist' });
    if (url.endsWith('M01.studyPack.json')) return Response.json(fixture);
    return Response.json({ unitId: url.includes('M01') ? 'M01' : 'C03' });
  };
  try {
    const m = await loader();
    const units = await m.loadAllUnits();
    assert.equal(calls.length, 3);
    assert.ok(!calls.some((p) => /studyPack|studypack/.test(p)));
    await m.loadStudyPackIndex();
    assert.ok(!calls.some((p) => p.endsWith('.studyPack.json')));
    const [a, b] = await Promise.all([m.loadStudyPack('M01'), m.loadStudyPack('M01')]);
    assert.deepEqual(a, fixture);
    assert.equal(a, b);
    assert.equal(units[0].studyPack, a);
    assert.equal(calls.filter((p) => p.endsWith('.studyPack.json')).length, 1);
    assert.equal(await m.loadStudyPack('C03'), null);
    assert.equal(await m.loadStudyPack('../private'), null);
  } finally { globalThis.fetch = original; }
});

test('Study Pack transient failures retry, missing index does not block Learn', async () => {
  const original = globalThis.fetch;
  let failIndex = true;
  let failPack = true;
  globalThis.fetch = async (url) => {
    if (url.endsWith('manifest.json')) return Response.json({ units: [{ unitId: 'M01' }] });
    if (url.endsWith('studypack-index.json')) {
      if (failIndex) throw Error('offline');
      return Response.json({ M01: 'fixture' });
    }
    if (url.endsWith('.studyPack.json')) {
      if (failPack) return new Response('', { status: 503 });
      return Response.json(fixture);
    }
    return Response.json({ unitId: 'M01' });
  };
  try {
    const m = await loader();
    assert.deepEqual(await m.loadStudyPackIndex(), {});
    assert.equal(await m.loadStudyPack('M01'), null);
    failIndex = false;
    await assert.rejects(m.loadStudyPack('M01'), /503/);
    failPack = false;
    assert.deepEqual(await m.loadStudyPack('M01'), fixture);
  } finally { globalThis.fetch = original; }
});

test('Tutor uses only reviewed hooks/mistakes, bounded to 400 chars; legacy prompt unchanged', () => {
  const unit = { unitId: 'M01', officialCode: '1', title: 'Fixture', wbjeebTraps: [] };
  const base = buildGroundTruthSystemPrompt({ unit });
  const withPack = buildGroundTruthSystemPrompt({ unit: { ...unit, studyPack: fixture }, origin: 'lesson', sectionHeading: 'Synthetic primer' });
  assert.ok(withPack.includes('Memory hooks: Synthetic hook | Common mistakes: Synthetic mistake'));
  assert.ok(withPack.includes('Lesson section: Synthetic primer'));
  assert.ok(!withPack.includes('DO NOT INJECT'));
  const unreviewed = structuredClone(fixture);
  unreviewed.provenance.reviewedBy = '';
  assert.equal(buildGroundTruthSystemPrompt({ unit: { ...unit, studyPack: unreviewed } }), base);
  const long = structuredClone(fixture);
  long.memoryHooks = ['h'.repeat(800)]; long.commonMistakes = ['m'.repeat(800)];
  const line = buildGroundTruthSystemPrompt({ unit: { ...unit, studyPack: long } }).split('\n').find((l) => l.startsWith('Memory hooks:'));
  assert.ok(line.length <= 400);
  assert.ok(line.includes('Common mistakes:'));
});
