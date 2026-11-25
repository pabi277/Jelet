import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AI_PROVIDERS, CURATED_AI_MODELS, AI_LANGUAGES, AI_VAULT_STORAGE_KEY,
  readAiVault, writeAiVault, hasAiDefaultUpgradeNotice, normalizeGenerationSettings,
  buildAiRequestPayload, buildGroundTruthSystemPrompt, sendBuiltAiRequest, testAiConnection } from '../assets/js/core/ai-vault.js';
import { getGovernorDashboard, localDay } from '../assets/js/core/ai-governor.js';
import { buildOfflineCorpusReply } from '../assets/js/views/ai-tutor.js';

function storage() {
  const data = new Map();
  return { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,String(v)), removeItem: k => data.delete(k) };
}

test('fresh defaults and legacy saved vaults retain stored and implicit choices', () => {
  const mem = storage();
  assert.equal(readAiVault(mem).model, 'gemini-3.1-flash-lite');
  assert.equal(readAiVault(mem).previewPrompt, false);
  assert.equal(hasAiDefaultUpgradeNotice(mem), false);
  const legacy = {provider:'gemini',model:'gemini-2.5-flash',previewPrompt:true,apiKey:'secret'};
  mem.setItem(AI_VAULT_STORAGE_KEY, JSON.stringify(legacy));
  assert.equal(hasAiDefaultUpgradeNotice(mem), true);
  assert.equal(readAiVault(mem).model, legacy.model);
  assert.equal(readAiVault(mem).previewPrompt, true);
  writeAiVault({temperature:0.8}, mem);
  assert.equal(readAiVault(mem).apiKey, 'secret');
  assert.equal(readAiVault(mem).model, legacy.model);
  assert.equal(readAiVault(mem).previewPrompt, true);
  writeAiVault({defaultUpgradeNoticeSeen:true}, mem);
  assert.equal(hasAiDefaultUpgradeNotice(mem), false);
  mem.setItem(AI_VAULT_STORAGE_KEY, JSON.stringify({provider:'gemini',apiKey:'old'}));
  assert.equal(readAiVault(mem).model, 'gemini-2.5-flash');
  assert.equal(readAiVault(mem).previewPrompt, true);
  mem.setItem(AI_VAULT_STORAGE_KEY, JSON.stringify({provider:'groq',model:'older-groq',previewPrompt:false}));
  assert.equal(readAiVault(mem).model, 'older-groq');
  assert.equal(readAiVault(mem).previewPrompt, false);
  assert.equal(hasAiDefaultUpgradeNotice(mem), true);
});

test('generation settings clamp on persistence and request building, with exact JSON send', async () => {
  assert.deepEqual(normalizeGenerationSettings({temperature:-2,maxOutputTokens:99999,historyTurns:1}), {temperature:0,maxOutputTokens:4096,historyTurns:2});
  assert.deepEqual(normalizeGenerationSettings({temperature:'bad',maxOutputTokens:'',historyTurns:null}), {temperature:0.2,maxOutputTokens:1024,historyTurns:8});
  const mem = storage();
  const vault = writeAiVault({provider:'groq',model:'fixture',temperature:4,maxOutputTokens:12,historyTurns:3}, mem);
  assert.deepEqual([vault.temperature,vault.maxOutputTokens,vault.historyTurns],[1,256,3]);
  const history = Array.from({length:8}, (_,i)=>({role:i%2?'assistant':'user',text:`turn${i}`}));
  for (const provider of Object.keys(AI_PROVIDERS)) {
    const req = buildAiRequestPayload({vault:{...vault,provider},systemPrompt:'ground truth',history,userMessage:'question'});
    const body = JSON.parse(req.bodyString);
    const messages = body.contents || body.messages.slice(1);
    assert.equal(messages.length, 4);
    assert.equal(provider === 'gemini' ? body.generationConfig.temperature : body.temperature, 1);
    assert.equal(provider === 'gemini' ? body.generationConfig.maxOutputTokens : body.max_tokens, 256);
    const previous = globalThis.fetch;
    try {
      globalThis.fetch = async (_url, options) => {
        assert.equal(options.body, req.bodyString);
        const result = provider === 'gemini' ? {candidates:[{content:{parts:[{text:'ok'}]}}]} : {choices:[{message:{content:'ok'}}]};
        return new Response(JSON.stringify(result), {status:200});
      };
      await sendBuiltAiRequest(req);
    } finally { globalThis.fetch = previous; }
  }
  const previous = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, options) => {
      assert.equal(JSON.parse(options.body).generationConfig.maxOutputTokens, 8);
      return new Response(JSON.stringify({candidates:[{content:{parts:[{text:'OK'}]}}]}), {status:200});
    };
    await testAiConnection({...vault,provider:'gemini',apiKey:'key'});
  } finally { globalThis.fetch = previous; }
});

test('curated models include all providers and honest NVIDIA free-endpoint warning', () => {
  for (const [provider, config] of Object.entries(AI_PROVIDERS)) {
    assert.ok(CURATED_AI_MODELS[provider].some(m => m.id === config.defaultModel));
    assert.ok(CURATED_AI_MODELS[provider].every(m => m.freeTierNote));
  }
  assert.match(CURATED_AI_MODELS.nvidia.find(m => m.id === 'meta/llama-3.3-70b-instruct').freeTierNote, /deprecated/);
});

test('all language modes flow through prompts and offline question answers', async () => {
  const q = JSON.parse(fs.readFileSync('./_data/papers/2025.json')).questions[0];
  const solution = JSON.parse(fs.readFileSync('./_data/solutions/2025.solutions.json')).solutions[q.id];
  for (const languageMode of AI_LANGUAGES) {
    assert.ok(buildGroundTruthSystemPrompt({question:q, solution,languageMode}).includes(`Preferred Language: ${languageMode}`));
    const answer = await buildOfflineCorpusReply({context:{question:q,solution,unit:{unitId:q.unitId}},userPrompt:'Explain',languageMode});
    assert.ok(answer.includes((q.key.correct || []).join(', ')));
    assert.ok(answer.includes(solution.steps[0].bodyLatex));
    if (languageMode === 'Hinglish') assert.match(answer, /Apna answer/);
    if (languageMode === 'Simple English') assert.match(answer, /official answer is/);
  }
});

test('dashboard totals provider ledger accurately, resets today, and keeps last error', () => {
  const now = new Date(2026,10,25,14).getTime(), day=localDay(now);
  const dashboard = getGovernorDashboard({ledger:{gemini:{day,requests:12,promptTokens:20,outputTokens:7},groq:{day:'old',requests:4}},lastErrors:{gemini:{kind:'auth',at:now}}}, now);
  assert.equal(dashboard.length,4);
  assert.deepEqual([dashboard[0].requests,dashboard[0].totalTokens,dashboard[0].dailyWarn,dashboard[0].dailyMax],[12,27,50,100]);
  assert.equal(dashboard[0].lastError.kind,'auth');
  assert.equal(dashboard.find(r=>r.provider==='groq').requests,0);
});
