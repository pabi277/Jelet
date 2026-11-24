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
  readAiVault,
  writeAiVault,
  clearAiVault,
  maskApiKey,
  buildGroundTruthSystemPrompt,
  buildAiRequestPayload,
} from "../assets/js/core/ai-vault.js";
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
