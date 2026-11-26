import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROVIDER_LIMITS, RETRY_WINDOW_MS, localDay, canSendNow, recordSend, estimateTokens, trimHistoryByBudget, parseRetryAfter, classifyProviderError, nextRetryMs, recoveryVerdict, recordUsage, getTodaySummary } from '../assets/js/core/ai-governor.js';

test('provider pacing, rolling minute, daily thresholds and midnight', () => {
  const t = new Date(2026, 10, 25, 12).getTime();
  let state = recordSend('gemini', t, {});
  assert.deepEqual(canSendNow('gemini', t + 1000, state), { verdict: 'min-gap', retryInMs: 5000 });
  assert.equal(canSendNow('groq', t + 1000, state).verdict, 'ok');
  state = { providers: { gemini: { day: localDay(t), count: 50, sends: Array.from({length: 10}, (_, i) => t - 59000 + i * 5000) } } };
  assert.deepEqual(canSendNow('gemini', t, state), { verdict: 'rpm', retryInMs: 1000 });
  assert.equal(canSendNow('gemini', t + 60000, state).verdict, 'daily-warn');
  state.providers.gemini.count = 100;
  assert.equal(canSendNow('gemini', t, state).verdict, 'daily-block');
  assert.equal(canSendNow('gemini', new Date(2026, 10, 26, 0).getTime(), state).verdict, 'ok');
  assert.equal(PROVIDER_LIMITS.openrouter.dailyMax, 48);
});
test('estimator and floor/cap for history budget', () => {
  assert.ok(estimateTokens('longer text') > estimateTokens('x'));
  assert.ok(estimateTokens('\\frac{x}{y}') > estimateTokens('abcdefghijk'));
  const turns = Array.from({length: 12}, (_, i) => ({ text: String(i).repeat(100) }));
  assert.equal(trimHistoryByBudget(turns, '', 10000).length, 8);
  assert.deepEqual(trimHistoryByBudget(turns, 'x'.repeat(100), 1), turns.slice(-2));
  assert.deepEqual(trimHistoryByBudget([], '', 0), []);
});
test('classification, retry after and bounded recovery', () => {
  const t = Date.parse('2026-11-25T12:00:00Z');
  assert.equal(parseRetryAfter('5', t), 5000);
  assert.equal(parseRetryAfter('Wed, 25 Nov 2026 12:00:10 GMT', t), 10000);
  assert.equal(classifyProviderError(429, 'quota_exceeded').kind, 'daily-quota');
  assert.equal(classifyProviderError(429, 'rate limit', { 'Retry-After': '5' }).retryAfterMs, 5000);
  assert.equal(classifyProviderError(403).kind, 'auth');
  assert.equal(classifyProviderError(400).kind, 'bad-request');
  assert.equal(classifyProviderError(500).kind, 'server');
  assert.equal(classifyProviderError(0).kind, 'network');
  assert.equal(nextRetryMs(0, 'server', null, () => 0), 900);
  assert.equal(nextRetryMs(1, 'server', null, () => 1), 2200);
  assert.equal(nextRetryMs(2, 'server'), null);
  assert.equal(nextRetryMs(0, 'auth'), null);
  assert.equal(nextRetryMs(0, 'per-minute', 70000), 70000);
  assert.equal(recoveryVerdict(t, t, RETRY_WINDOW_MS).verdict, 'offline');
  assert.equal(recoveryVerdict(t, t + 69999, 0).verdict, 'wait');
  assert.equal(recoveryVerdict(t, t + 70000, 0).verdict, 'offline');
});
test('ledger merges, recovers corrupt data and rolls over', () => {
  const t = new Date(2026, 10, 25, 12).getTime(), day = localDay(t);
  let ledger = recordUsage(null, {provider:'groq', day, requests:1, promptTokens:42});
  ledger = recordUsage(ledger, {provider:'groq', day, requests:1, outputTokens:9});
  assert.deepEqual(getTodaySummary(ledger, 'groq', t), {day, requests:2, promptTokens:42, outputTokens:9});
  assert.equal(getTodaySummary(ledger, 'groq', new Date(2026, 10, 26).getTime()).requests, 0);
  assert.equal(getTodaySummary({groq:{day,requests:'bad'}}, 'groq', t).requests, 0);
});

test('governor metadata is excluded from synchronization', async () => {
  const { SYNC_LOCAL_META_KEYS, sanitizeForSync } = await import('../assets/js/db/sync.js');
  assert.ok(SYNC_LOCAL_META_KEYS.includes('aiGovernor'));
  const sanitized = sanitizeForSync({meta:[{key:'aiGovernor',providers:{}},{key:'app'}]});
  assert.deepEqual(sanitized.meta, [{key:'app'}]);
});

test('governed sends pace without fetching and daily block never fetches', async () => {
  const { sendGovernedAiRequest } = await import('../assets/js/core/ai-governor-runtime.js');
  let clock = new Date(2026, 10, 25, 12).getTime(), state = {}, calls = 0, waited = 0;
  const reserve = async (p, t) => { const v = canSendNow(p, t, state); if (['ok','daily-warn'].includes(v.verdict)) state = recordSend(p,t,state); return v; };
  const send = async () => { calls++; return {text:'ok', usage:null, truncated:false}; };
  const opts = {request:{provider:'gemini'}, reserve, send, now:()=>clock, wait:async ms=>{ waited += ms; assert.equal(calls,1); clock += ms; }, saveUsage:async()=>{}, saveError:async()=>{}};
  await sendGovernedAiRequest(opts);
  await sendGovernedAiRequest(opts);
  assert.equal(calls,2); assert.equal(waited,6000);
  state.providers.gemini.count = 100;
  await assert.rejects(()=>sendGovernedAiRequest(opts), err=>err.kind === 'daily-quota');
  assert.equal(calls,2);
});

test('429 retry-after 70 seconds counts down to offline without another POST', async () => {
  const { sendGovernedAiRequest } = await import('../assets/js/core/ai-governor-runtime.js');
  let clock=0, calls=0, lastState;
  await assert.rejects(()=>sendGovernedAiRequest({request:{provider:'groq'}, now:()=>clock,
    reserve:async()=>({verdict:'ok'}), wait:async ms=>{clock+=ms;}, saveError:async()=>{},
    onState:s=>{lastState=s;}, send:async()=>{calls++; const e=new Error('429'); e.classification={kind:'per-minute',retryAfterMs:70000}; throw e;}}),
    e=>e.kind==='window-expired');
  assert.equal(clock,70000); assert.equal(calls,1); assert.equal(lastState.remainingMs,1000);
});

test('continuations use a fresh request and are governed, usage is accumulated', async () => {
  const { sendGovernedAiRequest } = await import('../assets/js/core/ai-governor-runtime.js');
  let clock=0, calls=0, state={}, requested=[], logged=[];
  const result=await sendGovernedAiRequest({request:{provider:'groq',bodyString:'first'}, now:()=>clock,
    reserve:async(p,t)=>{const v=canSendNow(p,t,state);if(v.verdict==='ok')state=recordSend(p,t,state);return v;},
    wait:async ms=>{clock+=ms;}, onRequest:r=>requested.push(r.bodyString),
    buildContinuation:partial=>({provider:'groq',bodyString:`continue:${partial}`}),
    saveUsage:async(_p,u)=>logged.push(u), saveError:async()=>{},
    send:async()=>{calls++;return {text:calls===1?'one':' two',truncated:calls===1,usage:{promptTokens:2,outputTokens:3},providerLatencyMs:50};}});
  assert.equal(result.text,'one two'); assert.deepEqual(requested,['first','continue:one']);
  assert.equal(clock,3000); assert.equal(logged.length,2); assert.deepEqual(result.usage,{promptTokens:4,outputTokens:6});
});

test('local reservations persist, broadcast and never enqueue for sync', async () => {
  const db = await import('../assets/js/db/indexeddb.js');
  const runtime = await import('../assets/js/core/ai-governor-runtime.js');
  await db.openDB();
  await db.put('meta', {key:'aiGovernor', providers:{}, ledger:{}});
  const notices=[]; const unsubscribe=db.onSync(n=>notices.push(n));
  const t = new Date(2026,10,25,12).getTime();
  try {
    assert.equal((await runtime.reserveGovernorSend('openrouter',t)).verdict,'ok');
    assert.equal((await runtime.reserveGovernorSend('openrouter',t+1)).verdict,'min-gap');
    await runtime.storeGovernorUsage('openrouter',{promptTokens:20,outputTokens:4},t);
    const rec=await runtime.loadGovernor();
    assert.equal(rec.providers.openrouter.count,1);
    assert.equal(rec.ledger.openrouter.requests,1);
    assert.equal(rec.ledger.openrouter.promptTokens,20);
    assert.ok(notices.some(n=>n.store==='meta' && n.key==='aiGovernor' && n.op==='send'));
    assert.equal(JSON.stringify(rec).includes('apiKey'),false);
  } finally {unsubscribe();}
});


test('stopping a paced continuation preserves its partial answer', async () => {
  const { sendGovernedAiRequest } = await import('../assets/js/core/ai-governor-runtime.js');
  const controller = new AbortController();
  let reservations = 0;
  await assert.rejects(() => sendGovernedAiRequest({
    request:{provider:'gemini'}, signal:controller.signal,
    reserve:async()=>++reservations === 1 ? {verdict:'ok'} : {verdict:'min-gap',retryInMs:6000},
    send:async()=>({text:'partial live text',truncated:true}),
    buildContinuation:()=>({provider:'gemini'}), saveUsage:async()=>{}, saveError:async()=>{},
    wait:async()=>{ controller.abort(); throw new DOMException('Stopped','AbortError'); },
  }), error => error.name === 'AbortError' && error.partialText === 'partial live text');
});
