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

export const AI_VAULT_STORAGE_KEY = "jelet_ai_vault_v1";
export const WELCOME_VERSION = 1;

export const AI_PROVIDERS = {
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    defaultModel: "gemini-2.5-flash",
    endpointHint: "generativelanguage.googleapis.com",
  },
  groq: {
    id: "groq",
    label: "Groq",
    defaultModel: "llama-3.3-70b-versatile",
    endpointHint: "api.groq.com/openai/v1/chat/completions",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    defaultModel: "google/gemini-2.5-flash",
    endpointHint: "openrouter.ai/api/v1/chat/completions",
  },
};

export const DEFAULT_VAULT = {
  provider: "gemini",
  model: "gemini-2.5-flash",
  useCustomModel: false,
  customModel: "",
  apiKey: "",
  previewPrompt: true,
  acceptedWelcomeVersion: 0,
  preferredLanguage: "English",
};

const KNOWN_ENDPOINT_ORIGINS = [
  "https://generativelanguage.googleapis.com/",
  "https://api.groq.com/",
  "https://openrouter.ai/",
];

/**
 * Validate that `providerId` is a supported provider with a known endpoint.
 * Throws a descriptive Error for unknown custom providers instead of silently failing.
 */
export function validateAiProvider(providerId) {
  const id = String(providerId ?? "").trim();
  if (!id || !Object.prototype.hasOwnProperty.call(AI_PROVIDERS, id)) {
    throw new Error(
      `Unknown AI provider "${id || "(empty)"}". Supported providers: Google Gemini (gemini), Groq (groq), OpenRouter (openrouter).`
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
    return custom || providerCfg.defaultModel;
  }
  const explicit = typeof vault.model === "string" ? vault.model.trim() : "";
  return explicit || providerCfg.defaultModel;
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
    const customModel = typeof parsed.customModel === "string" ? parsed.customModel : "";
    const effectiveModel = useCustomModel
      ? customModel.trim() || knownCfg.defaultModel
      : (typeof parsed.model === "string" ? parsed.model.trim() : "") || knownCfg.defaultModel;
    return {
      ...DEFAULT_VAULT,
      ...parsed,
      provider,
      useCustomModel,
      customModel,
      model: effectiveModel,
    };
  } catch {
    return { ...DEFAULT_VAULT };
  }
}

/** Save isolated AI vault patch to `localStorage`. */
export function writeAiVault(patch, storage = globalThis.localStorage) {
  const merged = { ...readAiVault(storage), ...patch };
  merged.model = resolveEffectiveModel(merged);
  if (storage && typeof storage.setItem === "function") {
    storage.setItem(AI_VAULT_STORAGE_KEY, JSON.stringify(merged));
  }
  return merged;
}

/** Wipe API key and reset isolated AI vault. */
export function clearAiVault(storage = globalThis.localStorage) {
  if (storage && typeof storage.removeItem === "function") {
    storage.removeItem(AI_VAULT_STORAGE_KEY);
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
}) {
  const rawProvider =
    vault.provider === undefined || vault.provider === null || vault.provider === ""
      ? "gemini"
      : vault.provider;
  const providerCfg = validateAiProvider(rawProvider);
  const provider = providerCfg.id;
  const model = resolveEffectiveModel({ ...vault, provider });
  const boundedHistory = history.slice(-8);

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
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
    };
    const bodyString = JSON.stringify(bodyObj, null, 2);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(vault.apiKey || "")}`;
    return {
      provider,
      providerLabel: providerCfg.label,
      model,
      endpoint,
      headers: { "Content-Type": "application/json" },
      bodyString,
    };
  }

  // OpenAI-compatible payload for Groq / OpenRouter
  const endpoint =
    provider === "groq"
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";

  const messages = [
    { role: "system", content: systemPrompt },
    ...boundedHistory.map((t) => ({ role: t.role, content: t.text })),
    { role: "user", content: userMessage },
  ];
  const bodyObj = {
    model,
    messages,
    temperature: 0.2,
    max_tokens: 1024,
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
  };
}

/** Execute a built AI request with `AbortSignal`, using `req.bodyString` byte-for-byte. */
export async function sendBuiltAiRequest(req, { signal } = {}) {
  validateAiProvider(req?.provider);
  const endpoint = String(req?.endpoint || "");
  if (!KNOWN_ENDPOINT_ORIGINS.some((origin) => endpoint.startsWith(origin))) {
    throw new Error(
      `Unsupported provider endpoint "${endpoint || "(empty)"}". Choose Google Gemini, Groq, or OpenRouter.`
    );
  }
  const res = await fetch(endpoint, {
    method: "POST",
    headers: req.headers,
    body: req.bodyString,
    signal,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json?.error?.message ||
      `Provider returned HTTP ${res.status}. Check your API key, model name (${req.model}), or quota in You & AI.`;
    throw new Error(msg);
  }
  if (req.provider === "gemini") {
    const parts = json?.candidates?.[0]?.content?.parts || [];
    return parts.map((p) => p.text || "").join("") || "No response text returned.";
  }
  return json?.choices?.[0]?.message?.content || "No response text returned.";
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
  });
  const text = await sendBuiltAiRequest(req);
  const latencyMs = Math.round(performance.now() - t0);
  return { ok: true, latencyMs, model: req.model, sample: text.trim().slice(0, 24) };
}
