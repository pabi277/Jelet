import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAiRequestPayload, sendBuiltAiRequest } from '../assets/js/core/ai-vault.js';
import { sendGovernedAiRequest } from '../assets/js/core/ai-governor-runtime.js';

function response(chunks) {
  const encoder=new TextEncoder(), bytes=encoder.encode(chunks);
  // Split into uneven byte sequences including inside multibyte characters.
  return new Response(new ReadableStream({start(controller){
    for(let i=0;i<bytes.length;i+=7) controller.enqueue(bytes.slice(i,i+7));
    controller.close();
  }}),{headers:{'Content-Type':'text/event-stream'}});
}
for (const provider of ['gemini','groq','openrouter','nvidia']) {
  test(`${provider} SSE streams chunks with exact request body and usage`, async () => {
    const req=buildAiRequestPayload({vault:{provider,apiKey:'test'},systemPrompt:'ground truth',history:[],userMessage:'why',stream:true});
    assert.equal(req.streaming,true);
    if(provider==='gemini') assert.match(req.endpoint, /:streamGenerateContent\?alt=sse&key=/);
    else assert.equal(JSON.parse(req.bodyString).stream,true);
    const gemini=provider==='gemini';
    const frames=gemini
      ? ['data: '+JSON.stringify({candidates:[{content:{parts:[{text:'বাংলা '}]}}]}), 'data: '+JSON.stringify({candidates:[{content:{parts:[{text:'answer'}]},finishReason:'STOP'}],usageMetadata:{promptTokenCount:9,candidatesTokenCount:3}})]
      : ['data: '+JSON.stringify({choices:[{delta:{content:'বাংলা '}}]}), 'data: '+JSON.stringify({choices:[{delta:{content:'answer'},finish_reason:'stop'}]}), 'data: '+JSON.stringify({choices:[],usage:{prompt_tokens:9,completion_tokens:3}}), 'data: [DONE]'];
    const old=globalThis.fetch, chunks=[];
    try {
      globalThis.fetch=async (_url,opts)=>{assert.equal(opts.body,req.bodyString);return response(frames.join('\r\n\r\n')+'\r\n\r\n');};
      const result=await sendBuiltAiRequest(req,{onChunk:c=>chunks.push(c)});
      assert.equal(result.text,'বাংলা answer'); assert.equal(chunks.join(''),'বাংলা answer');
      assert.equal(result.truncated,false); assert.deepEqual(result.usage,{promptTokens:9,outputTokens:3});
    } finally {globalThis.fetch=old;}
  });
}
test('stopping an active stream returns already received text', async () => {
  const req=buildAiRequestPayload({vault:{provider:'gemini',apiKey:'test'},systemPrompt:'truth',userMessage:'x',stream:true});
  const old=globalThis.fetch, ctrl=new AbortController();
  try {
    globalThis.fetch=async()=>new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('data: '+JSON.stringify({candidates:[{content:{parts:[{text:'partial'}]}}]})+'\n\n'));}}),{headers:{'Content-Type':'text/event-stream'}});
    await assert.rejects(()=>sendBuiltAiRequest(req,{signal:ctrl.signal,onChunk:()=>ctrl.abort()}),e=>e.name==='AbortError' && e.partialText==='partial');
  } finally {globalThis.fetch=old;}
});
test('stream interruptions preserve partial and do not silently retry', async () => {
  let sends=0, visible='';
  await assert.rejects(()=>sendGovernedAiRequest({request:{provider:'groq'},reserve:async()=>({verdict:'ok'}),saveError:async()=>{},
    onChunk: text=>visible=text,send:async(_req,{onChunk})=>{sends++;onChunk('partial');const e=new Error('network');e.classification={kind:'network'};throw e;}}),
    e=>e.kind==='network' && e.partialText==='partial');
  assert.equal(sends,1);assert.equal(visible,'partial');
});
test('truncated streams continue through governor while retaining cumulative text', async () => {
  let sends=0, visible=[];
  const result=await sendGovernedAiRequest({request:{provider:'groq'},reserve:async()=>({verdict:'ok'}),saveUsage:async()=>{},
    buildContinuation:()=>({provider:'groq'}),onChunk:text=>visible.push(text),send:async(_req,{onChunk})=>{sends++;onChunk(sends===1?'first':' second');return {text:sends===1?'first':' second',truncated:sends===1};}});
  assert.deepEqual(visible,['first','first second']);assert.equal(result.text,'first second');
});
