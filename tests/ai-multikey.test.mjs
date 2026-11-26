import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AI_VAULT_STORAGE_KEY, readAiVault, writeAiVault, updateAiKeys, selectAiKey, protectAiKey, lockAiKey, unlockAiKey, buildAiRequestPayload, withAiRequestKey} from '../assets/js/core/ai-vault.js';
import {sendGovernedAiRequest} from '../assets/js/core/ai-governor-runtime.js';
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};

test('legacy key migration, per-provider selection, add and remove',async()=>{
 const mem=storage(); mem.setItem(AI_VAULT_STORAGE_KEY, JSON.stringify({provider:'nvidia',apiKey:'old-secret',model:'old-model',previewPrompt:true}));
 writeAiVault({provider:'groq',model:'groq-model'},mem);
 assert.equal(readAiVault(mem).apiKey,'');
 await updateAiKeys({add:{provider:'groq',secret:'groq-secret'}},mem);
 await updateAiKeys({add:{provider:'nvidia',secret:'new-secret'}},mem);
 await assert.rejects(updateAiKeys({add:{provider:'nvidia',secret:'new-secret'}},mem),/already saved/);
 writeAiVault({provider:'nvidia',model:'old-model'},mem);
 let vault=readAiVault(mem); assert.equal(vault.apiKey,'old-secret');
 const second=vault.vaultKeys.find(k=>k.secret==='new-secret');
 selectAiKey('nvidia',second.id,mem); vault=readAiVault(mem); assert.equal(vault.apiKey,'new-secret'); assert.equal(vault.keyModes.nvidia,'manual');
 await updateAiKeys({removeId:second.id},mem); assert.equal(readAiVault(mem).apiKey,'old-secret'); assert.equal(readAiVault(mem).keyModes.nvidia,'auto');
 selectAiKey('nvidia','auto',mem); assert.equal(readAiVault(mem).keyModes.nvidia,'auto');
 writeAiVault({provider:'groq'},mem); assert.equal(readAiVault(mem).apiKey,'groq-secret');
});

test('encrypted ring never writes any plaintext, wrong passphrase fails without changes, lock and unlock',async()=>{
 const mem=storage(), pass='test-passphrase-123';
 writeAiVault({provider:'nvidia',apiKey:'first-secret'},mem);
 await protectAiKey(pass,mem);
 const before=mem.getItem(AI_VAULT_STORAGE_KEY);
 await assert.rejects(updateAiKeys({add:{provider:'nvidia',secret:'second-secret'},passphrase:'wrong-passphrase'},mem),/unlock/);
 assert.equal(mem.getItem(AI_VAULT_STORAGE_KEY),before);
 await updateAiKeys({add:{provider:'nvidia',secret:'second-secret'},passphrase:pass},mem);
 await updateAiKeys({add:{provider:'groq',secret:'third-secret'},passphrase:pass},mem);
 const raw=mem.getItem(AI_VAULT_STORAGE_KEY);
 for(const secret of ['first-secret','second-secret','third-secret',pass]) assert.equal(raw.includes(secret),false);
 lockAiKey(mem); assert.equal(readAiVault(mem).keyLocked,true); assert.equal(readAiVault(mem).apiKey,'');
 assert.equal(readAiVault(mem).vaultKeys.length,3);
 writeAiVault({provider:'groq'},mem); assert.equal(mem.getItem(AI_VAULT_STORAGE_KEY).includes('third-secret'),false);
 await unlockAiKey(pass,mem); assert.equal(readAiVault(mem).apiKey,'third-secret');
 writeAiVault({provider:'nvidia'},mem); const second=readAiVault(mem).vaultKeys.find(k=>k.secret==='second-secret');
 selectAiKey('nvidia',second.id,mem); assert.equal(readAiVault(mem).apiKey,'second-secret');
 await updateAiKeys({removeId:second.id,passphrase:pass},mem); assert.equal(readAiVault(mem).apiKey,'first-secret');
 assert.equal(mem.getItem(AI_VAULT_STORAGE_KEY).includes('first-secret'),false);
});

test('key replacement preserves preview body and changes only provider credential',()=>{
 for(const provider of ['gemini','groq','openrouter','nvidia']) {
  const req=buildAiRequestPayload({vault:{provider,apiKey:'key-one'},systemPrompt:'test',history:[],userMessage:'question',stream:true});
  const other=withAiRequestKey(req,'key-two'); assert.equal(other.bodyString,req.bodyString); assert.equal(other.provider,provider);
  if(provider==='gemini') {assert.equal(new URL(other.endpoint).searchParams.get('key'),'key-two');assert.equal(new URL(req.endpoint).searchParams.get('key'),'key-one');}
  else {assert.equal(other.headers.Authorization,'Bearer key-two');assert.equal(req.headers.Authorization,'Bearer key-one');assert.equal(other.endpoint,req.endpoint);}
 }
});

test('governor switches only eligible failures with same provider/body and enforces retry budget',async()=>{
 for(const kind of ['auth','daily-quota','per-minute']) {
  let sent=[], reserved=0; const base={provider:'nvidia',bodyString:'preview',key:'one'};
  const result=await sendGovernedAiRequest({request:base,reserve:async()=>{reserved++;return {verdict:'ok'};},saveError:async()=>{},saveUsage:async()=>{},
   onKeyFailure:r=>({...({request:{...r,key:'two'},label:'Key 2'})}), send:async r=>{sent.push(r);if(sent.length===1) {let e=new Error('reject');e.classification={kind};throw e;} return {text:'ok'};}});
  assert.equal(result.text,'ok'); assert.equal(reserved,2); assert.deepEqual(sent.map(r=>r.key),['one','two']); assert.ok(sent.every(r=>r.bodyString==='preview'));
 }
 for(const kind of ['network','bad-request','not-found']) {
  let switches=0; await assert.rejects(sendGovernedAiRequest({request:{provider:'nvidia',bodyString:'preview'},reserve:async()=>({verdict:'ok'}),saveError:async()=>{},onKeyFailure:()=>{switches++;},send:async()=>{let e=new Error('reject'); e.classification={kind}; throw e;}})); assert.equal(switches,0);
 }
 let calls=0; await assert.rejects(sendGovernedAiRequest({request:{provider:'nvidia',bodyString:'preview'},reserve:async()=>({verdict:'ok'}),saveError:async()=>{},onKeyFailure:r=>({request:r}),send:async()=>{calls++;let e=new Error('reject');e.classification={kind:'auth'};throw e;}})); assert.equal(calls,3);
});

test('no switch on partial stream or when retry-after exhausts recovery window',async()=>{
 let switches=0;
 await assert.rejects(sendGovernedAiRequest({request:{provider:'nvidia',bodyString:'preview'},reserve:async()=>({verdict:'ok'}),saveError:async()=>{},onKeyFailure:()=>{switches++;},send:async()=>{let e=new Error('reject');e.classification={kind:'auth'};e.partialText='partial';throw e;}}));
 assert.equal(switches,0);
 let clock=0;
 await assert.rejects(sendGovernedAiRequest({request:{provider:'nvidia',bodyString:'preview'},now:()=>clock,wait:async ms=>{clock+=ms;},reserve:async()=>({verdict:'ok'}),saveError:async()=>{},onKeyFailure:()=>{switches++;},send:async()=>{let e=new Error('reject');e.classification={kind:'per-minute',retryAfterMs:70000};throw e;}}),e=>e.kind==='window-expired');
 assert.equal(switches,0);
});

test('legacy encrypted single key retains its provider if settings change while locked', async()=>{
 const mem=storage(), pass='legacy-passphrase', secret='legacy-encrypted-key';
 const salt=crypto.getRandomValues(new Uint8Array(16)), iv=crypto.getRandomValues(new Uint8Array(12));
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:310000},material,{name:'AES-GCM',length:256},false,['encrypt']);
 const data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('jelet-ai-vault-key-v1')},key,new TextEncoder().encode(secret));
 const b64=value=>btoa(String.fromCharCode(...new Uint8Array(value)));
 mem.setItem(AI_VAULT_STORAGE_KEY,JSON.stringify({provider:'nvidia',apiKey:'',keyEnvelope:{version:1,algorithm:'AES-GCM',kdf:'PBKDF2-SHA256',iterations:310000,salt:b64(salt),iv:b64(iv),ciphertext:b64(data)}}));
 writeAiVault({provider:'groq'},mem); await unlockAiKey(pass,mem);
 assert.equal(readAiVault(mem).apiKey,'');
 assert.equal(readAiVault(mem).vaultKeys[0].provider,'nvidia');
 writeAiVault({provider:'nvidia'},mem); assert.equal(readAiVault(mem).apiKey,secret);
 await updateAiKeys({add:{provider:'nvidia',secret:'new-encrypted-key'},passphrase:pass},mem);
 assert.ok(!mem.getItem(AI_VAULT_STORAGE_KEY).includes(secret));
 lockAiKey(mem); await unlockAiKey(pass,mem); assert.equal(readAiVault(mem).vaultKeys.length,2);
});
