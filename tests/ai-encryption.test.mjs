import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AI_VAULT_STORAGE_KEY, readAiVault, writeAiVault, clearAiVault, protectAiKey, unlockAiKey, lockAiKey } from '../assets/js/core/ai-vault.js';
function storage() { const data = new Map(); return {getItem:k=>data.get(k) ?? null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)}; }

test('encrypted vault never stores plaintext; locks, unlocks, and preserves settings', async () => {
  const mem=storage(), secret='nvapi-secret-marker-123456', password='a strong test passphrase';
  writeAiVault({provider:'nvidia',apiKey:secret,previewPrompt:true},mem);
  await assert.rejects(()=>protectAiKey('short',mem),/at least 8/);
  await protectAiKey(password,mem);
  const encrypted=mem.getItem(AI_VAULT_STORAGE_KEY);
  assert.ok(!encrypted.includes(secret));
  assert.ok(!encrypted.includes(password));
  const parsed=JSON.parse(encrypted);
  assert.equal(parsed.keyEnvelope.algorithm,'AES-GCM');
  assert.equal(parsed.keyEnvelope.kdf,'PBKDF2-SHA256');
  assert.equal(readAiVault(mem).apiKey,secret);
  writeAiVault({temperature:0.7},mem);
  assert.ok(!mem.getItem(AI_VAULT_STORAGE_KEY).includes(secret));
  lockAiKey(mem);
  assert.equal(readAiVault(mem).keyLocked,true);
  assert.equal(readAiVault(mem).apiKey,'');
  await assert.rejects(()=>unlockAiKey('incorrect password',mem),/unlock/);
  assert.equal(readAiVault(mem).keyLocked,true);
  await unlockAiKey(password,mem);
  assert.equal(readAiVault(mem).apiKey,secret);
  assert.equal(readAiVault(mem).temperature,0.7);
  assert.equal(readAiVault(mem).previewPrompt,true);
  assert.throws(()=>writeAiVault({apiKey:'new key'},mem),/passphrase/);
  assert.throws(()=>writeAiVault({keyEnvelope:null},mem),/controls/);
  clearAiVault(mem);
  assert.equal(mem.getItem(AI_VAULT_STORAGE_KEY),null);
  assert.equal(readAiVault(mem).apiKey,'');
});

test('protected key replacement verifies passphrase and rejects tampering', async () => {
  const mem=storage();
  writeAiVault({apiKey:'old secret'},mem);
  await protectAiKey('test passphrase',mem);
  const before=mem.getItem(AI_VAULT_STORAGE_KEY);
  await assert.rejects(()=>protectAiKey('wrong passphrase',mem,'new secret'),/unlock/);
  assert.equal(mem.getItem(AI_VAULT_STORAGE_KEY),before);
  await protectAiKey('test passphrase',mem,'new secret');
  assert.equal(readAiVault(mem).apiKey,'new secret');
  assert.ok(!mem.getItem(AI_VAULT_STORAGE_KEY).includes('new secret'));
  lockAiKey(mem);
  const obj=JSON.parse(mem.getItem(AI_VAULT_STORAGE_KEY));
  obj.keyEnvelope.ciphertext=obj.keyEnvelope.ciphertext.replace(/^./, obj.keyEnvelope.ciphertext[0] === 'A' ? 'B' : 'A');
  mem.setItem(AI_VAULT_STORAGE_KEY,JSON.stringify(obj));
  await assert.rejects(()=>unlockAiKey('test passphrase',mem),/unlock/);
});
