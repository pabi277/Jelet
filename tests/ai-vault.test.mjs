/**
 * ai-vault.test.mjs — Phase 04 Gate: AI Vault Isolation & Byte-Exact Prompt Preview Tests
 * ---------------------------------------------------------------------------
 * Verifies docs/04-CODEC-AI-TUTOR-SPEC.md invariants:
 *   1. `backup.js` NEVER reads `jelet_ai_vault_v1` — API keys never leak into exports.
 *   2. `buildAiRequestPayload` produces a deterministic `bodyString` matching the
 *      exact JSON payload sent over `fetch()`.
 *   3. Ground-truth system prompt injects the official WBJEEB answer & marking rule.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  AI_VAULT_STORAGE_KEY,
  AI_PROVIDERS,
  readAiVault,
  writeAiVault,
  clearAiVault,
  maskApiKey,
  validateAiProvider,
  resolveEffectiveModel,
  buildGroundTruthSystemPrompt,
  buildAiRequestPayload,
  sendBuiltAiRequest,
} from "../assets/js/core/ai-vault.js";
import { normalizeUnit } from "../assets/js/core/data-loader.js";
import { buildOfflineCorpusReply } from "../assets/js/views/ai-tutor.js";
import { buildEnvelope } from "../assets/js/db/backup.js";

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test("AI vault stores key in isolated storage and masks display cleanly", () => {
  const mem = createMemoryStorage();
  assert.equal(readAiVault(mem).apiKey, "");

  writeAiVault({ provider: "gemini", apiKey: "AIzaSySecretKey123457xQ" }, mem);
  const saved = readAiVault(mem);
  assert.equal(saved.apiKey, "AIzaSySecretKey123457xQ");
  assert.equal(maskApiKey(saved.apiKey), "AIza •••••• 7xQ");

  clearAiVault(mem);
  assert.equal(readAiVault(mem).apiKey, "");
});

test("Signed backup export NEVER includes jelet_ai_vault_v1 or API keys", async () => {
  const backupSrc = fs.readFileSync("./assets/js/db/backup.js", "utf8");
  // Static check: backup.js never reads localStorage or the isolated vault key
  assert.equal(backupSrc.includes("localStorage.getItem"), false);

  const env = await buildEnvelope({
    meta: [{ key: "app", theme: "dark" }],
    attempts: [],
  });
  const serialized = JSON.stringify(env);
  assert.equal(serialized.includes(AI_VAULT_STORAGE_KEY), false);
});

test("Ground-Truth prompt builder locks official WBJEEB key & byte-exact preview body", () => {
  const paper2025 = JSON.parse(fs.readFileSync("./_data/papers/2025.json", "utf8"));
  const sol2025 = JSON.parse(fs.readFileSync("./_data/solutions/2025.solutions.json", "utf8"));
  const q1 = paper2025.questions[0];
  const s1 = sol2025.solutions[q1.id];

  const sys = buildGroundTruthSystemPrompt({
    question: q1,
    solution: s1,
    paperTitle: "JELET 2025 · Paper I",
    studentSelected: ["B"],
    studentOutcome: "incorrect",
    studentScoreText: "-0.25",
    languageMode: "Bengali",
  });

  assert.ok(sys.includes("IMMUTABLE GROUND TRUTH"));
  assert.ok(sys.includes("Official / SymPy-Verified Correct Answer(s): D"));
  assert.ok(sys.includes("Preferred Language: Bengali"));

  const req = buildAiRequestPayload({
    vault: { provider: "gemini", model: "gemini-2.5-flash", apiKey: "test-key" },
    systemPrompt: sys,
    history: [],
    userMessage: "Why was option B wrong?",
  });

  const parsed = JSON.parse(req.bodyString);
  assert.equal(parsed.system_instruction.parts[0].text, sys);
  assert.equal(parsed.contents[0].parts[0].text, "Why was option B wrong?");
});

test("Ground-Truth prompt: origin & section are optional, appear once, preview stays byte-exact", () => {
  const paper2025 = JSON.parse(fs.readFileSync("./_data/papers/2025.json", "utf8"));
  const sol2025 = JSON.parse(fs.readFileSync("./_data/solutions/2025.solutions.json", "utf8"));
  const q1 = paper2025.questions[0];
  const s1 = sol2025.solutions[q1.id];

  // Absent by default → no context lines (fully backward compatible).
  const plain = buildGroundTruthSystemPrompt({ question: q1, solution: s1 });
  assert.equal((plain.match(/Opened from:/g) || []).length, 0);
  assert.equal((plain.match(/Lesson section:/g) || []).length, 0);

  // Present → exactly one of each line in the question branch.
  const withCtx = buildGroundTruthSystemPrompt({
    question: q1,
    solution: s1,
    origin: "Results Review",
    sectionHeading: "Matrices",
  });
  assert.equal((withCtx.match(/Opened from: Results Review/g) || []).length, 1);
  assert.equal((withCtx.match(/Lesson section: Matrices/g) || []).length, 1);

  // Byte-exact preview invariant (docs/04 §4): shown body == sent body.
  const req = buildAiRequestPayload({
    vault: { provider: "gemini", model: "gemini-2.5-flash", apiKey: "k" },
    systemPrompt: withCtx,
    history: [],
    userMessage: "hi",
  });
  const parsed = JSON.parse(req.bodyString);
  assert.equal(parsed.system_instruction.parts[0].text, withCtx);
});

test("Ground-Truth prompt: unit branch carries origin context line", () => {
  const p02 = normalizeUnit(JSON.parse(fs.readFileSync("./_data/units/P02.json", "utf8")));
  const sys = buildGroundTruthSystemPrompt({
    unit: p02,
    formula: p02.formulas[0],
    origin: "Unit Formula Sheet",
  });
  assert.equal((sys.match(/Opened from: Unit Formula Sheet/g) || []).length, 1);
});

test("Custom model name is persisted in vault, passed to BYOK payloads, and falls back when blank", () => {
  const mem = createMemoryStorage();

  // 1. Custom model persisted and routed to Gemini endpoint URL
  writeAiVault(
    {
      provider: "gemini",
      useCustomModel: true,
      customModel: "gemini-2.5-pro",
      apiKey: "test-key",
    },
    mem
  );
  const savedGemini = readAiVault(mem);
  assert.equal(savedGemini.useCustomModel, true);
  assert.equal(savedGemini.customModel, "gemini-2.5-pro");
  assert.equal(savedGemini.model, "gemini-2.5-pro");

  const geminiReq = buildAiRequestPayload({
    vault: savedGemini,
    systemPrompt: "Sys",
    history: [],
    userMessage: "Hi",
  });
  assert.equal(geminiReq.model, "gemini-2.5-pro");
  assert.ok(geminiReq.endpoint.includes("/models/gemini-2.5-pro:generateContent"));

  // 2. Custom model routed to OpenRouter / Groq JSON body
  writeAiVault(
    {
      provider: "openrouter",
      useCustomModel: true,
      customModel: "deepseek/deepseek-chat",
    },
    mem
  );
  const orReq = buildAiRequestPayload({
    vault: readAiVault(mem),
    systemPrompt: "Sys",
    history: [],
    userMessage: "Hi",
  });
  assert.equal(orReq.model, "deepseek/deepseek-chat");
  assert.equal(JSON.parse(orReq.bodyString).model, "deepseek/deepseek-chat");

  // 3. Blank custom model falls back to provider defaultModel
  writeAiVault(
    {
      provider: "groq",
      useCustomModel: true,
      customModel: "   ",
    },
    mem
  );
  const groqSaved = readAiVault(mem);
  assert.equal(groqSaved.model, AI_PROVIDERS.groq.defaultModel);
  assert.equal(resolveEffectiveModel(groqSaved), AI_PROVIDERS.groq.defaultModel);
  const groqReq = buildAiRequestPayload({
    vault: groqSaved,
    systemPrompt: "Sys",
    history: [],
    userMessage: "Hi",
  });
  assert.equal(groqReq.model, AI_PROVIDERS.groq.defaultModel);
  assert.equal(JSON.parse(groqReq.bodyString).model, AI_PROVIDERS.groq.defaultModel);
});

test("Unknown custom provider surfaces a clear validation error and offline corpus path stays independent", async () => {
  assert.throws(
    () => validateAiProvider("unknown-llm-host"),
    /Unknown AI provider "unknown-llm-host"/
  );
  assert.throws(
    () =>
      buildAiRequestPayload({
        vault: { provider: "unknown-llm-host", apiKey: "k" },
        systemPrompt: "Sys",
        history: [],
        userMessage: "Hi",
      }),
    /Unknown AI provider "unknown-llm-host"/
  );
  await assert.rejects(
    () =>
      sendBuiltAiRequest({
        provider: "gemini",
        endpoint: "https://evil.example.com/v1/chat",
        headers: {},
        bodyString: "{}",
      }),
    /Unsupported provider endpoint/
  );

  // Offline corpus reply works with zero API key and completely independent of vault model/provider
  const p02 = normalizeUnit(JSON.parse(fs.readFileSync("./_data/units/P02.json", "utf8")));
  const offlineReply = await buildOfflineCorpusReply({
    context: { unit: p02 },
    userPrompt: "Key formulas & traps",
    languageMode: "English",
  });
  assert.ok(offlineReply.includes("P02"));
  assert.ok(offlineReply.includes("High-Yield Formulas"));
});

test("connection test uses an eight-token payload for each existing provider", async () => {
  const { testAiConnection } = await import('../assets/js/core/ai-vault.js');
  const saved = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({url, body: JSON.parse(options.body)});
    return {ok: true, json: async () => url.includes('generativelanguage')
      ? {candidates: [{content: {parts: [{text: 'OK'}]}}]}
      : {choices: [{message: {content: 'OK'}}]} };
  };
  try {
    for (const provider of ['gemini', 'groq', 'openrouter', 'nvidia']) {
      await testAiConnection({provider, apiKey:'test'});
    }
    assert.equal(calls[0].body.generationConfig.maxOutputTokens, 8);
    assert.equal(calls[1].body.max_tokens, 8);
    assert.equal(calls[2].body.max_tokens, 8);
    assert.equal(calls[3].body.max_tokens, 8);
    assert.equal(calls[0].body.contents[0].parts[0].text, 'Reply with OK');
  } finally { globalThis.fetch = saved; }
});

test("budget trimming is reflected in the exact sent preview", async () => {
  const saved = globalThis.fetch;
  const req = buildAiRequestPayload({ vault: {provider:'groq', apiKey:'test'}, systemPrompt:'ground truth',
    history:Array.from({length:8}, (_,i)=>({role:i%2?'assistant':'user', text:'x'.repeat(16000)})), userMessage:'Question' });
  let body;
  globalThis.fetch = async (_url, opts) => { body = opts.body; return {ok:true, json:async()=>({choices:[{message:{content:'ok'}}]})}; };
  try { await sendBuiltAiRequest(req); assert.equal(body, req.bodyString); assert.equal(JSON.parse(body).messages.length, 4); }
  finally { globalThis.fetch = saved; }
});

test('NVIDIA endpoint and byte exact body, response usage and truncation', async () => {
  const req=buildAiRequestPayload({vault:{provider:'nvidia',apiKey:'nvapi-test'},systemPrompt:'grounding',history:[],userMessage:'hi'});
  assert.equal(req.endpoint,'https://integrate.api.nvidia.com/v1/chat/completions');
  assert.equal(JSON.parse(req.bodyString).model,AI_PROVIDERS.nvidia.defaultModel);
  const saved=globalThis.fetch; let sent;
  globalThis.fetch=async (_url, opts)=>{sent=opts.body;return {ok:true,json:async()=>({choices:[{message:{content:'part'},finish_reason:'length'}],usage:{prompt_tokens:10,completion_tokens:7}})};};
  try { const r=await sendBuiltAiRequest(req); assert.equal(sent,req.bodyString); assert.equal(r.text,'part'); assert.equal(r.truncated,true); assert.deepEqual(r.usage,{promptTokens:10,outputTokens:7}); }
  finally {globalThis.fetch=saved;}
  assert.throws(()=>validateAiProvider('other'),/NVIDIA NIM \(nvidia\)/);
});

test('fetch timeout is classified network and never exposes provider body', async () => {
  const saved=globalThis.fetch;
  const req=buildAiRequestPayload({vault:{provider:'gemini',apiKey:'secret'},systemPrompt:'x',userMessage:'hello'});
  globalThis.fetch=()=>new Promise(()=>{});
  try {await assert.rejects(()=>sendBuiltAiRequest(req,{timeoutMs:5}),e=>e.classification?.kind==='network' && !e.message.includes('secret'));}
  finally {globalThis.fetch=saved;}
});

test('preview body is byte-exact for every supported provider', async () => {
  const saved = globalThis.fetch;
  let sent;
  globalThis.fetch=async (url,opts)=>{sent=opts.body;return {ok:true,json:async()=>url.includes('generativelanguage')
    ? {candidates:[{content:{parts:[{text:'ok'}]}}]}
    : {choices:[{message:{content:'ok'}}]}};};
  try {
    for (const provider of Object.keys(AI_PROVIDERS)) {
      const req=buildAiRequestPayload({vault:{provider,apiKey:'fixture'},systemPrompt:'truth $x$',history:[{role:'user',text:'earlier'}],userMessage:'why?'});
      await sendBuiltAiRequest(req);
      assert.equal(sent,req.bodyString,provider);
    }
  } finally { globalThis.fetch=saved; }
});

test('Gemini captures total usage and token truncation', async () => {
  const old = globalThis.fetch;
  const req=buildAiRequestPayload({vault:{provider:'gemini',apiKey:'fixture'},systemPrompt:'x',userMessage:'hello'});
  globalThis.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:'part'}]},finishReason:'MAX_TOKENS'}],usageMetadata:{promptTokenCount:5,candidatesTokenCount:7,totalTokenCount:12}})});
  try { const r=await sendBuiltAiRequest(req); assert.equal(r.truncated,true); assert.deepEqual(r.usage,{promptTokens:5,outputTokens:7,totalTokens:12}); }
  finally {globalThis.fetch=old;}
});

test('NVIDIA browser network failure reports possible CORS without exposing keys', async () => {
  const previous = globalThis.fetch;
  const req = buildAiRequestPayload({vault:{provider:'nvidia',apiKey:'nvapi-secret-fixture'},systemPrompt:'grounding',userMessage:'hello'});
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch nvapi-secret-fixture'); };
  try {
    await assert.rejects(()=>sendBuiltAiRequest(req), error=>error.classification?.kind === 'network' && /CORS/.test(error.message) && /not verified/.test(error.message) && !error.message.includes('nvapi-secret-fixture'));
  } finally { globalThis.fetch = previous; }
});

test('provider 404 indicates model or endpoint problem without exposing response body', async () => {
  const previous = globalThis.fetch;
  const req = buildAiRequestPayload({vault:{provider:'nvidia',apiKey:'nvapi-secret-fixture'},systemPrompt:'grounding',userMessage:'hello'});
  globalThis.fetch = async () => new Response(JSON.stringify({error:{message:'private provider detail'}}),{status:404});
  try {
    await assert.rejects(()=>sendBuiltAiRequest(req), error=>error.status === 404 && error.classification.kind === 'not-found' && /model or endpoint/i.test(error.message) && !error.message.includes('private provider detail'));
  } finally { globalThis.fetch = previous; }
});

test('NVIDIA relay only on explicitly marked loopback document, preserves exact body', async () => {
  const oldFetch = globalThis.fetch, oldLocation = globalThis.location, oldDocument = globalThis.document;
  const calls = [];
  try {
    globalThis.location = {protocol:'http:', hostname:'localhost'};
    globalThis.document = {querySelector: () => ({})};
    globalThis.fetch = async (url, options) => {
      calls.push({url, options});
      if (url.endsWith('/health')) return new Response(JSON.stringify({service:'jelet-nvidia-local-relay',version:1}), {status:200});
      return new Response(JSON.stringify({choices:[{message:{content:'OK'}}]}), {status:200, headers:{'Content-Type':'application/json'}});
    };
    const req = buildAiRequestPayload({vault:{provider:'nvidia',apiKey:'private-key'},systemPrompt:'test',history:[],userMessage:'secret prompt'});
    await sendBuiltAiRequest(req);
    assert.equal(calls[0].options.cache, 'no-store');
    assert.equal(calls[1].url, '/__jelet_nvidia_relay__/chat/completions');
    assert.equal(calls[1].options.body, req.bodyString);
    assert.equal(calls[1].options.headers.Authorization, 'Bearer private-key');
    calls.length = 0;
    globalThis.location = {protocol:'https:',hostname:'example.com'};
    await sendBuiltAiRequest(req);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://integrate.api.nvidia.com/v1/chat/completions');
    calls.length = 0;
    globalThis.location = {protocol:'http:',hostname:'localhost'};
    globalThis.document = {querySelector: () => null};
    await sendBuiltAiRequest(req);
    assert.equal(calls[0].url, 'https://integrate.api.nvidia.com/v1/chat/completions');
    calls.length = 0;
    globalThis.document = {querySelector: () => ({})};
    globalThis.fetch = async (url, options) => { calls.push({url, options}); return new Response('{}'); };
    await assert.rejects(sendBuiltAiRequest(req), /relay unavailable/i);
    assert.equal(calls.length, 1);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldLocation === undefined) delete globalThis.location; else globalThis.location = oldLocation;
    if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument;
  }
});

test('NVIDIA authorization and relay errors report safe, accurate source', async () => {
  const oldFetch = globalThis.fetch, oldLocation = globalThis.location, oldDocument = globalThis.document;
  const req = buildAiRequestPayload({vault:{provider:'nvidia',apiKey:'nvapi-secret'},systemPrompt:'test',history:[],userMessage:'private question'});
  try {
    globalThis.location = {protocol:'http:',hostname:'localhost'};
    globalThis.document = {querySelector: () => ({})};
    for (const [status, marker, expected, kind] of [[403,'local',/Local NVIDIA relay HTTP 403/, 'local-relay'],[401,'upstream',/NVIDIA endpoint HTTP 401/, 'auth'],[403,'upstream',/NVIDIA endpoint HTTP 403.*permissions/, 'auth']]) {
      globalThis.fetch = async url => String(url).endsWith('/health')
        ? new Response(JSON.stringify({service:'jelet-nvidia-local-relay',version:1}))
        : new Response(JSON.stringify({error:'nvapi-secret private question'}),{status,headers:{'X-Jelet-Relay-Source':marker}});
      await assert.rejects(sendBuiltAiRequest(req), err => {
        assert.match(err.message,expected); assert.equal(err.classification.kind,kind);
        assert.ok(!err.message.includes('nvapi-secret') && !err.message.includes('private question'));
        return true;
      });
    }
  } finally {globalThis.fetch=oldFetch; if(oldLocation===undefined) delete globalThis.location; else globalThis.location=oldLocation; if(oldDocument===undefined) delete globalThis.document; else globalThis.document=oldDocument;}
});
