/**
 * ai-vault.js — JELET Study Hub (v3) · Isolated BYOK AI Vault & Prompt Builder
 * ---------------------------------------------------------------------------
 * Implements `docs/04-CODEC-AI-TUTOR-SPEC.md`:
 *   1. Isolated Storage (`localStorage["jelet_ai_vault_v1"]`) — NEVER stored in
 *      `jelet_hub_v1` IndexedDB and NEVER read by `backup.js`.
 *   2. Deterministic Ground-Truth Prompt Builder (`buildGroundedRequest`) where
 *      the string shown in "Check prompt before sending" is BYTE-FOR-BYTE the
 *      exact HTTP request body sent over `fetch()`.
 *   3. One-time "Before you ask" agreement version tracking (`WELCOME_VERSION = 1`).
 */

import { PROVIDER_LIMITS, estimateTokens, trimHistoryByBudget, classifyProviderError } from "./ai-governor.js";

export const AI_VAULT_STORAGE_KEY = "jelet_ai_vault_v1";
export const WELCOME_VERSION = 1;

export const AI_PROVIDERS = {
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    defaultModel: "gemini-3.1-flash-lite",
    endpointHint: "generativelanguage.googleapis.com",
  },
  groq: {
    id: "groq",
    label: "Groq",
    defaultModel: "llama-3.3-70b-versatile",
    endpointHint: "api.groq.com/openai/v1/chat/completions",
  },
  nvidia: {
    id: "nvidia",
    label: "NVIDIA NIM (Free)",
    defaultModel: "nvidia/nemotron-3.5-lightning-30b-a3b",
    endpointHint: "integrate.api.nvidia.com/v1/chat/completions",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    defaultModel: "google/gemini-2.5-flash",
    endpointHint: "openrouter.ai/api/v1/chat/completions",
  },
};

// Offline-safe suggestions: provider availability and free-tier limits can change.
export const CURATED_AI_MODELS = Object.freeze({
  gemini: [
    { id: "gemini-3.1-flash-lite", freeTierNote: "Recommended free-tier starting point; availability and quotas vary by account and region. EU, UK and Switzerland users should check current free-tier access." },
    { id: "gemini-2.5-flash-lite", freeTierNote: "Flash-Lite alternative; check your AI Studio quota." },
    { id: "gemini-2.5-flash", freeTierNote: "Free daily limits can be lower; check AI Studio before choosing." },
  ],
  groq: [
    { id: "llama-3.3-70b-versatile", freeTierNote: "General-purpose model; free-tier quotas vary." },
    { id: "llama-3.1-8b-instant", freeTierNote: "Smaller, fast model; check your Groq dashboard for limits." },
  ],
  openrouter: [
    { id: "google/gemini-2.5-flash", freeTierNote: "Existing OpenRouter default may be paid; check provider pricing before sending." },
    { id: "openrouter/free", freeTierNote: "Free model router; the selected underlying model and availability can change." },
    { id: "google/gemma-3-27b-it:free", freeTierNote: "Free endpoint when available; provider limits and availability can change." },
  ],
  nvidia: [
    { id: "nvidia/nemotron-3.5-lightning-30b-a3b", freeTierNote: "NVIDIA catalog lists a free endpoint; availability can change." },
    { id: "meta/llama-3.3-70b-instruct", freeTierNote: "NVIDIA lists this model, but its free endpoint is deprecated; a partner endpoint may be needed." },
  ],
});
export const AI_LANGUAGES = Object.freeze(["English", "Bengali", "Hinglish", "Simple English"]);
const finiteClamp = (value, min, max, fallback, integer = false) => {
  const n = value === "" || value == null ? NaN : Number(value);
  const clamped = Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  return integer ? Math.round(clamped) : clamped;
};
export function normalizeGenerationSettings(vault = {}) {
  return {
    temperature: finiteClamp(vault.temperature, 0, 1, 0.2),
    maxOutputTokens: finiteClamp(vault.maxOutputTokens, 256, 4096, 1024, true),
    historyTurns: finiteClamp(vault.historyTurns, 2, 8, 8, true),
  };
}

// Only saved pre-upgrade vaults get the notice; reading never changes their choices.
export function hasAiDefaultUpgradeNotice(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(AI_VAULT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !parsed.defaultUpgradeNoticeSeen && Number(parsed.defaultsVersion || 1) < 2;
  } catch { return false; }
}

export const DEFAULT_VAULT = {
  provider: "gemini",
  defaultsVersion: 2,
  model: "gemini-3.1-flash-lite",
  useCustomModel: false,
  customModel: "",
  apiKey: "",
  previewPrompt: false,
  acceptedWelcomeVersion: 0,
  preferredLanguage: "English",
  temperature: 0.2,
  maxOutputTokens: 1024,
  historyTurns: 8,
};

const KNOWN_ENDPOINT_ORIGINS = [
  "https://generativelanguage.googleapis.com/",
  "https://api.groq.com/",
  "https://openrouter.ai/",
  "https://integrate.api.nvidia.com/",
];

/**
 * Validate that `providerId` is a supported provider with a known endpoint.
 * Throws a descriptive Error for unknown custom providers instead of silently failing.
 */
export function validateAiProvider(providerId) {
  const id = String(providerId ?? "").trim();
  if (!id || !Object.prototype.hasOwnProperty.call(AI_PROVIDERS, id)) {
    throw new Error(
      `Unknown AI provider "${id || "(empty)"}". Supported providers: Google Gemini (gemini), Groq (groq), OpenRouter (openrouter), NVIDIA NIM (nvidia).`
    );
  }
  return AI_PROVIDERS[id];
}

/**
 * Resolve the effective model name for a vault state:
 * - When `useCustomModel` is true, uses trimmed `customModel` or falls back to `defaultModel` if blank.
 * - Otherwise uses trimmed `model` or falls back to `defaultModel` if blank.
 */
export function resolveEffectiveModel(vault = {}) {
  const providerCfg = Object.prototype.hasOwnProperty.call(AI_PROVIDERS, vault.provider)
    ? AI_PROVIDERS[vault.provider]
    : AI_PROVIDERS.gemini;
  if (vault.useCustomModel) {
    const custom = typeof vault.customModel === "string" ? vault.customModel.trim() : "";
    return custom || (typeof vault.model === "string" && vault.model.trim()) || providerCfg.defaultModel;
  }
  const explicit = typeof vault.model === "string" ? vault.model.trim() : "";
  return explicit || providerCfg.defaultModel;
}

// Decrypted keys exist only in this tab's module memory, never storage/sessionStorage.
const unlockedKeys = new WeakMap();
const WRAP_ITERATIONS = 310000;
const WRAP_AAD = new TextEncoder().encode("jelet-ai-vault-key-v1");
const toBase64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromBase64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
function vaultChanged(storage) {
  if (storage === globalThis.localStorage && typeof window !== "undefined") window.dispatchEvent(new Event("jelet-ai-vault-change"));
}
async function deriveWrapKey(passphrase, salt, iterations) {
  if (!globalThis.crypto?.subtle) throw new Error("Key encryption requires Web Crypto in a secure browser context.");
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, material,
    { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function decryptEnvelope(envelope, passphrase) {
  if (envelope?.version !== 1 || envelope?.algorithm !== "AES-GCM" || envelope?.kdf !== "PBKDF2-SHA256" ||
      envelope.iterations !== WRAP_ITERATIONS) throw new Error("Unsupported encrypted key format.");
  try {
    const salt = fromBase64(envelope.salt), iv = fromBase64(envelope.iv), ciphertext = fromBase64(envelope.ciphertext);
    if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 17) throw new Error("Invalid envelope");
    const key = await deriveWrapKey(passphrase, salt, envelope.iterations);
    const plain = await crypto.subtle.decrypt({name:"AES-GCM", iv, additionalData:WRAP_AAD}, key, ciphertext);
    return new TextDecoder().decode(plain);
  } catch { throw new Error("Unable to unlock key. Check the passphrase or encrypted data."); }
}
/** Encrypt an existing or replacement key; never overwrites storage on failure. */
export async function protectAiKey(passphrase, storage = globalThis.localStorage, replacementKey = null) {
  if (!storage?.getItem || !storage?.setItem) throw new Error("Local storage is unavailable.");
  if (typeof passphrase !== "string" || passphrase.length < 8) throw new Error("Use a passphrase of at least 8 characters.");
  const raw = storage.getItem(AI_VAULT_STORAGE_KEY);
  if (!raw) throw new Error("Save an API key before protecting it.");
  const saved = JSON.parse(raw);
  let secret = saved.apiKey || "";
  if (saved.keyEnvelope) secret = await decryptEnvelope(saved.keyEnvelope, passphrase);
  if (replacementKey !== null) secret = String(replacementKey).trim();
  if (!secret) throw new Error("Save an API key before protecting it.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveWrapKey(passphrase, salt, WRAP_ITERATIONS);
  const ciphertext = await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:WRAP_AAD}, key, new TextEncoder().encode(secret));
  const envelope = {version:1,algorithm:"AES-GCM",kdf:"PBKDF2-SHA256",iterations:WRAP_ITERATIONS,
    salt:toBase64(salt),iv:toBase64(iv),ciphertext:toBase64(ciphertext)};
  if (storage.getItem(AI_VAULT_STORAGE_KEY) !== raw) throw new Error("Vault changed in another tab. Please try again.");
  storage.setItem(AI_VAULT_STORAGE_KEY, JSON.stringify({...saved, apiKey:"", keyEnvelope:envelope}));
  unlockedKeys.set(storage, {ciphertext:envelope.ciphertext, secret});
  vaultChanged(storage);
}
/** Unlock for this tab only; a reload requires the passphrase again. */
export async function unlockAiKey(passphrase, storage = globalThis.localStorage) {
  const raw = storage?.getItem(AI_VAULT_STORAGE_KEY);
  const saved = raw ? JSON.parse(raw) : null;
  if (!saved?.keyEnvelope) throw new Error("No encrypted key is stored on this device.");
  const secret = await decryptEnvelope(saved.keyEnvelope, passphrase);
  if (storage.getItem(AI_VAULT_STORAGE_KEY) !== raw) throw new Error("Vault changed in another tab. Please try again.");
  unlockedKeys.set(storage, {ciphertext:saved.keyEnvelope.ciphertext, secret});
  vaultChanged(storage);
}
export function lockAiKey(storage = globalThis.localStorage) {
  if (storage) unlockedKeys.delete(storage);
  vaultChanged(storage);
}

/** Read isolated AI vault from `localStorage` (safe in Node tests where localStorage may be absent). */
export function readAiVault(storage = globalThis.localStorage) {
  if (!storage || typeof storage.getItem !== "function") {
    return { ...DEFAULT_VAULT };
  }
  try {
    const raw = storage.getItem(AI_VAULT_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_VAULT };
    const parsed = JSON.parse(raw);
    const provider =
      parsed.provider === undefined || parsed.provider === null || parsed.provider === ""
        ? "gemini"
        : String(parsed.provider);
    const knownCfg = Object.prototype.hasOwnProperty.call(AI_PROVIDERS, provider)
      ? AI_PROVIDERS[provider]
      : AI_PROVIDERS.gemini;
    const useCustomModel = Boolean(parsed.useCustomModel);
    // A pre-upgrade vault with omitted values used the former defaults.
    const legacyDefaultModel = provider === "gemini" ? "gemini-2.5-flash" : knownCfg.defaultModel;
    const customModel = typeof parsed.customModel === "string" ? parsed.customModel : "";
    const effectiveModel = useCustomModel
      ? customModel.trim() || legacyDefaultModel
      : (typeof parsed.model === "string" ? parsed.model.trim() : "") || legacyDefaultModel;
    const session = unlockedKeys.get(storage);
    const apiKey = parsed.keyEnvelope ? (session?.ciphertext === parsed.keyEnvelope.ciphertext ? session.secret : "") : (parsed.apiKey || "");
    return {
      ...DEFAULT_VAULT,
      ...parsed,
      apiKey,
      keyLocked: Boolean(parsed.keyEnvelope && !apiKey),
      provider,
      defaultsVersion: Object.hasOwn(parsed, "defaultsVersion") ? parsed.defaultsVersion : 1,
      useCustomModel,
      customModel,
      model: effectiveModel,
      previewPrompt: Object.hasOwn(parsed, "previewPrompt") ? Boolean(parsed.previewPrompt) : true,
      ...normalizeGenerationSettings(parsed),
    };
  } catch {
    return { ...DEFAULT_VAULT };
  }
}

/** Save isolated AI vault patch to `localStorage`. */
export function writeAiVault(patch, storage = globalThis.localStorage) {
  const previous = readAiVault(storage);
  if (Object.hasOwn(patch, "keyEnvelope")) throw new Error("Use the encrypted-key controls to change protection.");
  const merged = { ...previous, ...patch };
  if (previous.keyEnvelope && Object.hasOwn(patch, "apiKey") && patch.apiKey !== previous.apiKey) throw new Error("Unlock and use the passphrase to replace a protected key.");
  const sessionKey = merged.apiKey;
  delete merged.keyLocked;
  if (merged.keyEnvelope) merged.apiKey = "";
  merged.model = resolveEffectiveModel(merged);
  Object.assign(merged, normalizeGenerationSettings(merged));
  if (storage && typeof storage.setItem === "function") {
    storage.setItem(AI_VAULT_STORAGE_KEY, JSON.stringify(merged));
    vaultChanged(storage);
  }
  return { ...merged, apiKey: merged.keyEnvelope ? sessionKey : merged.apiKey };
}

/** Wipe API key and reset isolated AI vault. */
export function clearAiVault(storage = globalThis.localStorage) {
  if (storage && typeof storage.removeItem === "function") {
    storage.removeItem(AI_VAULT_STORAGE_KEY);
    unlockedKeys.delete(storage);
    vaultChanged(storage);
  }
  return { ...DEFAULT_VAULT };
}

/** Mask an API key for UI display (e.g. `AIza••••••7xQ`). */
export function maskApiKey(apiKey) {
  const k = String(apiKey || "").trim();
  if (!k) return "Not configured (Offline Corpus Mode active)";
  if (k.length <= 8) return "••••••••";
  return `${k.slice(0, 4)} •••••• ${k.slice(-3)}`;
}

/**
 * Phase 13 §2.4 — compact Study Pack grounding for unit prompts.
 * Echoes ONLY the pack's memory hooks and common mistakes (the owner-reviewed
 * wording), never `furtherReading` book pointers. Trimmed to ~400 chars.
 */
export function summarizeStudyPackForTutor(studyPack) {
  if (!studyPack || typeof studyPack !== "object") return "";
  const hooks = (studyPack.memoryHooks || []).slice(0, 3).join("; ");
  const slips = (studyPack.commonMistakes || []).slice(0, 3).join("; ");
  const raw = `Memory hooks: ${hooks} | Common mistakes: ${slips}`;
  return raw.length <= 400 ? raw : `${raw.slice(0, 397)}...`;
}

/**
 * Build the Immutable Ground-Truth System Prompt (docs/04 §5.1).
 */
export function buildGroundTruthSystemPrompt({
  question = null,
  solution = null,
  unit = null,
  formula = null,
  paperTitle = "",
  studentSelected = [],
  studentOutcome = null,
  studentScoreText = "",
  languageMode = "English",
  origin = "",
  sectionHeading = "",
} = {}) {
  // Optional page/section context (Gap B). Absent by default → backward compatible.
  const contextLines = [];
  if (origin) contextLines.push(`Opened from: ${origin}`);
  if (sectionHeading) contextLines.push(`Lesson section: ${sectionHeading}`);
  if (question) {
    const markingRuleText =
      question.key?.status === "voided"
        ? `Board-Voided (W): Full +${question.category === 2 ? "2.00" : "1.00"} mark awarded to all candidates`
        : question.category === 2
        ? "Category II: +2 × (c / C) if zero wrong options selected; 0 if any wrong option selected; 0 negative"
        : "Category I: +1.00 correct, -0.25 wrong or multiple bubbles, 0 unattempted";

    const optsLines = (question.options || [])
      .map((o) => `  ${o.id}) ${o.latex}${o.figure?.alt ? ` [Diagram: ${o.figure.alt}]` : ""}`)
      .join("\n");

    const stepsText = (solution?.steps || [])
      .map((s) => `Step ${s.stepNumber} (${s.title}): ${s.bodyLatex}`)
      .join("\n");

    const trapsText = solution?.optionTraps
      ? JSON.stringify(solution.optionTraps)
      : solution?.verification?.note || "Check algebra, sign, and units carefully.";

    return [
      "You are the JELET Study Hub AI Doubt Tutor helping a West Bengal Diploma Engineering student targeting Jadavpur University.",
      "",
      "IMMUTABLE GROUND TRUTH (DO NOT CONTRADICT UNDER ANY CIRCUMSTANCES):",
      `- Paper & Question: ${paperTitle || `JELET ${question.year || ""}`}, Question ${question.qNumber} (Unit ${question.unitId})`,
      `- Category & Marking Rule: Category ${question.category} (${markingRuleText})`,
      `- Verbatim Question: ${question.stemLatex}${question.stemFigure?.alt ? ` [Diagram: ${question.stemFigure.alt}]` : ""}`,
      "- Options:",
      optsLines,
      `- Official / SymPy-Verified Correct Answer(s): ${(question.key?.correct || []).join(", ")} (Source: ${question.key?.sourceRef || "SymPy Verified"})`,
      `- Verified Step-by-Step Solution:\n${stepsText}`,
      `- Verification / Option Traps: ${trapsText}`,
      `- Student's Selected Option(s): ${studentSelected.length ? studentSelected.join(", ") : "None"} (Outcome: ${studentOutcome || "reviewing"}, Score: ${studentScoreText || "N/A"})`,
      `- Preferred Language: ${languageMode} (Use crisp KaTeX $...$ and $$...$$ for all math).`,
      ...contextLines,
      "",
      "STRICT RULES:",
      "1. Treat the Official Correct Answer(s) and Verified Solution above as 100% ground truth. NEVER claim another option is correct.",
      "2. Pinpoint the exact concept or algebra/sign/unit trap behind the student's selection if they missed or got partial marks.",
      "3. Keep explanations concise, step-by-step, and focused on fast 2-hour OMR exam execution.",
      "4. Stay strictly within the official WBJEEB JELET 42-unit syllabus.",
    ].join("\n");
  }

  if (unit) {
    return [
      "You are the JELET Study Hub AI Doubt Tutor helping a West Bengal Diploma Engineering student targeting Jadavpur University.",
      "",
      "IMMUTABLE SYLLABUS GROUND TRUTH:",
      `- Unit: ${unit.unitId} (${unit.officialCode}) — ${unit.title}`,
      formula ? `- Selected Formula (${formula.label}): ${formula.latex}` : "",
      formula?.aiExplainContext ? `- Derivation Focus: ${formula.aiExplainContext}` : "",
      `- WBJEEB Traps for ${unit.unitId}: ${(unit.wbjeebTraps || []).join(" | ")}`,
      unit.studyPack ? `- Study Pack Hooks & Slips: ${summarizeStudyPackForTutor(unit.studyPack)}` : "",
      `- Preferred Language: ${languageMode} (Use crisp KaTeX $...$ and $$...$$ for all math).`,
      ...contextLines,
      "",
      "Explain clearly from 1st-year Diploma fundamentals up to JELET exam speed without going outside the official WBJEEB syllabus.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    "You are the JELET Study Hub AI Doubt Tutor helping a West Bengal Polytechnic Diploma student targeting Jadavpur University in WBJEEB JELET Paper-I (100 Qs, 120 Marks: Mathematics 50m, Physics 35m, Chemistry 25m, FEEE 10m; 42 canonical units M01–M11, P01–P15, C01–C08, E01–E08).",
    `Preferred Language: ${languageMode} (Use KaTeX $...$ and $$...$$ for equations).`,
    ...contextLines,
    "Give concise, accurate, syllabus-faithful explanations.",
  ].join("\n");
}

/**
 * Build the deterministic outgoing request preview & exact `fetch()` payload.
 * INVARIANT (docs/04 §4): `preview.bodyString` is byte-for-byte the `body` sent over `fetch()`.
 */
export function buildAiRequestPayload({
  vault = {},
  systemPrompt,
  history = [], // [{ role: "user"|"assistant", text: string }] up to 8 turns
  userMessage,
  maxOutputTokens,
  stream = false,
}) {
  const rawProvider =
    vault.provider === undefined || vault.provider === null || vault.provider === ""
      ? "gemini"
      : vault.provider;
  const providerCfg = validateAiProvider(rawProvider);
  const provider = providerCfg.id;
  const model = resolveEffectiveModel({ ...vault, provider });
  // Reserve space for the pending user message as well as immutable grounding.
  const budget = PROVIDER_LIMITS[provider].tokenBudget - estimateTokens(userMessage);
  const settings = normalizeGenerationSettings(vault);
  const outputTokens = maxOutputTokens === 8 ? 8 : settings.maxOutputTokens;
  const boundedHistory = trimHistoryByBudget(history.slice(-settings.historyTurns), systemPrompt, budget);

  if (provider === "gemini") {
    const contents = [
      ...boundedHistory.map((turn) => ({
        role: turn.role === "assistant" ? "model" : "user",
        parts: [{ text: turn.text }],
      })),
      { role: "user", parts: [{ text: userMessage }] },
    ];
    const bodyObj = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: settings.temperature, maxOutputTokens: outputTokens },
    };
    const bodyString = JSON.stringify(bodyObj, null, 2);
    const method = stream ? "streamGenerateContent?alt=sse&key=" : "generateContent?key=";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${method}${encodeURIComponent(vault.apiKey || "")}`;
    return {
      provider,
      providerLabel: providerCfg.label,
      model,
      endpoint,
      headers: { "Content-Type": "application/json" },
      bodyString,
      streaming: Boolean(stream),
    };
  }

  // OpenAI-compatible payload for Groq / OpenRouter
  const endpoint =
    provider === "groq"
      ? "https://api.groq.com/openai/v1/chat/completions"
      : provider === "nvidia"
      ? "https://integrate.api.nvidia.com/v1/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";

  const messages = [
    { role: "system", content: systemPrompt },
    ...boundedHistory.map((t) => ({ role: t.role, content: t.text })),
    { role: "user", content: userMessage },
  ];
  const bodyObj = {
    model,
    messages,
    temperature: settings.temperature,
    max_tokens: outputTokens,
    ...(stream ? { stream: true } : {}),
  };
  const bodyString = JSON.stringify(bodyObj, null, 2);
  return {
    provider,
    providerLabel: providerCfg.label,
    model,
    endpoint,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${vault.apiKey || ""}`,
    },
    bodyString,
    streaming: Boolean(stream),
  };
}

/** Provider errors retain only safe diagnostics, never the body or credentials. */
export class AiProviderError extends Error {
  constructor(message, classification, status = 0) {
    super(message);
    this.name = "AiProviderError";
    this.classification = classification;
    this.status = status;
  }
}

function responseUsage(raw, isGemini) {
  if (!raw) return null;
  const number = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  const total = isGemini ? raw.totalTokenCount : raw.total_tokens;
  return { promptTokens:number(isGemini ? raw.promptTokenCount : raw.prompt_tokens),
    outputTokens:number(isGemini ? raw.candidatesTokenCount : raw.completion_tokens),
    ...(total != null && Number.isFinite(Number(total)) ? { totalTokens:number(total) } : {}) };
}
async function readEventStream(response, isGemini, onChunk) {
  if (!response.body?.getReader) throw new AiProviderError("Provider stream is unavailable.", {kind:"network"});
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let buffer = "", text = "", finish = "", usage = null, doneMarker = false;
  function consume(frame) {
    const data = frame.split(/\r?\n/).filter(line => line.startsWith("data:"))
      .map(line => line.slice(5).replace(/^ /, "")).join("\n");
    if (!data) return;
    if (data === "[DONE]") { doneMarker = true; return; }
    let event;
    try { event = JSON.parse(data); } catch { throw new AiProviderError("Invalid provider stream.", {kind:"network"}); }
    if (event.error) throw new AiProviderError("Provider stream failed.", {kind:"network"});
    const chunk = isGemini ? (event.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("")
      : (event.choices?.[0]?.delta?.content || "");
    if (chunk) { text += chunk; onChunk(chunk); }
    finish = (isGemini ? event.candidates?.[0]?.finishReason : event.choices?.[0]?.finish_reason) || finish;
    usage = responseUsage(isGemini ? event.usageMetadata : (event.usage || event.x_groq?.usage), isGemini) || usage;
  }
  try {
    while (!doneMarker) {
      const part = await reader.read();
      buffer += decoder.decode(part.value || new Uint8Array(), {stream:!part.done});
      let match;
      while ((match = /\r?\n\r?\n/.exec(buffer))) {
        const frame = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);
        consume(frame);
      }
      if (part.done) { if (buffer.trim()) consume(buffer); break; }
    }
    // A terminated connection without a provider completion marker is not a
    // complete answer: expose Continue instead of silently claiming success.
    return {text, usage, truncated: finish === "MAX_TOKENS" || finish === "length" || (!finish && !doneMarker)};
  } finally { reader.releaseLock(); }
}

/** Execute exactly the previewed body; deadline covers fetch AND response parsing. */
export async function sendBuiltAiRequest(req, { signal, timeoutMs = 45000, onChunk = () => {} } = {}) {
  validateAiProvider(req?.provider);
  const endpoint = String(req?.endpoint || "");
  if (!KNOWN_ENDPOINT_ORIGINS.some((origin) => endpoint.startsWith(origin))) {
    throw new Error("Unsupported provider endpoint. Choose Gemini, Groq, OpenRouter or NVIDIA NIM.");
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) throw new DOMException("Generation stopped.", "AbortError");
  signal?.addEventListener("abort", abort, { once: true });
  let timer;
  let rejectOnAbort;
  const started = Date.now();
  let received = "";
  try {
    return await Promise.race([
      (async () => {
        const res = await fetch(endpoint, { method: "POST", headers: req.headers,
          body: req.bodyString, signal: controller.signal });
        const isGemini = req.provider === "gemini";
        if (res.ok && req.streaming && /text\/event-stream/i.test(res.headers.get("content-type") || "")) {
          const result = await readEventStream(res, isGemini, chunk => { received += chunk; onChunk(chunk); });
          return { ...result, text:result.text || "No response text returned.", providerLatencyMs:Date.now() - started };
        }
        const json = await res.json().catch(() => ({}));
        const usage = responseUsage(isGemini ? json?.usageMetadata : json?.usage, isGemini);
        if (!res.ok) {
          const classification = classifyProviderError(res.status, JSON.stringify(json), res.headers);
          const note = classification.kind === "auth" && req.provider === "nvidia"
            ? " NVIDIA nvapi keys can expire after six months; renew at build.nvidia.com." : "";
          const error = new AiProviderError(`Provider HTTP ${res.status}.${note}`, classification, res.status);
          error.usage = usage;
          throw error;
        }
        const text = isGemini
          ? (json?.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("")
          : json?.choices?.[0]?.message?.content;
        const finish = isGemini ? json?.candidates?.[0]?.finishReason : json?.choices?.[0]?.finish_reason;
        return { text: text || "No response text returned.", usage,
          truncated: finish === "MAX_TOKENS" || finish === "length", providerLatencyMs: Date.now() - started };
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new AiProviderError("Provider request timed out.", { kind: "network", retryAfterMs: null }));
        }, Math.max(0, timeoutMs));
        rejectOnAbort = () => reject(new DOMException("Generation stopped.", "AbortError"));
        signal?.addEventListener("abort", rejectOnAbort, { once: true });
      }),
    ]);
  } catch (error) {
    if (received) error.partialText = received;
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
    if (rejectOnAbort) signal?.removeEventListener("abort", rejectOnAbort);
  }
}

/** Minimal zero-study-data connection test (`docs/04 §2.3`: `Reply with OK`, `maxOutputTokens: 8`). */
export async function testAiConnection(vault) {
  validateAiProvider(vault?.provider);
  if (!vault?.apiKey || !vault.apiKey.trim()) {
    throw new Error("Enter an API key first.");
  }
  const t0 = performance.now();
  const req = buildAiRequestPayload({
    vault,
    systemPrompt: "Reply strictly with OK.",
    history: [],
    userMessage: "Reply with OK",
    maxOutputTokens: 8,
  });
  const { text } = await sendBuiltAiRequest(req);
  const latencyMs = Math.round(performance.now() - t0);
  return { ok: true, latencyMs, model: req.model, sample: text.trim().slice(0, 24) };
}
